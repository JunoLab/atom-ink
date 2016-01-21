{$, $$, ScrollView, TextEditorView} = require 'atom-space-pen-views'

module.exports =
class ConsoleView extends ScrollView

  @content: ->
    @div class: 'pane-item', tabindex: -1, =>
      @div class: 'ink-console', =>
        @div class: 'gutter'
        @div class: 'items-scroll', =>
          @div class: 'items'
          @div class: 'spacer'

  initialize: ->
    super
    @items = @element.querySelector '.items'
    @scrollView = @element.querySelector '.items-scroll'
    @element.querySelector('.spacer').onclick = => @focusInput()

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
    items = @items.querySelectorAll '.cell'
    items[items.length-1]

  getInputEd: ->
    @getInput()?.querySelector('atom-text-editor')?.getModel()

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

  iconView: (name) ->
    icon = document.createElement 'span'
    icon.classList.add 'icon', 'icon-'+name
    icon

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

  streamView: (text, type, icon) ->
    out = document.createElement 'div'
    out.style.fontSize = atom.config.get('editor.fontSize') + 'px'
    out.style.fontFamily = atom.config.get('editor.fontFamily')
    out.innerText = text
    out.classList.add type, 'stream'
    @cellView out,
      icon: icon

  outView: (s) -> @streamView s, 'output', 'quote'

  errView: (s) -> @streamView s, 'err', 'alert'

  infoView: (s) -> @streamView s, 'info', 'info'

  resultView: (r, {icon, error}={}) ->
    icon ?= if error then 'x' else 'check'
    view = $$ ->
      @div class: 'result'
    if error then view.addClass 'error'
    view.append r
    @cellView view[0],
      icon: icon

  inputView: (con) ->
    ed = document.createElement 'atom-text-editor'
    if @defaultGrammar? then ed.getModel().setGrammar @defaultGrammar
    ed.getModel().setLineNumberGutterVisible(false)
    ed.getModel().inkConsole = con
    @cellView ed,
      icon: 'chevron-right'

  visible: ->
    document.contains @element

  fadeIn: (view) ->
    if @visible()
      view.classList.add 'ink-hide'
      setTimeout (-> view.classList.remove 'ink-hide'), 0
    view

  fadeOut: (view) ->
    if @visible()
      view.classList.add 'ink-hide'
      setTimeout (-> view.parentElement?.removeChild(view)), 100
    view

  slideIn: (view) ->
    if @visible()
      h = view.clientHeight
      view.style.height = '0'
      setTimeout (-> view.style.height = h + 'px'), 0
      setTimeout (-> view.style.height = ''), 100
    view

  setIcon: (cell, name) ->
    gutter = cell.querySelector '.gutter'
    icon = cell.querySelector '.icon'
    gutter.removeChild icon
    icon2 = @iconView name
    gutter.appendChild icon2

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
