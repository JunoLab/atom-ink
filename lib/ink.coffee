{CompositeDisposable} = require 'atom'
etch = require 'etch'
{once} = require 'underscore-plus'

# these need to be loaded first so deserialization works fine
PaneItem = require './util/pane-item'
PlotPane = require './plots/pane'
HTMLPane = require './plots/htmlpane'
DocPane = require('./docs/docpane')
NotePane = require('./note/notepane')
DebuggerPane = require('./debugger/debugger-pane')
InkTerminal = require('./console/console')
Workspace = require './workspace/workspace'
Outline = require './outline/outline'
Linter = require './linter/linter'

exportables =
  PaneItem: once(=> PaneItem)
  PlotPane: once(=> PlotPane)
  DocPane: once(=> DocPane)
  NotePane: once(=> NotePane)
  DebuggerPane: once(=> DebuggerPane)
  InkTerminal: once(=> InkTerminal)
  Workspace: once(=> Workspace)
  Outline: once(=> Outline)
  Linter: once(=> Linter)
  HTMLPane: once(=> HTMLPane)
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
  Profiler: once(=> require './plots/profiler')
  tree: once(=> require './tree')
  Opener: once(=> require('./util/opener'))
  matchHighlighter: once(=> require './util/matchHighlighter')
  ansiToHTML: once(=> require './util/ansitohtml')
  showBasicModal: once(=> require './util/basic-modal')

module.exports = Ink =
  activate: ->
    etch.setScheduler(atom.views)
    mod.activate() for mod in [exportables.Opener(), exportables.PaneItem(), exportables.Result(), exportables.InlineDoc(), exportables.PlotPane(), exportables.InkTerminal(), exportables.Linter()]

  deactivate: ->
    # pkg = atom.packages.getActivePackage 'ink'
    # localStorage.setItem pkg.getCanDeferMainModuleRequireStorageKey(), exportables.false()
    mod.deactivate() for mod in [exportables.Opener(), exportables.PaneItem(), exportables.Result(), exportables.DocPane(), exportables.InlineDoc(), exportables.PlotPane(), exportables.InkTerminal(), exportables.Linter()]

  config: require('./config')

  consumeStatusBar: (bar) ->
    exportables.progress().consumeStatusBar bar

  consumeRemoteFileOpener: (opener) ->
    exportables.Opener().consumeRemoteFileOpener(opener)

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
