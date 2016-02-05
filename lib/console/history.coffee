module.exports =
class HistoryProvider

  constructor: (items) ->
    @set items

  set: (@items) ->
    @items ?= []
    @position = @items.length

  push: (x) ->
    @lastPosition = @position
    @items.push x
    @position = @items.length
    @removeCycles()

  getCurrent: -> @items[@position] or input: ""

  isAtEnd: ->
    @position is @items.length

  matchesPrefix: ({input}, pre) ->
    not pre? or input.startsWith pre

  getPrevious: (prefix) ->
    delete @lastPosition
    if @position >= 0
      @position--
    while @position >= 0 and not @matchesPrefix(@getCurrent(), prefix)
      @position--
    @getCurrent()

  getNext: (prefix) ->
    if @lastPosition?
      @position = @lastPosition
      delete @lastPosition
    if not @isAtEnd()
      @position++
    while not @isAtEnd() and not @matchesPrefix(@getCurrent(), prefix)
      @position++
    @getCurrent()

  isEquiv: (a, b) ->
    a.mode is b.mode and a.input is b.input

  removeCycles: ->
    return if @items.length < 2
    for n in [1..Math.min(@items.length/2, 100)]
      for i in [1..n]
        if @isEquiv @items[@items.length-i], @items[@items.length-(i+n)]
          if i is n # History items up to length n are duplicates
            @set @items.slice(0, @items.length - n)
            return
        else
          break
    return
