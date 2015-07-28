ConsoleView = require './view'

module.exports =
  activate: ->
    @consoleOpener = atom.workspace.addOpener (uri) =>
      if uri == 'atom://console'
        @view = new ConsoleView
        # new ConsoleView

    @openCmd = atom.commands.add 'atom-workspace',
      'ink:open-console': -> atom.workspace.open 'atom://console', split:'right'

  deactivate: ->
    @consoleOpener.dispose()
    @openCmd.dispose()

  # @grammar = atom.grammars.grammarsByScopeName['source.julia']
  # @view.setGrammar @grammar
  # @view.addItem @view.inputView()
  # @view.divider()
  # @view.addItem @view.outView 'foo bar baz'
  # @view.addItem @view.errView 'oh noes'
  # @view.addItem @view.infoView 'we did something interesting'
  # @view.clear()
