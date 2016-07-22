{Emitter} = require 'atom'

PaneItem = require '../util/pane-item'
PlotPaneElement = require './view'

module.exports =
class PlotPane extends PaneItem

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
    'graph'

  show: (view) ->
    @item = view
    @emitter.emit 'did-add-item', view

  onDidAddItem: (f) -> @emitter.on 'did-add-item', f

PlotPane.attachView PlotPaneElement
