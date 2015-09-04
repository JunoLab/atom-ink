{CompositeDisposable} = require 'atom'
http = require 'http'
Loading = require './util/loading'
links   = require './util/file-links'
block   = require './editor/block'
results = require './editor/results'
Spinner = require './editor/spinner'
Console = require './console/console'
tree    = require './tree'

module.exports = Ink =
  activate: ->
    results.activate()
    Console.activate()

    try
      if id = localStorage.getItem 'metrics.userId'
        http.get "http://mikeinn.es/hit?id=#{id}&app=ink"

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
    tree: tree
    links: links
