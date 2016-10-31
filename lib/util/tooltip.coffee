# Tooltip
#
# Tooltips that support arbitrary HTML content.
#
# new InkTooltip(parent, content, cond = -> true)
#     Create a new InkTooltip attached to `parent` with content `content`. Will
#     be shown on mouseover, unless `cond` evaluates to `false`.
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
  constructor: (@parent, content, @cond = -> true) ->
    @view = @tooltipView content
    document.body.appendChild @view
    @showOnHover()
    this

  hide: ->
    @view.classList.add 'dontshow'
    setTimeout (=> @view.style.display = 'none'), 100

  show: ->
    @view.classList.remove 'dontshow'
    setTimeout (=> @view.style.display = 'block'), 100

  destroy: ->
    document.body.removeChild @view

  tooltipView: (content) ->
    tt = document.createElement 'div'
    tt.classList.add 'ink-tooltip', 'dontshow'
    tt.style.display = 'none'
    tt.appendChild content
    tt

  showOnHover: ->
    timer = null
    @parent.onmouseover = =>
      @positionOverlay()
      clearTimeout timer
      if @cond() then @show()
    @parent.onmouseout = => timer = setTimeout (=> @hide()), 100
    @view.onmouseover  = => clearTimeout timer
    @view.onmouseout   = => timer = setTimeout (=> @hide()), 100

  positionOverlay: ->
    bounding = @parent.getBoundingClientRect()
    @view.style.bottom   = bounding.height + 'px'
    @view.style.left     = bounding.left   + 'px'
    @view.style.minWidth = bounding.width  + 'px'
