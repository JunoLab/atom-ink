'use babel'
/** @jsx etch.dom */

import etch from 'etch'
import { Raw } from '../util/etch.js'
import { CompositeDisposable } from 'atom'
import { Terminal } from 'xterm'
import TerminalElement from './view'
import PaneItem from '../util/pane-item'
import ResizeDetector from 'element-resize-detector'
import { debounce, throttle } from 'underscore-plus'
import { closest } from './helpers'

let getTerminal = el => closest(el, 'ink-terminal').getModel()

Terminal.loadAddon('fit')

var subs

export default class InkTerminal extends PaneItem {
  static activate () {
    subs = new CompositeDisposable()
    subs.add(atom.commands.add('ink-terminal', {
      'ink-terminal:copy':  ({target}) => {
        let term = getTerminal(target)
        if (term != undefined) {
          term.copySelection()
        }},
      'ink-terminal:paste': ({target}) => {
        let term = getTerminal(target)
        if (term != undefined) {
          term.paste()
        }}
    }))

    subs.add(atom.workspace.onDidStopChangingActivePaneItem((item) => {
      if (item instanceof InkTerminal) {
        item.view.initialize(item)
        item.terminal.focus()
      }
    }))
  }

  static deactivate () {
    subs.dispose()
  }

  name = 'InkTerminal'

  constructor () {
    super()

    this.terminal = new Terminal({
      cursorBlink: true,
      cols: 100,
      rows: 30,
      tabStopWidth: 4
    })

    this.classname = ''

    this.view = new TerminalElement

    etch.initialize(this)
    etch.update(this).then(() => {
      this.view.initialize(this)
    })
  }

  set class (name) {
    this.classname = name
    this.view.className = name
  }

  update() {}

  render () {
    return <Raw>{this.view}</Raw>
  }

  getDefaultLocation () {
    return 'bottom'
  }

  onAttached () {
    this.view.initialize(this)
  }

  attach (ty) {
    if (ty === undefined || ty.on === undefined) {
      throw new Error('Tried attaching invalid pty.')
    }

    this.detach()
    this.clear(true)

    this.ty = ty

    this.tyWrite = (data) => this.ty.write(data)
    this.tyResize = (size) => this.ty.resize(size.cols, size.rows)

    this.terminal.on('data', this.tyWrite)
    this.terminal.on('resize', this.tyResize)
    this.ty.on('data', (data) => this.terminal.write(data))
  }

  detach () {
    if (this.ty != undefined) {
      if (this.tyWrite != undefined) this.terminal.off('data', this.tyWrite)
      if (this.tyResize != undefined) this.terminal.off('resize', this.tyResize)
    }
  }

  execute (text) {
    if (this.ty === undefined) {
      throw new Error('Need to attach a pty before executing code.')
    }

    this.ty.write(text)
  }

  clear (hidePrompt = false) {
    this.terminal.clear()
    hidePrompt && this.terminal.write('\r' + ' '.repeat(this.terminal.cols - 3) + '\r')
  }

  copySelection () {
    if (this.terminal.hasSelection()) {
      atom.clipboard.write(this.terminal.getSelection())
      this.terminal.clearSelection()
    }
  }

  paste () {
    if (this.ty === undefined) {
      throw new Error('Need to attach a pty before pasting.')
    }

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
atom.deserializers.add(InkTerminal)