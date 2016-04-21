StepperView = require './stepper-view'

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
    view = new StepperView ed, @line
    text = document.createElement 'span'
    text.innerText = @text
    text.style.paddingLeft = text.style.paddingRight = '10px'
    view.appendChild text
    view.appendChild view.buttonGroup @buttons
    @views.push view

  edsForFile: (file) ->
    atom.workspace.getTextEditors()
      .filter((x)->x.getPath() is file)

  activate: (file, line) ->
    active = atom.workspace.getActiveTextEditor()
    if active?.getPath() is file
      active.setCursorBufferPosition [line, 0]
      Promise.resolve()
    else
      atom.workspace.open file,
        initialLine: line
        searchAllPanes: true
        pending: true

  goto: (file, @line) ->
    @listener ?= atom.workspace.observeTextEditors (ed) =>
      @attach(ed) if ed.getPath() is @file

    @activate(file, @line).then =>
      if file == @file
        view.goto @line for view in @views
      else
        @file = file
        @detach()
        @attach(ed) for ed in @edsForFile file

  detach: ->
    view?.destroy() for view in @views
    @views = []

  destroy: ->
    @detach()
    @listener.dispose()
    delete @listener
    delete @file
    delete @line
