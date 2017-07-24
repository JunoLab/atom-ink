'use babel'
/** @jsx etch.dom */

import etch from 'etch'

import { TextEditor, CompositeDisposable } from 'atom'
import PaneItem from '../util/pane-item'
import { toView, Toolbar, Button, Icon, BackgroundMessage } from '../util/etch'
import { renderToString } from 'katex'
import { htmlDecodeUnsafe, htmlDecode } from '../util/misc'

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
      this.setItems(res.items)
    })
  }

  search () {
    console.error('`search` must be overwritten with something useful')
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
    let items
    if (this.isLoading) {
      items = <div className="items"><span className="loading loading-spinner-large"/></div>
    } else {
      items = <div className="items">
        <table>{
          // should probably not use a table for this, but w/e for now
          this.items.map((item) =>
            <tr>
              <td>{item.typ}</td>
              <td>{item.mod}</td>
              <td className="name">{item.name}</td>
              <td className="value" innerHTML={texify(toView(item.html))}></td>
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
      {items}
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

function texify (html) {
  htmlDecoded = htmlDecodeUnsafe(html)
  if (!htmlDecoded) return html
  return htmlDecoded.replace(/\$.*?\$/g, (substr) => {
    substr = substr.substring(1, substr.length-1)
    let r = renderToString(substr, {throwOnError: false})
    return r
  })
}
