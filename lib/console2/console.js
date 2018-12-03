'use babel'
/** @jsx etch.dom */

import etch from 'etch'
import { Raw } from '../util/etch.js'
import { CompositeDisposable, Emitter } from 'atom'
import { Terminal } from 'xterm'
import * as fit from 'xterm/lib/addons/fit/fit'
import * as webLinks from 'xterm/lib/addons/webLinks/webLinks'
import * as winptyCompat from 'xterm/lib/addons/winptyCompat/winptyCompat'
import TerminalElement from './view'
import PaneItem from '../util/pane-item'
import ResizeDetector from 'element-resize-detector'
import { debounce, throttle } from 'underscore-plus'
import { closest } from './helpers'
import { openExternal } from 'shell'

let getTerminal = el => closest(el, 'ink-terminal').getModel()

Terminal.applyAddon(fit)
Terminal.applyAddon(webLinks)
Terminal.applyAddon(winptyCompat)

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
          term.paste(process.platform != 'win32')
        }}
    }))

    subs.add(atom.workspace.onDidStopChangingActivePaneItem((item) => {
      if (item instanceof InkTerminal) {
        item.view.initialize(item)
        item.terminal.focus()
        if (item.ty) {
          item.resize()
        }
      }
    }))
  }

  static deactivate () {
    subs.dispose()
  }

  name = 'InkTerminal'
  title = 'Terminal'

  constructor (opts) {
    super()

    // default options
    opts = Object.assign({}, {
      cursorBlink: false,
      cols: 100,
      rows: 30,
      scrollback: 5000,
      tabStopWidth: 4
    }, opts)

    this.terminal = new Terminal(opts)
    this.emitter = new Emitter()

    webLinks.webLinksInit(this.terminal, (ev, uri) => openExternal(uri))
    this.terminal.winptyCompatInit()

    this.persistentState = {opts}
    this.classname = ''

    this.enterhandler = (e) => {
      if (!this.ty && e.keyCode == 13) {
        if (this.startRequested) {
          this.startRequested()
        }
        return false
      }
      return e
    }
    this.terminal.attachCustomKeyEventHandler(this.enterhandler)

    this.view = new TerminalElement

    etch.initialize(this)
    etch.update(this).then(() => {
      this.view.initialize(this)
    })

    this.terminal.on('title', (t) => this.setTitle(t))
  }

  set class (name) {
    this.classname = name
    this.view.className = name
  }

  setTitle (t, force) {
    if (force == undefined) {
      if (!this.forced) {
        this.title = t
        this.emitter.emit('change-title', t)
      }
    } else {
      this.forced = force
      this.title = t
      this.emitter.emit('change-title', t)
    }
  }

  onDidChangeTitle (f) {
    return this.emitter.on('change-title', f)
  }

  cursorPosition () {
    this.write('\x1b[0m')
    return [this.terminal._core.buffer.x, this.terminal._core.buffer.y]
  }

  update () {}

  render () {
    return <Raw>{this.view}</Raw>
  }

  getDefaultLocation () {
    return 'bottom'
  }

  onAttached () {
    this.view.initialize(this)
    // force resize
    if (this.ty) this.resize()
  }

  attachCustomKeyEventHandler (f, keepDefault = true) {
    this.terminal.attachCustomKeyEventHandler((e) => {
      let custom = f(e)
      if (custom) {
        return this.enterhandler(e)
      } else {
        return false
      }
    })
  }

  attach (ty, clear = false, cwd = '') {
    if (!ty || !(ty.on) || !(ty.resize) || !(ty.write)) {
      throw new Error('Tried attaching invalid pty.')
    }

    if (cwd) {
      this.persistentState.cwd = cwd
    }

    this.detach()

    this.ty = ty

    this.tyWrite = (data) => this.ty.write(data)
    this.tyResize = (size) => this.ty.resize(size.cols, size.rows)

    this.terminal.on('data', this.tyWrite)
    this.terminal.on('resize', this.tyResize)
    this.ty.on('data', (data) => this.terminal.write(data.toString()))

    if (this.element.parentElement) {
      this.resize()
    }

    if (clear) this.clear()
  }

  detach () {
    if (this.ty != undefined) {
      if (this.tyWrite != undefined) this.terminal.off('data', this.tyWrite)
      if (this.tyResize != undefined) this.terminal.off('resize', this.tyResize)
      this.ty = undefined
    }
  }

  execute (text) {
    if (this.ty === undefined) {
      throw new Error('Need to attach a pty before executing code.')
    }

    this.ty.write(text)
  }

  resize () {
    let {cols, rows} = this.terminal.proposeGeometry()
    // resize twice with different sizes to actually force a resize:
    this.terminal.resize(cols - 2, rows)
    this.terminal.resize(cols - 1, rows)
  }

  clear (hidePrompt = false) {
    this.terminal.clear()
    hidePrompt && this.terminal.write('\r' + ' '.repeat(this.terminal.cols - 3) + '\r')
  }

  copySelection () {
    if (this.terminal.hasSelection()) {
      atom.clipboard.write(this.terminal.getSelection())
      this.terminal.clearSelection()
      return true
    }
    return false
  }

  paste (bracketed = true) {
    if (this.ty === undefined) {
      throw new Error('Need to attach a pty before pasting.')
    }

    let clip = atom.clipboard.read()

    bracketed = bracketed && /\n/.test(clip)

    bracketed && this.ty.write('\x1b[200~') // enable bracketed paste mode
    this.ty.write(clip)
    bracketed && this.ty.write('\x1b[201~') // disable bracketed paste mode
  }

  show (view) {
    this.terminal.focus()
  }

  write (str) {
    this.terminal.write(str)
  }

  getTitle() {
    return this.title
  }

  getIconName() {
    return "terminal"
  }
}

InkTerminal.registerView()
