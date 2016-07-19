{CompositeDisposable} = require 'atom'

subs = new CompositeDisposable

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
        pane = Pane.fromId id
        return if pane.currentPane()
        pane

  Pane.prototype.serialize = ->
    if @id
      deserializer: deserialiser
      id: @id

  Pane.registerViews()

  Pane.prototype.currentPane = ->
    for pane in atom.workspace.getPanes()
      return pane if this in pane.getItems()
    return

  Pane.prototype.activate = ->
    if (pane = @currentPane())
      pane.activate()
      pane.activateItem this
      return pane
    else
      return

  subs.add atom.workspace.addOpener (uri) ->
    if (m = uri.match new RegExp "atom://ink-#{Pane.name.toLowerCase()}/(.+)")
      [_, id] = m
      return Pane.fromId id

  Pane.prototype.open = (opts) ->
    if @activate() then return
    if @id
      atom.workspace.open "atom://ink-#{Pane.name.toLowerCase()}/#{@id}", opts
    else
      throw new Error 'Pane does not have an ID'

module.exports.deactivate = ->
  subs.dispose()
