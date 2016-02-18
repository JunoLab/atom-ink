PlotPaneElement = require './view'

module.exports =
class PlotPane

  @activate: ->
    @pane = PlotPane.fromId 'default'
    atom.workspace.addOpener (uri) =>
      if uri.startsWith 'atom://ink/plots'
        @pane

  getTitle: ->
    'Plots'

  getIconName: ->
    'comment'

require('../pane-mixin')(PlotPane, PlotPaneElement)
