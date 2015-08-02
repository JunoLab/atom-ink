{CompositeDisposable} = require 'atom'
block = require './block'
Loading = require './Loading'
Spinner = require './spinner'
results = require './results'
Console = require './console/console'

module.exports = Ink =
  activate: ->
    Console.activate()

  deactivate: ->
    Console.deactivate()

  provide: ->
    highlight: (ed, start, end) =>
      block.highlight ed, start, end
    Loading: Loading
    Spinner: Spinner
    results: results
    Console: Console
