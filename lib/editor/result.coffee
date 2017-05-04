# TODO: better scrolling behaviour
{throttle, debounce} = require 'underscore-plus'
{$, $$} = require 'atom-space-pen-views'
{CompositeDisposable, Emitter} = require 'atom'
trees = require '../tree'
views = require '../util/views'
{div, span} = views.tags
ResizeDetector = require 'element-resize-detector'
fastdom = require 'fastdom'


# ## Result API
# `Result`s are DOM elements which represent the result of some operation. They
# can be created by something like
#
# ```coffeescript
# new ink.Result(ed, range, options)
# ```
# where `ed` is the current text editor and `range` is a line range compatible array,
# e.g. `[3, 4]`. `options` is an object with the mandatory field
# - `content`: DOM-node that will be diplayed inside of the `Result`.
#
# and the optional fields
# - `error`: Default `false`. If true, adds the `error`-style to the `Result`.
# - `type`:  Default `inline`, can also be `block`. Inline-`Result`s will be
# displayed after the end of the last line contained in `range`, whereas
# block-`Result`s will be displayed below it and span the whole width of
# the current editor.

metrics = ->
  if id = localStorage.getItem 'metrics.userId'
    r = require('http').get "http://data.junolab.org/hit?id=#{id}&app=ink-result"
    r.on 'error', ->

metrics = throttle metrics, 60*60*1000

resizer = ResizeDetector strategy: "scroll"

results = {}

module.exports =
class Result
  constructor: (@editor, [@start, @end], opts={}) ->
    metrics()
    opts.type ?= 'inline'
    {@type} = opts
    @emitter = new Emitter
    @disposables = new CompositeDisposable
    opts.fade ?= not Result.removeLines @editor, @start, @end
    opts.loading ?= not opts.content
    @createView opts
    @initMarker()
    @text = @getText()
    @disposables.add @editor.onDidChange (e) => @validateText e
    @expanded = false

    @view.addEventListener 'dblclick', (ev) => @toggleView()

  fadeIn: ->
    @view.classList.add 'ink-hide'
    @timeout 20, =>
      @view.classList.remove 'ink-hide'

  toggleView: () ->
    return unless @type == 'inline'
    if @expanded then @collapseView() else @expandView()

  expandView: () ->
    @expanded = true
    @decoration?.destroy()
    row = @marker.getEndBufferPosition().row
    @expMarker = @editor.markBufferRange [[row, 0], [row, 1]]
    mark =
      item: @view
      avoidOverflow: false
      type: 'overlay'
      class: 'ink-underlay'
      invalidate: 'never'
    @expDecoration = @editor.decorateMarker @expMarker, mark
    # setTimeout (=> @updateWidth()), 50

  collapseView: () ->
    @expanded = false
    @expMarker?.destroy()
    @decorateMarker()
    # setTimeout (=> @updateWidth()), 50

  createView: (opts) ->
    {content, fade, loading} = opts
    @view = document.createElement 'div'
    @view.setAttribute 'tabindex', '-1'
    @view.classList.add 'ink', 'result'
    switch @type
      when 'inline'
        @view.classList.add 'inline'
        @disposables.add atom.config.observe 'editor.lineHeight', (h) =>
          @view.style.top       = -h + 'em'
          @view.style.minHeight =  h + 'em'
      when 'block'  then @view.classList.add 'under'
    @view.addEventListener 'mousewheel', (e) =>
      if (@view.offsetHeight < @view.scrollHeight  ||
          @view.offsetWidth  < @view.scrollWidth)  &&
         ((e.deltaY > 0 && @view.scrollHeight - @view.scrollTop > @view.clientHeight) ||
          (e.deltaY < 0 && @view.scrollTop > 0) ||
          (e.deltaX > 0 && @view.scrollWidth - @view.scrollLeft > @view.clientWidth) ||
          (e.deltaX < 0 && @view.scrollLeft > 0))
        e.stopPropagation()
    # clicking on it will bring the current result to the top of the stack
    @view.addEventListener 'click', =>
      @view.parentNode.parentNode.appendChild @view.parentNode

    @disposables.add atom.commands.add @view,
      'inline-results:clear': (e) => @remove()
    fade and @fadeIn()

    if content? then @setContent content, opts
    if loading then @setContent views.render(span 'loading icon icon-gear'), opts

  setContent: (view, {error, loading}={}) ->
    while @view.firstChild?
      @view.removeChild @view.firstChild
    if error then @view.classList.add 'error' else @view.classList.remove 'error'
    if loading then @view.classList.add 'loading' else @view.classList.remove 'loading'
    @view.appendChild view

  lineRange: (start, end) ->
    [[start, 0], [end, @editor.lineTextForBufferRow(end).length]]

  decorateMarker: ->
    mark = item: @view, avoidOverflow: false
    switch @type
      when 'inline' then mark.type = 'overlay'; mark.class = 'ink-overlay'
      when 'block' then mark.type = 'block'; mark.position = 'after'
    @decoration = @editor.decorateMarker @marker, mark
    if @type == 'inline'
      # setTimeout (=> @updateWidth()), 50
      ed = @editor
      el = @editor.editorElement
      if not results.hasOwnProperty(ed.id)
        results[ed.id] = true
        listener = ->
          ed.presenter.updating = true
          # ed.element.component.requestAnimationFrame ->
          res = ed.findMarkers().filter((m) -> m.result?).map((m) -> m.result)
          # reads
          rect = null
          fastdom.measure ->
            rect = el.getBoundingClientRect()
            res.forEach (m) -> m.readOffsetLeft()
          # writes
          fastdom.mutate ->
            res.forEach (m) -> m.updateWidth(rect)
          ed.presenter.updating = false
        # ed.presenter.onDidUpdateState listener

        resizer.listenTo el, listener

  initMarker: ->
    @marker = @editor.markBufferRange @lineRange(@start, @end)
    @marker.result = @
    @decorateMarker()
    @disposables.add @marker.onDidChange (e) => @checkMarker e

  readOffsetLeft: ->
    return unless @view.parentElement
    @left = parseInt @view.parentElement.style.left

  updateWidth: (elRect) ->
    w = elRect.width + elRect.left - 40 - @left
    if w < 100 then w = 100
    @view.style.maxWidth = w + 'px'

  toggleTree: ->
    trees.toggle $(@view).find('> .tree')

  remove: ->
    @view.classList.add 'ink-hide'
    @timeout 200, => @destroy()

  destroy: ->
    @isDestroyed = true
    @emitter.emit 'destroyed'
    @emitter.dispose()
    @expMarker?.destroy()
    @marker.destroy()
    @disposables.dispose()

  onDidDestroy: (f) ->
    @emitter.on 'destroyed', f

  invalidate: ->
    @view.classList.add 'invalid'
    @invalid = true

  validate: ->
    @view.classList.remove 'invalid'
    @invalid = false

  checkMarker: (e) ->
    if !e.isValid or @marker.getBufferRange().isEmpty()
      @remove()
    else if e.textChanged
      old = e.oldHeadScreenPosition
      nu = e.newHeadScreenPosition
      if old.isLessThan nu
        text = @editor.getTextInRange([old, nu])
        if text.match /^\r?\n\s*$/
          @marker.setHeadBufferPosition old

  validateText: ->
    text = @getText()
    if @text == text and @invalid then @validate()
    else if @text != text and !@invalid then @invalidate()

  # Utilities

  timeout: (t, f) -> setTimeout f, t

  getText: ->
    @editor.getTextInRange(@marker.getBufferRange()).trim()

  # Bulk Actions

  @all: -> # TODO: scope selector
    results = []
    for item in atom.workspace.getPaneItems() when atom.workspace.isTextEditor item
      item.findMarkers().filter((m) -> m.result?).forEach (m) ->
        results.push m.result
    results

  @invalidateAll: ->
    for result in @all()
      delete result.text
      result.invalidate()

  @forLines: (ed, start, end, type = 'any') ->
    ed.findMarkers().filter((m) -> m.result? &&
                                   m.getBufferRange().intersectsRowRange(start, end) &&
                                  (m.result.type == type || type == 'any'))
                    .map((m) -> m.result)

  @removeLines: (ed, start, end, type = 'any') ->
    rs = @forLines(ed, start, end, type)
    rs.map (r) -> r.remove()
    rs.length > 0

  @removeAll: (ed = atom.workspace.getActiveTextEditor()) ->
    ed?.findMarkers().filter((m) -> m.result?).map((m) -> m.result.remove())

  @removeCurrent: (e) ->
    if (ed = atom.workspace.getActiveTextEditor())
      for sel in ed.getSelections()
        if @removeLines(ed, sel.getHeadBufferPosition().row, sel.getTailBufferPosition().row)
          done = true
    e.abortKeyBinding() unless done

  @toggleCurrent: ->
    ed = atom.workspace.getActiveTextEditor()
    for sel in ed.getSelections()
      rs = @forLines ed, sel.getHeadBufferPosition().row, sel.getTailBufferPosition().row
      rs.map (r) -> r.toggleView()

  # Commands

  @activate: ->
    @subs = new CompositeDisposable
    @subs.add atom.commands.add 'atom-text-editor:not([mini])',
      'inline:clear-current': (e) => @removeCurrent e
      'inline-results:clear-all': => @removeAll()
      'inline-results:toggle': => @toggleCurrent()

  @deactivate: ->
    @subs.dispose()
