
/** @jsx etch.dom */

import etch from 'etch'
import { Raw } from '../util/etch.js'
import { CompositeDisposable } from 'atom'
import PaneItem from '../util/pane-item'
import { open } from '../util/opener'

// pane for side-to-side view of compiled code and source code
export default class CompiledPane extends PaneItem {
  name = 'CompiledPane'

  static activate () {
    subs = new CompositeDisposable()
  }

  static deactivate () {
    subs.dispose()
  }

  constructor (opts) {
    super()

    this.setTitle('Compiled Code')
    this.code = []
    this.header = ""

    etch.initialize(this)
  }

  showCode (name, header, code) {
    this.getTitle = () => name
    this.header = header
    this.code = code
    etch.update(this)
  }

  update () {}

  render () {
    return  <div className="ink-compiled-code-container">
              <div className="ink-compiled-header">
                 {this.header || ''}
              </div>
              <div className="ink-compiled-code">
                {
                  this.code.map(line => {
                    return  <div className="ink-compiled-line">
                              <div className="ink-compiled-line-number">{line[0]}</div>
                              <div className="ink-compiled-line-content">{line[1]}</div>
                            </div>
                  })
                }
              </div>
            </div>
  }

  getIconName () {
    return 'alert'
  }
}

CompiledPane.registerView()
