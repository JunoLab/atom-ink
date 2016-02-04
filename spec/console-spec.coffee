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

  describe 'when an input is created', ->
    beforeEach ->
      model.input()

    it 'updates the model', ->
      expect(model.items.length).toBe 1
      expect(model.items[0].type).toBe 'input'
      expect(model.items[0].input).toBe true

    it 'creates an atom-text-editor', ->
      ed = model.items[0].view
      expect(ed.tagName.toLowerCase()).toBe 'atom-text-editor'
      cells = view.querySelectorAll '.cell'
      expect(cells.length).toBe 1
      expect(cells[0].contains ed).toBe true

    it 'focuses the input', ->
      expect(document.activeElement).toBe model.items[0].view

  describe 'when a result is displayed', ->

    describe 'when there is a single result', ->

      result = null
      beforeEach ->
        result = document.createElement 'div'
        model.result result

      it 'updates the model', ->
        expect(model.items.length).toBe 1
        expect(model.items[0].type).toBe 'result'
        expect(model.items[0].view.contains result).toBe true

      it 'displays the result', ->
        cells = view.querySelectorAll '.cell'
        expect(cells.length).toBe 1
        expect(cells[0].contains result).toBe true

    describe 'when there are multiple results', ->

      beforeEach ->
        for i in [1..10]
          result = document.createElement 'div'
          result.innerText = "#{i}"
          model.result result

      it 'updates the model', ->
        expect(model.items.length).toBe 10
        for i in [1..10]
          expect(model.items[i-1].view.innerText.trim()).toBe "#{i}"

      it 'stacks the results vertically', ->
        cells = view.querySelectorAll '.cell .content'
        expect(cells.length).toBe 10
        for i in [1..10]
          expect(cells[i-1].innerText.trim()).toBe "#{i}"
