'use babel'
import {focusEditorPane} from './pane-item'
import {existsSync} from 'fs'
import {normalize} from 'path'
import {Emitter, TextEditor} from 'atom'

let remoteFileOpener = undefined
let allowremote = false
let emitter

export function activate () {
  emitter = new Emitter()
}

export function deactivate () {
  emitter.dispose()
}

class EditorLocation {
  constructor (file, line, opts) {
    this.file = file
    this.line = line
    this.opts = opts
  }

  open () {
    open(this.file, this.line, this.opts)
  }
}

export function open (pathOrId, line, {pending = false, existingOnly = true, remote = false} = {}) {
  let id = getUntitledId(pathOrId)

  let oldLocation = undefined
  const activeItem = atom.workspace.getActivePaneItem()
  if (activeItem instanceof TextEditor) {
    let path = activeItem.getPath() || 'untitled-' + activeItem.buffer.getId()
    let line = activeItem.getCursorBufferPosition().row
    oldLocation = new EditorLocation(path, line, {pending, existingOnly, remote})
  }

  if (id) {
    focusEditorPane()
    return openEditorById(id, line).then((ed) => {
      let edloc = new EditorLocation(pathOrId, line, {pending, existingOnly, remote})
      emitter.emit('didOpen', {
        oldLocation: oldLocation,
        newLocation: edloc
      })
    })
  } else if (allowremote && remoteFileOpener) {
    focusEditorPane()
    return new Promise((resolve, reject) => {
      let disposable = atom.workspace.observeActiveTextEditor(ed => {
        if (editorMatchesFile(ed, pathOrId)) {
          let edloc = new EditorLocation(pathOrId, line, {pending, existingOnly, remote})
          emitter.emit('didOpen', {
            oldLocation: oldLocation,
            newLocation: edloc
          })
          ed.setCursorBufferPosition([line, 0])
          if (disposable) disposable.dispose()
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
    return atom.workspace.open(pathOrId, {initialLine: line, searchAllPanes: true, pending}).then((ed) => {
      let edloc = new EditorLocation(pathOrId, line, {pending, existingOnly, remote})
      emitter.emit('didOpen', {
        oldLocation: oldLocation,
        newLocation: edloc
      })
    })
  } else {
    return Promise.resolve(false)
  }
}

export function onDidOpen(f) {
  emitter.on('didOpen', f)
}

export function editorMatchesFile (ed, pathOrId) {
  if (!ed || !pathOrId) {
    return false
  }
  let id = getUntitledId(pathOrId)
  let ep = ed.getPath()
  if (id) {
    return ed.getBuffer().id == id
  } else if (allowremote && remoteFileOpener) {
    if (ep) {
      ep = ep.replace(/\\/g, '/')
      let path = normalize(pathOrId)
      path = path.replace(/\\/g, '/')
      if (ep.indexOf(path) > -1) {
        return true
      }
    }
  } else {
    if (ep) {
      return ep == pathOrId
    }
  }
  return false
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
