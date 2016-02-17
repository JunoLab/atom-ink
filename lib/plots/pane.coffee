PlotPaneElement = require './view'

module.exports =
class PlotPane

  @activate: ->
    @pane ?= new PlotPane
    atom.workspace.addOpener (uri) =>
      if uri.startsWith 'atom://ink/plots'
        @pane

  @registerViews: ->
    atom.views.addViewProvider PlotPane, (c) ->
      new PlotPaneElement().initialize c

    atom.deserializers.add
      name: 'InkPlotPane'
      deserialize: ->
        @pane = new PlotPane

  # TODO: support more than one pane
  serialize: ->
    deserializer: 'InkPlotPane'

  getTitle: ->
    'Plots'

  getIconName: ->
    'pencil'

PlotPane.registerViews()
