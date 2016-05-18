views = require './util/views'

{div, span} = views.tags

module.exports =
  treeView: (head, children, {expand}) ->
    view = views.render div 'ink tree', [
      span 'icon icon-chevron-right open'
      div 'header gutted', head
      div 'body gutted', children
    ]
    for sel in [':scope > .header', ':scope > .icon']
      view.querySelector(sel).onclick = =>
        setTimeout (=> @toggle view), 0
    @toggle view unless expand
    view

  toggle: (view) ->
    body = view.querySelector ':scope > .body'
    icon = view.querySelector ':scope > .icon'
    return unless body?
    if body.style.display == ''
      body.style.display = 'none'
      icon.classList.remove 'open'
    else
      body.style.display = ''
      icon.classList.add 'open'
