class PlotPaneElement extends HTMLElement

  createdCallback: ->
    @setAttribute 'tabindex', -1

  initialize: (@model) ->
    @

  getModel: -> @model

module.exports = PlotPaneElement = document.registerElement 'ink-plot-pane', prototype: PlotPaneElement.prototype
