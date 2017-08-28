'use babel'
/** @jsx etch.dom */

import etch from 'etch'

import { TextEditor, CompositeDisposable } from 'atom'
import PaneItem from '../util/pane-item'
import { toView, Toolbar, Button, Icon, makeicon, Etch } from '../util/etch'

let codeFontFamily, codeFontSize

export default class DocPane extends PaneItem {
  constructor () {
    super()

    this.content = []
    this.items = []
    this.mode = 'empty'
    this.exportedOnly = false
    this.allPackages = false
    this.namesOnly = false
    this.searchEd = new TextEditor({mini: true, placeholderText: "Search Documentation"})
    this.modEd = new TextEditor({mini: true, placeholderText: "in all modules"})

    this.subs = new CompositeDisposable()
    this.subs.add(atom.commands.add('.docpane .header .editor', {
      'docpane:search': () => this._search()
    }))

    this.subs.add(atom.config.observe('editor.fontFamily', v => {
      codeFontFamily = v
    }))

    this.subs.add(atom.config.observe('editor.fontSize', v => {
      codeFontSize = v + 'px';
    }))

    etch.initialize(this)
    this.element.setAttribute('tabindex', -1)
  }

  _search (query = this.searchEd.getText(), mod = this.modEd.getText(),
           eo = this.exportedOnly, ap = this.allPackages, np = this.namesOnly) {
    this.setContent('loading')
    this.search(query, mod || "Main", eo, ap, np)
      .then((res) => {
        if (res.error) {
          this.setContent('error', {content: res.errmsg})
        } else {
          this.setContent('search', {items: res.items})
        }
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

  showDocument (doc, items) {
    this.setContent('document', {content: doc, items: items})
  }

  setContent (mode, obj = {content: [], items: []}) {
    this.mode = mode
    this.content = obj.content
    this.items = obj.items
    etch.update(this)
  }

  toggleExported () {
    this.exportedOnly = !this.exportedOnly
    this.refs.toggleExported.element.classList.toggle("selected")
  }

  toggleAllLoaded () {
    this.allPackages = !this.allPackages
    this.refs.toggleLoaded.element.classList.toggle("selected")
  }

  toggleLocation () {
    this.namesOnly = !this.namesOnly
    this.refs.toggleLocation.element.classList.toggle("selected")
  }

  toggleOptions () {
    this.refs.headerOptions.classList.toggle('hidden')
    this.refs.options.element.classList.toggle("selected")
  }

  headerView () {
    return  <div className="header">
      <span className="header-main">
        <span className="search-editor">{toView(this.searchEd.element)}</span>
        <span className="btn-group search-button"><Button alt='Search documentation' icon="search" onclick={() => this._search()}/></span>
        <span className="btn-group options-button"><Button alt='Show search options' ref="options" icon="three-bars" onclick={() => this.toggleOptions()}/></span>
      </span>
      <span ref="headerOptions" className="header-options hidden">
        <span className="module-editor">{toView(this.modEd.element)}</span>
        <span className="options-btngroup">
          <div className="btn-group">
            <Button ref="toggleLocation" alt='Search in variable names only' onclick={() => this.toggleLocation()}>names</Button>
            <Button ref="toggleExported" alt='Search in exported variables only' onclick={() => this.toggleExported()}>exported</Button>
            <Button ref="toggleLoaded" alt='Search in loaded modules only' icon="foo selected" onclick={() => this.toggleAllLoaded()}>loaded</Button>
          </div>
        </span>
      </span>
    </div>
  }

  contentView () {
    let content
    switch (this.mode) {
      case 'loading':
        content = <div className="content"><span className="loading loading-spinner-large"/></div>
        break
      case 'search':
        content = <div className="content">
          {this.items.map((item) => toView(new DocItem({item})))}
        </div>
        break
      case 'document':
        content = <div className="content">
          {toView(this.content)}
          {this.items.map((item) => toView(new DocItem({item})))}
        </div>
        break
      case 'error':
        content = <div>{toView(this.content)}</div>
        break
      default:
        content = <div/>
    }
    return content
  }

  update () {}

  render () {
    return <div className="ink docpane">
      {this.headerView()}
      {this.contentView()}
    </div>
  }

  getTitle () {
    return 'Documentation'
  }

  getIconName () {
    return 'book'
  }
}

function icon (item) {
  switch (item.typ) {
    case "Function": return <span className="icon function">{item.name.startsWith("@") ? "m" : "λ"}</span>
    case "Module": return <span className="icon package icon-package"></span>
    case "DataType": return <span className="icon type">T</span>
    case "Keyword": return <span className="icon keyword">k</span>
    default: return <span className="icon constant">c</span>
  }
}

class DocItem extends Etch {
  render () {
    let codeStyle = `font-family: ${codeFontFamily}; font-size: ${codeFontSize}`
    return <div className="item">
             <div className="item-header" style={codeStyle}>
               <span className="typ" title={this.props.item.typ}>{icon(this.props.item)}</span>
               <span className="name" onclick={this.props.item.onClickName}>{this.props.item.name}</span>
               <span
                 className={`exported icon icon-eye ${this.props.item.exported ? "is-exported" : ""}`}
                 title={this.props.item.exported ? "exported" : "not exported"}
               />
               <span className="module" onclick={this.props.item.onClickModule}>{this.props.item.mod}</span>
             </div>
             <div ref='itemBody' className="item-body collapsed">
               <span className="docs">{toView(this.props.item.html)}</span>
               <span className='expander' onclick={() => this.expand()}>...</span>
             </div>
           </div>
  }

  expand () {
    this.refs.itemBody.classList.toggle('collapsed')
  }
}


DocPane.registerView()
