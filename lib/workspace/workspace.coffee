{Emitter} = require 'atom'

WorkspaceElement = require './view'

module.exports =
class Workspace

  @activate: ->

  constructor: ->
    @items = [{
      context: 'Main'
      items: [
        {name: 'Requires', value: 'Requires', type: 'module'}
        {name: 'exp', value: 'exp', type: 'function'}
        {name: 'pi', value: '3.14', type: 'number'}
        {name: 'Vertex', value: 'abstract Vertex', type: 'type'}
        {name: '@foo', value: '@foo', type: 'macro'}
        {name: 'expr', value: '2+2', type: 'code'}
        {name: 'name', value: '"Mike"', type: 'string'}
      ]
    }]

  getTitle: ->
    'Workspace'

  getIconName: ->
    'book'

require('../pane-mixin')(Workspace, WorkspaceElement)
