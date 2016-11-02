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
#        delay: Time in ms after which the tooltip is shown or hidden. Defaults
#               to 150ms.
#
# .show()
#     Show the tooltip.
#
# .hide()
#     Hide the tooltip.
#
# .destroy()
#     Destroy the tooltip.

module.exports =
class Tooltip
  constructor: (@parent, content, {@cond, @delay}) ->
    @cond  = (-> true) unless @cond?
    @delay = 150       unless @delay?

    @view = @tooltipView content
    document.body.appendChild @view
    @showOnHover()
    this

  hide_: ->
    @view.classList.add 'dontshow'
    @view.style.display = 'none'

  hide: ->
    @view.classList.add 'dontshow'
    setTimeout (=> @hide_()), 100

  show: ->
    @view.style.display = 'block'
    setTimeout ( => @view.classList.remove 'dontshow'), 20

  destroy: ->
    document.body.removeChild @view

  tooltipView: (content) ->
    tt = document.createElement 'div'
    tt.classList.add 'ink-tooltip', 'dontshow'
    tt.style.display = 'none'
    if content then tt.appendChild content
    tt

  showOnHover: ->
    hideTimer = null
    showTimer = null
    @parent.onmouseover = =>
      @positionOverlay()
      clearTimeout hideTimer
      if @cond() then showTimer = setTimeout (=> @show()), @delay
    @parent.onmouseout = =>
      clearTimeout showTimer
      hideTimer = setTimeout (=> @hide()), @delay
    @view.onmouseover  = => clearTimeout hideTimer
    @view.onmouseout   = => hideTimer = setTimeout (=> @hide()), @delay

  positionOverlay: ->
    bounding = @parent.getBoundingClientRect()
    @view.style.bottom   = bounding.height + 'px'
    @view.style.left     = bounding.left   + 'px'
    @view.style.minWidth = bounding.width  + 'px'
