closest = (element, selector) ->
  return unless element?
  return element if element.matches(selector)
  closest(element.parentElement, selector)

module.exports = {closest}
