# TODO: implement progress stack
{Emitter} = require 'atom'

# Progress API
#
# You can create a new progress meter in the status bar by calling
# `ink.progress.create()`, which will return a ProgressMeter object, which can
# be updated via the `update(progress, [text, [file]])` method as well as
# `destroy()`ed (the latter removes the tile as well).
#
# create()
#   Creates a new progress bar and displays it in the status bar.
#
# update(progress, [text, [file]])
#   Updates the progress bar to `progress` ∈ [0, 1] (or "indeterminate" to show
#   a indeterminate progress bar) and displays `text` as a tooltip if provided.
#   If `file` exists, a click on the progress bar will open it.
#
# destroy()
#   Destroys the progress bar and removes it from the status bar.

class ProgressMeter
  constructor: (@progress, @text = '') ->
    @emitter  = new Emitter
    @view = @progressView()
    @overlay = @overlayView()

    document.body.appendChild @overlay

    @view.onmouseover = => @overlay.style.display = 'block' unless @text is ''
    @view.onmouseout  = => @overlay.style.display = 'none'

  onDidUpdate:  (f) -> @emitter.on 'did-update', f

  update: (@progress, @text, @file) ->
    @positionOverlay()
    @emitter.emit 'did-update'

  onDidDestroy: (f) -> @emitter.on 'did-destroy', f

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

    @onDidUpdate =>
      div.innerText = @text
      if @text is '' then div.style.display = 'none'

    @onDidDestroy =>
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

    @onDidUpdate =>
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
    p.onDidDestroy => @tile?.destroy()
    p

  consumeStatusBar: (bar) ->
    @statusBar = bar
