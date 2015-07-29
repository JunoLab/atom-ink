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
      @isInput = true
      @view.addItem @view.fadeIn @view.inputView(this)
    done: ->
      @isInput = false
    out: (s) ->
      @view.addItem @view.fadeIn @view.outView s
    divider: ->
      @view.fadeIn @view.divider()
    emitter: new Emitter
    onEval: (f) -> @emitter.on 'eval', f

  echo: ->
    @openTab (c) =>
      c.onEval (ed) =>
        c.out ed.getText()
        c.divider()
        c.input()
        c.divider()
      c.input()
      c.divider()
      @c = c

  # @echo()
