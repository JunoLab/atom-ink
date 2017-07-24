'use babel'

import { readFile, realpath } from 'fs'
import { renderToString } from 'katex'

// TODO: Figure out font loading errors.

// Asynchronously load the resource specified by `url` into Atom.
export function loadResource (url) {
  realpath(url, (err, url) => {
    if (err) return
    readFile(url, (err, css) => {
      if (err) return
      let style = document.createElement('style')
      style.setAttribute('source-path', url)
      style.setAttribute('priority', 0)
      style.innerText = css
      let headScript = document.querySelector('atom-styles')
      headScript.appendChild(style)
    })
  })
}

function htmlDecode (input) {
  let txt = document.createElement("textarea")
  txt.innerHTML = input
  return txt.value
}

export function texify (input) {
  htmlDecoded = htmlDecode(input)
  if (!htmlDecoded) return input
  // This is pretty ... bad. Should properly handle HTML tags etc...
  return htmlDecoded.replace(/(\$.*?\$|``.*?``)/g, (substr) => {
    substr = substr.substring(1, substr.length-1)
    let r = renderToString(substr, {throwOnError: false})
    return r
  })
}
