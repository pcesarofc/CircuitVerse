/*
    # Primary Developers
    1) James H-J Yeh, Ph.D.
    2) Satvik Ramaprasad

    refer verilog_documentation.md
*/
import { scopeList } from "./circuit";
import { errorDetectedGet } from "./engine";
import { download } from "./utils";
import { getProjectName } from "./data/save";
import modules from "./modules";
import { sanitizeLabel } from "./verilogHelpers";
import CodeMirror from "codemirror/lib/codemirror.js";
import "codemirror/lib/codemirror.css";
import "codemirror/addon/hint/show-hint.css";
import "codemirror/mode/verilog/verilog.js";
import "codemirror/addon/edit/closebrackets.js";
import "codemirror/addon/hint/anyword-hint.js";
import "codemirror/addon/hint/show-hint.js";
import "codemirror/addon/display/autorefresh.js";
import { openInNewTab, copyToClipboard, showMessage } from "./utils";

var editora;

export function generateVHDL() {
    var dialog = $("#vhdl-export-code-window-div");
    var data = vhdl.exportVHDL();
    editora.setValue(data);
    $("#vhdl-export-code-window-div .CodeMirror").css(
        "height",
        $(window).height() - 200
    );
    dialog.dialog({
        resizable: false,
        width: "90%",
        height: "auto",
        position: { my: "center", at: "center", of: window },
        buttons: [
            {
                text: "Download Verilog File",
                click() {
                    var fileName = getProjectName() || "Untitled";
                    download(fileName + ".v", editor.getValue());
                },
            },
            {
                text: "Copy to Clipboard",
                click() {
                    copyToClipboard(editor.getValue());
                    showMessage("Code has been copied");
                },
            },
            {
                text: "Try in EDA Playground",
                click() {
                    copyToClipboard(teste.getValue());
                    openInNewTab("https://www.edaplayground.com/x/XZpY");
                },
            },
        ],
    });
}

export function setupVHDLExportCodeWindow() {
    var myTextarea2 = document.getElementById("vhdl-export-code-window");
    editora = CodeMirror.fromTextArea(myTextarea2, {
        mode: "verilog",
        autoRefresh: true,
        styleActiveLine: true,
        lineNumbers: true,
        autoCloseBrackets: true,
        smartIndent: true,
        indentWithTabs: true,
        extraKeys: { "Ctrl-Space": "autocomplete" },
    });
}

export var vhdl = {
    exportVHDL: function (scope = undefined) {
        var dependencyList = {};
        // Reset Verilog Element State
        for (var elem in modules) {
            // Not sure if globalScope here is correct.
            if (modules[elem].resetVerilog) {
                modules[elem].resetVerilog();
            }
        }

        // List of devices under test for which testbench needs to be created
        var DUTs = [];
        var SubCircuitIds = new Set();

        // Generate SubCircuit Dependency Graph
        for (id in scopeList) {
            dependencyList[id] = scopeList[id].getDependencies();
            for (var i = 0; i < scopeList[id].SubCircuit.length; i++) {
                SubCircuitIds.add(scopeList[id].SubCircuit[i].id);
            }
        }

        for (id in scopeList) {
            if (!SubCircuitIds.has(id)) DUTs.push(scopeList[id]);
        }

        // DFS on SubCircuit Dependency Graph
        var visited = {};
        var elementTypesUsed = {};
        var output = "";
        if (scope) {
            // generate verilog only for scope
            output += this.exportVHDLScope(
                scope.id,
                visited,
                dependencyList,
                elementTypesUsed
            );
        } else {
            // generate verilog for everything
            for (id in scopeList) {
                output += this.exportVHDLScope(
                    id,
                    visited,
                    dependencyList,
                    elementTypesUsed
                );
            }
        }
        // Add Circuit Element - Module Specific Verilog Code
        for (var element in elementTypesUsed) {
            // If element has custom verilog
            if (modules[element] && modules[element].moduleVHDL) {
                output += modules[element].moduleVHDL();
            }
        }

        var report = this.generateReport(elementTypesUsed);
        var testbench = this.generateTestBenchCode(DUTs);

        return report + testbench + output;
    },
    generateReport: function (elementTypesUsed) {
        var output = "";
        return output;
    },
    generateTestBenchCode: function (DUTs) {
        return "";
    },
    // Recursive DFS function
    exportVHDLScope: function (id, visited, dependencyList, elementTypesUsed) {
        // Already Visited
        if (visited[id]) return "";
        // Mark as Visited
        visited[id] = true;

        var output = "";
        // DFS on dependencies
        for (var i = 0; i < dependencyList[id].length; i++)
            output +=
                this.exportVHDLScope(
                    dependencyList[id][i],
                    visited,
                    dependencyList,
                    elementTypesUsed
                ) + "\n";

        var scope = scopeList[id];
        // Initialize labels for all elements
        this.resetLabels(scope);
        this.setLabels(scope);

        output += "use IEEE.std_logic_1164.all;\n\n";
        output += this.generateHeaderVHDL(scope);
        output += this.generateInputList(scope);
        output += this.generateOutputList(scope);
        output +=
            "end portas;\n\narchiterture " +
            sanitizeLabel(scope.name) +
            " of portas is\n"; // generate output first to be consistent

        // Note: processGraph function populates scope.verilogWireList
        var res = "    " + this.processGraph(scope, elementTypesUsed);

        // Generate Wire Initialization Code
        for (var bitWidth = 1; bitWidth <= 32; bitWidth++) {
            var wireList = scope.verilogWireList[bitWidth];
            // Hack for splitter
            wireList = wireList.filter((x) => !x.includes("["));
            if (wireList.length == 0) continue;
            if (bitWidth == 1)
                output += "  signal " + wireList.join(", ") + ";\n";
            else
                output +=
                    "  signal [" +
                    (bitWidth - 1) +
                    ":0] " +
                    wireList.join(", ") +
                    ";\n";
        }

        output += "  begin\n";

        // Append Wire connections and module instantiations
        output += res;

        // Append footer
        output += "end " + sanitizeLabel(scope.name) + ";";

        return output;
    },
    // Performs DFS on the graph and generates netlist of wires and connections
    processGraph: function (scope, elementTypesUsed) {
        // Initializations
        var res = "";
        scope.stack = [];
        scope.verilogWireList = [];
        for (var i = 0; i <= 32; i++) scope.verilogWireList.push(new Array());

        var verilogResolvedSet = new Set();

        // Start DFS from inputs
        for (var i = 0; i < inputList.length; i++) {
            for (var j = 0; j < scope[inputList[i]].length; j++) {
                scope.stack.push(scope[inputList[i]][j]);
            }
        }

        // Iterative DFS on circuit graph
        while (scope.stack.length) {
            if (errorDetectedGet()) return;
            var elem = scope.stack.pop();

            if (verilogResolvedSet.has(elem)) continue;

            // Process verilog creates variable names and adds elements to DFS stack
            elem.processVerilog();

            // Record usage of element type
            if (elem.objectType != "Node") {
                if (elementTypesUsed[elem.objectType])
                    elementTypesUsed[elem.objectType]++;
                else elementTypesUsed[elem.objectType] = 1;
            }

            if (
                elem.objectType != "Node" &&
                elem.objectType != "Input" &&
                elem.objectType != "Clock"
            ) {
                verilogResolvedSet.add(elem);
            }
        }

        // Generate connection verilog code and module instantiations
        for (var elem of verilogResolvedSet) {
            res += elem.generateVHDL() + "\n";
        }
        return res;
    },

    resetLabels: function (scope) {
        for (var i = 0; i < scope.allNodes.length; i++) {
            scope.allNodes[i].verilogLabel = "";
        }
    },
    // Sets labels for all Circuit Elements elements
    setLabels: function (scope = globalScope) {
        /**
         * Sets a name for each element. If element is already labeled,
         * the element is used directly, otherwise an automated label is provided
         * sanitizeLabel is a helper function to escape white spaces
         */
        for (var i = 0; i < scope.Input.length; i++) {
            if (scope.Input[i].label == "") scope.Input[i].label = "inp_" + i;
            else scope.Input[i].label = sanitizeLabel(scope.Input[i].label);
            // copy label to node
            scope.Input[i].output1.verilogLabel = scope.Input[i].label;
        }
        for (var i = 0; i < scope.ConstantVal.length; i++) {
            if (scope.ConstantVal[i].label == "")
                scope.ConstantVal[i].label = "const_" + i;
            else
                scope.ConstantVal[i].label = sanitizeLabel(
                    scope.ConstantVal[i].label
                );
            // copy label to node
            scope.ConstantVal[i].output1.verilogLabel =
                scope.ConstantVal[i].label;
        }

        // copy label to clock
        for (var i = 0; i < scope.Clock.length; i++) {
            if (scope.Clock[i].label == "") scope.Clock[i].label = "clk_" + i;
            else scope.Clock[i].label = sanitizeLabel(scope.Clock[i].label);
            scope.Clock[i].output1.verilogLabel = scope.Clock[i].label;
        }

        for (var i = 0; i < scope.Output.length; i++) {
            if (scope.Output[i].label == "") scope.Output[i].label = "out_" + i;
            else scope.Output[i].label = sanitizeLabel(scope.Output[i].label);
        }
        for (var i = 0; i < scope.SubCircuit.length; i++) {
            if (scope.SubCircuit[i].label == "")
                scope.SubCircuit[i].label =
                    scope.SubCircuit[i].data.name + "_" + i;
            else
                scope.SubCircuit[i].label = sanitizeLabel(
                    scope.SubCircuit[i].label
                );
        }
        for (var i = 0; i < moduleList.length; i++) {
            var m = moduleList[i];
            for (var j = 0; j < scope[m].length; j++) {
                scope[m][j].verilogLabel =
                    sanitizeLabel(scope[m][j].label) ||
                    scope[m][j].verilogName() + "_" + j;
            }
        }
    },
    generateHeaderVHDL: function (scope = globalScope) {
        // Example: module HalfAdder (a,b,s,c);
        var res = "entity portas is \n"; /*+ //sanitizeLabel(scope.name);*/
        return res;
    },
    generateHeaderHelper: function (scope = globalScope) {
        // Example: (a,b,s,c);
        var res = "(";
        var pins = [];
        for (var i = 0; i < scope.Output.length; i++) {
            pins.push(scope.Output[i].label);
        }
        for (var i = 0; i < scope.Clock.length; i++) {
            pins.push(scope.Clock[i].label);
        }
        for (var i = 0; i < scope.Input.length; i++) {
            pins.push(scope.Input[i].label);
        }
        res += pins.join(", ");
        res += ");\n";
        return res;
    },
    generateInputList: function (scope = globalScope) {
        var inputs = {};
        for (var i = 1; i <= 32; i++) inputs[i] = [];

        for (var i = 0; i < scope.Input.length; i++) {
            inputs[scope.Input[i].bitWidth].push(scope.Input[i].label);
        }

        for (var i = 0; i < scope.Clock.length; i++) {
            inputs[scope.Clock[i].bitWidth].push(scope.Clock[i].label);
        }

        var res = "";
        for (var bitWidth in inputs) {
            if (inputs[bitWidth].length == 0) continue;
            if (bitWidth == 1)
                res += "port(\n  " + inputs[1].join(", ") + ": in std_logic;\n";
            else
                res +=
                    "port [" +
                    (bitWidth - 1) +
                    ":0] " +
                    inputs[bitWidth].join(", ") +
                    ";: in std_logic;\n";
        }

        return res;
    },
    generateOutputList: function (scope = globalScope) {
        // Example 1: output s,cout;
        var outputs = {};
        for (var i = 0; i < scope.Output.length; i++) {
            if (outputs[scope.Output[i].bitWidth])
                outputs[scope.Output[i].bitWidth].push(scope.Output[i].label);
            else outputs[scope.Output[i].bitWidth] = [scope.Output[i].label];
        }
        var res = "";
        for (var bitWidth in outputs) {
            if (bitWidth == 1)
                res += "  " + outputs[1].join(",  ") + ": out std_logic);\n";
            else
                res +=
                    "  " +
                    (bitWidth - 1) +
                    ":0] " +
                    outputs[bitWidth].join(", ") +
                    ": out std_logic);\n";
        }

        return res;
    },
};
