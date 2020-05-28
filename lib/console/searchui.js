
/** @jsx etch.dom */

import etch from 'etch'
import { Button, toView } from '../util/etch.js'
import { TextEditor } from 'atom'

export default class TerminalSearchUI {
  constructor (terminal, searcher) {
    this.terminal = terminal
    this.searcher = searcher
    this.editor = new TextEditor( {mini: true, placeholderText: 'Find in Terminal'} )

    this.useRegex = false
    this.matchCase = false
    this.wholeWord = false

    this.initialized = false
    this.errorMessage = ''

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

  toggleError (show) {
    let el = this.refs.errorMessage
    show ? el.classList.remove('hidden') : el.classList.add('hidden')
    etch.update(this)
  }

  find (next) {

    let text = this.editor.getText()
    if (this.useRegex) {
      let msg = null
      try {
        new RegExp(text)
      } catch (err) {
        msg = err.message
      }

      if (msg !== null) {
        this.errorMessage = msg
        this.toggleError(true)
        this.blinkRed()
        return false
      }
    }
    this.toggleError(false)

    let found
    if (next) {
      found = this.searcher.findNext(text, {
        regex: this.useRegex,
        wholeWord: this.wholeWord,
        caseSensitive: this.matchCase,
        incremental: false
      })
    } else {
      found = this.searcher.findPrevious(text, {
        regex: this.useRegex,
        wholeWord: this.wholeWord,
        caseSensitive: this.matchCase
      })
    }

    if (!found) this.blinkRed()
  }

  blinkRed () {
    this.element.classList.add('nothingfound')
    setTimeout(() => this.element.classList.remove('nothingfound'), 200)
  }

  render () {
    return <div className='ink search hidden'>
      <div className='inputs'>
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
                  onclick={() => this.find(false)}>
          </Button>
          <Button className='btn-sm'
                  alt='Find Next'
                  icon='chevron-right'
                  onclick={() => this.find(true)}>
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
      <div className='errormessage hidden'
           ref='errorMessage'>
        {this.errorMessage}
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
