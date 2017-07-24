'use babel'

import { readFile, realpath } from 'fs'

// Asynchronously load the stylesheet specified by `url` into Atom.
export function loadCSS (url) {
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

export function htmlDecode(input){
  let doc = new DOMParser().parseFromString(input, "text/html")
  return doc.documentElement.textContent
}

export function htmlDecodeUnsafe (input) {
  let txt = document.createElement("textarea")
  txt.innerHTML = input
  return txt.value
}
