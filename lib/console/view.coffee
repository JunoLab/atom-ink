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
    @element.querySelector('.spacer').onclick = =>
      @focusInput true

  getTitle: ->
    "Console"

  getIconName: ->
    "terminal"

  addItem: (view, {divider}={divider:true}) ->
    @fadeIn view
    @items.appendChild view
    if divider then @divider()
    view

  getInput: ->
    items = @items.querySelectorAll('.cell')
    items[items.length-1]

  addBeforeInput: (view, {divider}={divider:true}) ->
    @items.insertBefore view, @getInput()
    @slideIn view
    if divider then @divider(true)
    view

  add: (item, isInput, opts) ->
    if !isInput
      @addItem item, opts
    else
      @addBeforeInput item, opts

  divider: (input) ->
    d = document.createElement 'div'
    d.classList.add 'divider'
    if input then @addBeforeInput(d, {divider:false}) else @addItem((@fadeIn d), {divider:false})
    @updateLoading()

  clear: ->
    while @items.hasChildNodes()
      @items.removeChild @items.lastChild

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

  focusInput: (force) ->
    if force or @element.contains document.activeElement
      @getInput()?.querySelector('atom-text-editor')?.focus()

  loading: (l) ->
    if l
      @loading false
      @items.querySelector('.divider:last-child').classList.add 'loading'
    else
      @items.querySelector('.divider.loading')?.classList.remove 'loading'

  updateLoading: ->
    if document.querySelector('.divider.loading')? then @loading true

  scrollEndValue: ->
    @items.querySelector('.divider:last-child').offsetTop -
      @element.querySelector('.items-scroll').clientHeight + 5

  isVisible: (pane, view) ->
    [top, bottom] = [pane.scrollTop, bottom = pane.scrollTop + pane.clientHeight]
    [ptop, pbottom] = [view.offsetTop, view.offsetTop + view.clientHeight]
    bottom >= ptop >= top || bottom >= pbottom >= top

  last: (xs) -> xs[xs.length-1]

  shouldScroll: ->
    @isVisible @element.querySelector('.items-scroll'),
               @last @items.querySelectorAll('.cell')
