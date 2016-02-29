{$$, SelectListView} = require 'atom-space-pen-views'
fuzzaldrinPlus = require 'fuzzaldrin-plus'

# ## GoToDef-Panel
#
# `goto` takes a promise as its argument, which can either be fulfilled or rejected.
# Both modes will be handled by `goto` as follows:
# On fulfillment, a `GotoView` will be shown and populated by the array `items`
# returned by the promise if there's more than one item in it. Otherwise, Atom
# jumps straight to the definition.
#   `items` conatins objects with the fields:
#     .text:      Displayed text, searchable.
#     .file:      File in which this method is defined, not displayed.
#     .line:      Line of definition.
#     .dispfile:  Humanized file path, displayed.
#
# If the Promise errors, it should contain an object with the field error, which
# will subsequently be displayed in a modal panel.

module.exports =
goto: (promise) ->
  @view ?= new GotoView()

  promise
    .then (items) =>
      if items.error?
        @view.setError items.error
        @view.show()
      if items.length == 1
        GotoView.openItem items[0]
      else if items.length > 1
        @view.setItems items
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
  viewForItem: ({text, dispfile, line}) ->
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
        @div dispfile + ":" + line, class: 'secondary-line'

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
    @openItem item
    @hide()

  # Return to previously focused element when the modal panel is cancelled.
  cancelled: ->
    @hide()

  @openItem: (item) ->
    atom.workspace.open item.file,
      initialLine: item.line
