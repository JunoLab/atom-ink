{CompositeDisposable} = require 'atom'
block = require './block'
loading = require './loading'

module.exports = Ink =
  activate: ->

  provide: ->
    highlight: (ed, start, end) =>
      block.highlight ed, start, end
    working: ->
      loading.working()
    done: ->
      loading.done()
    reset: ->
      loading.reset()
