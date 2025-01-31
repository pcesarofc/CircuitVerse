# -*- encoding: utf-8 -*-
# stub: simple_po_parser 1.1.6 ruby lib

Gem::Specification.new do |s|
  s.name = "simple_po_parser".freeze
  s.version = "1.1.6"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Dennis-Florian Herr".freeze]
  s.date = "2022-03-22"
  s.description = "A simple PO file to ruby hash parser . PO files are translation files generated by GNU/Gettext tool.".freeze
  s.email = ["dennis.herr@experteer.com".freeze]
  s.homepage = "http://github.com/experteer/simple_po_parser".freeze
  s.licenses = ["MIT".freeze]
  s.rubygems_version = "3.3.7".freeze
  s.summary = "A simple PO file to ruby hash parser".freeze

  s.installed_by_version = "3.3.7" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4
  end

  if s.respond_to? :add_runtime_dependency then
    s.add_development_dependency(%q<bundler>.freeze, [">= 0"])
    s.add_development_dependency(%q<rake>.freeze, [">= 0"])
  else
    s.add_dependency(%q<bundler>.freeze, [">= 0"])
    s.add_dependency(%q<rake>.freeze, [">= 0"])
  end
end
