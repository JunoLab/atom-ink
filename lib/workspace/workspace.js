'use babel'
/** @jsx etch.dom */

import etch from "etch"
import PaneItem from '../util/pane-item'
import { toView, Button } from '../util/etch'
import { TextEditor } from 'atom'
import * as fuzzaldrinPlus from 'fuzzaldrin-plus'

function makeicon(type) {
  if (!type) return 'c';
  else if (type.startsWith('icon-')) return <span className={`icon ${type}`}/>;
  else if (type.length == 1) return type;
  switch (type) {
    case 'function': return 'λ';
    case 'type': return 'T';
    case 'module': return <span className='icon icon-package'/>;
    case 'mixin': return <span className='icon icon-code'/>;
    default: return 'c';
  }
}

export default class Workspace extends PaneItem {
  constructor() {
    super()
    this.items = []

    this.searchEd = new TextEditor({mini: true, placeholderText: "Filter"})
    this.filteredItems = []

    this.searchEd.onDidStopChanging(() => this.filterItems(this.searchEd.getText()))

    etch.initialize(this)
    this.element.setAttribute('tabindex', -1)
    this.element.classList.add('ink-workspace')
  }

  setItems(items) {
    this.items = items
    this.filterItems(this.searchEd.getText())
    etch.update(this)
  }

  refresh () {
    console.log("refresh");
    // no-op unless overwritten
  }

  filterItems (query) {
    if (query.length == 0) {
      this.filteredItems = this.items
      etch.update(this)
      return
    }

    this.filteredItems = []
    for (let context of this.items) {
      let _ctx = {
        context: context.context,
        items: fuzzaldrinPlus.filter(context.items, query, {key: 'name'})
      }
      if (_ctx.items.length > 0) {
        _ctx.items.sort((a, b) => b.score - a.score)
        this.filteredItems.push(_ctx)
      }
    }

    etch.update(this)
  }

  getTitle() {
    return 'Workspace';
  }

  getIconName() {
    return 'book';
  }

  update(props, children) {}

  render(props, children) {
    let i = 0
    return <div>
      <div className="workspace-header">
        <span className="header-main">
          <span className="search-editor">{toView(this.searchEd.element)}</span>
          <span className="btn-group">
            <Button alt='Refresh' icon="repo-sync" onclick={() => this.refresh()}/>
            <Button alt='Set Module' icon="package" onclick={() => this.refreshModule()}/>
          </span>
        </span>
      </div>
      <div className="workspace-content">
        {
          this.filteredItems.map(({context, items}) =>
            <div className="context">
              <div className="header">{context}</div>
              <table className="items">{
                items.map(({name, value, type, icon}) =>
                  <tr key={`${context}-${name}`}>
                    <td className={`icon ${type}`}>{makeicon(icon || type)}</td>
                    <td className="name">{name}</td>
                    <td className="value">{toView(value)}</td>
                  </tr>
                )
              }</table>
            </div>
          )
        }
      </div>
    </div>
  }

};

Workspace.registerView();
