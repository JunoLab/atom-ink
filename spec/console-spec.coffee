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
      view.style.width = '800px'
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
        [1..10].forEach (i) ->
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
        [1..10].forEach (i) ->
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

  describe 'input modes', ->
    beforeEach ->
      waitsForPromise ->
        atom.packages.activatePackage 'language-python'
      waitsForPromise ->
        atom.packages.activatePackage 'language-shellscript'
      runs ->
        @modes = [
          {name: 'python', default: true, grammar: 'source.python'}
          {name: 'shell', prefix: ';', grammar: 'source.shell'}
        ]
        model.setModes @modes
        model.input()
        {@editor} = model.getInput()

    it 'sets inputs to the default mode', ->
      {mode} = model.getInput()
      expect(mode.name).toBe 'python'

    it 'sets inputs to the default mode grammar', ->
      {editor, mode} = model.getInput()
      expect(editor.getGrammar().scopeName).toBe 'source.python'

    expectMode = (mode, preserve = true) ->

      it 'updates the model', ->
        expect(model.getInput().mode).toBe @modes[mode]

      if preserve
        it 'preserves the input text', ->
          expect(@editor.getText()).toBe @text
      else
        it "updates the input text", ->
          expect(@editor.getText()).not.toBe @text

      it 'updates the grammar', ->
        waits 10
        runs ->
          expect(@editor.getGrammar().scopeName).toBe @modes[mode].grammar

    describe 'when entering a mode prefix', ->

      beforeEach ->
        @text = 'foo bar baz'
        @editor.setText @text
        @editor.setCursorBufferPosition [0, 0]
        @editor.insertText ';'

      expectMode 1

      describe 'when removing the prefix', ->

        beforeEach ->
          {view} = model.getInput()
          atom.commands.dispatch view, 'core:backspace'

        expectMode 0

      describe 'when backspacing', ->
        beforeEach ->
          {editor, view} = model.getInput()
          editor.setCursorBufferPosition [0, 1]
          atom.commands.dispatch view, 'core:backspace'

        expectMode 1, false

  describe 'history', ->
    goUp = -> atom.commands.dispatch model.getInput().view, 'core:move-up'
    goDown = -> atom.commands.dispatch model.getInput().view, 'core:move-down'
    enter = -> (model.logInput(); model.done(); model.input())

    beforeEach ->
      @history = ['using Gadfly', '2+2', 'foo\nbar', 'rand(5)']
      model.input()
      for s in @history
        model.getInput().editor.setText s
        enter()
      {@editor} = model.getInput()

    it 'records the right number of inputs', ->
      expect(model.history.items.length).toBe @history.length

    it 'allows moving up through history', ->
      for s in @history.reverse()
        goUp()
        expect(@editor.getText()).toBe s

    it 'allows moving down through history', ->
      goUp() for i in [1..@history.length+1]
      expect(@editor.getText()).toBe ''
      for s in @history
        goDown()
        expect(@editor.getText()).toBe s

    it 'jumps straight to prefixed inputs', ->
      @editor.insertText 'us'
      goUp()
      expect(@editor.getText()).toBe 'using Gadfly'

    describe 'after using an old input', ->
      beforeEach ->
        @editor.insertText 'us'
        goUp()
        enter()
        {@editor} = model.getInput()

      it 'resets the input', ->
        expect(@editor.getText()).toBe ''

      it 'goes down to the next in history', ->
        goDown()
        expect(@editor.getText()).toBe '2+2'

      it 'goes up to the last input', ->
        goUp()
        expect(@editor.getText()).toBe 'using Gadfly'

    it "doesn't record repeated input", ->
      @editor.setText 'rand(5)'
      enter()
      goUp()
      expect(model.getInput().editor.getText()).toBe 'rand(5)'
      goUp()
      expect(model.getInput().editor.getText()).toBe 'foo\nbar'

    it 'eliminates longer input cycles', ->
      for s in @history
        model.getInput().editor.setText s
        enter()
      expect(model.history.items.length).toBe 4
