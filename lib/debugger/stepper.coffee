StepperView = require './stepper-view'

module.exports =
class Stepper

  constructor: (@text, @buttons) ->

    @views = []
    @text ?= "Grand Steppin'"
    @buttons ?= [
      {icon: 'arrow-down', tooltip: 'Next Line', command: 'julia-debug:step-to-next-line'}
      {icon: 'link-external', tooltip: 'Step Out'}
      {icon: 'chevron-right', tooltip: 'Step In'}
    ]
    @listener = atom.workspace.observeTextEditors (ed) =>
      @attach(ed) if ed.getPath() is @file

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

  goto: (file, @line) ->
    opts =
      initialLine: @line
      searchAllPanes: true
      pending: true
    atom.workspace.open(file, opts).then =>
      if file == @file
        view.goto @line for view in @views
      else
        @detach()
        @file = file
        @attach(ed) for ed in @edsForFile file

  detach: ->
    view?.destroy() for view in @views
    @views = []

  destroy: ->
    @detach()
    @listener.dispose()
    delete @file
    delete @line
