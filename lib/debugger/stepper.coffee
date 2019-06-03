StepperView = require './stepper-view'
# {DebuggerToolbar} = require('./toolbar')
views = require '../util/views'
{Emitter} = require 'atom'
{focusEditorPane} = require '../util/pane-item'
{span} = views.tags
{open, isUntitled, getUntitledId, editorMatchesFile} = require '../util/opener'

module.exports =
class Stepper
  constructor: ({@buttons, @pending}) ->
    @views = []
    # @bars = []
    @text = "Grand Steppin'"
    @emitter = new Emitter()
    @pending ?= true
    @buttons ?= [
      {icon: 'arrow-down'}
      {icon: 'link-external'}
      {icon: 'chevron-right'}
    ]

  attach: (ed) ->
    return unless ed
    s = new StepperView ed, @line
    # toolbar = new DebuggerToolbar(@buttons)
    # toolbar.attach(ed)
    @views.push s
    # @bars.push toolbar
    ed.onDidDestroy =>
      s.destroy()
      # toolbar.destroy()
      @views = @views.filter((x) => x != s)
      # @bars = @bars.filter((x) => x != s)
    @setViewText s

  setViewText: (view) ->
    view.clear()
    view.appendChild views.render span 'stepper-label', @text
    # view.appendChild view.buttonGroup @buttons

  setText: (@text) ->
    @views.forEach (view) => @setViewText(view)

  edForFile: (file) ->
    atom.workspace.getTextEditors()
      .filter((ed) -> editorMatchesFile(ed, file))[0]

  activate: (file, line) ->
    active = atom.workspace.getActiveTextEditor()
    if editorMatchesFile(active, file)
      active.setCursorBufferPosition [line, 0]
      Promise.resolve()
    else
      focusEditorPane()
      open(file, line, {pending: @pending})

  goto: (file, @line) ->
    @listener ?= atom.workspace.observeTextEditors (ed) =>
      if editorMatchesFile(ed, file)
        @attach(ed)

    @activate(file, @line).then =>
      if file == @file
        view.goto @line for view in @views
      else
        @file = file
        @detach()
        @attach(@edForFile(file))
        @setText @text

  step: (file, line, text, info) ->
    @goto(file, line)
    @setText(text)
    @emitter.emit('step', {file, line, text: text.cloneNode(true), info})

  onStep: (f) ->
    @emitter.on('step', f)

  detach: ->
    view.destroy() for view in @views
    # bar.destroy() for bar in @bars
    @views = []
    # @bars = []

  destroy: ->
    @detach()
    @listener?.dispose()
    delete @listener
    delete @file
    delete @line
