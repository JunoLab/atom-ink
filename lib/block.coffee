overlay = require './overlay'

module.exports =
  timeout: (t, f) -> setTimeout f, t

  highlightColour: (ed, start, end) ->
    m = ed.markBufferRange [[start, 0], [end+1, 0]]
    d = ed.decorateMarker m,
          type: 'highlight'
          class: 'block-notify'
    @timeout 20, =>
      for region in atom.views.getView(ed).rootElement.querySelectorAll '.block-notify'
        region.classList.add 'hidden'
    @timeout 320, =>
      m.destroy()

  blockDiv: ->
    div = document.createElement('div')
    div.classList.add 'ink'
    div.classList.add 'block'
    div.style.width = '100%'
    div

  highlight: (ed, start, end) ->
    div = @blockDiv()
    overlay.show ed, div, scroll: true
    overlay.position ed, div,
      row: start
      height: end-start+1
    @timeout 20, => div.classList.add 'hidden'
    @timeout 220, =>
      overlay.remove div
    div
