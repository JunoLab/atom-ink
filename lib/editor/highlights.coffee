module.exports =
  matchesPath: (ed, path) ->
    ed.getPath() == path ||
      (!ed.getPath() &&
        ed.getBuffer().id == path.match(/untitled-([\d\w]*)/)?[1])

  observeLines: (ls, f) ->
    atom.workspace.observeTextEditors (ed) =>
      for l in ls
        if @matchesPath ed, l.file
          f ed, l

  errorLines: (ls) ->
    markers = []
    watch = @observeLines ls, (ed, {line}) =>
      m = ed.markBufferRange [[line, 0], [line+1, 0]],
        invalidate: 'touch'
      markers.push m
      ed.decorateMarker m,
        type: 'highlight'
        class: 'error-line'
    destroy: ->
      watch.dispose()
      m.destroy() for m in markers
