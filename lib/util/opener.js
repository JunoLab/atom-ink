'use babel'
import {focusEditorPane} from './pane-item'
import {existsSync} from 'fs'
import {normalize} from 'path'

let remoteFileOpener = undefined
let allowremote = false

export function open (pathOrId, line, {pending = false, existingOnly = true, remote = false} = {}) {
  let id = getUntitledId(pathOrId)

  if (id) {
    focusEditorPane()
    return openEditorById(id, line)
  } else if (allowremote && remoteFileOpener) {
    focusEditorPane()
    return new Promise((resolve, reject) => {
      let disposable = atom.workspace.observeActiveTextEditor(ed => {
        if (ed) {
          let ep = ed.getPath()
          if (ep) {
            ep = ep.replace(/\\/g, '/')
            if (ep.indexOf(normalize(pathOrId)) > -1) {
              ed.setCursorBufferPosition([line, 0])
              if (disposable) disposable.dispose()
            }
          }
        }
      })
      if (remoteFileOpener(pathOrId)) {
        resolve(true)
      } else {
        resolve(false)
        if (disposable) disposable.dispose()
      }
    })
  } else if (!existingOnly || existsSync(pathOrId)) {
    focusEditorPane()
    return atom.workspace.open(pathOrId, {initialLine: line, searchAllPanes: true, pending})
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

export function allowRemoteFiles (val) {
  allowremote = val
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
