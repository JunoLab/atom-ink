{CompositeDisposable} = require 'atom'
http = require 'http'
block = require './block'
Loading = require './loading'
Spinner = require './spinner'
results = require './results'
Console = require './console/console'
tree = require './tree'

module.exports = Ink =
  activate: ->
    results.activate()
    Console.activate()

    try
      if id = atom.config.get 'metrics.userId'
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
