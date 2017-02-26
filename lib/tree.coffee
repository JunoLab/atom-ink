views = require './util/views'

{div, span} = views.tags

module.exports =
  treeView: (head, children, {expand, onToggle}={}) ->
    view = views.render div 'ink tree', [
      span 'icon icon-chevron-right open'
      div 'header gutted', head
      div 'body gutted', children
    ]
    for sel in [':scope > .header', ':scope > .icon']
      view.querySelector(sel).onclick = =>
        onToggle?()
        setTimeout (=> @toggle view), 0
    view.onToggle = onToggle
    @toggle view unless expand
    view

  toggle: (view) ->
    head = view.querySelector ':scope > .header'
    body = view.querySelector ':scope > .body'
    icon = view.querySelector ':scope > .icon'
    return unless body?
    if body.style.display == ''
      body.style.display = 'none'
      head.classList.add 'closed'
      icon.classList.remove 'open'
    else
      body.style.display = ''
      head.classList.remove 'closed'
      icon.classList.add 'open'
