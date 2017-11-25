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

    this.bgColor = '#000'
    this.fgColor = '#fff'

    this.v = document.createElement('div')
    this.v.className = 'ink-terminal'

    this.terminal.open(this.v)

    this.spawn()

    this.terminal.on('data', (data) => this.ty.write(data))
    this.ty.on('data', (data) => {this.terminal.write(data)})

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

    etch.initialize(this)
    etch.updateSync(this)

    this.resizer.listenTo(this.v, () => this.resize())
    this.themeTerminal()

    console.log(this)
  }

  _open () {
    this.open().then((val) => {
      this.onAttached()
    })
  }

  themeTerminal () {
    let cs = window.getComputedStyle(this.v)
    let bg = rgb2hex(cs['backgroundColor'])
    let fg = rgb2hex(cs['color'])
    if (bg !== '' && fg !== '') {
      this.bgColor = rgb2hex(cs['backgroundColor'])
      this.fgColor = rgb2hex(cs['color'])
    }
    this.terminal.setOption('theme', {
      'background': this.bgColor,
      'foreground': this.fgColor,
      'cursor':     this.fgColor
    })
  }

  onAttached () {
    this.themeTerminal()
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
    return <span className='inkterm'>
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
    this.themeTerminal()
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

function rgb2hex(rgb) {
  if (rgb.search("rgb") == -1) {
    return rgb
  } else {
    rgb = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\)$/)
    function hex(x) {
      return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
  }
}
