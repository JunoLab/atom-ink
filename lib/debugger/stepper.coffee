StepperView = require './stepper-view'
views = require '../util/views'
{focusEditorPane} = require '../util/pane-item'
{span} = views.tags
{open} = require '../util/opener'

module.exports =
class Stepper

  constructor: ({@buttons}) ->
    @views = []
    @text = "Grand Steppin'"
    @buttons ?= [
      {icon: 'arrow-down'}
      {icon: 'link-external'}
      {icon: 'chevron-right'}
    ]

  attach: (ed) ->
    s = new StepperView ed, @line
    @views.push s
    ed.onDidDestroy =>
      s.destroy()
      @views = @views.filter((x) => x != s)
    @setViewText s

  setViewText: (view) ->
    view.clear()
    view.appendChild views.render span 'stepper-label', @text
    view.appendChild view.buttonGroup @buttons

  setText: (@text) ->
    @views.forEach (view) => @setViewText(view)

  edForFile: (file) ->
    atom.workspace.getTextEditors()
      .filter((x)->x.getPath() is file)[0]

  activate: (file, line) ->
    active = atom.workspace.getActiveTextEditor()
    if active?.getPath() is file
      active.setCursorBufferPosition [line, 0]
      Promise.resolve()
    else
      focusEditorPane()
      open(file, line, {pending: true})

  goto: (file, @line) ->
    @listener ?= atom.workspace.observeTextEditors (ed) =>
      @attach(ed) if ed.getPath() is @file

    @activate(file, @line).then =>
      if file == @file
        view.goto @line for view in @views
      else
        @file = file
        @detach()
        @attach(@edForFile(file))
        @setText @text

  detach: ->
    view.destroy() for view in @views
    @views = []

  destroy: ->
    @detach()
    @listener?.dispose()
    delete @listener
    delete @file
    delete @line
