class PlotPaneElement extends HTMLElement

  createdCallback: ->
    @setAttribute 'tabindex', -1

  initialize: (@model) ->
    @model.onDidAddItem (item) => @addItem item
    @

  addItem: (item) ->
    @item?.parentElement.removeChild @item
    @item = item
    @appendChild @item

  getModel: -> @model

module.exports = PlotPaneElement = document.registerElement 'ink-plot-pane', prototype: PlotPaneElement.prototype
