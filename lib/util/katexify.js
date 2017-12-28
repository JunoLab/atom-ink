'use babel'

import { renderToString } from 'katex'

export function texify (input, block) {
  try {
    return renderToString(input, {throwOnError: false, displayMode: block})
  } catch (e) {
    return input
  }
}
