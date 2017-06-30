module.exports =
  show: (ed, view, {scroll}={}) ->
    dom = atom.views.getView(ed).querySelector('.lines')
    view.style.position = 'absolute'
    view.style.zIndex = 100
    dom.appendChild view
    if scroll then @scrollContinuous atom.views.getView(ed), view

  remove: (view) ->
    view.parentElement?.removeChild(view)

  scroll: (ed, view) ->
    view.style.transform = "translateY(#{-ed.getScrollTop()}px)
                            translateX(#{-ed.getScrollLeft()}px)"

  scrollContinuous: (ed, view) ->
    if view.parentElement?
      @scroll ed, view
      requestAnimationFrame =>
        @scrollContinuous ed, view

  position: (ed, view, {row, column, width, height}={}) ->
    h = ed.getLineHeightInPixels()
    row and view.style.top = row * h + "px"
    height and view.style.height = height * h + "px"
    w = ed.getDefaultCharWidth()
    column and view.style.left = column * w + "px"
    width and view.style.width = width * w + "px"
