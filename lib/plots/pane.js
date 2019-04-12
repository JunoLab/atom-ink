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

  constructor(opts) {
    super()

    this.setTitle('Plots')

    this.counter = 0
    this.items = []
    this.ids = []
    this.currentItem = -1

    etch.initialize(this)
    this.element.setAttribute('tabindex', -1)
  }

  update() {
    return etch.update(this)
  }

  render() {
    let currentItem
    if (this.currentItem > -1 && this.currentItem < this.items.length) {
      currentItem = this.items[this.currentItem]
    } else {
      currentItem = undefined
    }

    let buttons = [
      <div className='btn-group'>
        <Button icon='arrow-left' alt='First' disabled = {this.items.length == 0} onclick={() => this.activateItem(0)}/>
        <Button icon='arrow-left' alt='Previous' disabled = {this.currentItem <= 0} onclick={() => this.previousPlot()}/>
        <Button icon='arrow-right' alt='Next'  disabled = {this.currentItem >= (this.items.length - 1)} onclick={() => this.nextPlot()}/>
        <Button icon='arrow-right' alt='Last'  disabled = {this.items.length == 0} onclick={() => this.activateItem(this.items.length - 1}/>
      </div>,
      <div className='btn-group'>
        <Button icon='x' alt='Forget Plot' disabled = {currentItem == undefined} onclick={() => this.teardown()} />
        <Button icon='circle-slash' alt='Forget All Plots' disabled = {currentItem == undefined} onclick={() => this.clearAll()} />
      </div>
    ];
    if (currentItem && currentItem.toolbar) buttons = buttons.concat(toView(currentItem.toolbar))

    let els = []
    for (let i = 0; i < this.items.length; i++) {
       els.push(
         <div className="fill"
              style={`display:${i == this.currentItem ? 'initial' : 'none'}`}
              key = {this.ids[i]}>
           {toView(this.items[i])}
         </div>)
     }

    return <span className='ink-plot-pane'>
             <Toolbar items={buttons}>
               <div className="ink-plot-pane-container fill">
                 {els}
               </div>
             </Toolbar>
           </span>
  }

  deactivateCurrentItem () {
    if (this.currentItem > -1 && this.currentItem < this.items.length) {
      let currentItem = this.items[this.currentItem]
      if (currentItem.teardown) currentItem.teardown()
    }
  }

  activateCurrentItem () {
    if (this.currentItem > -1 && this.currentItem < this.items.length) {
      let currentItem = this.items[this.currentItem]
      if (currentItem.build) currentItem.build()
    }
  }

  activateItem (ind) {
    this.deactivateCurrentItem()
    this.currentItem = ind
    this.activateCurrentItem()

    etch.update(this, false)
  }

  previousPlot () {
    if (this.currentItem > 0) {
      this.activateItem(this.currentItem - 1)
    } else {
      this.activateItem(this.currentItem)
    }
  }

  nextPlot () {
    if (this.currentItem < this.items.length - 1) {
      this.activateItem(this.currentItem + 1)
    } else {
      this.activateItem(this.currentItem)
    }
  }

  show (view) {
    if (view) {
      this.ids.push(this.counter += 1)
      this.items.push(view)
      this.activateItem(this.items.length - 1)
    }
    etch.update(this, false)
  }

  teardown () {
    if (this.items[this.currentItem] && this.items[this.currentItem].teardown) this.items[this.currentItem].teardown()

    this.ids.splice(this.currentItem, 1)
    this.items.splice(this.currentItem, 1)

    if (!(this.currentItem < this.items.length - 1)) {
      this.activateItem(this.items.length - 1)
    } else {
      this.activateItem(this.currentItem)
    }
  }

  clearAll () {
    this.items.forEach(item => item.teardown && item.teardown())
    this.ids = []
    this.items = []

    this.activateItem(-1)
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
