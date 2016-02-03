{CompositeDisposable} = require 'atom'
http = require 'http'
Loading = require './util/loading'
block   = require './editor/block'
highlights = require './editor/highlights'
Result = require './editor/result'
Spinner = require './editor/spinner'
Console = require './console/console'
tree    = require './tree'

module.exports = Ink =
  activate: ->
    Result.activate()
    Console.activate()

    edId = 1
    atom.workspace.observeTextEditors (ed) ->
      if not ed.getPath()?
        ed.getBuffer().inkId ?= edId++

    try
      if id = localStorage.getItem 'metrics.userId'
        http.get "http://data.junolab.org/hit?id=#{id}&app=ink"

  deactivate: ->
    Result.deactivate()
    Console.deactivate()

  provide: ->
    highlight: (ed, start, end) =>
      block.highlight ed, start, end
    Loading: Loading
    Spinner: Spinner
    Result: Result
    Console: Console
    highlights: highlights
    tree: tree
