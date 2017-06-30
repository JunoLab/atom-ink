overlay = require './overlay'

module.exports =
  timeout: (t, f) -> setTimeout f, t

  highlightColour: (ed, start, end) ->
    m = ed.markBufferRange [[start, 0], [end+1, 0]]
    d = ed.decorateMarker m,
          type: 'highlight'
          class: 'block-notify'
    @timeout 20, =>
      for region in atom.views.getView(ed).querySelectorAll '.block-notify'
        region.classList.add 'hidden'
    @timeout 320, =>
      m.destroy()

  blockDiv: ->
    div = document.createElement('div')
    div.classList.add 'ink'
    div.classList.add 'block'
    div.style.width = '100%'
    div

  # highlights the start-end range of the provided editor object for 20 ms
  # ed is an object like atom.workspace.getActiveTextEditor(), start and
  # end are integers
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
