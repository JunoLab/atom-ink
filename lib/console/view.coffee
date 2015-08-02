{$, $$, ScrollView, TextEditorView} = require 'atom-space-pen-views'

module.exports =
class ConsoleView extends ScrollView

  @content: ->
    @div class: 'pane-item', tabindex: -1, =>
      @div class: 'console', =>
        @div class: 'gutter'
        @div class: 'items-scroll', =>
          @div class: 'items'
          @div class: 'spacer'

  initialize: ->
    super
    @items = @element.querySelector '.items'
    @scrollView = @element.querySelector '.items-scroll'
    @element.onclick = =>
      if @shouldScroll() and !document.getSelection().toString()
        @focusInput()

  getTitle: ->
    "Console"

  getIconName: ->
    "terminal"

  addItem: (view, {divider}={divider:true}) ->
    scroll = @shouldScroll()
    @fadeIn view
    @items.appendChild view
    if divider then @divider()
    if scroll then @scroll()
    view

  getInput: ->
    items = @items.querySelectorAll('.cell')
    items[items.length-1]

  addBeforeInput: (view, {divider}={divider:true}) ->
    if @shouldScroll() then @lock 200
    @items.insertBefore view, @getInput()
    if divider then @divider(true)
    @slideIn view
    view

  add: (item, isInput, opts) ->
    if !isInput
      @addItem item, opts
    else
      @addBeforeInput item, opts

  divider: (input) ->
    d = document.createElement 'div'
    d.classList.add 'divider'
    if not input then @lastDivider = d
    if input then @addBeforeInput(d, {}) else @addItem((@fadeIn d), {})
    @updateLoading()

  clear: ->
    while @items.hasChildNodes()
      @items.removeChild @items.lastChild
    delete @lastDivider

  setGrammar: (g) ->
    @defaultGrammar = g

  cellView: (v, {icon, gutterText}={}) ->
    cell = document.createElement 'div'
    cell.classList.add 'cell'
    gutter = document.createElement 'div'
    gutter.classList.add 'gutter'
    if icon then gutter.innerHTML = "<span class='icon icon-#{icon}'></span>"
    content = document.createElement 'div'
    content.classList.add 'content'
    content.appendChild v
    cell.appendChild gutter
    cell.appendChild content
    cell

  outView: (s) ->
    out = document.createElement 'div'
    out.innerText = s
    out.classList.add 'stream', 'output'
    @cellView out,
      icon: 'quote'

  errView: (s) ->
    err = document.createElement 'div'
    err.innerText = s
    err.classList.add 'stream', 'error'
    @cellView err,
      icon: 'alert'

  infoView: (s) ->
    err = document.createElement 'div'
    err.innerText = s
    err.classList.add 'stream', 'info'
    @cellView err,
      icon: 'info'

  inputView: (con) ->
    ed = document.createElement 'atom-text-editor'
    if @defaultGrammar? then ed.getModel().setGrammar @defaultGrammar
    ed.getModel().setLineNumberGutterVisible(false)
    ed.getModel().inkEval = =>
      con.emitter.emit 'eval', ed.getModel()
    @cellView ed,
      icon: 'chevron-right'

  fadeIn: (view) ->
    view.classList.add 'ink-hide'
    setTimeout (-> view.classList.remove 'ink-hide'), 0
    view

  slideIn: (view) ->
    h = view.clientHeight
    view.style.height = '0'
    setTimeout (-> view.style.height = h + 'px'), 0
    view

  hasFocus: ->
    @element.contains document.activeElement

  focusInput: (force) ->
    if force or @hasFocus()
      @getInput()?.querySelector('atom-text-editor')?.focus()

  loading: (l) ->
    if l
      @loading false
      @items.querySelector('.divider:last-child').classList.add 'loading'
    else
      @items.querySelector('.divider.loading')?.classList.remove 'loading'

  updateLoading: ->
    if document.querySelector('.divider.loading')? then @loading true

  scrollValue: ->
    @scrollView.scrollTop

  scrollEndValue: ->
    return 0 unless @lastDivider
    @lastDivider.offsetTop - @scrollView.clientHeight + 8

  isVisible: (pane, view) ->
    [top, bottom] = [pane.scrollTop, bottom = pane.scrollTop + pane.clientHeight]
    [ptop, pbottom] = [view.offsetTop, view.offsetTop + view.clientHeight]
    bottom >= ptop >= top || bottom >= pbottom >= top

  last: (xs) -> xs[xs.length-1]

  shouldScroll: ->
    items = @items.querySelectorAll('.cell')
    return false unless items[0]
    @isVisible @scrollView, @last items

  isScrolling: false

  _scroll: ->
    target = @scrollEndValue()
    delta = target-@scrollView.scrollTop
    mov = Math.max delta/2, 5
    mov = Math.min delta, mov
    if delta > 0
      @isScrolling = true
      @scrollView.scrollTop += mov
      requestAnimationFrame => @_scroll()
    else
      @isScrolling = false
      @focusInput()

  scroll: ->
    if not @isScrolling
      @_scroll()

  _lock: (input, target) ->
    if input.offsetTop + input.clientHeight + 10 <
         @scrollView.scrollTop + @scrollView.clientHeight
      target = input.offsetTop - @scrollView.scrollTop
    else
      delta = input.offsetTop - @scrollView.scrollTop - target
      @scrollView.scrollTop += delta
    requestAnimationFrame (t) =>
      if t > @isScrolling
        @isScrolling = false
      else
        @_lock input, target

  lock: (time) ->
    scrolling = @isScrolling
    @isScrolling = performance.now() + time
    if not scrolling
      input = @getInput()
      target = input.offsetTop - @scrollView.scrollTop
      @_lock input, target
