{CompositeDisposable} = require 'atom'
http = require 'http'
Loading = require './util/loading'
links   = require './util/file-links'
block   = require './editor/block'
highlights = require './editor/highlights'
results = require './editor/results'
Spinner = require './editor/spinner'
Console = require './console/console'
tree    = require './tree'
methodview = require './util/method-view'

module.exports = Ink =
  config:
    monotypeResults:
      type: 'boolean'
      default: false
      description: 'Display results in your editor\'s monotype font'

  activate: ->
    results.activate()
    Console.activate()

    edId = 1
    atom.workspace.observeTextEditors (ed) ->
      if not ed.getPath()?
        ed.getBuffer().inkId ?= edId++

    try
      if id = localStorage.getItem 'metrics.userId'
        http.get "http://data.junolab.org/hit?id=#{id}&app=ink"

  deactivate: ->
    results.deactivate()
    Console.deactivate()

  provide: ->
    highlight: (ed, start, end) =>
      block.highlight ed, start, end
    Loading: Loading
    Spinner: Spinner
    results: results
    Console: Console
    highlights: highlights
    tree: tree
    links: links
    methodview: methodview
