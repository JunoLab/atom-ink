export default block =
  timeout: (t, f) -> setTimeout f, t

  # highlights the start-end range of the provided editor object for 20 ms
  # ed is an object like atom.workspace.getActiveTextEditor(), start and
  # end are integers
  highlight: (ed, start, end, clas = 'ink-block') ->
    m = ed.markBufferRange [[start, 0], [end+1, 0]]
    d = ed.decorateMarker m,
          type: 'highlight'
          class: clas
    @timeout 20, =>
      for region in atom.views.getView(ed).querySelectorAll clas
        region.classList.add 'hidden'
    @timeout 220, =>
      m.destroy()
