'use babel'
/** @jsx etch.dom */

import etch from 'etch'
import { Raw } from '../util/etch.js'
import { CompositeDisposable } from 'atom'
import { Terminal } from 'xterm'
import { SearchAddon } from 'xterm-addon-search'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { Unicode11Addon } from 'xterm-addon-unicode11'
import { FitAddon } from 'xterm-addon-fit'
import TerminalElement from './view'
import PaneItem from '../util/pane-item'
import { debounce, throttle } from 'underscore-plus'
import { closest } from './helpers'
import { openExternal } from 'shell'
import SearchUI from './searchui'

let getTerminal = el => closest(el, 'ink-terminal').getModel()

let subs

export default class InkTerminal extends PaneItem {
  static activate () {
    subs = new CompositeDisposable()
    subs.add(atom.commands.add('ink-terminal', {
      'ink-terminal:copy':  ({target}) => {
        const term = getTerminal(target)
        if (term != undefined) {
          term.copySelection()
        }},
      'ink-terminal:paste': ({target}) => {
        const term = getTerminal(target)
        if (term != undefined) {
          term.paste(process.platform != 'win32')
        }},
      'ink-terminal:show-search': ({target}) => {
        const term = getTerminal(target)
        if (term != undefined) {
          term.searchui.show()
        }},
      'ink-terminal:find-next': ({target}) => {
        const term = getTerminal(target)
        if (term != undefined) {
          term.searchui.find(true)
        }},
      'ink-terminal:find-previous': ({target}) => {
        const term = getTerminal(target)
        if (term != undefined) {
          term.searchui.find(false)
        }},
      'ink-terminal:close-search': ({target}) => {
        const term = getTerminal(target)
        if (term != undefined) {
          term.searchui.hide()
        }}
    }))

    subs.add(atom.workspace.onDidChangeActivePaneItem((item) => {
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
    subs = null
  }

  name = 'InkTerminal'

  constructor (opts) {
    super()

    // default options
    opts = Object.assign({}, {
      cursorBlink: false,
      cols: 100,
      rows: 30,
      scrollback: 5000,
      tabStopWidth: 4,
    }, opts)

    if (process.platform === 'win32') {
      opts.windowsMode = true
    }

    this.persistentState = {}
    this.persistentState.opts = opts

    if (opts.rendererType === 'webgl') {
      this.isWebgl = true
      opts.rendererType = 'canvas'
    }

    this.terminal = new Terminal(opts)
    const webLinksAddon = new WebLinksAddon((ev, uri) => {
      if (!this.shouldOpenLink(ev)) return false
      openExternal(uri)
    }, {
      willLinkActivate: ev => this.shouldOpenLink(ev),
      tooltipCallback: (ev, uri, location) => this.tooltipCallback(ev, uri, location),
      leaveCallback: () => this.closeTooltip()
    })
    this.terminal.loadAddon(webLinksAddon)

    this.searchAddon = new SearchAddon()
    this.terminal.loadAddon(this.searchAddon)

    this.unicode11Addon = new Unicode11Addon()
    this.terminal.loadAddon(this.unicode11Addon)
    this.terminal.activeVersion = '11'

    this.fitAddon = new FitAddon()
    this.terminal.loadAddon(this.fitAddon)

    this.setTitle('Terminal')

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

    this.view = new TerminalElement()

    this.searchui = new SearchUI(this.terminal, this.searchAddon)

    etch.initialize(this)
    etch.update(this).then(() => {
      this.view.initialize(this)
    })

    this.terminal.onTitleChange((t) => this.setTitle(t))
  }

  set class (name) {
    this.classname = name
    this.view.className = name
  }

  shouldOpenLink (ev) {
    return true
  }

  tooltipCallback (ev, uri, location) {
    return false
  }

  closeTooltip () {
    return false
  }

  onDidOpenLink (f) {
    this.shouldOpenLink = f
  }

  registerTooltipHandler (open, close) {
    this.tooltipCallback = (ev, uri, location) => open(ev, uri, location, this.terminal)
    this.closeTooltip = close
  }

  cursorPosition () {
    this.write('\x1b[0m')
    return [this.terminal.buffer.active.cursorX, this.terminal.buffer.active.cursorY]
  }

  setOption (key, val) {
    if (!this.persistentState) {
      this.persistentState = { opts: {} }
    }
    if (!this.persistentState.opts) {
      this.persistentState.opts = {}
    }

    if (key === 'rendererType' && !this.element.initialized) {
      return
    }
    try {
      if (key === 'rendererType' && val === 'webgl') {
        this.persistentState.opts[key] = val
        val = 'canvas'
      } else {
        this.persistentState.opts[key] = val
      }
      this.terminal.setOption(key, val)
    } catch (err) {
      console.warn('Error while applying settings for terminal:', this, err)
    }
  }

  update () {}

  render () {
    return <Raw>{this.view}</Raw>
  }

  onAttached () {
    this.view.initialize(this)
    // force resize
    if (this.ty) this.resize()
  }

  attachCustomKeyEventHandler (f, keepDefault = true) {
    this.terminal.attachCustomKeyEventHandler((e) => {
      const custom = f(e)
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

    this.onData = this.terminal.onData(data => this.ty.write(data))
    this.ty.on('data', data => this.terminal.write(data.toString()))

    if (this.element.parentElement) {
      this.resize()
    }

    if (clear) this.clear()
  }

  detach (keepTy = false) {
    if (this.ty != undefined) {
      if (this.onData != undefined) {
        this.onData.dispose()
        this.onData = undefined
      }

      if (keepTy) this.ty.destroy()

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
    let {cols, rows} = this.fitAddon.proposeDimensions()
    // slightly narrower terminal looks better:
    cols -= 1
    if (cols < 1) cols = 1
    if (this.terminal && !isNaN(cols) && !isNaN(rows)) {
      this.terminal.resize(cols, rows)
      if (this.ty && this.ty.resize) {
        try {
          this.ty.resize(cols, rows)
        } catch (err) {
          // the pty can apparently die before the resize event goes through (https://github.com/JunoLab/atom-julia-client/issues/687)
          console.error(err)
        }
      }
    }
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

    const clip = atom.clipboard.read()

    bracketed = bracketed && /\n/.test(clip)

    bracketed && this.ty.write('\x1b[200~') // enable bracketed paste mode
    this.ty.write(clip)
    bracketed && this.ty.write('\x1b[201~') // disable bracketed paste mode
  }

  show () {
    this.terminal.focus()
  }

  write (str) {
    this.terminal.write(str)
  }

  getIconName() {
    return "terminal"
  }
}

InkTerminal.registerView()
