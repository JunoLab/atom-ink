module.exports = (Pane, View) ->
  deserialiser = "Ink#{Pane.name}"

  Pane.registered = {}
  Pane.fromId = (id) ->
    if (pane = @registered[id])
      pane
    else
      pane = @registered[id] = new Pane
      pane.id = id
      pane

  Pane.registerViews = ->
    atom.views.addViewProvider Pane, (pane) ->
      new View().initialize pane

    atom.deserializers.add
      name: deserialiser
      deserialize: ({id}) ->
        Pane.fromId id

  Pane.prototype.serialize = ->
    if @id
      deserializer: deserialiser
      id: @id

  Pane.registerViews()

  Pane.prototype.activate = ->
    for pane in atom.workspace.getPanes()
      for item in pane.getItems()
        if item is this
          pane.activate()
          pane.activateItem this
          return true
    return false
