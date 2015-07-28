{CompositeDisposable} = require 'atom'
block = require './block'
loading = require './loading'
results = require './results'
consoul = require './console/console'

module.exports = Ink =
  activate: ->
    consoul.activate()

  deactivate: ->
    consoul.deactivate()

  provide: ->
    highlight: (ed, start, end) =>
      block.highlight ed, start, end
    loading: loading
    results: results
    console: consoul
