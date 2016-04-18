module.exports =

  metres: []

  consumeStatusBar: (bar) ->
    @statusBar = bar
    @test()

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

  test: ->
    @p = {progress: 0}
    @statusBar.addLeftTile item: @progressView(@p), priority: -10

  # for i in [0..100]
  #   do (i) =>
  #     setTimeout (=> @p.progress = i/100), i*10
