# TODO: autocomplete

{Emitter, CompositeDisposable} = require 'atom'
ConsoleView = require './view'
HistoryProvider = require './history'
{closest} = require './helpers'

getConsole = (el) -> closest(el, 'ink-console').getModel()

module.exports =
class Console
  @activate: ->
    @subs = new CompositeDisposable
    @subs.add atom.commands.add 'ink-console atom-text-editor:not([mini])',
      'console:evaluate': ->
        getConsole(this).eval this
      'core:move-up': (e) ->
        getConsole(this).keyUp e, this
      'core:move-down': (e) ->
        getConsole(this).keyDown e, this
      'core:move-left': (e) ->
        delete getConsole(this).prefix
      'core:move-right': (e) ->
        delete getConsole(this).prefix
      'core:backspace': (e) ->
        getConsole(this).cancelMode this

    @subs.add atom.commands.add 'ink-console',
      'core:copy': ->
        if (sel = document.getSelection().toString())
          atom.clipboard.write sel
      'console:previous-in-history': -> @getModel().previous()
      'console:next-in-history': -> @getModel().next()

  @deactivate: ->
    @subs.dispose()

  constructor: ->
    @items = []
    @history = new HistoryProvider
    @emitter = new Emitter
    # TODO: we shouldn't need to know about the view at all
    @view = new ConsoleView().initialize @
    @onDidAddItem (item) => @watchModes item
    setTimeout (=> @input()), 100 # Wait for grammars to load

  # Basic item / input logic

  push: (cell) ->
    @items.push cell
    @emitter.emit 'did-add-item', cell

  onDidAddItem: (f) -> @emitter.on 'did-add-item', f

  insert: (cell, i) ->
    if i >= @items.length or @items.length is 0
      @push cell
    else
      @items.splice(i, 0, cell)
      @emitter.emit 'did-insert-item', [cell, i]

  onDidInsertItem: (f) -> @emitter.on 'did-insert-item', f

  clear: (cell) ->
    @items = []
    @emitter.emit 'did-clear'

  onDidClear: (f) -> @emitter.on 'did-clear', f

  getInput: ->
    last = @items[@items.length-1]
    if last?.input then last

  lastOutput: -> @items[@items.length - (if @getInput() then 2 else 1)]

  input: ->
    delete @prefix
    if not @getInput()
      @push @setMode type: 'input', input: true
      @focusInput()

  done: ->
    if @getInput()
      @view.focus() if @view.hasFocus() # Defocus input
      @getInput().input = false

  output: (cell) ->
    if @getInput()?
      @insert cell, @items.length-1
    else
      @push cell

  reset: ->
    @done()
    @clear()
    @input()
    @focusInput true

  itemForView: (view) ->
    return view unless view instanceof HTMLElement
    for item in @items
      if item.cell.contains view
        return item

  eval: (item) ->
    item = @itemForView item
    if item.input
      @emitter.emit 'eval', item
    else if (input = @getInput())
      input.editor.setText item.editor.getText()
      @focusInput true
      @view.scroll()

  onEval: (f) -> @emitter.on 'eval', f

  openInTab: ->
    p = atom.workspace.getActivePane()
    if p.items.length > 0
      p = p.splitDown()
      p.setFlexScale 1/2
    p.activateItem @view
    p.onDidActivate => setTimeout =>
      if document.activeElement == @view
          @focusInput()

  toggle: ->
    if atom.workspace.getPaneItems().indexOf(@view) > -1
      @view.parentElement.parentElement.getModel().removeItem @view
    else
      @openInTab()
      @focusInput()

  focusInput: (force) ->
    if @getInput()? then @emitter.emit 'focus-input', force

  onFocusInput: (f) -> @emitter.on 'focus-input', f

  # Output

  bufferOut: (item) ->
    {type, text} = item
    last = @lastOutput()
    if last?.type is type and last.expires > performance.now()
      last.text += text
    else
      @output item
    @lastOutput().expires = performance.now() + 100

  stdout: (s) -> @bufferOut type: 'stdout', icon: 'quote', text: s

  stderr: (s) -> @bufferOut type: 'stderr', icon: 'alert', text: s

  info: (s) -> @bufferOut type: 'info', icon: 'info', text: s

  result: (r, {error}) ->
    @output
      type: 'result'
      icon: if error then 'x' else 'check'
      result: r

  # Input Modes

  getModes: -> []

  setModes: (modes) -> @getModes = -> modes

  defaultMode: ->
    for mode in @getModes()
      return mode if mode.default
    return {}

  getMode: (name) ->
    return name if name instanceof Object
    for mode in @getModes()
      return mode if mode.name is name
    return @defaultMode()

  modeForPrefix: (prefix) ->
    for mode in @getModes()
      return mode if mode.prefix is prefix or mode.prefix is prefix

  setMode: (item, mode = @defaultMode()) ->
    mode = @getMode mode
    item.mode = mode
    item.icon = mode.icon or 'chevron-right'
    item.grammar = mode.grammar
    item

  cursorAtBeginning: (ed) ->
    ed.getCursors().length == 1 and
    ed.getCursors()[0].getBufferPosition().isEqual [0, 0]

  watchModes: (item) ->
    {editor, mode} = item
    return unless editor?
    @edListener?.dispose()
    @edListener = editor.onWillInsertText (e) =>
      newmode = @modeForPrefix e.text
      if newmode? and @cursorAtBeginning(editor) and newmode isnt mode
        e.cancel()
        @setMode item, newmode

  cancelMode: (item) ->
    {editor} = item = @itemForView item
    if @cursorAtBeginning(editor)
      @setMode item

  # History

  logInput: ->
    {editor, mode} = @getInput()
    @history.push
      input: editor.getText()
      mode: mode?.name

  moveHistory: (up) ->
    {editor} = @getInput()
    if editor.getText() or not @prefix?
      pos = editor.getCursorBufferPosition()
      text = editor.getTextInRange [[0,0], pos]
      @prefix = {pos, text}
    next = if up
      @history.getPrevious @prefix.text
    else
      @history.getNext @prefix.text
    editor.setText next.input
    @setMode @getInput(), next.mode
    editor.setCursorBufferPosition @prefix.pos or [0, 0]

  previous: -> @moveHistory true
  next: -> @moveHistory false

  keyUp: (e, item) ->
    {editor, input} = @itemForView item
    if input
      curs = editor.getCursorsOrderedByBufferPosition()
      if curs.length is 1 and (@prefix? or curs[0].getBufferRow() == 0)
        e.stopImmediatePropagation()
        @previous()

  keyDown: (e, item) ->
    {editor, input} = @itemForView item
    if input
      curs = editor.getCursorsOrderedByBufferPosition()
      if curs.length is 1 and (@prefix? or curs[0].getBufferRow()+1 == editor.getLineCount())
        e.stopImmediatePropagation()
        @next()
