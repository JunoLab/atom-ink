{Emitter} = require 'atom'

module.exports =
class Loading

  status: 0

  constructor: ->
    @emitter = new Emitter

  onWorking: (f) -> @emitter.on 'working', f
  onDone: (f) -> @emitter.on 'done', f
  isWorking: -> @status > 0

  working: ->
    @status++
    if @status is 1
      @emitter.emit 'working'

  done: ->
    if @isWorking()
      @status--
      if not @isWorking()
        @emitter.emit 'done'

  reset: ->
    if @isWorking()
      @status = 0
      @emitter.emit 'done'
