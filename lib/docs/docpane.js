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
    this.exportedOnly = true
    this.searchEd = new TextEditor({mini: true, placeholderText: "Search Documentation"})
    this.modEd = new TextEditor({mini: true, placeholderText: "in all modules"})

    this.subs = new CompositeDisposable()
    this.subs.add(atom.commands.add('.docpane .header .editor', {
      'docpane:search': () => this._search()
    }))

    etch.initialize(this)
    this.element.setAttribute('tabindex', -1)
  }

  _search () {
    this.loading(true)
    this.search(this.searchEd.getText(), this.modEd.getText() || "Main", this.exportedOnly).then((res) => {
      this.loading(false)
      for (i = 0; i < res.items.length; i++) {
        res.items[i].score = res.scores[i]
      }
      this.setItems(res.items)
    })
  }

  search () {
    console.error('`search` must be overwritten with something useful')
  }

  // no-op fallback
  process (item) {
    return item
  }

  loading (flag) {
    this.isLoading = flag
    etch.update(this)
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
    let items, itemViews
    if (this.isLoading) {
      itemViews = <div className="items"><span className="loading loading-spinner-large"/></div>
    } else {
      items = this.items.map((item) => this.process(item))
      itemViews = <div className="items">
        <table>{
          // should probably not use a table for this, but w/e for now
          items.map((item) =>
            <tr>
              <td>{Math.round(item.score*100)}</td>
              <td className="typ">{item.typ}</td>
              <td className="mod">{item.mod}</td>
              <td className="name" onclick={item.onClickName}>{item.name}</td>
              <td className="docs" innerHTML={toView(item.html)}></td>
            </tr>
          )
        }</table>
      </div>
    }

    return <div className="docpane">
      <div className="header">
        <span className="search-editor">{toView(this.searchEd.element)}</span>
        <span className="search-button"><Button icon="search-save" onclick={() => this._search()}/></span>
        <span className="module-editor">{toView(this.modEd.element)}</span>
        <span className="exported-button"><Button ref="toggleExported" icon="mail-reply selected" onclick={() => this.toggleExported()}/></span>
      </div>
      {itemViews}
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
