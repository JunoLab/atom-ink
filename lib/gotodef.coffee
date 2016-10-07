{$$, SelectListView} = require 'atom-space-pen-views'
fuzzaldrinPlus = require 'fuzzaldrin-plus'

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
    matches = fuzzaldrinPlus.match(text, filterQuery)

    $$ ->
      highlighter = (command, matches, offsetIndex) =>
        lastIndex = 0
        matchedChars = [] # Build up a set of matched chars to be more semantic

        for matchIndex in matches
          matchIndex -= offsetIndex
          continue if matchIndex < 0 # If marking up the basename, omit command matches
          unmatched = command.substring(lastIndex, matchIndex)
          if unmatched
            @span matchedChars.join(''), class: 'character-match' if matchedChars.length
            matchedChars = []
            @text unmatched
          matchedChars.push(command[matchIndex])
          lastIndex = matchIndex + 1

        @span matchedChars.join(''), class: 'character-match' if matchedChars.length

        # Remaining characters are plain text
        @text command.substring(lastIndex)

      @li class: 'two-lines', =>
        @div class: 'primary-line', -> highlighter(text, matches, 0)
        @div secondary, class: 'secondary-line'

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
    atom.workspace.open item.file,
      initialLine: item.line
