'use babel'
/** @jsx etch.dom */

import etch from 'etch'

import PaneItem from '../util/pane-item'
import { toView, Toolbar, Button, Icon, BackgroundMessage } from '../util/etch'

let defaultPane

export default class PlotPane extends PaneItem {

  static activate() {
    defaultPane = PlotPane.fromId('default')
    atom.workspace.addOpener(uri => {
      if (uri.startsWith('atom://ink/plots')) {
        return defaultPane
      }
    })
  }

  constructor() {
    super()
    etch.initialize(this)
    this.element.setAttribute('tabindex', -1)
  }

  update() {}

  render() {
    let buttons = [
      <div className='btn-group'>
        <Button icon='arrow-left' alt='Previous' disabled />
        <Button icon='arrow-right' alt='Next' disabled />
      </div>,
      <Button icon='circle-slash' alt='Forget Plot' onclick={() => this.show()} />
    ];
    if (this.item && this.item.toolbar) buttons.push(toView(this.item.toolbar))
    return <span className='ink-plot-pane'><Toolbar items={buttons}>
      {toView(this.item)}
    </Toolbar></span>
  }

  show(view) {
    if (this.item && this.item.destroy) this.item.destroy()
    this.item = view
    etch.update(this)
  }

  getTitle() {
    return 'Plots'
  }

  getIconName() {
    return 'graph'
  }
}

PlotPane.registerView()
