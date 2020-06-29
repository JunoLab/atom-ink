

import AnsiUp from 'ansi_up'
let converter = new AnsiUp()
converter.escape_for_html = false

// this wraps all plain text nodes in a span, which makes sure they can be picked
// up by querySelectorAll later
function wrapTextNodes (view) {
  if (view.hasChildNodes()) {
    let nodes = view.childNodes
    for (let i = 0; i < nodes.length; i++) {
      let node = nodes[i]
      if (node.nodeType == 3) { // text nodes
        let span = document.createElement('span')
        span.innerText = node.textContent
        node.parentElement.insertBefore(span, node)
        node.parentElement.removeChild(node)
      } else if (node.nodeType == 1) { // normal HTML nodes
        wrapTextNodes(node)
      }
    }
  }
}

export default function ansiToHTML (view) {
  if (typeof view === 'string' || view instanceof String) {
    return converter.ansi_to_html(view)
  } else {
    wrapTextNodes(view)

    if (view.childElementCount == 0) {
      view.innerHTML = converter.ansi_to_html(view.innerText)
    } else if (view.querySelectorAll) {
      let allElements = view.querySelectorAll('*')
      for (let i = 0; i < allElements.length; i++) {
        if (allElements[i].childElementCount == 0) {
          allElements[i].innerHTML = converter.ansi_to_html(allElements[i].innerHTML)
        }
      }
    }

    // reset color stream
    converter.ansi_to_html('\x1b[0m')

    return view
  }
}
