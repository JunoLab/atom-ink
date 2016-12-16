'use babel'
/** @jsx etch.dom */

import {CompositeDisposable} from 'atom'
import { Etch, view, dom } from './etch'

let subs = new CompositeDisposable
let scopes = new Set
let breakpoints = new Set

class BreakpointView extends Etch {
  render() {
    let icon = this.props.status === 'active' ? 'icon-primitive-dot' :
                                                'icon-primitive-square'
    let cond = this.props.condition === '' ? 'cond' : 'nocond'
    <span class='ink-bp icon ' + icon + ' ' + cond>
  }
}

class Breakpoint {
  constructor(file, line, status, condition) {
    this._file = file
    this._line = line
    this._status = status
    this._condition = condition

    this.view = new BreakpointView({status, condition})
    this.views = new Set
  }

  update() {
    this.view.update({this._status, this._condition})
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
      update()
    }
  })
})

export default class BreakpointRegistry {
  constructor(scopes) {
    this.subs = new CompositeDisposable
    this.scopes = new Set
    this.breakpoints = new Set

    subs.add(atom.workspace.observeTextEditors((ed) => {
      subs.add(ed.observeGrammar((grammar) => {
        if (grammar.scopeName in scopes) {
          this.init(ed)
        } else {
          this.deinit(ed)
        }
      }))
    }))
  }

  init(ed) {
    ed.addGutter({name: 'ink-breakpoints'})
    for (bp of breakpoints) {
      if (bp.file === ed.getPath()) {
        bp.views.push(this.addToEd(ed, bp.line))
      }
    }
  }

  deinit(ed) {
    let g
    if (g = ed.gutterWithName('ink-breakpoints')) {
      g.destroy()
    }
  }

  add(file, line, status) {
    bp = new Breakpoint(file, line, status)
    this.breakpoints.push(bp)
    bp.destroy = () => {
      this.breakpoints = this.breakpoints.filter((x) => x !== bp)
      bp._destroy()
    }
    return bp
  }
}
