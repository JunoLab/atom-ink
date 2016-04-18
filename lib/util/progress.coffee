module.exports =

  metres: []

  consumeStatusBar: (bar) ->
    @statusBar = bar
    @test()

  progressView: (p) ->
    span = document.createElement 'span'
    span.classList.add 'inline-block'
    prog = document.createElement 'progress'
    span.appendChild prog
    span

  test: ->
    @statusBar.addLeftTile item: @progressView(), priority: -10
