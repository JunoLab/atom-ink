{Emitter} = require 'atom'

WorkspaceElement = require './view'

module.exports =
class Workspace

  @activate: ->

  constructor: ->
    @items = [{
      context: 'Main'
      items: [
        {name: 'Foo', value: 'Bar'}
        {name: 'Bazzer', value: 'Qux'}
      ]
    }]

  getTitle: ->
    'Workspace'

  getIconName: ->
    'book'

require('../pane-mixin')(Workspace, WorkspaceElement)
