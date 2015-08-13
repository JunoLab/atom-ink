{$, $$} = require 'atom-space-pen-views'

module.exports =
  treeView: (head, children) ->
    view = $$ ->
      @div class: 'ink tree', =>
        @div class: 'header', =>
          @span class: 'icon icon-terminal'
        @div class: 'body', =>
          @div class: 'gutter'
    view.find('> .header').append head
    view.find('> .body').append child for child in children
    view

  fromJson: (data) ->
    console.log data
    if data.constructor == Array && data.length == 2
      [head, children] = data
      @treeView head, (@fromJson child for child in children)
    else
      data

  # view: @fromJson(['Array', [['1', ['foo']], ['2', ['bar']]]])[0]
