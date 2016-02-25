class WorkspaceElement extends HTMLElement

  createdCallback: ->
    @setAttribute 'tabindex', -1

  initialize: (@model) ->
    @

  getModel: -> @model

module.exports = WorkspaceElement = document.registerElement 'ink-workspace', prototype: WorkspaceElement.prototype
