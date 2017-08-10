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
    this.allPackages = false
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

  _search (query = this.searchEd.getText(), mod = this.modEd.getText(),
           eo = this.exportedOnly, ap = this.allPackages) {
    this.loading(true)
    this.search(query, mod || "Main", eo, ap)
      .then((res) => {
        this.loading(false)
        if (res.error) return
        for (i = 0; i < res.items.length; i++) {
          res.items[i].score = res.scores[i]
        }
        this.setItems(res.items)
      })
  }

  search () {
    console.error('`search` must be overwritten with something useful')
  }

  // search for query without changing any other options
  kwsearch (query) {
    this.searchEd.setText(query)
    this._search(query)
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

  toggleAllLoaded () {
    this.allPackages = !this.allPackages
    if (this.allPackages) {
      this.refs.toggleAll.element.classList.add("selected")
      this.refs.toggleLoaded.element.classList.remove("selected")
    } else {
      this.refs.toggleLoaded.element.classList.add("selected")
      this.refs.toggleAll.element.classList.remove("selected")
    }
  }

  icon (item) {
    switch (item.typ) {
      case "Function": return <span className="icon function">{item.name.startsWith("@") ? "m" : "λ"}</span>
      case "Module": return <span className="icon icon-package"></span>
      case "DataType": return <span className="icon type">T</span>
      default: return <span className="icon constant">c</span>
    }
  }

  update () {}

  itemView (item) {
    item = this.process(item)
    return <div className="item">
             <div className="item-header" style={codeStyle}>
               <span className="typ">{this.icon(item)}</span>
               <span className="name" onclick={item.onClickName}>{item.name}</span>
               <span className={`exported icon icon-eye ${item.exported ? "is-exported" : ""}`}></span>
               <span className="module" onclick={item.onClickModule}>{item.mod}</span>
             </div>
             <div className="item-body">
               <span className="docs">{toView(item.html)}</span>
             </div>
           </div>
  }

  headerView () {
    return  <div className="header">
      <span className="search-editor">{toView(this.searchEd.element)}</span>
      <span className="btn-group search-button"><Button icon="search" onclick={() => this._search()}/></span>
      <span className="module-editor">{toView(this.modEd.element)}</span>
      <span className="btn-group exported-button">
        <Button ref="toggleExported" icon="mail-reply selected" onclick={() => this.toggleExported()}/>
      </span>
      <span className="all-loaded-radiobutton">
        <div className="btn-group">
          <Button ref="toggleLoaded" icon="foo selected" onclick={() => this.toggleAllLoaded()}>loaded</Button>
          <Button ref="toggleAll" icon="foo" onclick={() => this.toggleAllLoaded()}>all</Button>
        </div>
      </span>
    </div>
  }

  render () {
    codeStyle = `font-family: ${this.codeFontFamily}; font-size: ${this.codeFontSize}`
    let items, itemViews
    if (this.isLoading) {
      itemViews = <div className="items"><span className="loading loading-spinner-large"/></div>
    } else {
      itemViews = <div className="items">
          {this.items.map((item) => this.itemView(item))}
      </div>
    }

    return <div className="ink docpane">
      {this.headerView()}
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
