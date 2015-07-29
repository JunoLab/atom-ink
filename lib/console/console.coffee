{Emitter} = require 'atom'
ConsoleView = require './view'

module.exports =
  activate: ->
    # TODO: eval only in last editor
    @evalCmd = atom.commands.add '.console atom-text-editor',
      'console:evaluate': (e) -> e.currentTarget.getModel().inkEval()

    @clearCmd = atom.commands.add '.console',
      'console:clear': (e) -> atom.workspace.getActivePaneItem().getModel().clear()

  deactivate: ->
    @openCmd.dispose()
    @clearCmd.dispose()

  create: ->
    c = @basic()
    c.view.getModel = -> c
    c

  basic: ->
    view: new ConsoleView

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
        @view.slideIn @view.addBeforeInput @view.outView s
      else
        @view.addItem @view.fadeIn @view.outView s
      @divider()

    divider: ->
      @view.divider @isInput

    clear: ->
      @done()
      @view.clear()
      @emitter.emit 'clear'

    emitter: new Emitter

    onEval: (f) -> @emitter.on 'eval', f
    onClear: (f) -> @emitter.on 'clear', f

    openInTab: ->
      p = atom.workspace.getActivePane()
      if p.items.length > 0
        p = p.splitDown()
        p.setFlexScale 1/2
      p.activateItem @view

    toggle: ->
      if atom.workspace.getPaneItems().indexOf(@view) > -1
        @view[0].parentElement.parentElement.getModel().removeItem @view
      else
        @openInTab()
        @view.focusInput()
