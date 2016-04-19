StepperView = require './stepper-view'

module.exports =
class Stepper

  constructor: ->

  goto: (file, line) ->
    if file == @file
      @view.goto line
    else
      @destroy()
      atom.workspace.open(file).then (ed) =>
        @file = file
        @view = new StepperView ed, line

  destroy: ->
    @view?.destroy()
    delete @file
    delete @line
