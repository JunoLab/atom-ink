'use babel'
import {focusEditorPane} from './pane-item'
import {existsSync} from 'fs'

export function open (pathOrId, line, {pending = false, existingOnly = true} = {}) {
  focusEditorPane()
  let id = getUntitledId(pathOrId)
  return id ? openEditorById(id, line) :
    (!existingOnly || existsSync(pathOrId)) ?
      atom.workspace.open(pathOrId, {initialLine: line, searchAllPanes: true, pending}) : Promise.resolve(false)
}

export function isUntitled(pathOrId) {
  return !!getUntitledId(pathOrId)
}

export function getUntitledId (file) {
  const id = file.match(/untitled-([\d\w]+)$/)
  return id != null ? id[1] : false
}

function openEditorById (id, line) {
  return new Promise((resolve) => {
    for (const pane of atom.workspace.getPanes()) {
      // handle docks properly:
      let items
      if (pane.getItems == null) {
        if (pane.getPaneItems == null) {
          continue
        } else {
          items = pane.getPaneItems()
        }
      } else {
        items = pane.getItems()
      }
      for (const item of items) {
        if (item.constructor.name === "TextEditor" && item.getBuffer().id === id) {
          pane.setActiveItem(item)
          item.setCursorBufferPosition([line, 0])
          item.scrollToCursorPosition()
          resolve(item)
        }
      }
    }
    resolve(false)
  })
}
