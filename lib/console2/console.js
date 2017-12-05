'use babel'
/** @jsx etch.dom */

import etch from 'etch'
import { Raw } from '../util/etch.js'
import {CompositeDisposable} from 'atom'
import {Terminal} from 'xterm'
import TerminalElement from './view'
import PaneItem from '../util/pane-item'
import ResizeDetector from 'element-resize-detector'
import { debounce, throttle } from 'underscore-plus'

Terminal.loadAddon('fit')

export default class InkTerminal extends PaneItem {
  constructor () {
    super()

    // TODO: use disposables for cleaning up all those subscriptions.

    this.terminal = new Terminal({
      cursorBlink: true,
      cols: 100,
      rows: 30,
      tabStopWidth: 4
    })

    this.view = new TerminalElement

    etch.initialize(this)
    etch.update(this).then(() => {
      this.view.initialize(this)
    })

    atom.commands.add('ink-terminal', {
      'ink-terminal:copy':  () => this.copySelection(),
      'ink-terminal:paste': () => this.paste()
    })

    atom.workspace.onDidStopChangingActivePaneItem((item) => {
      if (item === this) {
        this.view.initialize(this)
        this.terminal.focus()
      }
    })
  }

  update() {}

  render () {
    return <Raw>{this.view}</Raw>
  }

  onAttached () {
    this.view.initialize(this)
  }

  attach (ty) {
    this.ty = ty

    this.terminal.on('data', (data) => this.ty.write(data))
    this.terminal.on('resize', (size) => this.ty.resize(size.cols, size.rows))
    this.ty.on('data', (data) => this.terminal.write(data))
  }

  // spawn (exe = process.platform === 'win32' ? 'cmd.exe' : 'bash', args = []) {
  //   this.exe = exe
  //   this.args = args
  //   this.ty = pty.fork(exe, args, {
  //     cols: 100,
  //     rows: 30
  //   })
  //
  //   this.terminal.on('data', (data) => this.ty.write(data))
  //   this.terminal.on('resize', (size) => this.ty.resize(size.cols, size.rows))
  //   this.ty.on('data', (data) => this.terminal.write(data))
  // }

  execute (text, silent = true) {
    this.ty.write(text+'\n\r')
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
    this.terminal.focus()
  }

  getTitle() {
    return 'Terminal'
  }

  getIconName() {
    return "terminal"
  }
}

InkTerminal.registerView()
