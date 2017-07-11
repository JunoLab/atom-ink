'use babel'
/** @jsx etch.dom */

import etch from 'etch'

import PaneItem from '../util/pane-item'
import { toView, Toolbar, Button, Icon, BackgroundMessage } from '../util/etch'

export default class DocPane extends PaneItem {
  static activate () {
    defaultPane = DocPane.fromId('docs')
    atom.workspace.addOpener(uri => {
      if (uri.startsWith('atom://ink/docpane')) {
        return defaultPane
      }
    })
  }

  constructor () {
    super()
    etch.initialize(this)
    this.element.setAttribute('tabindex', -1)
    this.items = []
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
      <table className="items">{
        // should probably not use a table for this, but w/e for now
        this.items.map((item) =>
          <tr>
            <td>{item.mod}</td>
            <td className="name">{item.name}</td>
            <td className="value" innerHTML={toView(item.html)}></td>
          </tr>
        )
      }</table>
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
