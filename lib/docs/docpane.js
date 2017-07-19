'use babel'
/** @jsx etch.dom */

import etch from 'etch'

import { TextEditor, CompositeDisposable } from 'atom'
import PaneItem from '../util/pane-item'
import { toView, Toolbar, Button, Icon, BackgroundMessage } from '../util/etch'

export default class DocPane extends PaneItem {
  constructor () {
    super()

    this.items = []
    this.exportedOnly = false
    this.searchEd = new TextEditor({mini: true, placeholderText: "Search Documentation"})
    this.modEd = new TextEditor({mini: true, placeholderText: "in all modules"})

    this.subs = new CompositeDisposable()
    this.subs.add(atom.commands.add('.docpane .header .editor', {
      'docpane:search': () => {
        this.search(this.searchEd.getText(), this.modEd.getText() || "Main", this.exportedOnly)
      }
    }))

    etch.initialize(this)
    this.element.setAttribute('tabindex', -1)
  }

  search () {
    console.error('`search` must be overwritten with something useful')
  }

  setItems (items) {
    this.items = items
    etch.update(this)
  }

  toggleExported () {
    this.exportedOnly = !this.exportedOnly
    if (this.exportedOnly) {
      this.refs.toggleExported.element.classList.add("selected")
    } else {
      this.refs.toggleExported.element.classList.remove("selected")
    }
  }

  update () {}

  render () {
    return <div className="docpane">
      <div className="header">
        <span className="icon icon-search-save"/>
        <span className="search-editor">{toView(this.searchEd.element)}</span>
        <span className="module-editor">{toView(this.modEd.element)}</span>
        <span className="exported-button"><Button ref="toggleExported" icon="mail-reply" onclick={() => this.toggleExported()}/></span>
      </div>
      <div className="items">
        <table>{
          // should probably not use a table for this, but w/e for now
          this.items.map((item) =>
            <tr>
              <td>{item.typ}</td>
              <td>{item.mod}</td>
              <td className="name">{item.name}</td>
              <td className="value" innerHTML={toView(item.html)}></td>
            </tr>
          )
        }</table>
      </div>
    </div>
  }

  getTitle () {
    return 'Documentation'
  }

  getIconName () {
    return 'graph'
  }
}

DocPane.registerView()
