module.exports =
class StepperView

  createView: ->
    @view = document.createElement 'div'
    @view.classList.add 'ink', 'stepper'
    @view.style.top = -@editor.getLineHeightInPixels() + 'px'

  buttonView: ({icon, text, tooltip, command}) ->
    btn = document.createElement 'button'
    btn.classList.add 'btn', 'btn-primary'
    if text? then btn.innerText = text
    if icon? then btn.classList.add "icon-#{icon}"
    if tooltip? then atom.tooltips.add btn,
      title: tooltip,
      keyBindingCommand: command
      keyBindingTarget: atom.views.getView @editor
    btn.onclick = => atom.commands.dispatch atom.views.getView(@editor), command
    btn

  buttonGroup: (buttons) ->
    grp = document.createElement 'div'
    grp.classList.add 'btn-group', 'btn-group-xs'
    buttons.forEach (b) => grp.appendChild @buttonView b
    grp

  appendChild: (c) -> @view.appendChild c

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
