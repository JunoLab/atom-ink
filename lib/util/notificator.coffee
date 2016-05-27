{$$} = require 'atom-space-pen-views'
{Emitter, CompositeDisposable} = require 'atom'

module.exports =
  stack: []

  create: () ->
    @emitter = new Emitter
    @tile = @statusBar.addLeftTile
      item: @constructNotificator()
      priority: -2
    this

  notify: ({text, type}) ->
    if text is '' then empty = true
    body = document.createElement 'li'
    body.classList.add type
    body.innerText = text
    @push(
      dom: body
      type: type
      empty: empty)

  # Pushes a notification onto the stack.
  push: (notif) ->
    @stack.push notif unless notif.empty
    @emitter.emit 'push', notif

  # Removes the oldest notifiation.
  pop: () ->
    @stack.pop()
    @emitter.emit 'pop'

  onDidPush: (f) -> @emitter.on 'push', f
  onDidPop: (f) -> @emitter.on 'pop', f

  flash: (type) ->
    @notifView.classList.remove 'flashing', 'msg', 'error'
    # retrigger animation:
    @notifView.offsetWidth = @notifView.offsetWidth
    @notifView.classList.add 'flashing', type

  updateTooltip: () ->
    @tt?.dispose()
    @tt = atom.tooltips.add @notifView,
      placement: 'top'
      title: @stackView.outerHTML

  constructNotificator: () ->
    @stackView = document.createElement 'ol'
    @stackView.classList.add 'stackview'
    @notifView = document.createElement 'span'
    @notifView.classList.add 'ink-notificator', 'inline-block'
    @notifView.innerText = 'Notif'

    @onDidPush (notif) =>
      @stackView.appendChild(notif.dom) unless notif.empty
      @updateTooltip()
      @flash notif.type
    @onDidPop () =>
      @stackView.removeChild @stackView.firstChild
      @updateTooltip()
    @notifView

  destroy: () ->
    @tile?.destroy()

  consumeStatusBar: (@statusBar) ->
