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

  profileLineView: (ed, count) ->
    v = document.createElement 'div'
    v.classList.add 'ink-profile-line'
    # ed.presenter.baseCharacterWidth
    v.style.width = count*ed.preferredLineLength/2 + 'em'
    v

  profileLines: (ls) ->
    markers = []
    watch = @observeLines ls, (ed, {line, count}) =>
      m = ed.markBufferRange [[line, 0], [line, 0]],
        invalidate: 'touch'
      markers.push m
      ed.decorateMarker m,
        type: 'overlay'
        item: @profileLineView ed, count
        class: 'ink-profile-overlay'
    destroy: ->
      watch.dispose()
      m.destroy() for m in markers
