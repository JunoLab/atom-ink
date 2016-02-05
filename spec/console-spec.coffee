Console = require '../lib/console/console'

{model, view, pane, editor} = {}

describe "the console", ->

  beforeEach ->
    jasmine.unspy window, 'setTimeout'
    jasmine.attachToDOM atom.views.getView(atom.workspace)
    waitsForPromise ->
      Console.registerViews()
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

  viewSyncTest = ->
    beforeEach ->
      @cells = view.querySelectorAll '.cell .content > *'

    it 'has the right number of cells in the view', ->
      expect(model.items.length).toBe @cells.length

    it 'has the cell contents in the right order', ->
      for i in [0...model.items.length]
        expect(@cells[i]).toBe model.items[i].view

  clearTest = ->
    describe 'clearing the console', ->

      beforeEach ->
        model.clear()

      it 'updates the model', ->
        expect(model.items.length).toBe 0

      it 'updates the view', ->
        expect(view.querySelectorAll('.cell').length).toBe 0

      it 'retains focus', ->
        expect(document.activeElement).toBe view

  describe 'when an input is created', ->
    beforeEach ->
      model.input()

    it 'creates a text editor', ->
      ed = model.items[0].view
      expect(ed.tagName.toLowerCase()).toBe 'atom-text-editor'

    it 'updates the model', ->
      expect(model.items.length).toBe 1
      expect(model.items[0].type).toBe 'input'

    it 'recognises an active input cell', ->
      expect(model.getInput()).toBeTruthy()

    viewSyncTest()
    clearTest()

  describe 'when a result is displayed', ->

    describe 'when there is a single result', ->

      beforeEach ->
        @result = document.createElement 'div'
        model.result @result

      it 'updates the model', ->
        expect(model.items.length).toBe 1
        expect(model.items[0].type).toBe 'result'
        expect(model.items[0].view.contains @result).toBe true

      viewSyncTest()

    describe 'when there are multiple results', ->

      beforeEach ->
        for i in [1..10]
          result = document.createElement 'div'
          result.innerText = "#{i}"
          model.result result

      it 'creates an item for each result', ->
        expect(model.items.length).toBe 10

      it 'stacks the results vertically', ->
        for i in [1..10]
          expect(model.items[i-1].view.innerText.trim()).toBe "#{i}"

      viewSyncTest()
      clearTest()

    describe 'when there is an active input', ->

      beforeEach ->
        model.input()
        @result1 = document.createElement 'div'
        @result2 = document.createElement 'div'
        model.result @result1
        model.result @result2

      it 'creates an item for each result', ->
        expect(model.items.length).toBe 3

      it 'inserts the results before the input', ->
        expect(model.items.map (item) -> item.type).toEqual ['result', 'result', 'input']

      it 'inserts the results in the right order', ->
        expect(model.items[0].view.contains @result1).toBe true
        expect(model.items[1].view.contains @result2).toBe true

      it 'preveserves the active input state', ->
        expect(model.getInput()).toBe model.items[2]

      viewSyncTest()

  describe 'when output is created', ->
    describe 'when outputs are seperated', ->
      beforeEach ->
        for i in [1..10]
          do (i) ->
            waits 100
            runs ->
              model.stdout "#{i}\n"

      it 'contains a cell for each piece of output', ->
        expect(model.items.length).toBe 10

      it 'outputs the data in order', ->
        for i in [1..10]
          expect(model.items[i-1].view.innerText.trim()).toBe "#{i}"

      viewSyncTest()

    describe 'when outputs are nearby', ->
      beforeEach ->
        for i in [1..10]
          do (i) ->
            waits 10
            runs ->
              model.stdout "#{i}\n"
        waits 10

      it 'creates a single cell for all of the data', ->
        expect(model.items.length).toBe 1

      it 'concatenates the data in the cell', ->
        expect(model.items[0].view.innerText.trim()).toBe [1..10].join '\n'

      viewSyncTest()

  describe 'evaluation', ->

    beforeEach ->
      @evalSpy = jasmine.createSpy 'eval'
      model.onEval @evalSpy
      model.input()

    it 'recognises the input state', ->
      expect(model.getInput()).toBeTruthy()

    it 'focuses the input', ->
      expect(document.activeElement).toBe model.items[0].view

    it 'emits eval events', ->
      expect(@evalSpy).not.toHaveBeenCalled()
      atom.commands.dispatch(model.getInput().view, 'console:evaluate')
      expect(@evalSpy).toHaveBeenCalled()

    it 'defocuses the input on done', ->
      model.done()
      expect(document.activeElement).toBe view

    it 'recognises the input state after done', ->
      model.done()
      expect(model.items.map (item) -> item.type).toEqual ['input']
      expect(model.getInput()).toBeFalsy()

    it 'puts results after the input', ->
      model.done()
      model.result document.createElement 'div'
      expect(model.items.map (item) -> item.type).toEqual ['input', 'result']
