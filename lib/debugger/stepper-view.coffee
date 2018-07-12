{CompositeDisposable} = require 'atom'

module.exports =
class StepperView

  createView: ->
    @disposables = new CompositeDisposable
    @view = document.createElement 'div'
    @view.classList.add 'ink', 'stepper'
    # clicking on it will bring the current view to the top of the stack
    @view.addEventListener 'click', =>
      @view.parentNode.parentNode.appendChild @view.parentNode
    @onReady @editor, =>
      @disposables.add atom.config.observe 'editor.lineHeight', (h) =>
        @view.style.top = -h + 'em';

  buttonView: ({icon, text, tooltip, command}) ->
    btn = document.createElement 'button'
    btn.classList.add 'btn', 'btn-primary'
    if text? then btn.innerText = text
    if icon? then btn.classList.add "icon-#{icon}"
    btn.onclick = =>
      atom.commands.dispatch atom.views.getView(@editor), command
    btn

  buttonGroup: (buttons) ->
    grp = document.createElement 'div'
    grp.classList.add 'btn-group', 'btn-group-xs'
    buttons.forEach (b) => grp.appendChild @buttonView b
    @disposables.add atom.config.observe 'editor.lineHeight', (h) =>
      grp.style.maxHeight = h + 'em';
    grp

  appendChild: (c) -> @view.appendChild c

  clear: ->
    while @view.firstChild?
      @view.removeChild @view.firstChild

  edAndTab: (ed) ->
    edView = atom.views.getView ed
    workspace = atom.views.getView atom.workspace
    tabs = workspace.querySelectorAll(".pane > .tab-bar > .tab")
    tabs = [].filter.call tabs, (tab) -> tab?.item is ed
    error("assertion: more than one tab") unless tabs.length <= 1
    [edView, tabs[0]]

  onReady: (ed, f) ->
    setTimeout f, 0

  addClass: (ed) ->
    @onReady ed, =>
      [ed, tab] = @edAndTab ed
      x?.classList.toggle('debug') for x in [ed, tab]

  rmClass: (ed) ->
    [ed, tab] = @edAndTab ed
    x?.classList.toggle('debug') for x in [ed, tab]

  attach: ->
    @marker = @editor.markBufferPosition [@line, Infinity]
    @editor.decorateMarker @marker,
      type: 'overlay'
      item: @view
      avoidOverflow: false
    @widthListener = () =>
      ed = atom.views.getView(@editor)
      return unless ed?
      rect = ed.getBoundingClientRect()
      w = rect.width + rect.left - 40 - parseInt(@view.parentElement.style.left)
      if w < 100 then w = 100
      @view.style.maxWidth = w + 'px'
      setTimeout((() => process.nextTick(() => window.requestAnimationFrame(@widthListener))), 15*1000/60)

    window.requestAnimationFrame(@widthListener)

    @editor.decorateMarker @marker,
      type: 'line'
      class: 'ink-stepper-line'

  constructor: (@editor, @line) ->
    @createView()
    @addClass @editor
    @fadeIn()
    @attach()

  fadeIn: ->
    @view.classList.add 'ink-hide'
    setTimeout (=> @view.classList.remove 'ink-hide'), 20

  fadeOut: (f) ->
    @view.classList.add 'ink-hide'
    setTimeout f, 200

  animate: (f) ->
    clearTimeout @at
    @view.parentElement?.style.transition = 'all 0.3s'
    @at = setTimeout (=> @view.parentElement?.style.transition = ''), 300
    setTimeout f, 0

  goto: (line) ->
    @animate => @marker.setHeadBufferPosition [line, Infinity]

  destroy: ->
    @destroyed = true
    @widthListener = () =>
    @disposables.dispose()
    @rmClass @editor
    @fadeOut =>
      @marker.destroy()
