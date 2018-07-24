{CompositeDisposable} = require 'atom'
etch = require 'etch'
{once} = require 'underscore-plus'

# these need to be loaded first so deserialization works fine
PaneItem = require './util/pane-item'
Console = require './console/console'
PlotPane = require './plots/pane'
DocPane = require('./docs/docpane')
InkTerminal = require('./console2/console')
Workspace = require './workspace/workspace'
Linter  = require './linter/linter'

exportables =
  PaneItem: => PaneItem
  Console: => Console
  PlotPane: => PlotPane
  DocPane: => DocPane
  InkTerminal: => InkTerminal
  Workspace: => Workspace
  Linter : => Linter
  Loading: once(=> require './util/loading')
  progress: once(=> require './util/progress')
  Tooltip: once(=> require './util/tooltip')
  block: once(=> require './editor/block')
  highlights: once(=> require './editor/highlights')
  Result: once(=> require './editor/result')
  InlineDoc: once(=> require './editor/docs')
  Stepper: once(=> require './debugger/stepper')
  breakpoints: once(=> require './debugger/breakpoints')
  Pannable: once(=> require('./plots/canopy').Pannable)
  KaTeX: once(=> require('./util/katexify'))
  profiler: once(=> require './plots/profiler')
  tree: once(=> require './tree')
  goto: once(=> require './util/gotodef')
  Opener: once(=> require('./util/opener'))
  matchHighlighter: once(=> require './util/matchHighlighter')
  ansiToHTML: once(=> require './util/ansitohtml')

module.exports = Ink =
  activate: ->
    etch.setScheduler(atom.views)
    mod.activate() for mod in [exportables.PaneItem(), exportables.Result(), exportables.InlineDoc(), exportables.Console(), exportables.PlotPane(), exportables.InkTerminal(), exportables.Linter()]

  deactivate: ->
    # pkg = atom.packages.getActivePackage 'ink'
    # localStorage.setItem pkg.getCanDeferMainModuleRequireStorageKey(), exportables.false()
    mod.deactivate() for mod in [exportables.PaneItem(), exportables.Result(), exportables.InlineDoc(), exportables.Console(), exportables.PlotPane(), exportables.InkTerminal(), exportables.Linter()]

  consumeStatusBar: (bar) ->
    exportables.progress().consumeStatusBar bar

  provide: ->
    obj =
      util:
        focusEditorPane: () -> exportables.PaneItem().focusEditorPane()
      highlight: (ed, start, end, clas) =>
        exportables.block().highlight ed, start, end, clas

    for key, val of exportables
      do (val) ->
        Object.defineProperty(obj, key, {
          get: -> val()
        })
    obj
