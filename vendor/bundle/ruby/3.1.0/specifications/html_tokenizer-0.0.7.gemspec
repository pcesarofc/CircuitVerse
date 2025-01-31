# -*- encoding: utf-8 -*-
# stub: html_tokenizer 0.0.7 ruby lib ext
# stub: ext/html_tokenizer_ext/extconf.rb

Gem::Specification.new do |s|
  s.name = "html_tokenizer".freeze
  s.version = "0.0.7"

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze, "ext".freeze]
  s.authors = ["Francois Chagnon".freeze]
  s.date = "2018-05-25"
  s.executables = ["html_tokenizer".freeze]
  s.extensions = ["ext/html_tokenizer_ext/extconf.rb".freeze]
  s.files = ["bin/html_tokenizer".freeze, "ext/html_tokenizer_ext/extconf.rb".freeze]
  s.rubygems_version = "3.3.7".freeze
  s.summary = "HTML Tokenizer".freeze

  s.installed_by_version = "3.3.7" if s.respond_to? :installed_by_version

  if s.respond_to? :specification_version then
    s.specification_version = 4
  end

  if s.respond_to? :add_runtime_dependency then
    s.add_development_dependency(%q<rake>.freeze, ["~> 0"])
    s.add_development_dependency(%q<rake-compiler>.freeze, ["~> 0"])
    s.add_development_dependency(%q<minitest>.freeze, ["~> 0"])
  else
    s.add_dependency(%q<rake>.freeze, ["~> 0"])
    s.add_dependency(%q<rake-compiler>.freeze, ["~> 0"])
    s.add_dependency(%q<minitest>.freeze, ["~> 0"])
  end
end
