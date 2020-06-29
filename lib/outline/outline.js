
/** @jsx etch.dom */

import { TextEditor, CompositeDisposable } from 'atom'
import etch from "etch"
import * as fuzzaldrinPlus from 'fuzzaldrin-plus'

import PaneItem from '../util/pane-item'
import { toView, makeIcon, Button } from '../util/etch'

export default class Outline extends PaneItem {
  constructor () {
    super()
    this.items = []
    this.setTitle('Outline')

    this.searchEd = new TextEditor({mini: true, placeholderText: "Filter"})
    this.filteredItems = []

    this.searchEd.onDidStopChanging(() => this.filterItems(this.searchEd.getText()))

    this.subs = new CompositeDisposable()

    etch.initialize(this)
    this.element.setAttribute('tabindex', -1)
  }

  setItems (items) {
    this.items = items
    this.filterItems(this.searchEd.getText())

    etch.update(this)
  }

  filterItems (query) {
    if (query.length == 0) {
      this.filteredItems = this.items
    } else {
      this.filteredItems = []
      let _items = fuzzaldrinPlus.filter(this.items, query, {key: 'name'})
      if (_items.length > 0) {
        _items.sort((a, b) => b.score - a.score)
        this.filteredItems = _items
      }
    }

    etch.update(this)
  }

  getIconName () {
    return 'list-unordered';
  }

  update () {}

  render () {
    const hasItems = this.items.length > 0
    return <div className="ink-outline">
      <div className="outline-header">
        <span className="header-main">
          <span className="search-editor">{toView(this.searchEd.element)}</span>
        </span>
      </div>
      <div className="outline-content">
        <table className="items">
          {
            this.filteredItems.map(({name, icon, type, onClick, isActive}) =>
              <tr
                className={isActive ? 'isactive' : ''}
                ref={isActive ? "activeElement" : ""}
                onClick={onClick}
              >
                <td className={`icon ${type}`}>{makeIcon(icon)}</td>
                <td className="name">{name}</td>
              </tr>
            )
          }
        </table>
        <ul className={hasItems ? 'hidden' : 'background-message centered'}>
          <li>No outline for this editor.</li>
        </ul>
      </div>
    </div>
  }

  writeAfterUpdate () {
    if (this.refs.activeElement) {
      this.refs.activeElement.scrollIntoView()
    }
  }

}

Outline.registerView();
