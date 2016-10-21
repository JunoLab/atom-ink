# TODO: move determinate progress bars to the front
# TODO: hover UI with progress stack, descriptions
{Emitter} = require 'atom'
{once} = require 'underscore-plus'

module.exports =
  activate: ->
    return if @activated
    @activated = true
    @emitter = new Emitter

    @overlay = @stackView()
    @view = @tileView()
    document.body.appendChild @overlay
    @tile = @statusBar?.addLeftTile
      item: @view
      priority: -1

    @view.onmouseover = => @overlay.style.display = 'block'
    @view.onmouseout = =>  @overlay.style.display = 'none'
    @positionOverlay()
    @emitter.on 'did-update-stack', => @positionOverlay()

  deactivate: ->
    @tile?.destroy()

  consumeStatusBar: (bar) ->
    @statusBar = bar

  stack: []

  add: (p) ->
    @stack.push p
    @emitter.emit 'did-update-stack'

  delete: (p) ->
    i = @stack.findIndex (e) -> e.id is p.id
    return if i < 0
    @stack.splice i, 1
    @emitter.emit 'did-update-stack'

  update: (p) ->
    i = @stack.findIndex (e) -> e.id is p.id
    return if i < 0
    @stack[i] = p
    @emitter.emit 'did-update-progress', p

  onDidUpdateStack: (f) -> @emitter.on 'did-update-stack', f

  onDidUpdateProgress: (f) -> @emitter.on 'did-update-progress', f

  progressView: (p) ->
    span = document.createElement 'span'
    span.classList.add 'inline-block'
    prog = document.createElement 'progress'
    prog.classList.add 'ink'
    prog.setAttribute 'max', 1
    span.appendChild prog

    @onDidUpdateProgress (prg) =>
      return unless p.id is prg.id
      if prg.determinate
        prog.setAttribute 'value', prg.progress
      else
        prog.removeAttribute 'value'

    span

  positionOverlay: ->
    bounding = @view.getBoundingClientRect()
    @overlay.style.bottom   = bounding.height - 5 + 'px'
    @overlay.style.left     = bounding.left + 'px'
    @overlay.style.minWidth = bounding.width + 'px'

  stackView: ->
    div = document.createElement 'div'
    div.classList.add 'ink-tooltip'
    div.style.display = 'none'
    table = document.createElement 'table'
    div.appendChild table

    @onDidUpdateStack =>
      # remove
      while table.firstChild
        table.removeChild table.firstChild

      #backwards iteration
      for i in [@stack.length - 1..0]
        p = @stack[i]
        tr = document.createElement 'tr'
        if p.name.length
          td = document.createElement 'td'
          td.appendChild document.createTextNode p.name
          tr.appendChild td
        td = document.createElement 'td'
        td.appendChild @progressView p
        tr.appendChild td
        table.appendChild tr
        console.log p
        @emitter.emit 'did-update-progress', p

    div

  tileView: ->
    span = document.createElement 'span'
    span.classList.add 'inline-block'
    span.innerText = 'progress'

    span
