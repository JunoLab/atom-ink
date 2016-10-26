{Emitter} = require 'atom'

# Progress Bars
#
# This module provides an API for displaying progress bars in Atom. The methods
# below allow modifing the stack of progress bars, which is represented by
# corresponding UI elements:
#    - A "global" progress bar is shown in the status bar. In pratice, this is
#      the first determinate progress bar in the stack. If there is none, the
#      first element (which then is indeterminate) will be shown instead. If the
#      stack is empty, an empty progress bar will be shown instead.
#    - Hovering over that status bar element will show the complete stack as
#      an overlay.
#    - Hovering over the actual progress bar of one such stack element will show
#      the message correesponding to that progress bar, if there is any.
#
# Methods:
#
# add(p)
#    Adds the progress bar `p` to the stack. Will also add a status bar element
#    automatically.
#
# delete(p)
#    Deletes the progress bar `p` from the stack.
#
# update(p)
#    Updates the progress bar with ID `p.id` with all the properties from `p`.
#
# emptyStack()
#    Clears the stack from all progress bars.
#
# emptyProgress(id = 'empty')
#    Returns an empty progress bar with ID `id`.
#
# indeterminateProgress(id = 'indeterminate')
#    Returns an indeterminate progress Bar with ID `id`.
#
# Objects:
#
# Properties of a progress bar object:
#
#    .id          - A string uniquely identifing the progress bar. Required.
#    .determinate - Boolean, determines if progress is shown.
#    .progress    - Number between 0 and 1. Required for determinate progress bars-
#    .leftText    - String displayed to the left of the progress bar (e.g. name).
#    .rightText   - String displayed to the right of the progress bar (e.g. remaining time).
#    .msg         - String displayed when hovering over the progress bar in the stack.


module.exports =
  stack: []

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

    @showOnHover()
    @positionOverlay()
    @onDidUpdateStack => @positionOverlay()

  deactivate: ->
    document.body.removeChild @overlay
    @tile?.destroy()

  consumeStatusBar: (bar) ->
    @statusBar = bar

  # Public API
  add: (p) ->
    @activate()
    @stack.push p
    @emitter.emit 'did-update-stack'

  delete: (p) ->
    @activate()
    i = @stack.findIndex (e) -> e.id is p.id
    return if i < 0
    @stack.splice i, 1
    @emitter.emit 'did-update-stack'

  update: (p) ->
    @activate()
    i = @stack.findIndex (e) -> e.id is p.id
    return if i < 0
    oldp = @stack[i]
    @stack[i] = p
    @emitter.emit 'did-update-progress', p
    # if p.determinate changes, update the stack display
    @emitter.emit 'did-update-stack' unless oldp.determinate is p.determinate

  emptyStack: () ->
    @stack = []
    @emitter.emit 'did-update-stack'

  emptyProgress: (id = 'empty') ->
    id: id
    determinate: true
    progress: 0

  indeterminateProgress: (id = 'indeterminate') ->
    id: id
    determinate: false

  # update logic
  hasNoDeterminateBars: ->
    @stack.filter((p) => p.determinate).length is 0

  onDidUpdateStack: (f) -> @emitter.on 'did-update-stack', f

  onDidUpdateProgress: (f) -> @emitter.on 'did-update-progress', f

  # UI elements:
  progressView: (p) ->
    span = document.createElement 'span'
    span.id = "ink-prog-#{p.id}"
    prog = document.createElement 'progress'
    prog.classList.add 'ink'
    prog.setAttribute 'max', 1
    span.appendChild prog

    updateView = (prg) =>
      return unless p.id is prg.id
      if prg.determinate
        prog.setAttribute 'value', prg.progress
      else
        prog.removeAttribute 'value'

    @onDidUpdateProgress (prg) => updateView(prg)
    updateView p

    span

  msgView: (p, parent) ->
    div = document.createElement 'div'
    div.classList.add 'ink-tooltip-msg'
    div.appendChild.innerText = p.msg

    @onDidUpdateProgress (prg) =>
      return unless p.id is prg.id
      if prg.msg?.length
        div.innerText = prg.msg
        parent.classList.add 'has-tooltip'
      else
        parent.classList.remove 'has-tooltip'

    div

  tableRowView: (p) ->
    tr = document.createElement 'tr'
    # left text
    tdl = document.createElement 'td'
    tdl.classList.add 'progress-tr'
    p.leftText? and tdl.appendChild document.createTextNode p.leftText
    # progress bar
    td = document.createElement 'td'
    td.classList.add 'progress-tr', 'has-tooltip'
    td.appendChild @progressView p
    td.appendChild @msgView p, td
    # right text
    tdr = document.createElement 'td'
    tdr.classList.add 'progress-tr'
    p.rightText? and tdr.appendChild document.createTextNode p.rightText

    @onDidUpdateProgress (prg) =>
      return unless p.id is prg.id
      if prg.rightText?
        if tdr.firstChild then tdr.removeChild tdr.firstChild
        tdr.appendChild document.createTextNode prg.rightText
    # construct the row
    tr.appendChild tdl
    tr.appendChild td
    tr.appendChild tdr

    tr

  stackView: ->
    div = document.createElement 'div'
    div.classList.add 'ink-tooltip'
    div.style.display = 'none'
    table = document.createElement 'table'
    div.appendChild table

    @onDidUpdateStack =>
      # remove all table rows
      while table.firstChild
        table.removeChild table.firstChild
      if @hasNoDeterminateBars()
        div.style.display = 'none'
        return
      # backwards iteration
      for i in [0...@stack.length].reverse()
        p = @stack[i]
        continue unless p.determinate
        table.appendChild @tableRowView p
        @emitter.emit 'did-update-progress', p

    div

  tileView: ->
    span = document.createElement 'span'
    span.classList.add 'inline-block'
    span.appendChild @tableRowView @emptyProgress()

    @onDidUpdateStack =>
      span.removeChild span.firstChild
      # find the first determinate progress bar
      global = @stack.find (p) => p.determinate
      # if there is none, use the first one in the stack
      global = @stack[0] unless global?
      # display an empty progress bar if the stack is empty
      global = @emptyProgress() unless global?
      span.appendChild @progressView global
      @emitter.emit 'did-update-progress', global

    span

  # UI logic
  showOnHover: ->
    timer = null
    @view.onmouseover = =>
      clearTimeout timer
      @overlay.style.display = 'block' unless @hasNoDeterminateBars()
    @view.onmouseout  = => timer = setTimeout (=> @overlay.style.display = 'none' ), 150
    @overlay.onmouseover = => clearTimeout timer
    @overlay.onmouseout  = => timer = setTimeout (=> @overlay.style.display = 'none' ), 150

  positionOverlay: ->
    bounding = @view.getBoundingClientRect()
    @overlay.style.bottom   = bounding.height + 'px'
    @overlay.style.left     = bounding.left + 'px'
    @overlay.style.minWidth = bounding.width + 'px'
