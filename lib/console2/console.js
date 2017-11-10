'use babel'
/** @jsx etch.dom */

import Terminal from 'xterm'
import etch from 'etch'
import PaneItem from '../util/pane-item'
import pty from './pty'
import { spawn } from 'child_process'
import { toView, Toolbar, Button, Icon, BackgroundMessage } from '../util/etch'

Terminal.loadAddon('fit')

export default class XTermConsole extends PaneItem {

  static activate() {
    defaultPane = PlotPane.fromId('default')
    atom.workspace.addOpener(uri => {
      if (uri.startsWith('atom://ink/xterm')) {
        return defaultPane
      }
    })
  }

  constructor () {
    super()

    this.terminal = new Terminal({
      cursorBlink: true,
      tabStopWidth: 4
    })
    this.v = document.createElement('div')
    this.v.class = 'xterm'

    this.terminal.open(this.v)
    this.terminal.write("Hi there.")

    this.spawn()

    this.terminal.on('data', (data) => this.ty.stdin.write(data))
    this.ty.stdout.on('data', (data) => {this.terminal.write(data)})
    this.ty.stderr.on('data', (data) => {this.terminal.write(data)})

    console.log(this.terminal)
    etch.initialize(this)
  }

  spawn () {
    const ty = spawn('konsole')

    this.ty = ty
  }

  update() {}

  render() {
    let buttons = [
      <div className='btn-group'>
        <Button icon='arrow-left' alt='Previous' disabled />
        <Button icon='arrow-right' alt='Next' disabled />
      </div>
    ];
    return <span className='ink-plot-pane'>
    <Toolbar items={buttons}>
      <div className='fill'>
        {toView(this.v)}
      </div>
    </Toolbar>
    </span>
  }

  writeAfterUpdate() {
    this.terminal.fit()
  }

  show (view) {
    etch.update(this)
  }

  getTitle() {
    return 'XTermConsole'
  }

  getIconName() {
    return 'graph'
  }
}

XTermConsole.registerView()
