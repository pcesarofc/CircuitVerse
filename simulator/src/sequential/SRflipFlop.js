import CircuitElement from '../circuitElement';
import Node, { findNode } from '../node';
import simulationArea from '../simulationArea';
import { correctWidth, fillText } from '../canvasApi';
/**
 * @class
 * SRflipFlop
 * SR flip flop has 6 input nodes:
 * clock, S input, R input, preset, reset ,enable.
 * @extends CircuitElement
 * @param {number} x - x coord of element
 * @param {number} y - y coord of element
 * @param {Scope=} scope - the ciruit in which we want the Element
 * @param {string=} dir - direcion in which element has to drawn
 * @category sequential
 */
import { colors } from '../themer/themer';
import { generateArchitetureHeader, generateArchitetureHeaderTFlipFlop, generateFooterEntity, generateHeaderVhdlEntity, generateLogicSRFlipFlop, generatePortsIO, generateSpacings, generateSTDType, hasComponent, hasExtraPorts, removeDuplicateComponent } from '../helperVHDL';
import { scopeList } from '../circuit';
export default class SRflipFlop extends CircuitElement {
    constructor(x, y, scope = globalScope, dir = 'RIGHT') {
        super(x, y, scope, dir, 1);
        /*
        this.scope['SRflipFlop'].push(this);
        */
        this.directionFixed = true;
        this.fixedBitWidth = true;
        this.setDimensions(20, 20);
        this.rectangleObject = true;
        this.R = new Node(-20, +10, 0, this, 1, 'R');
        this.S = new Node(-20, -10, 0, this, 1, 'S');
        this.qOutput = new Node(20, -10, 1, this, 1, 'Q');
        this.qInvOutput = new Node(20, 10, 1, this, 1, 'Q Inverse');
        this.reset = new Node(10, 20, 0, this, 1, 'Asynchronous Reset');
        this.preset = new Node(0, 20, 0, this, 1, 'Preset');
        this.en = new Node(-10, 20, 0, this, 1, 'Enable');
        this.state = 0;
        // this.slaveState = 0;
        // this.prevClockState = 0;
        // this.wasClicked = false;
    }

    newBitWidth(bitWidth) {
        this.bitWidth = bitWidth;
        this.dInp.bitWidth = bitWidth;
        this.qOutput.bitWidth = bitWidth;
        this.qInvOutput.bitWidth = bitWidth;
        this.preset.bitWidth = bitWidth;
    }

    /**
     * @memberof SRflipFlop
     * always resolvable
     */
    isResolvable() {
        return true;
        if (this.reset.value == 1) return true;
        if (this.S.value != undefined && this.R.value != undefined) return true;
        return false;
    }

    /**
     * @memberof SRflipFlop
     * function to resolve SR flip flop if S != R we can
     * set this.state to value S.
     */
    resolve() {
        if (this.reset.value == 1) {
            this.state = this.preset.value || 0;
        } else if ((this.en.value == 1 || this.en.connections == 0) && this.S.value ^ this.R.value) {
            this.state = this.S.value;
        }

        if (this.qOutput.value != this.state) {
            this.qOutput.value = this.state;
            this.qInvOutput.value = this.flipBits(this.state);
            simulationArea.simulationQueue.add(this.qOutput);
            simulationArea.simulationQueue.add(this.qInvOutput);
        }
    }

    customSave() {
        var data = {
            nodes: {
                S: findNode(this.S),
                R: findNode(this.R),
                qOutput: findNode(this.qOutput),
                qInvOutput: findNode(this.qInvOutput),
                reset: findNode(this.reset),
                preset: findNode(this.preset),
                en: findNode(this.en),
            },
            constructorParamaters: [this.direction],

        };
        return data;
    }

    static moduleVHDL(){
        let output = "\n";
        const srflipflop = Object.values(scopeList)[0].SRflipFlop
        let srflipflopcomponent = []
        let enable = []
        let preset = []
        let reset = []

        for(var i = 0; i < srflipflop.length; i++){
            enable = srflipflop[i].en
            preset = srflipflop[i].preset
            reset = srflipflop[i].reset

            srflipflopcomponent = [...srflipflopcomponent, {
                
                header: generateHeaderVhdlEntity('SRFlipFlop', `bit${srflipflop[i].bitWidth}`),
                SPort: generatePortsIO('S', 0),
                stdS: generateSTDType('IN', srflipflop[i].bitWidth) + ';\n',
                RPort: generatePortsIO('R', 0),
                stdR: generateSTDType('IN', srflipflop[i].bitWidth) + ';\n',
                
                portEnable: hasComponent(enable.connections) ? '\n' + generatePortsIO('enable', 0) : '',
                stdEnable: hasComponent(enable.connections) ? generateSTDType('IN', 1) + ';' : '',
                
                portPreset: hasComponent(preset.connections) ? '\n' + generatePortsIO('preset', 0) : '',
                stdPreset: hasComponent(preset.connections) ? generateSTDType('IN', 1) + ';' : '',
                
                portAReset: hasComponent(reset.connections) ? '\n' + generatePortsIO('reset', 0) : '',
                stdReset: hasComponent(reset.connections) ? generateSTDType('IN', 1) + ';' : '',
                
                portsout: '\n' + generatePortsIO('q', 1),
                stdout: generateSTDType('OUT', srflipflop[i].bitWidth) + '\n',
                footer: generateFooterEntity(),
                architeture: generateArchitetureHeaderTFlipFlop('SRFlipFlop', `bit${srflipflop[i].bitWidth}`),
                openProcess: `${generateSpacings(4)}PROCESS(S, R${hasExtraPorts(enable.connections, preset.connections, reset.connections)})\n${generateSpacings(6)}BEGIN\n${generateSpacings(8)}`,
                logic: generateLogicSRFlipFlop(srflipflop[i]),
                endprocess: `${generateSpacings(4)}END PROCESS;\n`,
                attr: `${generateSpacings(2)} q0 <= tmp;\n${generateSpacings(2)} q1 <= NOT tmp;\n`,
                end: `\nEND ARCHITECTURE;\n`,
                identificator: `bit${srflipflop[i].bitWidth}`,
            }]
        }
        const srflipflopFiltered = removeDuplicateComponent(srflipflopcomponent)
        srflipflopFiltered.forEach(el => output += el.header + el.SPort + el.stdS + el.RPort + el.stdR  + el.portEnable + el.stdEnable + el.portPreset + el.stdPreset + el.portAReset + el.stdReset + el.portsout + el.stdout + el.footer + el.architeture + el.openProcess + el.logic + el.endprocess + el.attr + el.end)
        return output
    }

    customDraw() {
        var ctx = simulationArea.context;
        //        
        ctx.strokeStyle = (colors['stroke']);
        ctx.fillStyle = (colors['fill']);
        ctx.beginPath();
        ctx.lineWidth = correctWidth(3);
        var xx = this.x;
        var yy = this.y;

        // rect(ctx, xx - 20, yy - 20, 40, 40);
        // moveTo(ctx, -20, 5, xx, yy, this.direction);
        // lineTo(ctx, -15, 10, xx, yy, this.direction);
        // lineTo(ctx, -20, 15, xx, yy, this.direction);


        // if ((this.b.hover&&!simulationArea.shiftDown)|| simulationArea.lastSelected == this || simulationArea.multipleObjectSelections.contains(this)) ctx.fillStyle = "rgba(255, 255, 32,0.8)";ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.font = '20px Raleway';
        ctx.fillStyle = colors['input_text'];
        ctx.textAlign = 'center';
        this.state ? fillText(ctx, this.state.toString(16), xx, yy + 5) : fillText(ctx, '0', xx, yy + 5);
        ctx.fill();
    }
}

SRflipFlop.prototype.tooltipText = 'SR FlipFlop ToolTip : SR FlipFlop Selected.';

SRflipFlop.prototype.helplink = 'https://docs.circuitverse.org/#/chapter4/6sequentialelements?id=sr-flip-flop';

SRflipFlop.prototype.objectType = 'SRflipFlop';
