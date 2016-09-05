{Emitter, CompositeDisposable} = require 'atom'
PaneItem = require '../util/pane-item'
ConsoleElement = require './view'
HistoryProvider = require './history'
{closest} = require './helpers'

getConsole = (el) -> closest(el, 'ink-console').getModel()

# ## Console API - in Javascript

# NOTE: This is incomplete, but it should help you get a an overview of the console itself

# In general you need to do 4 things to get a working console:
# - Register a console object via: ink.Console.fromId('console-id')
# - set the console modes via: console.setModes(modes), where modes is a vector of
#     {name: 'mode-name', default: true, grammar: 'source.language', icon: 'icon-name'}, and
#     console is the previously created console
# - activate the console object via: console.activate()
# - open a console pane via: atom.workspace.open('atom://language-client/console',
#                                                { split: 'down', searchAllPanes: true })
#   with a unique URI for your language, the position of the console on the workspace and
#   whether or not to have a unique console in your workspace. The previous works provided that
#   you have already registered an opener for your console via: atom.workspace.addOpener(uri-function)

# Once created you can interact with the console like this:
# - console.stderr('string') displays the string with a yellow color and a warning sign on the gutter
# - console.stdout('string') displays the string with the default color and a quotation mark on the gutter
# - console.info('string') displays the string with a blue color and an `i` on the gutter
# - console.result(HTMLElement, {error: true|false}) displays the HTML element according to the error flag
#    on error: red text with an `x` on the gutter
#    on normal-result:  default text color with  a `✓` on the gutter

module.exports =
class Console extends PaneItem
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
        getConsole(this).resetPrefix()
      'core:move-right': (e) ->
        getConsole(this).resetPrefix()
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

  constructor: ({initialInput}={}) ->
    @items = []
    @maxSize = 1000
    @history = new HistoryProvider
    @emitter = new Emitter
    initialInput ?= true
    if initialInput then setTimeout (=> @input()), 100 # Wait for grammars to load

  getTitle: ->
    "Console"

  getIconName: ->
    "terminal"

  # Basic item / input logic

  push: (cell) ->
    @items.push cell
    @emitter.emit 'did-add-item', cell
    @limitHistory()

  onDidAddItem: (f) -> @emitter.on 'did-add-item', f

  onDidDeleteFirstItems: (f) -> @emitter.on 'did-delete-first-items', f

  insert: (cell, i) ->
    if i >= @items.length or @items.length is 0
      @push cell
    else
      @items.splice(i, 0, cell)
      @emitter.emit 'did-insert-item', [cell, i]
      @limitHistory()

  limitHistory: ->
    itemsToDelete = @items.length - @maxSize
    if itemsToDelete <= 0 then return
    @items.splice 0, itemsToDelete
    @emitter.emit 'did-delete-first-items', itemsToDelete

  onDidInsertItem: (f) -> @emitter.on 'did-insert-item', f

  clear: (cell) ->
    @items = []
    @emitter.emit 'did-clear'

  onDidClear: (f) -> @emitter.on 'did-clear', f

  onceDidClear: (f) -> d = @onDidClear (x) -> (d.dispose(); f(x))

  getInput: ->
    last = @items[@items.length-1]
    if last?.input then last

  lastOutput: -> @items[@items.length - (if @getInput() then 2 else 1)]

  input: ->
    @resetPrefix()
    if not @getInput()
      item = type: 'input', input: true
      @push @setMode item
      @watchModes item
      @focusInput()
      item
    else
      @getInput()

  done: ->
    if @getInput()
      @getInput().input = false
      @emitter.emit 'done'

  onDone: (f) -> @emitter.on 'done', f

  output: (cell) ->
    if @getInput()?
      @insert cell, @items.length-1
    else
      @push cell

  reset: ->
    @done()
    @clear()
    @input()
    @history.resetPosition()
    @focusInput true

  itemForView: (view) ->
    return view unless view instanceof HTMLElement
    for item in @items
      if item.cell.contains view
        return item

  eval: (item) ->
    item = @itemForView item
    if item.eval?
      item.eval()
    else if item.input
      @emitter.emit 'eval', item
    else if (input = @getInput())
      input.editor.setText item.editor.getText()
      @focusInput true

  onEval: (f) -> @emitter.on 'eval', f

  focusInput: (force) ->
    if @getInput()? then @emitter.emit 'focus-input', force

  onFocusInput: (f) -> @emitter.on 'focus-input', f

  loading: (status) -> @emitter.emit 'loading', status

  onLoading: (f) -> @emitter.on 'loading', f

  # Output

  bufferOut: (item) ->
    {type, text} = item
    last = @lastOutput()
    if last?.type is type and (last.expires > performance.now() or not last.text)
      last.text += text
    else
      @output item
    @lastOutput().expires = performance.now() + 100

  stdout: (s) -> @bufferOut type: 'stdout', icon: 'quote', text: s

  stderr: (s) -> @bufferOut type: 'stderr', icon: 'alert', text: s

  info: (s) -> @bufferOut type: 'info', icon: 'info', text: s

  result: (r, {error}={}) ->
    @output
      type: 'result'
      icon: if error then 'x' else 'check'
      result: r
      error: error

#                ___                     _ _ _
#               ( /                _/_  ( / ) )      /
#                / _ _    ,_   , , /     / / / __ __/ _  (
#              _/_/ / /__/|_)_(_/_(__   / / (_(_)(_/_(/_/_)_
#                        /|
#                       (/

  getModes: -> []

  setModes: (modes) -> @getModes = -> modes

  defaultMode: ->
    for mode in @getModes()
      return mode if not mode.prefix?
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
    item

  cancelMode: (item) ->
    {editor} = item = @itemForView item
    if @cursorAtBeginning(editor)
      @setMode item

#                        __  ___      __
#                       / / / (_)____/ /_____  _______  __
#                      / /_/ / / ___/ __/ __ \/ ___/ / / /
#                     / __  / (__  ) /_/ /_/ / /  / /_/ /
#                    /_/ /_/_/____/\__/\____/_/   \__, /
#                                                /____/

  logInput: ->
    {editor, mode} = @getInput()
    @history.push
      input: editor.getText()
      mode: mode?.name

  resetPrefix: ->
    @prefix?.listener?.dispose()
    delete @prefix

  moveHistory: (up) ->
    {editor} = @getInput()
    if (editor.getText() or not @prefix?) and @prefix?.pos?[0] isnt Infinity
      @resetPrefix()
      pos = editor.getCursorBufferPosition()
      text = editor.getTextInRange [[0,0], pos]
      pos = [Infinity, Infinity] if text is ''
      @prefix = {pos, text}
    next = if up
      @history.getPrevious @prefix.text
    else
      @history.getNext @prefix.text
    @prefix.listener?.dispose()
    editor.setText next.input
    @prefix.listener = editor.onDidChange => @resetPrefix()
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

Console.attachView ConsoleElement
