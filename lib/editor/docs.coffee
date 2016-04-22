{CompositeDisposable} = require 'atom'

module.exports =
class InlineDoc
  constructor: (@editor, range, opts={}) ->
    @disposables = new CompositeDisposable
    InlineDoc.removeRangeRows @editor, range
    @createView opts
    @initMarker range, opts

  remove: ->
    @marker.destroy()
    @disposables.dispose()

  createView: ({content}) ->
    @view = document.createElement 'div'
    @view.classList.add 'ink', 'docs', 'under'
    @view.style.pointerEvents = 'auto'
    @disposables.add atom.commands.add @view,
      'inline-docs:clear': (e) => @remove()
    if content? then @view.appendChild content

  initMarker: (range, {highlight}) ->
    @marker = @editor.markBufferRange range,
      persistent: false,
      invalidate: 'touch'
    @marker.model = this
    @editor.decorateMarker @marker,
      item: @view,
      type: 'block',
      position: 'after'
    if highlight then @editor.decorateMarker @marker,
      type: 'highlight',
      class: 'doc-highlight'
    @disposables.add @marker.onDidChange (e) => @checkMarker e

  checkMarker: (e) ->
    if !e.isValid or @marker.getBufferRange().isEmpty() or e.textChanged
      @remove()

  @removeRangeRows: (ed, range) ->
    @removeLines ed, range.start.row, range.end.row

  @removeLines: (ed, start, end) ->
    ms = ed.findMarkers()
           .filter((x) -> (x.model? &&
                      x.model instanceof InlineDoc &&
                      x.getBufferRange().intersectsRowRange(start, end)))
           .map((x) -> x.model.remove())
    ms.length > 0

  @removeCurrent: (e) ->
    if (ed = atom.workspace.getActiveTextEditor())
      for sel in ed.getSelections()
        if @removeLines(ed, sel.getHeadBufferPosition().row, sel.getTailBufferPosition().row)
          done = true
    e.abortKeyBinding() unless done

  @activate: ->
    @subs = new CompositeDisposable
    @subs.add atom.commands.add 'atom-text-editor:not([mini])',
      'inline-docs:clear-current': (e) => @removeCurrent e

  @deactivate: ->
    @subs.dispose()
