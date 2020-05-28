import {CompositeDisposable, Emitter} from 'atom'

# Tooltip
#
# Tooltips that support arbitrary HTML content.
#
# new Tooltip(parent, content, options)
#     Create a new Tooltip attached to `parent` with content `content`, which
#     will be shown on mouseover.
#     options:
#        cond:  Function. If it evaluates to false when hovering over the parent,
#               the tooltip will not be shown. Defaults to `-> true`.
#        hideDelay: Time in ms after which the tooltip is hidden. Defaults to 150ms.
#        showDelay: Time in ms after which the tooltip is shown. Defaults to 150ms.
#        className: Custom CSS class for the tooltip.
#        position: Determines the tooltip's position relative to its parent.
#                  Can be `left` or `right`.
#
# .show()
#     Show the tooltip.
#
# .hide()
#     Hide the tooltip.
#
# .destroy()
#     Destroy the tooltip.

export default class Tooltip
  constructor: (@parent, content, {@cond, @showDelay, @hideDelay, @className, @position}={}) ->
    @cond  = (-> true)  unless @cond?
    @showDelay = 150    unless @showDelay?
    @hideDelay = 150    unless @hideDelay?
    @position  = 'left' unless @position?
    @emitter = new Emitter()
    @view = @tooltipView content
    document.body.appendChild @view

    # remember old mouse listeners
    @oldOnMouseOver = @parent.onmouseover
    @oldOnMouseOut = @parent.onmouseout

    @showOnHover()
    this

  onDidShow: (f) ->
    @emitter.on('didShow', f)

  onDidHide: (f) ->
    @emitter.on('didHide', f)

  hide_: ->
    @view.classList.add 'dontshow'
    @view.style.display = 'none'

  hide: ->
    @view.classList.add 'dontshow'
    @emitter.emit 'didHide'
    setTimeout (=> @hide_()), 100

  show: ->
    @view.style.display = 'block'
    @emitter.emit 'didShow'
    setTimeout ( =>
      @positionOverlay()
      @view.classList.remove 'dontshow'), 20

  destroy: ->
    if document.body.contains @view
      document.body.removeChild @view
    @parent.onmouseover = @oldOnMouseOver
    @parent.onmouseout = @oldOnMouseOut

  tooltipView: (content) ->
    tt = document.createElement 'div'
    tt.classList.add 'ink-tooltip', 'dontshow'
    if @clas then tt.classList.add @className
    tt.style.display = 'none'
    if content then tt.appendChild content
    tt

  showOnHover: ->
    hideTimer = null
    showTimer = null
    @parent.onmouseover = =>
      clearTimeout hideTimer
      if @cond() then showTimer = setTimeout (=> @show()), @showDelay
    @parent.onmouseout = =>
      clearTimeout showTimer
      hideTimer = setTimeout (=> @hide()), @hideDelay
    @view.onmouseover  = =>
      clearTimeout hideTimer
    @view.onmouseout   = =>
      hideTimer = setTimeout (=> @hide()), @hideDelay

  positionOverlay: ->
    bounding = @parent.getBoundingClientRect()
    @view.style.bottom = document.documentElement.clientHeight - bounding.top + 'px'
    @view.style.left = switch @position
      when 'left'
        bounding.left + 'px'
      when 'right'
        bounding.left + bounding.width - @view.offsetWidth + 'px'
