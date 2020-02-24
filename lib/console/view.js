'use babel'

import { CompositeDisposable } from 'atom'
import { WebglAddon } from 'xterm-addon-webgl'
import ResizeDetector from 'element-resize-detector'
import { debounce, throttle } from 'underscore-plus'
import chroma from 'chroma-js'

class TerminalElement extends HTMLElement {
  initialize (model) {
    if (this.initialized) return this

    // check if element is visible, because `terminal.open(this)` will fail otherwise
    let rect = this.getBoundingClientRect()
    if (rect.width == 0 || rect.height == 0) {
      return
    }

    this.subs = new CompositeDisposable

    this.initialized = true

    this.model = model
    this.resizer = new ResizeDetector()

    this.model.terminal.open(this)

    if (this.model.isWebgl) {
      try {
        this.model.terminal.loadAddon(new WebglAddon())
      } catch (err) {
        console.error('Tried to start terminal with WebGL backend, but encountered the following error:')
        console.error(err)
      }
    }

    this.subs.add(atom.config.observe('editor.fontSize', (val) => {
        this.model.terminal.setOption('fontSize', val)
    }))

    this.subs.add(atom.config.observe('editor.fontFamily', (val) => {
        // default fonts as of Atom 1.26
        val = val ? val : 'Menlo, Consolas, "DejaVu Sans Mono", monospace'
        this.model.terminal.setOption('fontFamily', val)
    }))

    this.subs.add(atom.themes.onDidChangeActiveThemes(() => {
      setTimeout(() => this.themeTerminal(), 0)
    }))

    this.subs.add(atom.config.observe('ink.terminal', (val) => {
      this.ansiColors = val
      this.themeTerminal()
    }))

    this.resizer.listenTo(this, debounce(() => this.resize(), 100))

    this.themeTerminal()
    this.initMouseHandling()

    this.model.searchui.attach(this)

    return this
  }

  deinitialize () {
    this.subs.dispose()
  }

  getModel () {
    if (this.initialized) {
      return this.model
    }
  }

  resize () {
    this.model.resize()
  }

  initMouseHandling () {
    let isMouseOver = false

    this.addEventListener('mouseover', e => {
      isMouseOver = true
    })

    this.addEventListener('mouseout', e => {
      isMouseOver = false
    })

    this.addEventListener('paste', e => {
      if (!isMouseOver) {
        e.preventDefault()
        e.stopImmediatePropagation()
      }
    }, true)
  }

  themeTerminal () {
    let cs = window.getComputedStyle(this)
    if (!cs['backgroundColor']) {
      setTimeout(() => this.themeTerminal(), 100)
      return
    }
    let isDarkTheme = chroma(cs['backgroundColor']).luminance() < 0.5
    let bg = rgb2hex(cs['backgroundColor'])
    let fg = rgb2hex(cs['color'])
    let selection = chroma(fg).alpha(this.ansiColors['selectionAlpha'])

    let modifier = isDarkTheme ? 'dark' : 'light'

    this.model.terminal.setOption('theme', {
      'background': bg,
      'selection': selection.hex('rgba'), // transparent foreground color
      'foreground': fg,
      'cursor': fg,
      'cursorAccent': bg,

      'black': this.ansiColors['ansiBlack'][modifier].toHexString(),
      'red': this.ansiColors['ansiRed'][modifier].toHexString(),
      'green': this.ansiColors['ansiGreen'][modifier].toHexString(),
      'yellow': this.ansiColors['ansiYellow'][modifier].toHexString(),
      'blue': this.ansiColors['ansiBlue'][modifier].toHexString(),
      'magenta': this.ansiColors['ansiMagenta'][modifier].toHexString(),
      'cyan': this.ansiColors['ansiCyan'][modifier].toHexString(),
      'white': this.ansiColors['ansiWhite'][modifier].toHexString(),

      'brightBlack': this.ansiColors['ansiBrightBlack'][modifier].toHexString(),
      'brightRed': this.ansiColors['ansiBrightRed'][modifier].toHexString(),
      'brightGreen': this.ansiColors['ansiBrightGreen'][modifier].toHexString(),
      'brightYellow': this.ansiColors['ansiBrightYellow'][modifier].toHexString(),
      'brightBlue': this.ansiColors['ansiBrightBlue'][modifier].toHexString(),
      'brightMagenta': this.ansiColors['ansiBrightMagenta'][modifier].toHexString(),
      'brightCyan': this.ansiColors['ansiBrightCyan'][modifier].toHexString(),
      'brightWhite': this.ansiColors['ansiBrightWhite'][modifier].toHexString(),
    })

    this.resize()
  }
}

function hex(x) {
  return ("0" + parseInt(x).toString(16)).slice(-2);
}
function rgb2hex (rgb) {
  if (rgb.search("rgb") == -1) {
    return rgb
  } else {
    rgb = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\)$/)
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
  }
}

module.exports = TerminalElement = document.registerElement('ink-terminal', {prototype: TerminalElement.prototype})
