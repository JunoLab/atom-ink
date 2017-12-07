'use babel'

import ResizeDetector from 'element-resize-detector'
import { debounce, throttle } from 'underscore-plus'

class TerminalElement extends HTMLElement {
  initialize (model) {
    if (this.initialized) return this

    // check if element is visible, because `terminal.open(this)` will fail
    // otherwise
    let rect = this.getBoundingClientRect()
    if (rect.width == 0 || rect.height == 0) {
      return
    }

    this.initialized = true

    this.model = model
    this.resizer = new ResizeDetector()

    this.model.terminal.open(this)

    atom.config.observe('editor.fontSize', (val) => {
      this.model.terminal.setOption('fontSize', val)
    })

    atom.config.observe('editor.fontFamily', (val) => {
      this.model.terminal.setOption('fontFamily', val)
    })

    this.resizer.listenTo(this, debounce(() => this.resize(), 300))

    this.themeTerminal()

    return this
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
    let bg = rgb2hex(cs['backgroundColor'])
    let fg = rgb2hex(cs['color'])

    this.model.terminal.setOption('theme', {
      'background': bg,
      'foreground': fg,
      'cursor':     fg
    })
  }
}

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

module.exports = TerminalElement = document.registerElement('ink-terminal', {prototype: TerminalElement.prototype})
