# TODO: better scrolling behaviour
{throttle, debounce} = require 'underscore-plus'
{$, $$} = require 'atom-space-pen-views'
{CompositeDisposable, Emitter} = require 'atom'
trees = require '../tree'
views = require '../util/views'
{div, span} = views.tags
fastdom = require 'fastdom'
Tooltip = require '../util/tooltip'

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
# - `getButtons`: Function that will be called to get a button specification to
# be displayed in the toolbar above an inline result. Needs to return an array
# of `Button`s, where a `Button` is specified by
#   - `icon`: octicon class, e.g. `icon-x`
#   - `onclick`: Function to be called when clicking the button.

metrics = ->
  if id = localStorage.getItem 'metrics.userId'
    r = require('http').get "http://data.junolab.org/hit?id=#{id}&app=ink-result"
    r.on 'error', ->

metrics = throttle metrics, 60*60*1000

resultEditorRegistry = new Set
layers = {}

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
    @getCustomButtons = if opts.getButtons? then opts.getButtons else -> []
    @createView opts
    @initMarker()
    @text = @getText()
    @disposables.add @editor.onDidChange (e) => @validateText e
    @expanded = false

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
    setTimeout (=> @updateWidth()), 50

  collapseView: () ->
    @expanded = false
    @expMarker?.destroy()
    @decorateMarker()
    setTimeout (=> @updateWidth()), 50

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

    @view.onmouseover = =>
      @tb ?= new Tooltip(@view, @toolbar(), {clas: 'ink-result-toolbar', showDelay: 200, position: 'right'})
      setTimeout (=> @tb?.show()), 200
      @tb.onDidHide =>
        @tb.destroy()
        @tb = null

    if content? then @setContent content, opts
    if loading then @setContent views.render(span 'loading icon icon-gear'), opts

  buttons: ->
    [
      {
        icon: if @expanded then 'icon-fold' else 'icon-unfold'
        onclick: =>
          @toggleView()
          @tb?.hide()
      },
      {
        icon: 'icon-x'
        onclick: =>
          @remove()
          @tb?.hide()
      }
    ].concat @getCustomButtons()

  toolbar: ->
    bg = document.createElement 'div'
    bg.classList.add 'btn-group'
    for b in @buttons()
      v = document.createElement 'button'
      v.classList.add 'btn', b.icon
      v.addEventListener 'click', b.onclick
      bg.appendChild v
    bg

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
      ed = @editor
      edView = atom.views.getView(@editor)
      if not resultEditorRegistry.has ed.id
        lastRect = null
        resultEditorRegistry.add ed.id
        # create new editor specific result animation method
        listener = -> setTimeout (->
          res = layers[ed.id].getMarkers().map((m) -> m.result)

          if res.length == 0
            resultEditorRegistry.delete ed.id
            return

          # reads
          rect = null
          fastdom.measure ->
            rect = edView.getBoundingClientRect()
            res.forEach (m) -> m.isInViewport(rect)


          # writes
          fastdom.mutate ->
            #if shouldUpdate
            res.forEach (m) -> m.updateWidth(rect)
            last = []

          # batching updates:
          process.nextTick -> requestAnimationFrame listener
          ), 15*1000/60
        window.requestAnimationFrame listener

  initMarker: ->
    if not layers.hasOwnProperty @editor.id
      layers[@editor.id] = @editor.addMarkerLayer()
    @marker = layers[@editor.id].markBufferRange @lineRange(@start, @end)
    @marker.result = @
    @decorateMarker()
    @disposables.add @marker.onDidChange (e) => @checkMarker e

  lastRect: {width: -1}

  isInViewport: (edRect) ->
    @isVisible = false
    @left = 0
    @shouldUpdate = false
    if @view.parentElement?
      rect = @view.getBoundingClientRect()
      @isVisible = rect.top < edRect.bottom && rect.bottom > edRect.top
      @left = parseInt @view.parentElement.style.left
      @shouldUpdate = edRect.width != @lastRect.width

  updateWidth: (elRect = @editor.editorElement.getBoundingClientRect()) ->
    if @isVisible and @shouldUpdate
      console.log 'updating'
      w = elRect.width + elRect.left - 40 - @left
      if w < 100 then w = 100
      @view.style.maxWidth = w + 'px'
      @lastRect = elRect

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
      layers[item.id]?.getMarkers().forEach (m) ->
        results.push m.result
    results

  @invalidateAll: ->
    for result in @all()
      delete result.text
      result.invalidate()

  @forLines: (ed, start, end, type = 'any') ->
    layers[ed.id]?.findMarkers(intersectsBufferRowRange: [start, end])
                  .filter((m) -> (m.result.type == type || type == 'any'))
                  .map((m) -> m.result)

  @removeLines: (ed, start, end, type = 'any') ->
    rs = @forLines(ed, start, end, type)
    return unless rs?
    rs.map (r) -> r.remove()
    rs.length > 0

  @removeAll: (ed = atom.workspace.getActiveTextEditor()) ->
    layers[ed.id]?.getMarkers().map((m) -> m.result.remove())

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
      continue unless rs?
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
