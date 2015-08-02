{Emitter} = require 'atom'

module.exports =
class Loading
  emitter: new Emitter
  onWorking: (f) -> @emitter.on 'working', f
  onDone: (f) -> @emitter.on 'done', f

  lastStatus: 0
  status: 0

  working: -> @status++; @update()
  done: -> if @status > 0 then @status--; @update()
  reset: -> @status = 0; @update()

  isWorking: -> @status > 0

  update: ->
    if @status != @lastStatus
      if @isWorking()
        @emitter.emit 'working', @status
      else
        @emitter.emit 'done', @status
    @lastStatus = @status
