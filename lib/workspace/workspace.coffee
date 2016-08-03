{Emitter} = require 'atom'

PaneItem = require '../util/pane-item'
WorkspaceElement = require './view'

module.exports =
class Workspace extends PaneItem

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

Workspace.attachView WorkspaceElement
