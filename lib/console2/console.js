'use babel'
/** @jsx etch.dom */

import Terminal from 'xterm'
import etch from 'etch'
import PaneItem from '../util/pane-item'
import ResizeDetector from 'element-resize-detector'
import { spawn } from 'node-pty'
import { toView, Toolbar, Button, Icon, BackgroundMessage } from '../util/etch'

Terminal.loadAddon('fit')

export default class InkTerminal extends PaneItem {
  constructor () {
    super()

    this.isAttached = false
    this.resizer = new ResizeDetector()

    this.terminal = new Terminal({
      cursorBlink: true,
      cols: 100,
      rows: 100,
      tabStopWidth: 4
    })
    this.v = document.createElement('div')
    this.v.className = 'ink-terminal'

    this.terminal.open(this.v)

    this.spawn()

    this.terminal.on('data', (data) => this.ty.write(data))
    this.ty.on('data', (data) => {this.terminal.write(data)})

    console.log(this.terminal)
    console.log(this.ty)

    etch.initialize(this)
  }

  _open () {
    this.open().then((val) => {
      console.log(val)
      this.onAttached()
    })
  }

  onAttached () {
    this.resizer.listenTo(this.v, () => this.resize())
  }

  resize () {
    this.terminal.fit()
    etch.update(this)
    const cols = this.terminal.cols
    const rows = this.terminal.rows
    this.ty.resize(cols, rows)
    this.terminal.resize(cols, rows)
  }

  spawn () {
    const ty = spawn('bash', [], {
      cols: 100,
      rows: 100
    })

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
    // this.terminal.fit()
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

InkTerminal.registerView()
