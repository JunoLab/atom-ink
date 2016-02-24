{Emitter} = require 'atom'

PlotPaneElement = require './view'

module.exports =
class PlotPane

  @activate: ->
    @pane = PlotPane.fromId 'default'
    atom.workspace.addOpener (uri) =>
      if uri.startsWith 'atom://ink/plots'
        @pane

  constructor: ->
    @emitter = new Emitter

  getTitle: ->
    'Plots'

  getIconName: ->
    'comment'

  show: (view) ->
    @item = view
    @emitter.emit 'did-add-item', view

  onDidAddItem: (f) -> @emitter.on 'did-add-item', f

require('../pane-mixin')(PlotPane, PlotPaneElement)
