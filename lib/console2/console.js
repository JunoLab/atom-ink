'use babel'
/** @jsx etch.dom */

import {CompositeDisposable} from 'atom'
import {Terminal} from 'xterm'
import etch from 'etch'
import PaneItem from '../util/pane-item'
import ResizeDetector from 'element-resize-detector'
import pty from 'pty.js'
import { toView, Toolbar, Button, Icon, BackgroundMessage } from '../util/etch'

Terminal.loadAddon('fit')

export default class InkTerminal extends PaneItem {
  constructor () {
    super()

    this.resizer = new ResizeDetector()

    this.terminal = new Terminal({
      cursorBlink: true,
      cols: 100,
      rows: 30,
      tabStopWidth: 4,
    })
    this.v = document.createElement('div')
    this.v.className = 'ink-terminal'

    this.terminal.open(this.v)

    this.spawn()

    this.terminal.on('data', (data) => this.ty.write(data))
    this.ty.on('data', (data) => {this.terminal.write(data)})

    console.log(this.terminal)
    console.log(this.ty)

    // should dispose of the following listeners
    atom.config.observe('editor.fontSize', (val) => {
      this.terminal.setOption('fontSize', val)
    })

    atom.config.observe('editor.fontFamily', (val) => {
      this.terminal.setOption('fontFamily', val)
    })

    atom.workspace.onDidStopChangingActivePaneItem((item) => {
      if (item === this) {
        this.terminal.focus()
      }
    })

    this.resizer.listenTo(this.v, () => this.resize())

    etch.initialize(this)
  }

  _open () {
    this.open().then((val) => {
      this.onAttached()
    })
  }

  onAttached () {

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
    const shell = process.platform === 'win32' ? 'cmd.exe' : 'bash'
    const ty = pty.fork(shell, [], {
      cols: 100,
      rows: 30
    })

    this.ty = ty
  }

  update() {}

  render() {
    return <span className='ink-terminal'>
        {toView(this.v)}
    </span>
  }

  write (text) {
    this.terminal.write(text)
  }

  execute (text, silent = true) {
    if (silent) {
      this.ty.write(text+'\n\r')
    }
  }

  show (view) {
    etch.update(this)
    this.terminal.focus()
  }

  getTitle() {
    return 'XTermConsole'
  }

  getIconName() {
    return 'graph'
  }
}

InkTerminal.registerView()
