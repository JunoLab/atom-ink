ResizeDetector = require 'element-resize-detector'
ansiToHTML = require '../util/ansitohtml'
{throttle, delay} = require 'underscore-plus'

class ConsoleElement extends HTMLElement
  createdCallback: ->
    @setAttribute 'tabindex', -1
    @items = document.createElement 'div'
    @items.classList.add 'items'
    @appendChild @items

    atom.config.observe 'editor.fontSize', (v) =>
      @style.fontSize = v + 'px'
    atom.config.observe 'editor.fontFamily', (v) =>
      @style.fontFamily = v

    @views = {}
    for view in ['input', 'stdout', 'stderr', 'info', 'result']
      @views[view] = this["#{view}View"].bind this

  initialize: (@model) ->
    @getModel = -> @model
    @resizer = ResizeDetector strategy: "scroll"
    @model.onDidAddItem (item) => @addItem item
    @model.onDidInsertItem ([item, i]) => @insertItem [item, i]
    @model.onDidClear => @clear()
    @model.onDidDeleteFirstItems (n) => @deleteFirstItems n
    @model.onDone => if @hasFocus() then @focus()
    @model.onFocusInput () => @enterLastInput()
    @model.onLoading (status) => @loading status
    @model.onDidUpdateItem ({item, key}) =>
      if key is 'icon'    then @updateIcon item
      if key is 'grammar' then @updateGrammar item
      if key is 'text'    then @lock => @updateStream item

    @onfocus = =>
      if document.activeElement == this and @model.getInput()
        @enterLastInput()

    @scrollDown = throttle (=> @lastElement()?.scrollIntoView()), 130, {leading: false}

    # determine if we should scroll down
    @shouldScroll = true
    @items.parentElement.onscroll =
      throttle (=> @shouldScroll = @isVisible @lastElement()), 150
    # scroll down on subtree modifications if last element is visible
    @resizer.listenTo @items, => if @shouldScroll then @scrollDown()
    for item in @model.items
      @addItem item
    atom.config.observe 'editor.fontFamily', (value) =>
      @style.fontFamily = value
    @

  getModel: -> @model

  initView: (item) ->
    item.view ?= @views[item.type](item)
    item.cell ?= @cellView item
    item

  addItem: (item) ->
    {cell} = @initView item
    @lock =>
      @items.appendChild cell
      @items.appendChild @divider()
    @loading()

  insertItem: ([item, i]) ->
    {cell} = @initView item
    before = @model.items[i+1].cell
    @lock =>
      @items.insertBefore cell, before
      @items.insertBefore @divider(), before
    @loading()

  divider: ->
    d = document.createElement 'div'
    d.classList.add 'divider'
    d

  clear: ->
    if @hasFocus() then @focus() # Don't lose focus completely when removing a
                                 # focused editor
    while @items.hasChildNodes()
      @items.removeChild @items.lastChild

  deleteFirstItems: (n) ->
    # need to remove the cell and the divider (the +1 is for having an easier
    # while loop)
    n = 2*n + 1
    while n -= 1
      @items.removeChild @items.firstChild

  queryLast: (view, q) ->
    items = view.querySelectorAll q
    items[items.length - 1]

  lastCell: -> @queryLast @items, '.cell'

  lastDivider: -> @queryLast @items, '.divider'

  # fast no-jquery way to get the last element
  lastElement: -> @items.lastChild

  isVisible: (pane, view) ->
    if !view? then [pane, view] = [@, pane]
    return unless view?
    pane = pane.getBoundingClientRect()
    view = view.getBoundingClientRect()
    pane.bottom >= view.top >= pane.top or pane.bottom >= view.bottom >= pane.top

  enterLastInput: ->
    return unless @hasFocus()
    y = @scrollTop
    atom.views.getView(@lastInput)?.focus()
    s = @lastInput.onDidChange (e) =>
      # check if e is empty object
      if not (Object.keys(e).length is 0 and e.constructor is Object)
        atom.views.getView(@lastInput)?.focus()
      s?.dispose()
    @scrollTop = y

  # Various cell views
  iconView: (name) ->
    icon = document.createElement 'span'
    icon.classList.add 'icon', 'icon-'+name
    icon

  cellView: (item) ->
    {view, icon} = item
    cell = document.createElement 'div'
    cell.classList.add 'cell', 'ink'
    cell.setAttribute 'tabindex', -1

    gutter = document.createElement 'div'
    gutter.classList.add 'gutter'
    cell.appendChild gutter

    @updateIcon {cell, icon: item.icon}

    content = document.createElement 'div'
    content.classList.add 'content'
    content.appendChild view
    cell.appendChild content

    cell

  inputView: (item) ->
    @lastInput = model = atom.workspace.textEditorRegistry.build()
    atom.textEditors.add model
    ed = atom.views.getView model
    if @model.watchEditor?
      @model.watchEditor(model, ['workspace-center', 'symbol-provider'])
    ed.onblur = -> atom.commands.dispatch ed, 'autocomplete-plus:cancel'
    item.editor = model
    item.editor.update
      scrollPastEnd: false,
      softWrapped: true,
      lineNumberGutterVisible: false
    @updateGrammar item
    ed

  updateGrammar: ({editor, grammar}) ->
    return unless editor? and grammar?
    editor.setGrammar atom.grammars.grammarForScopeName grammar

  streamView: (item, type, ansi) ->
    out = document.createElement 'div'
    item.ansi = ansi
    out.innerText = item.text
    out.innerHTML = ansiToHTML(out.innerHTML) if ansi
    out.classList.add type, 'stream'
    out

  stdoutView: (item) -> @streamView item, 'output', true

  stderrView: (item) -> @streamView item, 'err', true

  infoView: (item) -> @streamView item, 'info'

  resultView: ({result, error}) ->
    view = document.createElement 'div'
    view.classList.add 'result'
    if error then view.classList.add 'error'
    view.appendChild result
    view

  updateStream: ({cell, text, ansi}) ->
    return unless cell? and text?
    out = cell.querySelector '.stream'
    out.innerText = text
    out.innerHTML = ansiToHTML(out.innerHTML) if ansi

  updateIcon: ({cell, icon}) ->
    return unless cell? and icon?
    gutter = cell.querySelector '.gutter'
    iconView = cell.querySelector '.icon'
    if iconView? then gutter.removeChild iconView
    icon2 = @iconView icon
    gutter.appendChild icon2

  hasFocus: ->
    @contains document.activeElement

  loading: (l = @isLoading) ->
    if l
      @loading false
      @lastDivider()?.classList.add 'loading'
    else
      @items.querySelector('.divider.loading')?.classList.remove 'loading'
    @isLoading = l

  lock: (f) ->
    if @isVisible @lastElement()
      @scrollDown()
    f()

module.exports = ConsoleElement = document.registerElement 'ink-console', prototype: ConsoleElement.prototype
