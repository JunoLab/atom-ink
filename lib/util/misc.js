'use babel'

export function loadCSS (url) {
  let link = document.createElement('style')
  link.setAttribute('source-path', url)
  link.setAttribute('priority', 0)
  let headScript = document.querySelector('atom-styles')
  headScript.appendChild(link)
}

export function htmlDecode(input){
  let doc = new DOMParser().parseFromString(input, "text/html")
  return doc.documentElement.textContent
}

export function htmlDecodeUnsafe(input){
  var e = document.createElement('div')
  e.innerHTML = input
  // handle case of empty input
  console.log(e)
  return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue
}
