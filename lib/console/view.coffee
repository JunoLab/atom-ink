class ConsoleElement extends HTMLElement

  createdCallback: ->
    @setAttribute 'tabindex', -1
    @gutter = document.createElement 'div'
    @gutter.classList.add 'gutter'
    @appendChild @gutter
    @items = document.createElement 'div'
    @items.classList.add 'items'
    @appendChild @items

    @views = {}
    for view in ['input', 'stdout', 'stderr', 'info', 'result']
      @views[view] = this["#{view}View"].bind this

  initialize: (@model) ->
    @getModel = -> @model
    @model.onDidAddItem (cell) => @addItem cell
    @model.onDidClear => @clear()
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
    @items.appendChild @fadeIn cell
    @items.appendChild @fadeIn @divider()
    if scroll then @scroll()

  divider: ->
    d = document.createElement 'div'
    d.classList.add 'divider'
    d

  clear: ->
    while @items.hasChildNodes()
      @items.removeChild @items.lastChild

  lastCell: ->
    @items.querySelector('.cell:last-of-type')

  lastDivider: ->
    @items.querySelector('.divider:last-of-type')

  isVisible: (pane, view) ->
    if !view? then [pane, view] = [@, pane]
    return true unless view?
    pane = pane.getBoundingClientRect()
    view = view.getBoundingClientRect()
    pane.bottom >= view.top >= pane.top && pane.bottom >= view.bottom >= pane.top

  focusVisible: (view) ->
    if @isVisible view
      view.focus()

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
    out.style.fontSize = atom.config.get('editor.fontSize') + 'px'
    out.style.fontFamily = atom.config.get('editor.fontFamily')
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

  # Animations

  fadeIn: (view) ->
    view.classList.add 'ink-hide'
    setTimeout (-> view.classList.remove 'ink-hide'), 0
    view

  fadeOut: (view) ->
    view.classList.add 'ink-hide'
    setTimeout (-> view.parentElement?.removeChild(view)), 100
    view

  slideIn: (view) ->
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

  isScrolling: false

  _scroll: ->
    target = @scrollEndValue()
    delta = target-@scrollTop
    mov = Math.max delta/2, 5
    mov = Math.min delta, mov
    if delta > 0
      @isScrolling = true
      @scrollTop += mov
      requestAnimationFrame => @_scroll()
    else
      @isScrolling = false

  scroll: ->
    if not @isScrolling
      @_scroll()

  _lock: (input, target) ->
    if input.offsetTop + input.clientHeight + 10 <
         @scrollTop + @clientHeight
      target = input.offsetTop - @scrollTop
    else
      delta = input.offsetTop - @scrollTop - target
      @scrollTop += delta
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
      target = input.offsetTop - @scrollTop
      @_lock input, target

module.exports = ConsoleElement = document.registerElement 'ink-console', prototype: ConsoleElement.prototype
