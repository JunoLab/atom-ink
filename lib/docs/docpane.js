'use babel'
/** @jsx etch.dom */

import etch from 'etch'

import { TextEditor, CompositeDisposable } from 'atom'
import PaneItem from '../util/pane-item'
import { toView, Toolbar, Button, Icon, BackgroundMessage } from '../util/etch'

export default class DocPane extends PaneItem {
  constructor () {
    super()
    etch.initialize(this)
    this.element.setAttribute('tabindex', -1)
    this.items = []
    this.searchEd = new TextEditor({mini: true, placeholderText: "Search Documentation"})
    this.modEd = new TextEditor({mini: true, placeholderText: "in all packages"})

    this.subs = new CompositeDisposable()
    this.subs.add(atom.commands.add('.docpane .header .editor', {
      'docpane:search': () => this.search(this.searchEd.getText(), this.modEd.getText() || "Main")
    }))
  }

  search () {
    console.error('`search` must be overwritten with something useful')
  }

  setItems (items) {
    this.items = items
    etch.update(this)
  }

  update () {}

  render () {
    // this shouldn't be necessary, but `render` is sometimes called *without* calling the
    // constructor first (probably serialization or something?)
    if (!this.items) this.items = []
    console.log(this.items)
    return <div className="docpane">
      <div className="header">
        <span className="icon icon-search-save"/>
        {toView(this.searchEd)}
        {toView(this.modEd)}
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
