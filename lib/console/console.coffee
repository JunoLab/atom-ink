# TODO: autocomplete

{Emitter} = require 'atom'
ConsoleView = require './view'

module.exports =
class Console
  @activate: ->
    # TODO: eval only in last editor
    @evalCmd = atom.commands.add '.ink-console atom-text-editor',
      'console:evaluate': ->
        ed = @getModel()
        ed.inkConsole.emitter.emit 'eval', ed
      'core:backspace': (e) ->
        @getModel().inkConsole.cancelMode e
      'console:previous-in-history': ->
        @getModel().inkConsole.previous()
      'console:next-in-history': ->
        @getModel().inkConsole.next()

  @deactivate: ->
    @openCmd.dispose()
    @clearCmd.dispose()

  constructor: ->
    @view.getModel = -> c
    @observeInput (cell) =>
      @watchModes cell
    @onEval => @logInput()

  view: new ConsoleView

  isInput: false

  setGrammar: (g) ->
    @view.setGrammar g

  input: ->
    v = @view.inputView this
    @emitter.emit 'new-input', v
    @view.add v
    @isInput = true

  done: -> @isInput = false

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

  out: @buffer (s) -> @view.add @view.outView(s), @isInput

  err: @buffer (s) -> @view.add @view.errView(s), @isInput

  info: @buffer (s) -> @view.add @view.infoView(s), @isInput

  result: (r, opts) -> @view.add @view.resultView(r, opts), @isInput

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
    p.onDidActivate => setTimeout  => @view.focusInput(true)

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
    ed = ed = cell.querySelector('atom-text-editor').getModel()
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
      if (mode = @modes()[e.text]) and @cursorAtBeginning(ed) and not ed.inkConsoleMode
        e.cancel()
        @setMode cell, mode

  cancelMode: (e) ->
    ed = e.currentTarget.getModel()
    cell = e.currentTarget.parentElement.parentElement
    if @cursorAtBeginning(ed) and ed.inkConsoleMode
      @setMode cell

  logInput: ->
    @history ?= []
    ed = @view.getInputEd()
    input = ed.getText()
    mode = ed.inkConsoleMode
    if input && input != @history[@history.length-1]?.input then @history.push {input, mode}
    @historyPos = @history.length

  previous: ->
    if @historyPos > 0
      @historyPos--
      @view.getInputEd().setText @history[@historyPos].input
      @setMode @view.getInput(), @history[@historyPos].mode

  next: ->
    if @historyPos < @history.length
      @historyPos += 1
      @view.getInputEd().setText (@history[@historyPos]?.input or "")
      @setMode @view.getInput(), @history[@historyPos]?.mode
