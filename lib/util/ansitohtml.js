'use babel'

import AnsiUp from 'ansi_up'
let converter = new AnsiUp()
converter.escape_for_html = false

export default function ansiToHTML (view) {
  if (view.childElementCount == 0) {
    view.innerHTML = converter.ansi_to_html(view.innerHTML)
  } else if (view.querySelectorAll) {
    let allNodes = view.querySelectorAll  ('*')
    for (let i = -1, l = allNodes.length; ++i < l;) {
      if (allNodes[i].childElementCount == 0) {
        allNodes[i].innerHTML = converter.ansi_to_html(allNodes[i].innerHTML)
      }
    }
  }
  return view
}
