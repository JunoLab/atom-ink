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

  addItem: (view) ->
    @items.appendChild view
    view

  clear: ->
    while @items.hasChildNodes()
      @items.removeChild @items.lastChild

  setGrammar: (g) ->
    @defaultGrammar = g

  divider: (input) ->
    d = document.createElement 'div'
    d.classList.add 'divider'
    if input then @addBeforeInput d else @addItem @fadeIn d

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
    process.nextTick =>
      view.classList.remove 'ink-hide'
    view

  getInput: ->
    items = @items.querySelectorAll('.cell')
    items[items.length-1]

  addBeforeInput: (view) ->
    @items.insertBefore view, @getInput()

  focusInput: (force) ->
    if force or @element.contains document.activeElement
      @getInput()?.querySelector('atom-text-editor')?.focus()
