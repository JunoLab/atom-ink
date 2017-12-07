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

  constructor () {
    super()

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

  execute (text, silent = true) {
    if (this.ty === undefined) {
      throw new Error('Need to attach a pty before executing code.')
    }

    this.ty.write(text+'\n\r')
  }

  clear () {
    this.terminal.clear()
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
