views = require '../util/views'
{div, table, tr, td} = views.tags

class WorkspaceElement extends HTMLElement

  createdCallback: ->
    @setAttribute 'tabindex', -1
    atom.config.observe 'editor.fontSize', (v) =>
      @style.fontSize = v + 'px'
    atom.config.observe 'editor.fontFamily', (v) =>
      @style.fontFamily = v

  createView: ->
    contexts = for {context, items} in @model.items
      rows = (tr [td('name', name), td('value', value)] for {name, value} in items)
      div 'context', [div('header', context), table('items', rows)]
    @view = views.render div 'contexts', contexts
    @appendChild @view

  initialize: (@model) ->
    @createView()
    @

  getModel: -> @model

module.exports = WorkspaceElement = document.registerElement 'ink-workspace', prototype: WorkspaceElement.prototype
