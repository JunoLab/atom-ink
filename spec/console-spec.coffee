Console = require '../lib/console/console'

{model, view, pane, editor} = {}

describe "the console", ->

  beforeEach ->
    jasmine.unspy window, 'setTimeout'
    jasmine.attachToDOM atom.views.getView(atom.workspace)
    waitsForPromise ->
      atom.packages.activatePackage 'ink'
    runs ->
      model = new Console initialInput: false
      view = atom.views.getView(model)
      view.style.height = '500px'
    waitsForPromise ->
      atom.workspace.open().then (ed) ->
        editor = ed
    runs ->
      pane = atom.workspace.getActivePane()
      pane.activateItem model

  it "has an ink-console view", ->
    expect(view.tagName.toLowerCase()).toBe 'ink-console'

  it "displays in a pane", ->
    pview = atom.views.getView(pane)
    expect(pview.contains view).toBe true

  it "has a width and height", ->
    expect(view.clientHeight).toBe 500
    expect(view.clientWidth).toBe 800

  it "is initially empty", ->
    expect(model.items.length).toBe(0)
    expect(view.querySelectorAll('.cell').length).toBe(0)

  describe "when adding cells to the console", ->

  describe 'focus', ->

  describe 'scrolling', ->

  describe 'modes', ->

  describe 'history', ->
