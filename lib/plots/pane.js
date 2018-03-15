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

    this.items = []
    this.currentItem = -1

    etch.initialize(this)
    this.element.setAttribute('tabindex', -1)
  }

  update() {}

  render() {
    let currentItem
    if (this.currentItem > -1 && this.currentItem < this.items.length) {
      currentItem = this.items[this.currentItem]
    } else {
      currentItem = undefined
    }

    let buttons = [
      <div className='btn-group'>
        <Button icon='arrow-left' alt='Previous' disabled = {this.currentItem <= 0} onclick={() => this.lastPlot()}/>
        <Button icon='arrow-right' alt='Next'  disabled = {this.currentItem >= (this.items.length - 1)} onclick={() => this.nextPlot()}/>
      </div>,
      <Button icon='circle-slash' alt='Forget Plot' disabled = {currentItem == undefined} onclick={() => this.teardown()} />
    ];
    if (currentItem && currentItem.toolbar) buttons = buttons.concat(toView(currentItem.toolbar))
    return <span className='ink-plot-pane'>
    <Toolbar items={buttons}>
      <div className='fill'>
        {toView(currentItem)}
      </div>
    </Toolbar>
    </span>
  }

  lastPlot () {
    if (this.currentItem > 0) {
      this.currentItem -= 1
    }
    etch.update(this)
  }

  nextPlot () {
    if (this.currentItem < this.items.length - 1) {
      this.currentItem += 1
    }
    etch.update(this)
  }

  show (view) {
    if (view) {
      this.items.push(view)
      this.currentItem = this.items.length - 1
    }
    etch.update(this)
  }

  teardown () {
    if (this.items[this.currentItem] && this.items[this.currentItem].teardown) this.items[this.currentItem].teardown()
    this.items.splice(this.currentItem, 1)
    if (!(this.currentItem < this.items.length - 1)) this.currentItem = this.items.length - 1

    etch.update(this)
  }

  getTitle() {
    return 'Plots'
  }

  getIconName() {
    return 'graph'
  }

  size() {
    let view = this.element
    let bar = view.querySelector('.bar')
    return [view.clientWidth, view.clientHeight - bar.clientHeight]
  }
}

PlotPane.registerView()
