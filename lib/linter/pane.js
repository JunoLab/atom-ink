
/** @jsx etch.dom */

import etch from 'etch'
import { Raw } from '../util/etch.js'
import { CompositeDisposable } from 'atom'
import PaneItem from '../util/pane-item'
import { open } from '../util/opener'

export default class LinterPane extends PaneItem {
  name = 'LinterPane'

  static activate () {
    subs = new CompositeDisposable()
  }

  static deactivate () {
    subs.dispose()
  }

  constructor (opts) {
    super()

    this.setTitle('Linter')
    this.elements = []
    etch.initialize(this)
  }

  setItems (els) {
    this.elements = els
    etch.update(this)
  }

  addItem (el) {
    this.elements.push(el)
    etch.update(this)
  }

  update () {}

  render () {
    return  <div className="ink-table-container">
            <table className="ink-table">
              <thead>
                <tr>
                  <th className="table-cell table-header table-cell-sev">Type</th>
                  <th className="table-cell table-header table-cell-prov">Provider</th>
                  <th className="table-cell table-header table-cell-desc">Description</th>
                  <th className="table-cell table-header table-cell-file">File</th>
                  <th className="table-cell table-header table-cell-line">Line</th>
                </tr>
              </thead>
              <tbody>
                {this.elements.map(item => {
                  let line = [item.range[0][0], item.range[1][0]]
                  return  <tr>
                            <td className="table-cell table-cell-sev">{item.severity}</td>
                            <td className="table-cell table-cell-prov">{item.provider || ''}</td>
                            <td className="table-cell table-cell-desc">{item.description || ''}</td>
                            <td className="table-cell table-cell-file" onclick={() => open(item.realpath || item.file, line[0])}>{item.file}</td>
                            <td className="table-cell table-cell-line">{`${line[0] + 1}${line[1] != line[0] ? ' - '+line[1] : ''}`}</td>
                          </tr>
                })}
              </tbody>
            </table>
            </div>
  }

  getIconName () {
    return 'alert'
  }
}

LinterPane.registerView()
