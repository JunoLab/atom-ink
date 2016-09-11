# TODO: move determinate progress bars to the front
# TODO: hover UI with progress stack, descriptions
{Emitter} = require 'atom'

class ProgressMeter
  constructor: (@progress, @text = '') ->
    @emitter  = new Emitter
    @view = @progressView()
    @overlay = @overlayView()

    document.body.appendChild @overlay

    @view.onmouseover = => @overlay.style.display = 'block' unless @text is ''
    @view.onmouseout  = => @overlay.style.display = 'none'

  update: (@progress, @text, @file) ->
    @positionOverlay()
    @emitter.emit 'did-update'

  destroy: ->
    @emitter.emit 'did-destroy'
    @emitter.dispose()

  positionOverlay: ->
    bounding = @view.getBoundingClientRect()
    @overlay.style.bottom   = bounding.height - 5 + 'px'
    @overlay.style.left     = bounding.left + 'px'
    @overlay.style.minWidth = bounding.width + 'px'

  overlayView: ->
    div = document.createElement 'div'
    div.classList.add 'ink-overlay'
    div.style.display = 'none'
    if @text? then div.innerText = @text

    @emitter.on 'did-update', =>
      div.innerText = @text
      if @text is '' then div.style.display = 'none'

    @emitter.on 'did-destroy', =>
      div.style.display = 'none'
      document.body.removeChild div

    div

  progressView: ->
    span = document.createElement 'span'
    span.classList.add 'inline-block'
    prog = document.createElement 'progress'
    prog.classList.add 'ink'
    prog.setAttribute 'max', 1
    span.appendChild prog

    @emitter.on 'did-update', =>
      if @progress is 'indeterminate'
        prog.removeAttribute 'value'
      else
        prog.setAttribute 'value', @progress

      if @file?
        prog.style.cursor = 'pointer'
        prog.onclick = =>
          atom.workspace.open @file,
            searchAllPanes: true
      else
        prog.style.cursor = 'auto'
        prog.onclick = =>

    span


module.exports =
  deactivate: ->
    @tile?.destroy()

  create: ->
    p = new ProgressMeter 0
    @tile = @statusBar?.addLeftTile
      item: p.view
      priority: -1
    p.positionOverlay()
    p

  consumeStatusBar: (bar) ->
    @statusBar = bar
