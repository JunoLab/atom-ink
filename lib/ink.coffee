{CompositeDisposable} = require 'atom'
mixin = require './pane-mixin'
Loading = require './util/loading'
progress = require './util/progress'
block = require './editor/block'
highlights = require './editor/highlights'
Result = require './editor/result'
Docs = require './editor/docs'
Console = require './console/console'
Stepper = require './debugger/stepper'
breakpoints = require './debugger/breakpoints'
PlotPane = require './plots/pane'
Workspace = require './workspace/workspace'
tree = require './tree'
goto = require './gotodef'

module.exports = Ink =
  activate: ->
    mod.activate() for mod in [Result, Docs, Console, PlotPane, Workspace]

  deactivate: ->
    mod.deactivate() for mod in [Result, Docs, Console, progress, breakpoints, mixin]

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
    breakpoints: breakpoints
    Workspace: Workspace
    PlotPane: PlotPane
    highlights: highlights
    tree: tree
    InlineDoc: Docs
    goto: goto
