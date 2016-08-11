{CompositeDisposable} = require 'atom'
views = require '../util/views.coffee'
{div, span} = views.tags

module.exports =

  activate: ->
    @subs = new CompositeDisposable
    @subs.add atom.workspace.observeTextEditors (ed) =>
      @subs.add ed.observeGrammar (grammar) =>
        if grammar.scopeName in @scopes
          @init ed
        else
          @deinit ed

  deactivate: ->
    @subs.dispose()
    for ed in atom.workspace.getTextEditors()
      @deinit ed
    delete @sub

  scopes: []
  breakpoints: []

  addScope: (scope) ->
    @activate()
    @scopes.push scope
    for ed in atom.workspace.getTextEditors()
      if ed.getGrammar().scopeName == scope then @init(ed)

  init: (ed) ->
    ed.addGutter name: 'ink-breakpoints'
    for bp in @breakpoints
      if bp.file == ed.getPath()
        bp.views.push @addToEd ed, bp.line

  deinit: (ed) ->
    ed.gutterWithName('ink-breakpoints')?.destroy()

  get: (f, l, bps = @breakpoints) ->
    bps.filter ({file, line}) ->
      file == f and (!l or line == l)

  editorsForFile: (path) ->
    atom.workspace.getTextEditors().filter (ed) -> ed.getPath() == path

  view: ->
    views.render span 'ink-bp icon icon-chevron-right'

  fadeIn: (view) ->
    view.classList.add 'ink-hide'
    setTimeout (-> view.classList.remove 'ink-hide'), 20
    view

  fadeOut: (view, f) ->
    view.classList.add 'ink-hide'
    setTimeout f, 200

  addToEd: (ed, line) ->
    marker = ed.markBufferPosition row: line
    gutter = ed.gutterWithName 'ink-breakpoints'
    item = @fadeIn @view()
    decoration = gutter.decorateMarker marker, item: item
    {marker, gutter, decoration, item}

  add: (file, line) ->
    return existing if (existing = @get(file, line)[0])?
    vs = for ed in @editorsForFile file
      @addToEd ed, line
    bp = @
    destroy = -> bp.remove @
    obj = {file, line, views: vs, destroy}
    @breakpoints.push obj
    obj

  remove: (bp) ->
    @breakpoints = @breakpoints.filter (x)->x!=bp
    for view in bp.views
      @fadeOut view.item, ->
        view.marker.destroy()
    return
