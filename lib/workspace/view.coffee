views = require '../util/views'
{div, span, table, tr, td} = views.tags

class WorkspaceElement extends HTMLElement

  createdCallback: ->
    @setAttribute 'tabindex', -1
    atom.config.observe 'editor.fontSize', (v) =>
      @style.fontSize = v + 'px'
    atom.config.observe 'editor.fontFamily', (v) =>
      @style.fontFamily = v

  icon: (type) ->
    if type?.startsWith 'icon-' then return span "icon #{type}"
    if type?.length == 1 then return type
    switch type
      when 'function' then 'λ'
      when 'type' then 'T'
      when 'module' then span 'icon icon-package'
      when 'mixin' then span 'icon icon-code'
      else 'c'

  createView: ->
    if @view? then @removeChild @view
    contexts = for {context, items} in @model.items
      rows = for {name, value, type, icon} in items
        if name?
          tr [
            td "icon #{type}", @icon icon or type
            td "name", name
            td 'value', value
          ]
        else
          tr [
            td "icon #{type}", @icon icon or type
            td {class: "value", colspan: 2}, value
          ]
      div 'context', [div('header', context), table('items', rows)]
    @view = views.render div 'contexts', contexts
    @classList.add @model.id
    @appendChild @view

  initialize: (@model) ->
    @createView()
    @model.onDidSetItems => @createView()
    @

  getModel: -> @model

module.exports = WorkspaceElement = document.registerElement 'ink-workspace', prototype: WorkspaceElement.prototype
