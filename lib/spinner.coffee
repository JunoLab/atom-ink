fs = require 'fs'
path = require 'path'

module.exports =
class Spinner

  constructor: (@loading) ->
    @loading?.onWorking => @on()
    @loading?.onDone => @off()

  dispose: ->
    @edSubscription?.dispose()

  ui: ->
    ui = document.createElement 'div'
    ui.classList.add 'julia-client'
    ui.classList.add 'loading'
    ui.innerHTML = """<div class="sk-folding-cube">
                        <div class="sk-cube1 sk-cube"></div>
                        <div class="sk-cube2 sk-cube"></div>
                        <div class="sk-cube4 sk-cube"></div>
                        <div class="sk-cube3 sk-cube"></div>
                      </div>
                  """
    ui.appendChild @style()
    ui

  uis: []

  insert: (ed) ->
    ui = @ui()
    @uis.push(ui)
    atom.views.getView(ed).rootElement.appendChild ui

  on: () ->
    if not @css? then return @loadCSS => @on()

    return if @edSubscription?
    @edSubscription = atom.workspace.observeTextEditors (ed) =>
      # TODO: make this non-julia-specific
      return unless ed.getGrammar().scopeName == 'source.julia'
      @insert ed

  off: ->
    for ui in @uis
      ui.parentElement?.removeChild(ui)
    @uis = []
    @edSubscription?.dispose()
    @edSubscription = null

  loadCSS: (cb) ->
    file = path.resolve __dirname, '..', 'styles', 'spinner.css'
    fs.readFile file, (err, data) =>
      @css = data.toString()
      cb?()

  style: () ->
    style = document.createElement 'style'
    style.innerText = @css
    style
