{$, $$} = require 'atom-space-pen-views'

module.exports =
  treeView: (head, children) ->
    view = $$ ->
      @div class: 'ink tree', =>
        @span class: 'icon icon-chevron-right'
        @div class: 'header gutted'
        @div class: 'body gutted'
    view.find('> .header').append head
    view.find('> .body').append child for child in children

    view.find('> .body').hide()
    view.find('> .icon').click => @toggle view
    view.find('> .header').click => @toggle view

    view

  fromJson: (data) ->
    if data.constructor == Array && data.length == 2
      [head, children] = data
      @treeView head, (@fromJson child for child in children)
    else
      view = $$ -> @div()
      view.append data
      view

  toggle: (view) ->
    view.find('> .body').toggle()
    icon = view.find('> .icon')
    if not view.visible
      view.visible = true
      icon.removeClass 'icon-chevron-right'
      icon.addClass 'icon-chevron-down'
      # unfolded results always have z-index of 5 or more so they are on top of
      # folded results:
      view[0].parentElement.parentElement?.style.zIndex = 5
    else
      view.visible = false
      icon.removeClass 'icon-chevron-down'
      icon.addClass 'icon-chevron-right'
      view[0].parentElement.parentElement?.style.zIndex = ''
