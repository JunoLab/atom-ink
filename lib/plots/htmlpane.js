'use babel'
/** @jsx etch.dom */

import etch from 'etch'

import { Emitter } from 'atom'
import PaneItem from '../util/pane-item'
import { toView } from '../util/etch'

export default class HTMLPane extends PaneItem {
  constructor() {
    super()

    this.emitter = new Emitter()

    this.item = undefined
    this.title = 'HTMLPane'
    this.icon = 'graph'

    etch.initialize(this)
    this.element.setAttribute('tabindex', -1)
  }

  show (opts) {
    if (opts.item) this.item = opts.item
    if (opts.title) {
      this.title = opts.title
      this.emitter.emit('change-title', opts.title)
    }
    if (opts.icon) {
      this.icon = opts.icon
      this.emitter.emit('change-icon', opts.icon)
    }

    this.update()
  }

  onDidChangeTitle (f) {
    return this.emitter.on('change-title', f)
  }

  onDidChangeIcon (f) {
    return this.emitter.on('change-icon', f)
  }

  update() {
    return etch.update(this)
  }

  render() {
    return <span className='ink-plot-pane'>
             <div className="ink-plot-pane-container fill">
               {toView(this.item)}
             </div>
           </span>
  }

  getTitle() {
    return this.title
  }

  getIconName() {
    return this.icon
  }

  // prevent serialization
  serialize () {
    return undefined
  }
}

HTMLPane.registerView()
