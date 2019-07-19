{$$, SelectListView} = require 'atom-space-pen-views'
{open} = require './opener'
{highlightMatches} = require './matchHighlighter'

# ## GoToDef-Panel
#
# `goto` either takes a `symbolTable` as its argument, or a Promise which returns a
# `symbolTable`.
#
# A `symbolTable` is specified by having the following fields:
#
#   - `symbolTable.error`: Boolean. If true, the contents of `result.items` will
#   be shown as an error.
#
#   - `symbolTable.items` -  Array that contains objects with the fields
#     - `.text` -       Displayed text, searchable.
#     - `.file` -       File in which this method is defined, not displayed.
#     - `.line` -       Line of definition.
#     - `.secondary` -  Secondary information, displayed below `text` (e.g. file).
#
#   or a plain text string if `symbolTable.error` is true.


module.exports =
goto: (symbolTableOrPromise) ->
  @view ?= new GotoView()

  # this allows either a promise or a symbolTable as the input
  promise = Promise.resolve symbolTableOrPromise

  promise.then (symbolTable) =>
    if symbolTable.error
      @view.setError symbolTable.items
      @view.show()
    else if symbolTable.items.length == 1
      GotoView.openItem symbolTable.items[0]
    else if symbolTable.items.length > 1
      @view.setItems symbolTable.items
      @view.show()

class GotoView extends SelectListView
  initialize: ->
    super
    @panel = atom.workspace.addModalPanel(item: this, visible: false)
    @addClass('command-palette')
    @addClass('gotodef-panel')

  destroy: ->
    @cancel()
    @panel.destroy()

  # Create the view for one item.
  viewForItem: ({text, secondary, line}) ->
    # the highlighting is taken verbatim from https://github.com/atom/command-palette
    filterQuery = @getFilterQuery()

    li = document.createElement('li')
    li.classList.add('two-lines')

    l1 = document.createElement('div')
    l1.classList.add('primary-line')
    l1.appendChild(highlightMatches(text, filterQuery, 0))

    l2 = document.createElement('div')
    l2.classList.add('secondary-line')
    l2.innerText = secondary

    li.appendChild(l1)
    li.appendChild(l2)

    return li

  # Only `item.text` is searchable.
  getFilterKey: -> 'text'

  # Show the goto-panel and store the previously focused element.
  show: () ->
    @storeFocusedElement()
    @panel.show()
    @focusFilterEditor()

  hide: () ->
    @panel?.hide()

  # Jump to `item.file` at line `item.line`, when an item was selected.
  confirmed: (item) ->
    GotoView.openItem item
    @hide()

  # Return to previously focused element when the modal panel is cancelled.
  cancelled: ->
    @hide()

  @openItem: (item) ->
    open(item.file, item.line, {
      pending: true
    })
