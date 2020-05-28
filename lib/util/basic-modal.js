
/** @jsx etch.dom */

import etch from 'etch'
import { toView, Button } from './etch'
import { TextEditor, CompositeDisposable } from 'atom'

export function showBasicModal(queries) {
  return new Promise((resolve, reject) => {
    subs = new CompositeDisposable()

    _resolve = (...args) => {
      panel.destroy()
      subs.dispose()
      resolve(...args)
    }
    _reject = (...args) => {
      panel.destroy()
      subs.dispose()
      reject(...args)
    }
    let view = new BasicModalView(queries, _resolve, _reject)

    subs.add(atom.commands.add('.basic-modal .editor', {
      'basic-modal:confirm': () => view.confirm()
    }))
    subs.add(atom.commands.add('.basic-modal .editor', {
      'basic-modal:cancel': () => view.cancel()
    }))
    let panel = atom.workspace.addModalPanel({
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
    for (let query of this.queries) {
      this.models[query.name] = new TextEditor({
        mini: true,
        placeholderText: query.placeholder || ''
      })
      if (query.value) {
        this.models[query.name].setText(query.value)
      }
    }

    etch.initialize(this)
  }

  confirm () {
    let ret = {}
    for (let query of this.queries) {
      ret[query.name] = this.models[query.name].getText()
    }
    this.resolve(ret)
  }

  cancel () {
    this.reject()
  }

  update () {}

  render () {
    let queryViews = this.queries.map(query => {
      return <div className="flex-table row">
        <div className="flex-row">
          {query.name || ''}
        </div>
        <div className="flex-row second">
          {toView(this.models[query.name].element)}
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
