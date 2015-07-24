{CompositeDisposable} = require 'atom'
block = require './block'
loading = require './loading'
results = require './results'

module.exports = Ink =
  activate: ->

  provide: ->
    highlight: (ed, start, end) =>
      block.highlight ed, start, end
    loading: loading
    results: results
