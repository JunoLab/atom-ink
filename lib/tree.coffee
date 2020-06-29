import views from './util/views'

{div, span} = views.tags

export default tree =
  treeView: (head, children, {expand, onToggle}={}) ->
    view = views.render div 'ink tree', [
      span 'icon icon-chevron-right open'
      div 'header gutted', head
      div 'body gutted', children
    ]
    for sel in [':scope > .header', ':scope > .icon']
      view.querySelector(sel).addEventListener 'click', () =>
        onToggle?()
        window.requestAnimationFrame => @toggle view
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
