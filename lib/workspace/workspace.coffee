{Emitter} = require 'atom'

WorkspaceElement = require './view'

module.exports =
class Workspace

  @activate: ->

  constructor: ->
    @emitter = new Emitter
    @items = []

  setItems: (@items) -> @emitter.emit 'did-set-items', @items

  onDidSetItems: (f) -> @emitter.on 'did-set-items', f

  getTitle: ->
    'Workspace'

  getIconName: ->
    'book'

require('../pane-mixin')(Workspace, WorkspaceElement)
