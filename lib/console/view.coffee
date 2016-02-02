class ConsoleElement extends HTMLElement

  createdCallback: ->
    @setAttribute 'tabindex', -1
    @gutter = document.createElement 'div'
    @gutter.classList.add 'gutter'
    @appendChild @gutter
    @items = document.createElement 'div'
    @items.classList.add 'items'
    @appendChild @items

    @style.fontSize = atom.config.get('editor.fontSize') + 'px'
    @style.fontFamily = atom.config.get('editor.fontFamily')

    @views = {}
    for view in ['input', 'stdout', 'stderr', 'info', 'result']
      @views[view] = this["#{view}View"].bind this

  initialize: (@model) ->
    @getModel = -> @model
    @model.onDidAddItem (item) => @addItem item
    @model.onDidInsertItem ([item, i]) => @insertItem [item, i]
    @model.onDidClear => @clear()
    @model.onFocusInput (force) => @focusLast force
    @

  getModel: -> @model

  getTitle: ->
    "Console"

  getIconName: ->
    "terminal"

  initView: (item) ->
    item.view ?= @views[item.type](item)
    item.cell ?= @cellView item
    item

  addItem: (item) ->
    {cell} = @initView item
    scroll = @isVisible @lastCell()
    @items.appendChild cell
    @items.appendChild @divider()
    if scroll then @scroll()

  insertItem: ([item, i]) ->
    if @isVisible(@lastCell()) then @lock 200
    {cell} = @initView item
    before = @model.items[i+1].cell
    @items.insertBefore cell, before
    @items.insertBefore @divider(), before

  divider: ->
    d = document.createElement 'div'
    d.classList.add 'divider'
    d

  clear: ->
    while @items.hasChildNodes()
      @items.removeChild @items.lastChild

  queryLast: (view, q) ->
    items = view.querySelectorAll q
    items[items.length - 1]

  lastCell: -> @queryLast @items, '.cell'

  lastDivider: -> @queryLast @items, '.divider'

  isVisible: (pane, view) ->
    if !view? then [pane, view] = [@, pane]
    return true unless view?
    pane = pane.getBoundingClientRect()
    view = view.getBoundingClientRect()
    pane.bottom >= view.top >= pane.top && pane.bottom >= view.bottom >= pane.top

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

  cellView: ({view, icon}) ->
    cell = document.createElement 'div'
    cell.classList.add 'cell'

    gutter = document.createElement 'div'
    gutter.classList.add 'gutter'
    if icon then gutter.appendChild @iconView icon
    cell.appendChild gutter

    content = document.createElement 'div'
    content.classList.add 'content'
    content.appendChild view
    cell.appendChild content

    cell

  inputView: (item) ->
    ed = document.createElement 'atom-text-editor'
    ed.getModel().setLineNumberGutterVisible(false)
    ed.getModel().inkConsole = @model
    ed

  streamView: (text, type) ->
    out = document.createElement 'div'
    out.innerText = text
    out.classList.add type, 'stream'
    out

  stdoutView: ({text}) -> @streamView text, 'output'

  stderrView: ({text}) -> @streamView text, 'err'

  infoView: ({text}) -> @streamView text, 'info'

  resultView: ({result, error}) ->
    view = document.createElement 'div'
    view.classList.add 'result'
    if error then view.classList.add 'error'
    view.appendChild result
    view

  setIcon: (cell, name) ->
    gutter = cell.querySelector '.gutter'
    icon = cell.querySelector '.icon'
    gutter.removeChild icon
    icon2 = @iconView name
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

  scrollEndValue: ->
    return 0 unless @lastDivider()?
    @lastDivider().offsetTop - @clientHeight + 8

  scroll: ->
    target = @scrollEndValue()
    delta = target-@scrollTop
    if delta > 0 then @scrollTop += delta
    @focusLast()

  isLocked: false

  _lock: (input, target) ->
    if input.offsetTop + input.clientHeight + 10 <
         @scrollTop + @clientHeight
      target = input.offsetTop - @scrollTop
    else
      delta = input.offsetTop - @scrollTop - target
      @scrollTop += delta
    requestAnimationFrame (t) =>
      if t > @isLocked
        @isLocked = false
      else
        @_lock input, target

  lock: (time) ->
    if not @isLocked
      @isLocked = performance.now() + time
      input = @lastCell()
      target = input.offsetTop - @scrollTop
      @_lock input, target
    else
      @isLocked = Math.max(@isLocked, performance.now() + time)

module.exports = ConsoleElement = document.registerElement 'ink-console', prototype: ConsoleElement.prototype
