{editorMatchesFile} = require '../util/opener'

module.exports =
  observeLines: (ls, f) ->
    atom.workspace.observeTextEditors (ed) =>
      for l in ls
        if editorMatchesFile(ed, l.file)
          f ed, l

# Adds a red background color to the provided line specifications
# ls is a vector of {file: 'full-path-to-file', line: integer}
# full-path as via: atom.workspace.getActiveTextEditor().getPath()
# NOTE: this doesn't check whether or not the lines already had a background color
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

  profileLines: (ls) ->
    markers = []
    watch = @observeLines ls, (ed, {line, count, classes}) =>
      m = ed.markBufferRange [[line, 0], [line, 1+Math.round(count*ed.preferredLineLength)]],
        invalidate: 'touch'
      markers.push m
      ed.decorateMarker m,
        type: 'highlight'
        class: "ink-profile-line #{classes.join(' ')}"
    destroy: =>
      watch.dispose()
      m.destroy() for m in markers
