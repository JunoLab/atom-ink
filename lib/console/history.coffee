module.exports =
class HistoryProvider

  constructor: (items) ->
    @set items

  set: (@items) ->
    @items ?= []
    @position = @items.length

  push: (x) ->
    if not @isEquiv(x, @items[@items.length-1])
      @items.push x
      @position = @items.length

  getPrevious: ->
    if @position > 0
      @position--
      @items[@position]

  getNext: ->
    if not @isAtEnd()
      @position++
    @items[@position] or input: ""

  isAtEnd: ->
    @position is @items.length

  isEquiv: (a, b) ->
    a.mode is b.mode and a.input is b.input
