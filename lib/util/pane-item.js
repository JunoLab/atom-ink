'use babel'

import { CompositeDisposable, TextEditor } from 'atom'

let subs = new CompositeDisposable
let panes = new Set

function ensurePaneVisible(pane) {
  if (!(pane && pane.getFlexScale)) return
  if (pane.getFlexScale() < 0.1) {
    pane.parent.adjustFlexScale()
    pane.setFlexScale(1)
  }
  ensurePaneVisible(pane.parent)
}

export default class PaneItem {

  static activate() {
    if (subs != null) return
    subs = new CompositeDisposable
    panes.forEach(Pane => Pane.registerView())
  }

  static deactivate() {
    if (subs != null) subs.dispose()
    subs = null
  }

  static attachView(View) {
    this.View = View
    this.registerView()
  }

  static registerView() {
    panes.add(this)

    subs.add(atom.views.addViewProvider(this, pane => {
      if (pane.element != null) {
        return pane.element
      } else {
        return new this.View().initialize(pane)
      }
    }))

    subs.add(atom.deserializers.add({
      name: `Ink${this.name}`,
      deserialize: (state) => {
        let pane = this.fromId(state.id)
        if (state.persistentState) pane.persistentState = state.persistentState
        if (pane.currentPane()) return
        return pane
      }
    }))

    subs.add(atom.workspace.onDidOpen(({uri, item}) => {
      if (uri && uri.match(new RegExp(`atom://ink-${this.name.toLowerCase()}/(.+)`))) {
        if (item.onAttached) item.onAttached()
      }
    }))

    subs.add(atom.workspace.addOpener(uri => {
      let m
      if (m = uri.match(new RegExp(`atom://ink-${this.name.toLowerCase()}/(.+)`))) {
        let [_, id] = m
        return this.fromId(id)
      }
    }))
  }

  getURI() {
    return `atom://ink-${this.constructor.name.toLowerCase()}/${this.id}`
  }

  static fromId(id, ...args) {
    let pane
    if (this.registered == null) { this.registered = {} }
    if (pane = this.registered[id]) {
      return pane
    } else {
      pane = this.registered[id] = new this(...args)
      pane.id = id
      return pane
    }
  }

  serialize() {
    if (this.id) {
      return {
        deserializer: `Ink${this.constructor.name}`,
        id: this.id,
        persistentState: this.persistentState
      }
    }
  }

  currentPane() {
    for (let pane of atom.workspace.getPanes()) {
      if (pane.getItems().includes(this)) return pane
    }
  }

  activate() {
    let pane
    if (pane = this.currentPane()) {
      pane.activate()
      pane.setActiveItem(this)
      ensurePaneVisible(pane)
      return true
    }
  }

  open(opts) {
    if (this.activate()) { return Promise.resolve(this) }
    if (this.id) {
      return atom.workspace.open(`atom://ink-${this.constructor.name.toLowerCase()}/${this.id}`, opts)
    } else {
      throw new Error('Pane does not have an ID')
    }
  }

  close() {
    if (this.currentPane()) this.currentPane().removeItem(this)
  }

  static focusEditorPane() {
    let cur = atom.workspace.getActivePaneItem()
    if (cur instanceof TextEditor) return
    for (pane of atom.workspace.getPanes()) {
      if (pane.getActiveItem() instanceof TextEditor) {
        pane.focus()
        break
      }
    }
  }

}
