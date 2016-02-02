class ConsoleElement extends HTMLElement

  createdCallback: ->
    @setAttribute 'tabindex', -1
    @gutter = document.createElement 'div'
    @gutter.classList.add 'gutter'
    @appendChild @gutter
    @items = document.createElement 'div'
    @items.classList.add 'items'
    @appendChild @items

    @views =
      input: @inputView.bind this

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
    scroll = @lastCellVisible()
    @items.appendChild @fadeIn cell
    @items.appendChild @fadeIn @divider()
    if scroll then @scroll()

  getInput: ->
    items = @items.querySelectorAll '.cell'
    items[items.length-1]

  getInputEd: ->
    @getInput()?.querySelector('atom-text-editor')?.getModel()

  divider: ->
    d = document.createElement 'div'
    d.classList.add 'divider'
    d

  clear: ->
    while @items.hasChildNodes()
      @items.removeChild @items.lastChild
    delete @lastDivider

  setGrammar: (g) ->
    @defaultGrammar = g

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

  # streamView: (text, type, icon) ->
  #   out = document.createElement 'div'
  #   out.style.fontSize = atom.config.get('editor.fontSize') + 'px'
  #   out.style.fontFamily = atom.config.get('editor.fontFamily')
  #   out.innerText = text
  #   out.classList.add type, 'stream'
  #   @cellView out,
  #     icon: icon
  #
  # outView: (s) -> @streamView s, 'output', 'quote'
  #
  # errView: (s) -> @streamView s, 'err', 'alert'
  #
  # infoView: (s) -> @streamView s, 'info', 'info'
  #
  # resultView: (r, {icon, error}={}) ->
  #   icon ?= if error then 'x' else 'check'
  #   view = document.createElement 'div'
  #   view.classList.add 'result'
  #   if error then view.classList.add 'error'
  #   view.appendChild r
  #   @cellView view,
  #     icon: icon

  # Animations

  visible: ->
    document.contains @

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
    @contains document.activeElement

  focusInput: (force) ->
    if force or @hasFocus()
      @getInput()?.querySelector('atom-text-editor')?.focus()

  loading: (l = @isLoading) ->
    if l
      @loading false
      @items.querySelector('.divider:last-child')?.classList.add 'loading'
    else
      @items.querySelector('.divider.loading')?.classList.remove 'loading'
    @isLoading = l

  # Scrolling

  scrollValue: ->
    @scrollTop

  scrollEndValue: ->
    return 0 unless @lastDivider
    @lastDivider.offsetTop - @clientHeight + 8

  isVisible: (pane, view) ->
    [top, bottom] = [pane.scrollTop, pane.scrollTop + pane.clientHeight]
    [ptop, pbottom] = [view.offsetTop, view.offsetTop + view.clientHeight]
    bottom >= ptop >= top || bottom >= pbottom >= top

  last: (xs) -> xs[xs.length-1]

  lastCellVisible: ->
    items = @items.querySelectorAll('.cell')
    return false unless items[0]
    @isVisible @, @last items

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
      @focusInput()

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
