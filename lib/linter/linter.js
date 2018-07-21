'use babel'

import LinterPane from './pane'
import CompiledPane from './compiled-pane'
import * as LinterDecorations from './inline'

var lintItems = []
export var lintPane

export {CompiledPane}

export function activate () {
  LinterPane.activate()
  CompiledPane.activate()
  LinterDecorations.activate()

  lintPane = LinterPane.fromId('default')
}

export function setItems (items) {
  lintItems = items
  lintPane.setItems(items)
  LinterDecorations.setItems(items)
}

export function addItem (item) {
  lintItems.push(item)
  lintPane.addItem(item)
  LinterDecorations.addItem(item)
}

export function clearItems (provider) {
  if (!provider) {
    lintItems = []
    lintPane.setItems([])
    LinterDecorations.setItems([])
  } else {
    lintItems = lintItems.filter(i => i.provider == provider)
    lintPane.setItems(lintItems)
    LinterDecorations.setItems(lintItems)
  }
}

export function deactivate () {
  clearItems()
  LinterPane.deactivate()
  CompiledPane.deactivate()
  LinterDecorations.deactivate()
}
