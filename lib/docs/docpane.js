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
    if (!this.items) this.items = []
    console.log(this.items)
    return <div className='fill'>
      <table className="items">{
        this.items.map((item) =>
          <tr>
            <td>{item.mod}</td>
            <td className="name">{item.name}</td>
            <td className="value">{toView(item.text)}</td>
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
