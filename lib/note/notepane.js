/** @babel */
/** @jsx etch.dom */

import etch from 'etch'
import marked from 'marked'

import PaneItem from '../util/pane-item'

export default class NotePane extends PaneItem {
  constructor () {
    super()
    this.note = ''
    this.setTitle('Note')
    etch.initialize(this)
    this.element.setAttribute('tabindex', -1)
  }

  open (opts) {
    return super.open(opts)
  }

  setNote (note) {
    this.note = note
    etch.update(this)
  }

  update () {}

  render () {
    return <div innerHTML={marked(this.note)} className="ink notepane"></div>
  }

  getIconName () {
    return 'book'
  }
}

NotePane.registerView()
