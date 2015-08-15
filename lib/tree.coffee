{$, $$} = require 'atom-space-pen-views'

module.exports =
  treeView: (head, children) ->
    view = $$ ->
      @div class: 'ink tree', =>
        @span class: 'icon icon-chevron-right'
        @div class: 'header'
        @div class: 'body'
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
      $$ -> @div data

  toggle: (view) ->
    view.find('> .body').toggle()
    icon = view.find('> .icon')
    if not view.visible
      view.visible = true
      icon.removeClass 'icon-chevron-right'
      icon.addClass 'icon-chevron-down'
    else
      view.visible = false
      icon.removeClass 'icon-chevron-down'
      icon.addClass 'icon-chevron-right'
