# TODO: move determinate progress bars to the front
# TODO: hover UI with progress stack, descriptions

module.exports =

  metres: []

  push: (p) ->
    if @metres.indexOf(p) == -1
      @metres.push p
      if @metres.length == 1
        @showTile p
      p.destroy = => @remove p
      p

  remove: (p) ->
    i = @metres.indexOf p
    @metres.splice i, 1 if i > -1
    if @metres.length == 0
      @hideTile()
    if i == 0 and @metres.length > 0
      @showTile @metres[0]

  consumeStatusBar: (bar) ->
    @statusBar = bar

  progressView: (p) ->
    span = document.createElement 'span'
    span.classList.add 'inline-block'
    prog = document.createElement 'progress'
    prog.setAttribute 'max', 1
    if p.progress? then prog.setAttribute 'value', p.progress
    span.appendChild prog

    Object.observe p, (changes) ->
      for {name, object} in changes
        continue unless name == "progress"
        if object.progress?
          prog.setAttribute 'value', object.progress
        else
          prog.removeAttribute 'value'

    span

  hideTile: ->
    @tile?.destroy()
    delete @tile

  showTile: (p) ->
    @hideTile()
    @tile ?= @statusBar.addLeftTile item: @progressView(p), priority: -10
