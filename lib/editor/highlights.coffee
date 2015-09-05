module.exports =
  observeLines: (ls, f) ->
    atom.workspace.observeTextEditors (ed) ->
      for l in ls
        if l.file == ed.getPath()
          f ed, l

  markLine: (ed, line) ->
    ed.markBufferRange [[line, 0], [line+1, 0]]

  errorLines: (ls) ->
    markers = []
    watch = @observeLines ls, (ed, {line}) =>
      m = @markLine ed, line
      markers.push m
      ed.decorateMarker m,
        type: 'highlight'
        class: 'error-line'
    dispose: ->
      watch.dispose()
      m.destroy() for m in markers
