'use babel'
/** @jsx etch.dom */

import {CompositeDisposable} from 'atom'
import {Etch} from '../util/etch'

import etch from 'etch'

DOMListener = require('dom-listener')

class BreakpointView extends Etch {
  render() {
    let icon = this.props.status === 'active' ? 'icon-primitive-dot' :
                                                'icon-primitive-square'
    let cond = this.props.condition === '' ? 'cond' : 'nocond'
    return <span className={'ink-bp icon ' + icon + ' ' + cond} line={this.props.line}/>
  }
}

class Breakpoint {
  constructor(file, line, status, condition) {
    this._file = file
    this._line = line
    this._status = status
    this._condition = condition

    this.view = new BreakpointView({status, condition, line})
    this.views = []
    return this
  }

  update() {
    this.view.update({status: this._status, condition: this._condition})
  }

  _destroy() {
    this.view.destroy()
  }
}

['file', 'line', 'status', 'condition'].forEach(key => {
  Object.defineProperty(Breakpoint.prototype, key, {
    get: function() { return this['_' + key] },
    set: function(val) {
      this['_' + key] = val
      this.update()
    }
  })
})

export default class BreakpointRegistry {
  constructor(scopes, onLeftClick, onRightClick) {
    this.subs = new CompositeDisposable
    this.scopes = []
    this.breakpoints = []
    this.onLeftClick = onLeftClick
    this.onRightClick = onRightClick

    this.listener = new DOMListener(document.querySelector('.ink-breakpoints'))

    this.subs.add(atom.workspace.observeTextEditors((ed) => {
      this.subs.add(ed.observeGrammar((grammar) => {
        if (scopes.indexOf(grammar.scopeName) > -1 ) {
          this.init(ed)
        } else {
          this.deinit(ed)
        }
      }))
    }))

    return this
  }

  init(ed) {
    ed.addGutter({name: 'ink-breakpoints'})
    this.listener.add('.custom-decorations', 'click', this.onLeftClick)
    this.listener.add('.ink-bp', 'click', event => {
      let row = ed.getElement().component.screenPositionForMouseEvent(event)
      this.add(file, row)
    })
    for (bp of this.breakpoints) {
      if (bp.file === ed.getPath()) {
        bp.views.push(this.addToEd(ed, bp))
      }
    }
  }

  deinit(ed) {
    let g
    if (g = ed.gutterWithName('ink-breakpoints')) {
      g.destroy()
    }
  }

  editorsForFile(file) {
    return atom.workspace.getTextEditors().filter((ed) => ed.getPath() === file)
  }

  addToEd(ed, bp) {
    let marker = ed.markBufferPosition({row: bp.line})
    let gutter = ed.gutterWithName('ink-breakpoints')
    let item   = bp.view
    let decoration = gutter.decorateMarker(marker, {item})
    return {marker, gutter, decoration, item}
  }

  add(file, line, status) {
    let bp = new Breakpoint(file, line, status)
    for (ed of this.editorsForFile(file)) {
      bp.views.push(this.addToEd(ed, bp))
    }
    this.breakpoints.push(bp)
    bp.destroy = () => {
      let v
      for (v of bp.views) {
        v.marker.destroy()
      }
      this.breakpoints = this.breakpoints.filter(x => x != bp)
      bp._destroy()
    }
    return bp
  }
}
