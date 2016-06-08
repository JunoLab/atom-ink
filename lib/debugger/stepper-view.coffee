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
    if tooltip? then tt = atom.tooltips.add btn,
      title: tooltip,
      keyBindingCommand: command
      keyBindingTarget: atom.views.getView @editor
    btn.onclick = =>
      atom.commands.dispatch atom.views.getView(@editor), command
      tt.dispose()
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
      x?.classList.add 'debug' for x in [ed, tab]

  rmClass: (ed) ->
    [ed, tab] = @edAndTab ed
    x?.classList.remove 'debug' for x in [ed, tab]

  attach: ->
    @marker = @editor.markBufferPosition [@line, Infinity]
    @editor.decorateMarker @marker,
      type: 'overlay'
      item: @view
      stable: true
    # Work around markers being destroyed when closing a split editor
    @mListener?.dispose()
    @mListener = @marker.onDidDestroy => @attach() unless @destroyed

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
    @disposables.dispose()
    @mListener.dispose()
    @rmClass @editor
    @fadeOut =>
      @marker.destroy()
