WorkspaceElement = require './view'

module.exports =
class Workspace

  @activate: ->

  getTitle: ->
    'Workspace'

  getIconName: ->
    'book'

require('../pane-mixin')(Workspace, WorkspaceElement)
