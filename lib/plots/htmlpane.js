'use babel'
/** @jsx etch.dom */

import etch from 'etch'

import PaneItem from '../util/pane-item'
import { toView } from '../util/etch'

export default class HTMLPane extends PaneItem {
  constructor(opts) {
    super()

    this.item = opts.item
    this.title = opts.title
    this.icon = opts.icon

    etch.initialize(this)
    this.element.setAttribute('tabindex', -1)
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
