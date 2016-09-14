ResizeDetector = require 'element-resize-detector'
AnsiConverter = require('ansi-to-html')
converter = new AnsiConverter()

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
    @model.onFocusInput (force) => @focusLast force
    @model.onLoading (status) => @loading status
    @model.onDidUpdateItem ({item, key}) =>
      if key is 'icon'    then @updateIcon item
      if key is 'grammar' then @updateGrammar item
      if key is 'text'    then @lock => @updateStream item

    @onfocus = =>
      if document.activeElement == this and @model.getInput()
        @focusLast()
    # start listening now, since @lock doesn't work properly if @items is empty
    @resizer.listenTo @items, =>
      @scrollTop = @scrollHeight
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

  isVisible: (pane, view) ->
    if !view? then [pane, view] = [@, pane]
    return unless view?
    pane = pane.getBoundingClientRect()
    view = view.getBoundingClientRect()
    pane.bottom >= view.top >= pane.top or pane.bottom >= view.bottom >= pane.top

  focusVisible: (view, force) ->
    if force or @isVisible view
      view.focus()

  focusLast: (force) ->
    if @hasFocus() and (view = @model.items[@model.items.length-1]?.view)
      @focusVisible view, force

  # Various cell views
  iconView: (name) ->
    icon = document.createElement 'span'
    icon.classList.add 'icon', 'icon-'+name
    icon

  cellView: (item) ->
    {view, icon} = item
    cell = document.createElement 'div'
    cell.classList.add 'cell'
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
    model = atom.workspace.buildTextEditor()
    atom.textEditors.add model
    ed = atom.views.getView model
    ed.onblur = -> atom.commands.dispatch ed, 'autocomplete-plus:cancel'
    item.editor = model
    item.editor.presenter.scrollPastEndOverride = false
    item.editor.setLineNumberGutterVisible(false)
    item.editor.setSoftWrapped true
    @updateGrammar item
    ed

  updateGrammar: ({editor, grammar}) ->
    return unless editor? and grammar?
    editor.setGrammar atom.grammars.grammarForScopeName grammar

  streamView: (item, type, ansi) ->
    out = document.createElement 'div'
    item.ansi = ansi
    out.innerText = item.text
    console.log out.innerHTML
    out.innerHTML = converter.toHtml(out.innerHTML) if ansi
    console.log out.innerHTML
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
    out.innerHTML = converter.toHtml(out.innerHTML) if ansi

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

  # Scrolling

  lock: (f) ->
    if @isVisible @lastDivider()
      # listen to changes in height from subtree modifications
      @resizer.listenTo @items, =>
        @scrollTop = @scrollHeight
      f()
      @scrollTop = @scrollHeight
    else
      @resizer.removeAllListeners @items
      f()

module.exports = ConsoleElement = document.registerElement 'ink-console', prototype: ConsoleElement.prototype
