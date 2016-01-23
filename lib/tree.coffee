{$, $$} = require 'atom-space-pen-views'

module.exports =
  treeView: (head, children, {expand}) ->
    view = $$ ->
      @div class: 'ink tree', =>
        @span class: 'icon icon-chevron-right'
        @div class: 'header gutted'
        @div class: 'body gutted'
    view.find('> .header').append head
    view.find('> .body').append child for child in children

    view.find('> .body').hide() unless expand
    view.find('> .icon').click => @toggle view
    view.find('> .header').click => @toggle view

    view[0]

  toggle: (view) ->
    view = $(view)
    body = view.find('> .body')
    icon = view.find('> .icon')
    return unless body[0]?
    body.toggle()
    if body.isVisible()
      view.visible = true
      icon.removeClass 'icon-chevron-right'
      icon.addClass 'icon-chevron-down'
    else
      view.visible = false
      icon.removeClass 'icon-chevron-down'
      icon.addClass 'icon-chevron-right'
