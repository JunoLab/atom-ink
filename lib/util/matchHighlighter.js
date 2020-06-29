

import * as fuzzaldrinPlus from 'fuzzaldrin-plus'

export function highlightMatches(text, filterQuery, offsetIndex = 0) {
  let matches = fuzzaldrinPlus.match(text, filterQuery)
  let lastIndex = 0
  let matchedChars = []

  let output = document.createElement('span')

  for (let matchIndex of matches) {
    matchIndex -= offsetIndex
    if (matchIndex < 0) continue
    let unmatched = text.substring(lastIndex, matchIndex)
    if (unmatched) {
      if (matchedChars.length > 0) {
        let s = document.createElement('span')
        s.classList.add('character-match')
        s.innerText = matchedChars.join('')
        output.appendChild(s)
      }
      matchedChars = []
      let t = document.createElement('span')
      t.innerText = unmatched
      output.appendChild(t)
    }
    matchedChars.push(text[matchIndex])
    lastIndex = matchIndex + 1
  }

  if (matchedChars.length > 0) {
    let s = document.createElement('span')
    s.classList.add('character-match')
    s.innerText = matchedChars.join('')
    output.appendChild(s)
  }

  let t = document.createElement('span')
  t.innerText = text.substring(lastIndex)
  output.appendChild(t)

  return output
}
