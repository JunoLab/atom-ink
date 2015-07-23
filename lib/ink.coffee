{CompositeDisposable} = require 'atom'
block = require './block'

module.exports = Ink =
  activate: ->

  provide: ->
    highlight: (ed, start, end) =>
      block.highlight ed, start, end
