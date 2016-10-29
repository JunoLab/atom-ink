# InkTooltip
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
class InkTooltip
  constructor: (@parent, content, @cond = -> true) ->
    @view = @tooltipView content
    document.body.appendChild @view
    @showOnHover()

  hide: -> @view.style.display = 'none'

  show: -> @view.style.display = 'block'

  destroy: ->
    document.body.removeChild @view

  tooltipView: (content) ->
    tt = document.createElement 'div'
    tt.classList.add 'ink-tooltip'
    tt.style.display = 'none'
    tt.appendChild content
    tt

  showOnHover: ->
    timer = null
    @parent.onmouseover = =>
      @positionOverlay()
      clearTimeout timer
      of @cond() then @show()
    @parent.onmouseout = => timer = setTimeout (=> @hide()), 150
    @view.onmouseover  = => clearTimeout timer
    @view.onmouseout   = => timer = setTimeout (=> @hide()), 150

  positionOverlay: ->
    bounding = @parent.getBoundingClientRect()
    @view.style.bottom   = bounding.height + 'px'
    @view.style.left     = bounding.left + 'px'
    @view.style.minWidth = bounding.width + 'px'
