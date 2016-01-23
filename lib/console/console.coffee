# TODO: autocomplete

{Emitter} = require 'atom'
ConsoleView = require './view'

module.exports =
class Console
  @activate: ->
    @evalCmd = atom.commands.add '.ink-console atom-text-editor',
      'console:evaluate': ->
        ed = @getModel()
        ed.inkConsole.eval ed
      'core:move-up': (e) ->
        ed = @getModel()
        ed.inkConsole.keyUp e, ed
      'core:move-down': (e) ->
        ed = @getModel()
        ed.inkConsole.keyDown e, ed
      'core:backspace': (e) ->
        @getModel().inkConsole.cancelMode e

    atom.commands.add '.ink-console',
      'core:copy': ->
        if (sel = document.getSelection().toString())
          atom.clipboard.write sel

  @deactivate: ->
    @evalCmd.dispose()

  constructor: ->
    @view = new ConsoleView
    @view.getModel = -> @
    @observeInput (cell) =>
      @watchModes cell
    @onEval => @logInput()

    @subs = atom.commands.add @view[0],
      'console:previous-in-history': => @previous()
      'console:next-in-history': => @next()

  destroy: ->
    @subs.dispose()

  isInput: false

  setGrammar: (g) ->
    @view.setGrammar g

  eval: (ed) ->
    if @isInput
      input = @view.getInputEd()
      if ed == input
        @emitter.emit 'eval', ed
      else
        input.setText ed.getText()
        @view.focusInput true
        @view.scroll()

  input: ->
    if not @isInput
      v = @view.inputView this
      @emitter.emit 'new-input', v
      @view.add v
      @isInput = true

  done: ->
    if @isInput
      @view.scrollView.focus() # Defocus input
      @isInput = false

  @debounce: (t, f) ->
    timeout = null
    (args...) ->
      if timeout? then clearTimeout timeout
      timeout = setTimeout (=> f.call this, args...), t

  @buffer: (f) ->
    buffer = []
    flush = @debounce 10, ->
      f.call this, buffer.join('').trim()
      buffer = []
    (s) ->
      buffer.push(s)
      flush.call this

  out: @buffer (s) -> @view.add(@view.outView(s), @isInput)

  err: @buffer (s) -> @view.add(@view.errView(s), @isInput)

  info: @buffer (s) -> @view.add(@view.infoView(s), @isInput)

  result: (r, opts) -> @view.add(@view.resultView(r, opts), @isInput)

  clear: ->
    @done()
    @view.clear()

  reset: ->
    focus = @view.hasFocus()
    @clear()
    @input()
    @view.focusInput focus

  emitter: new Emitter

  onEval: (f) -> @emitter.on 'eval', f

  observeInput: (f) -> @emitter.on 'new-input', f

  openInTab: ->
    p = atom.workspace.getActivePane()
    if p.items.length > 0
      p = p.splitDown()
      p.setFlexScale 1/2
    p.activateItem @view
    p.onDidActivate => setTimeout =>
      if document.activeElement == @view[0] && @view.lastCellVisible()
          @view.focusInput(true)

  toggle: ->
    if atom.workspace.getPaneItems().indexOf(@view) > -1
      @view[0].parentElement.parentElement.getModel().removeItem @view
    else
      @openInTab()
      @view.focusInput()

  modes: -> {}

  cursorAtBeginning: (ed) ->
    ed.getCursors().length == 1 and
    ed.getCursors()[0].getBufferPosition().isEqual [0, 0]

  setMode: (cell, mode) ->
    ed = cell.querySelector('atom-text-editor').getModel()
    if mode?.constructor is String then mode = @modes[mode]
    if not mode
      delete ed.inkConsoleMode
      if @view.defaultGrammar then ed.setGrammar @view.defaultGrammar
      @view.setIcon cell, 'chevron-right'
    else
      ed.inkConsoleMode = mode
      if mode.grammar then ed.setGrammar mode.grammar
      @view.setIcon cell, mode.icon

  watchModes: (cell) ->
    @edListener?.dispose()
    ed = cell.querySelector('atom-text-editor').getModel()
    @edListener = ed.onWillInsertText (e) =>
      if (mode = @modes()[e.text]) and @cursorAtBeginning(ed) and ed.inkConsoleMode isnt mode
        e.cancel()
        @setMode cell, mode

  cancelMode: (e) ->
    ed = e.currentTarget.getModel()
    cell = e.currentTarget.parentElement.parentElement
    if @cursorAtBeginning(ed) and ed.inkConsoleMode
      @setMode cell

  setHistory: (history) ->
    @history = history
    @historyPos = @history.length

  logInput: ->
    @history ?= []
    ed = @view.getInputEd()
    input = ed.getText()
    mode = ed.inkConsoleMode
    # TODO: more advanced cycle detection
    if input && input != @history[@history.length-1]?.input
      @history.push
        input: input
        mode: mode?.name
    @historyPos = @history.length

  previous: ->
    if @historyPos > 0
      @historyPos--
      @view.getInputEd().setText @history[@historyPos].input
      @setMode @view.getInput(), @history[@historyPos].mode
      @view.getInputEd().setCursorBufferPosition [0, 0]

  next: ->
    if @historyPos < @history.length
      @historyPos += 1
      ed = @view.getInputEd()
      ed.setText (@history[@historyPos]?.input or "")
      @setMode @view.getInput(), @history[@historyPos]?.mode
      ed.setCursorBufferPosition [Infinity, Infinity]

  keyUp: (e, ed) ->
    if ed == @view.getInputEd()
      curs = ed.getCursorsOrderedByBufferPosition()
      if curs.length is 1 and curs[0].getBufferRow() == 0
        e.preventDefault()
        @previous()

  keyDown: (e, ed) ->
    if ed == @view.getInputEd()
      curs = ed.getCursorsOrderedByBufferPosition()
      if curs.length is 1 and curs[0].getBufferRow()+1 == ed.getLineCount()
        e.preventDefault()
        @next()
