module.exports =
class HistoryProvider

  constructor: (items) ->
    @set items

  set: (@items) ->
    @items ?= []
    @position = @items.length

  push: (x) ->
    @items.push x
    @position = @items.length
    @removeCycles()

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

  removeCycles: ->
    for n in [1..Math.min(@items.length/2, 100)]
      for i in [1..n]
        if @isEquiv @items[@items.length-i], @items[@items.length-(i+n)]
          if i is n # History items up to length n are duplicates
            @set @items.slice(0, @items.length - n)
            return
        else
          break
    return
