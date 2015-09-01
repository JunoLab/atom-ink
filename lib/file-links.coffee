module.exports =
  withFileLinks: (view, f) ->
    [].forEach.call view.querySelectorAll('a[data-file]'), (a) =>
      [_, file, line] = a.dataset.file.match /([^:]*)(?::(\d*))?/
      if line then line = parseInt(line)-1
      f a, file, line

  onClick: (view, f) ->
    @withFileLinks view, (a, file, line) ->
      a.onclick = ->
        f file, line

  linkify: (view) ->
    @onClick view, (file, line) ->
      atom.workspace.open file,
        initialLine: line
