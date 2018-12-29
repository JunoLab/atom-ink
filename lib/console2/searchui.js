'use babel'
/** @jsx etch.dom */

import etch from 'etch'
import { Raw, Button, toView } from '../util/etch.js'
import { CompositeDisposable, Emitter, TextEditor, TextBuffer, Disposable, MarkerLayer, Range } from 'atom'
import { Terminal } from 'xterm'
import * as fit from 'xterm/lib/addons/fit/fit'
import * as webLinks from 'xterm/lib/addons/webLinks/webLinks'
import * as winptyCompat from 'xterm/lib/addons/winptyCompat/winptyCompat'
import * as search from 'xterm/lib/addons/search/search'
import TerminalElement from './view'
import PaneItem from '../util/pane-item'
import ResizeDetector from 'element-resize-detector'
import { debounce, throttle } from 'underscore-plus'
import { closest } from './helpers'
import { openExternal } from 'shell'

export default class TerminalSearchUI {
  constructor (terminal) {
    this.terminal = terminal
    this.editor = new TextEditor( {mini: true, placeholderText: 'Find in Terminal'} )

    this.useRegex = false
    this.matchCase = false
    this.wholeWord = false

    this.initialized = false

    etch.initialize(this)
  }

  update () {}

  toggleRegex () {
    this.useRegex = !this.useRegex
    this.refs.toggleRegex.element.classList.toggle('selected')
  }

  toggleCase () {
    this.matchCase = !this.matchCase
    this.refs.toggleCase.element.classList.toggle('selected')
  }

  toggleWhole () {
    this.wholeWord = !this.wholeWord
    this.refs.toggleWhole.element.classList.toggle('selected')
  }

  findNext () {
    let found = this.terminal.findNext(this.editor.getText(), {
      regex: this.useRegex,
      wholeWord: this.wholeWord,
      caseSensitive: this.matchCase,
      incremental: true
    })

    if (!found) this.blinkRed()
  }

  findPrevious () {
    let found = this.terminal.findPrevious(this.editor.getText(), {
      regex: this.useRegex,
      wholeWord: this.wholeWord,
      caseSensitive: this.matchCase
    })

    if (!found) this.blinkRed()
  }

  blinkRed () {
    this.element.classList.add('nothingfound')
    setTimeout(() => this.element.classList.remove('nothingfound'), 200)
  }

  render () {
    return <div className='ink terminal search hidden'>
      <span className='searchinput'>{ toView(this.editor.element) }</span>
      <div className='btn-group searchoptions'>
        <Button className='btn-sm'
                ref='toggleRegex'
                alt='Use Regex'
                onclick={() => this.toggleRegex()}>
        .*
        </Button>
        <Button className='btn-sm'
                ref='toggleCase'
                alt='Match Case'
                onclick={() => this.toggleCase()}>
        Aa
        </Button>
        <Button className='btn-sm'
                ref='toggleWhole'
                alt='Whole Word'
                onclick={() => this.toggleWhole()}>
        \b
        </Button>
      </div>
      <div className='btn-group nextprev'>
        <Button className='btn-sm'
                alt='Find Previous'
                icon='chevron-left'
                onclick={() => this.findPrevious()}>
        </Button>
        <Button className='btn-sm'
                alt='Find Next'
                icon='chevron-right'
                onclick={() => this.findNext()}>
        </Button>
      </div>
      <div className='btn-group closebutton'>
        <Button className='btn-sm'
                alt='Close'
                icon='x'
                onclick={() => this.hide()}>
        </Button>
      </div>
    </div>
  }

  attach (element) {
    if (!this.initialized) {
      element.appendChild(this.element)
      this.initialized = true
    }
  }

  show () {
    this.element.classList.remove('hidden')
    this.editor.element.focus()
  }

  hide () {
    this.element.classList.add('hidden')
    this.terminal.focus()
  }
}
