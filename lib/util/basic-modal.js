'use babel'
/** @jsx etch.dom */

import etch from 'etch'
import { toView, Toolbar, Button, Icon, makeicon, Etch, Raw } from './etch'
import { TextEditor, CompositeDisposable } from 'atom'

export default function showBasicModal(queries) {
  return new Promise((resolve, reject) => {
    const subs = new CompositeDisposable()

    const _resolve = (...args) => {
      panel.destroy()
      subs.dispose()
      resolve(...args)
    }
    const _reject = (...args) => {
      panel.destroy()
      subs.dispose()
      reject(...args)
    }
    const view = new BasicModalView(queries, _resolve, _reject)

    subs.add(atom.commands.add('.basic-modal .editor', {
      'basic-modal:confirm': () => view.confirm()
    }))
    subs.add(atom.commands.add('.basic-modal .editor', {
      'basic-modal:cancel': () => view.cancel()
    }))
    const panel = atom.workspace.addModalPanel({
      item: view,
      autoFocus: true
    })
    // focus first editor
    if (view.queries.length > 0) {
      view.models[view.queries[0].name].element.focus()
    }
  })
}

class BasicModalView {
  constructor (queries, resolve, reject) {
    this.resolve = resolve
    this.reject = reject
    this.models = {}
    this.queries = queries
    this.queries.forEach(query => {
      this.models[query.name] = new TextEditor({
        mini: true,
        placeholderText: query.placeholder || ''
      })
      if (query.defaultText) {
        this.models[query.name].setText(query.defaultText)
      }
    })

    etch.initialize(this)
  }

  confirm () {
    const ret = {}
    this.queries.forEach(query => {
      ret[query.name] = this.models[query.name].getText()
    })
    this.resolve(ret)
  }

  cancel () {
    this.reject()
  }

  update () {}

  render () {
    const queryViews = this.queries.map(query => {
      return <div className="flex-table row">
        <div className="flex-row">
          {query.name || ''}
        </div>
        <div className="flex-row second">
          {toView(this.models[query.name].element)}
          {query.message || ''}
        </div>
      </div>
    })
    return  <div className="basic-modal flex-table-container">
      {queryViews}
      <div className="confirm-cancel flex-table">
        <div className="flex-row">
          <Button
            className="btn-success"
            onclick={() => this.confirm()}>
            Confirm
          </Button>
        </div>
        <div className="flex-row">
          <Button
            className="btn-error"
            onclick={() => this.cancel()}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  }
}
