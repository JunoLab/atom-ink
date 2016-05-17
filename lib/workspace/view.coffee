views = require '../util/views'
{div, span, table, tr, td} = views.tags

class WorkspaceElement extends HTMLElement

  createdCallback: ->
    @setAttribute 'tabindex', -1
    atom.config.observe 'editor.fontSize', (v) =>
      @style.fontSize = v + 'px'
    atom.config.observe 'editor.fontFamily', (v) =>
      @style.fontFamily = v

  class: (type) ->
    switch type
      when 'number' then 'constant'
      when 'string' then 'constant'
      when 'code' then 'mixin'
      when 'macro' then 'mixin'
      else type

  icon: (type) ->
    switch type
      when 'function' then 'λ'
      when 'macro' then span 'icon icon-mention'
      when 'type' then 'T'
      when 'module' then span 'icon icon-package'
      when 'number' then 'n'
      when 'code' then span 'icon icon-code'
      when 'string' then span 'icon icon-quote'
      else 'c'

  createView: ->
    contexts = for {context, items} in @model.items
      rows = for {name, value, type} in items
        tr [
          td "icon #{@class type}", @icon type
          td "name", name
          td 'value', value
        ]
      div 'context', [div('header', context), table('items', rows)]
    @view = views.render div 'contexts', contexts
    @appendChild @view

  initialize: (@model) ->
    @createView()
    @

  getModel: -> @model

module.exports = WorkspaceElement = document.registerElement 'ink-workspace', prototype: WorkspaceElement.prototype
