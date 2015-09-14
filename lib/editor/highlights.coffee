module.exports =
  observeLines: (ls, f) ->
    atom.workspace.observeTextEditors (ed) ->
      for l in ls
        if l.file == ed.getPath()
          f ed, l

  errorLines: (ls) ->
    markers = []
    watch = @observeLines ls, (ed, {line}) =>
      m = ed.markBufferRange [[line, 0], [line+1, 0]]
      markers.push m
      ed.decorateMarker m,
        type: 'highlight'
        class: 'error-line'
    destroy: ->
      watch.dispose()
      m.destroy() for m in markers
