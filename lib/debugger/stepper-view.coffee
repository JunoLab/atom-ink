module.exports =
class StepperView

  createView: ->
    @view = document.createElement 'div'
    @view.classList.add 'ink', 'stepper'
    @view.style.top = -@editor.getLineHeightInPixels() + 'px'
    @view.style.height = @editor.getLineHeightInPixels() + 'px'
    @view.style.width = '100px'

  constructor: (@editor, @line) ->
    @createView()
    @fadeIn()
    @marker = @editor.markBufferPosition [line, Infinity]
    @editor.decorateMarker @marker,
      type: 'overlay'
      item: @view

  fadeIn: ->
    @view.classList.add 'ink-hide'
    setTimeout (=> @view.classList.remove 'ink-hide'), 10

  fadeOut: (f) ->
    @view.classList.add 'ink-hide'
    setTimeout f, 200

  animate: (f) ->
    @view.parentElement?.style.transition = 'all 0.1s'
    setTimeout (=> @view.parentElement?.style.transition = ''), 100
    setTimeout f, 0

  goto: (line) ->
    @animate => @marker.setHeadBufferPosition [line, Infinity]

  destroy: ->
    @fadeOut => @marker.destroy()
