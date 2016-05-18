views = require './util/views'

{div, span} = views.tags

module.exports =
  treeView: (head, children, {expand}) ->
    view = views.render div 'ink tree', [
      span 'icon icon-chevron-down'
      div 'header gutted', head
      div 'body gutted', children
    ]
    view.querySelector(':scope > .header').onclick = => @toggle view
    view.querySelector(':scope > .icon').onclick = => @toggle view
    @toggle view unless expand
    view

  toggle: (view) ->
    body = view.querySelector ':scope > .body'
    icon = view.querySelector ':scope > .icon'
    return unless body?
    if body.style.display == ''
      body.style.display = 'none'
      icon.classList.remove 'icon-chevron-down'
      icon.classList.add 'icon-chevron-right'
    else
      body.style.display = ''
      icon.classList.remove 'icon-chevron-right'
      icon.classList.add 'icon-chevron-down'
