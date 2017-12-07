'use babel'

export function closest(element, selector) {
  console.log(element);
  return element == null || element.matches(selector) ? element :
    closest(element.parentElement, selector)
}
