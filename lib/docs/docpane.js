'use babel'
/** @jsx etch.dom */

import etch from 'etch'

import { TextEditor, CompositeDisposable } from 'atom'
import PaneItem from '../util/pane-item'
import { toView, Toolbar, Button, Icon, makeicon } from '../util/etch'

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

    this.subs.add(atom.config.observe('editor.fontFamily', v => {
      this.codeFontFamily = v
    }))

    this.subs.add(atom.config.observe('editor.fontSize', v => {
      this.codeFontSize = v + 'px';
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

  icon (item) {
    switch (item.typ) {
      case "Function": return <span className="icon function">λ</span>
      case "Module": return <span className="icon icon-package"></span>
      case "DataType": return <span className="icon type">T</span>
      default: return <span className="icon constant">c</span>
    }
  }

  update () {}

  render () {
    codeStyle = `font-family: ${this.codeFontFamily}; font-size: ${this.codeFontSize}`
    let items, itemViews
    if (this.isLoading) {
      itemViews = <div className="items"><span className="loading loading-spinner-large"/></div>
    } else {
      items = this.items.map((item) => this.process(item))
      itemViews = <div className="items">
        <table>{
          // should probably not use a table for this, but w/e for now
          //  <td className="mod" style={codeStyle}>{item.mod}</td>
          items.map((item) =>
            <tr>
              <td className="typ" style={codeStyle}>{this.icon(item)}</td>
              <td className="name" style={codeStyle} onclick={item.onClickName} title={item.mod}>{item.name}</td>
              <td className="docs" innerHTML={toView(item.html)}></td>
            </tr>
          )
        }</table>
      </div>
    }

    return <div className="docpane">
      <div className="header">
        <span className="search-editor">{toView(this.searchEd.element)}</span>
        <span className="search-button"><Button icon="search" onclick={() => this._search()}/></span>
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
    return 'book'
  }
}

DocPane.registerView()
