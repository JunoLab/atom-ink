'use babel'
/** @jsx etch.dom */

import etch from 'etch'
import { toView, Toolbar, Button, Icon, makeicon, Etch, Raw } from './etch'
import { TextEditor, TextBuffer, CompositeDisposable } from 'atom'

export function showBasicModal(items) {
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
    let view = new BasicModalView(items, _resolve, _reject)

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
    for (let item of items) {
      if (item.type.startsWith('input')) {
        view.models[item.name].element.focus()
      }
    }
  })
}

class BasicModalView {
  constructor (items, resolve, reject) {
    this.resolve = resolve
    this.reject = reject
    this.models = {}
    this.items = items
    for (let item of this.items) {
      if (item.type === 'input') {
         let ed = new TextEditor({
          mini: true,
          placeholderText: item.placeholder || ''
        })
        if (item.value) {
          ed.setText(item.value)
        }

        this.models[item.name] = {
          element: ed.element,
          getValue: () => ed.getText()
        }
      } else if (item.type === 'input-password') {
        let ed = new TextEditor({
          mini: true,
          placeholderText: item.placeholder || 'Password'
        })
        let ctp = new TextBuffer('')
        let changing = false
        ed.buffer.onDidChange((obj) => {
          if (!changing) {
            changing = true
            ctp.setTextInRange(obj.oldRange, obj.newText)
            ed.buffer.setTextInRange(obj.newRange, '*'.repeat(obj.newText.length))
            changing = false
          }
        })

        if (item.value) {
          this.models[item.name].setText(item.value)
        }
        this.models[item.name] = {
          element: ed.element,
          getValue: () => ctp.getText()
        }
      }
    }
    etch.initialize(this)
  }

  confirm () {
    let ret = {}
    for (let item of this.items) {
      if (item.type.startsWith('input')) {
        ret[item.name] = this.models[item.name].getValue()
      }
    }
    this.resolve(ret)
  }

  cancel () {
    this.reject()
  }

  update () {}

  renderItem (item) {
    if (item.type.startsWith('input')) {
      return <div className="flex-table row">
        <div className="flex-row">
          {item.name || ''}
        </div>
        <div className="flex-row second">
          {toView(this.models[item.name].element)}
        </div>
      </div>
    } else if (item.type === 'header') {
      return <div className="flex-table row">
        <h3>
          {item.value || ''}
        </h3>
      </div>
    } else {
      return <div className="flex-table row">
        <p>
          {item.value || ''}
        </p>
      </div>
    }
  }

  render () {
    let itemViews = this.items.map(item => this.renderItem(item))
    return  <div className="basic-modal flex-table-container">
              {itemViews}
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
