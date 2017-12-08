'use babel'

export function closest(element, selector) {
  return element == null || element.matches(selector) ? element :
    closest(element.parentElement, selector)
}
