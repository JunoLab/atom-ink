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

  attach: (ed) ->
    @view = new StepperView ed, @line
    text = document.createElement 'span'
    text.innerText = @text
    text.style.paddingLeft = text.style.paddingRight = '10px'
    @view.appendChild text
    @view.appendChild @view.buttonGroup @buttons

  goto: (file, @line) ->
    # @listener ?= atom.workspace.observeTextEditors (ed) ->
    if file == @file
      @view.goto @line
    else
      @detach()
      atom.workspace.open(file).then (ed) =>
        @file = file
        @attach ed

  detach: -> @view?.destroy()

  destroy: ->
    @detach()
    delete @file
    delete @line
