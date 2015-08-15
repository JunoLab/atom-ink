{CompositeDisposable} = require 'atom'
block = require './block'
Loading = require './loading'
Spinner = require './spinner'
results = require './results'
Console = require './console/console'
tree = require './tree'

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
    tree: tree
