'use babel'
import {focusEditorPane} from './pane-item'
import {existsSync} from 'fs'

let remoteFileOpener = undefined

export function open (pathOrId, line, {pending = false, existingOnly = true, remote = false} = {}) {
  focusEditorPane()
  let id = getUntitledId(pathOrId)

  if (id) {
    return openEditorById(id, line)
  } else if (!existingOnly || existsSync(pathOrId)) {
    return atom.workspace.open(pathOrId, {initialLine: line, searchAllPanes: true, pending})
  } else if (remoteFileOpener) {
    return new Promise((resolve, reject) => {
      resolve(remoteFileOpener(pathOrId))
    })
  } else {
    return Promise.resolve(false)
  }
}

export function isUntitled(pathOrId) {
  return !!getUntitledId(pathOrId)
}

export function getUntitledId (file) {
  const id = file.match(/untitled-([\d\w]+)$/)
  return id != null ? id[1] : false
}

export function consumeRemoteFileOpener (o) {
  remoteFileOpener = o
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
