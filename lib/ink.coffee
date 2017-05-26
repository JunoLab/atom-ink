{CompositeDisposable} = require 'atom'
etch = require 'etch'

PaneItem = require './util/pane-item'
Loading = require './util/loading'
progress = require './util/progress'
Tooltip = require './util/tooltip'
block = require './editor/block'
highlights = require './editor/highlights'
Result = require './editor/result'
Docs = require './editor/docs'
Console = require './console/console'
Stepper = require './debugger/stepper'
breakpoints = require './debugger/breakpoints'
PlotPane = require './plots/pane'
profiler = require './plots/profiler'
Workspace = require './workspace/workspace'
tree = require './tree'
goto = require './gotodef'

module.exports = Ink =
  activate: ->
    etch.setScheduler(atom.views)
    mod.activate() for mod in [PaneItem, Result, Docs, Console, PlotPane, profiler]

  deactivate: ->
    pkg = atom.packages.getActivePackage 'ink'
    localStorage.setItem pkg.getCanDeferMainModuleRequireStorageKey(), false
    mod.deactivate() for mod in [PaneItem, Result, Docs, Console, PlotPane, profiler]

  consumeStatusBar: (bar) ->
    progress.consumeStatusBar bar

  provide: ->
    util:
      focusEditorPane: () -> PaneItem.focusEditorPane()
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
    Tooltip: Tooltip
    Profiler: profiler
