{CompositeDisposable} = require 'atom'
Loading = require './util/loading'
progress = require './util/progress'
block = require './editor/block'
highlights = require './editor/highlights'
Result = require './editor/result'
Console = require './console/console'
Stepper = require './debugger/stepper'
PlotPane = require './plots/pane'
Workspace = require './workspace/workspace'
tree = require './tree'

module.exports = Ink =
  activate: ->
    Result.activate()
    Console.activate()
    PlotPane.activate()
    Workspace.activate()
    window.Stepper = Stepper

    try
      if id = localStorage.getItem 'metrics.userId'
        require('http').get "http://data.junolab.org/hit?id=#{id}&app=ink"

  deactivate: ->
    Result.deactivate()
    Console.deactivate()
    progress.deactivate()

  consumeStatusBar: (bar) ->
    progress.consumeStatusBar bar

  provide: ->
    highlight: (ed, start, end) =>
      block.highlight ed, start, end
    Loading: Loading
    progress: progress
    Result: Result
    Console: Console
    Stepper: Stepper
    Workspace: Workspace
    PlotPane: PlotPane
    highlights: highlights
    tree: tree
