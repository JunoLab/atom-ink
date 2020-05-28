import {Emitter} from 'atom'

export default class Loading

  status: 0

  constructor: ->
    @emitter = new Emitter

  onWorking: (f) -> @emitter.on 'working', f
  onDone: (f) -> @emitter.on 'done', f
  isWorking: -> @status > 0

  onceDone: (f) ->
    return f() unless @isWorking()
    sub = @onDone -> (sub.dispose(); f())

  working: ->
    @status++
    if @status is 1
      @emitter.emit 'working'

  done: ->
    if @isWorking()
      @status--
      if not @isWorking()
        @emitter.emit 'done'

  monitor: (p) ->
    @working()
    done = => @done()
    p.then done, done
    p

  reset: ->
    if @isWorking()
      @status = 0
      @emitter.emit 'done'
