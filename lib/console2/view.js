'use babel'

import { CompositeDisposable } from 'atom'
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

    this.subs.add(atom.config.observe('editor.fontSize', (val) => {
        this.model.terminal.setOption('fontSize', val)
    }))

    this.subs.add(atom.config.observe('editor.fontFamily', (val) => {
        // default fonts as of Atom 1.26
        val = val ? val : 'Menlo, Consolas, "DejaVu Sans Mono", monospace'
        this.model.terminal.setOption('fontFamily', val)
    }))

    this.subs.add(atom.themes.onDidChangeActiveThemes(() => {
      // make sure themes are applied
      setTimeout(() => this.themeTerminal(), 100)
    }))

    this.resizer.listenTo(this, debounce(() => this.resize(), 300))

    this.themeTerminal()

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
    this.model.terminal.fit()
  }

  themeTerminal () {
    let cs = window.getComputedStyle(this)
    let isDarkTheme = chroma(cs['backgroundColor']).luminance() < 0.5
    let bg = rgb2hex(cs['backgroundColor'])
    let fg = rgb2hex(cs['color'])

    let black = chroma('#2e3436')
    let red = chroma('#cc0000')
    let green = chroma('#4e9a06')
    let yellow = chroma('#c4a000')
    let blue = chroma('#3465a4')
    let magenta = chroma('#75507b')
    let cyan = chroma('#06989a')
    let white = chroma('#d3d7cf')

    let selection = chroma(fg).alpha(0.2)

    this.model.terminal.setOption('theme', {
      'background': bg,
      'selection': selection.hex('rgba'), // transparent foreground color
      'foreground': fg,
      'cursor': fg,
      'cursorAccent': bg,

      'black': black.hex(),
      'red': red.hex(),
      'green': green.hex(),
      'yellow': yellow.hex(),
      'blue': blue.hex(),
      'magenta': magenta.hex(),
      'cyan': cyan.hex(),
      'white': white.hex(),

      'brightBlack': black.brighten(isDarkTheme ? 1 : 0.5).hex(),
      'brightRed': red.brighten(isDarkTheme ? 1 : 0.5).hex(),
      'brightGreen': green.brighten(isDarkTheme ? 1 : 0.5).hex(),
      'brightYellow': yellow.brighten(isDarkTheme ? 1 : 0.5).hex(),
      'brightBlue': blue.brighten(isDarkTheme ? 1 : 0.5).hex(),
      'brightMagenta': magenta.brighten(isDarkTheme ? 1 : 0.5).hex(),
      'brightCyan': cyan.brighten(isDarkTheme ? 1 : 0.5).hex(),
      'brightWhite': white.brighten(isDarkTheme ? 1 : 0.5).hex(),
    })

    this.resize()
  }
}

function rgb2hex (rgb) {
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

module.exports = TerminalElement = document.registerElement('ink-terminal', {prototype: TerminalElement.prototype})
