{Emitter} = require 'atom'
ConsoleView = require './view'

module.exports =
  activate: ->
    @consoleOpener = atom.workspace.addOpener (uri) =>
      if uri == 'atom://console'
        new ConsoleView

    # TODO: eval only in last editor
    @evalCmd = atom.commands.add '.console atom-text-editor',
      'console:evaluate': (e) -> e.currentTarget.getModel().inkEval()

  deactivate: ->
    @consoleOpener.dispose()
    @openCmd.dispose()

  openTab: (f) ->
    atom.workspace.open('atom://console', split:'right').then (view) =>
      f @console view

  console: (view) ->
    view: view
    isInput: false
    input: ->
      v = @view.inputView(this)
      @view.addItem @view.fadeIn v
      @view.focusInput()
      @divider()
      @isInput = true
    done: ->
      @isInput = false
    out: (s) ->
      if @isInput
        @view.addBeforeInput @view.outView s
      else
        @view.addItem @view.fadeIn @view.outView s
      @divider()
    divider: ->
      @view.divider @isInput
    emitter: new Emitter
    onEval: (f) -> @emitter.on 'eval', f

  echo: ->
    @openTab (c) =>
      c.onEval (ed) =>
        c.done()
        window.ed = ed
        if ed.getText()
          c.out ed.getText()
        # setTimeout (-> if ed.getText()
        #   c.out ed.getText()), 1000
        c.input()
      c.input()
      @c = c

  # @echo()
