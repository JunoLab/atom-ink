'use babel'

import {CompositeDisposable} from 'atom'
import {Terminal} from 'xterm'
import PaneItem from '../util/pane-item'
import ResizeDetector from 'element-resize-detector'
import pty from 'pty.js'
import { debounce, throttle } from 'underscore-plus'

Terminal.loadAddon('fit')

export default class InkTerminal extends PaneItem {
  constructor (state) {
    super()
    
    // TODO: use disposables for cleaning up all those subscriptions.

    this.resizer = new ResizeDetector()

    this.terminal = new Terminal({
      cursorBlink: true,
      cols: 100,
      rows: 30,
      tabStopWidth: 4,
    })

    this.spawn()

    this.initialized = false

    this.bgColor = '#000'
    this.fgColor = '#fff'

    this.element = document.createElement('div')
    this.element.className = 'ink-terminal'

    console.log(this)
  }

  _open () {
    this.open().then((val) => {
      this.onAttached()
    })
  }

  themeTerminal () {
    let cs = window.getComputedStyle(this.element)
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
    if (!this.initialized) {
      this.terminal.open(this.element)

      this.terminal.on('data', (data) => this.ty.write(data))
      this.terminal.on('resize', (size) => this.ty.resize(size.cols, size.rows))
      this.ty.on('data', (data) => this.terminal.write(data))

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

      this.resizer.listenTo(this.element, debounce(() => this.resize(), 300))
      // HACK:
      // setTimeout(() => {
      this.themeTerminal()
      // }, 300)

      atom.commands.add('.ink-terminal', {
        'ink-terminal:copy':  () => this.copySelection(),
        'ink-terminal:paste': () => this.paste()
      })

      this.initialized = true
    }
  }

  resize () {
    this.terminal.fit()
  }

  spawn () {
    const shell = process.platform === 'win32' ? 'cmd.exe' : 'bash'
    const ty = pty.fork(shell, [], {
      cols: 100,
      rows: 30
    })

    this.ty = ty
  }

  write (text) {
    this.terminal.write(text)
  }

  execute (text, silent = true) {
    if (silent) {
      this.ty.write(text+'\n\r')
    }
  }

  copySelection () {
    if (this.terminal.hasSelection()) {
      atom.clipboard.write(this.terminal.getSelection())
    }
  }

  paste () {
    this.ty.write(atom.clipboard.read())
  }

  show (view) {
    this.themeTerminal()
    if (this.initialized) this.terminal.focus()
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
