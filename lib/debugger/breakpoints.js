'use babel'
/** @jsx etch.dom */

import {CompositeDisposable} from 'atom'
import {Etch} from '../util/etch'

import etch from 'etch'

class BreakpointView extends Etch {
  render() {
    return <span className={'ink-bp icon icon-primitive-dot ' + this.props.status} />
  }
}

class Breakpoint {
  constructor({file, line}) {
    this.file = file
    this.line = line
    this.view = new BreakpointView()
    this.views = []
  }

  updateLineToMarkerPosition() {
    if (this.views.length > 0) {
      this.line = this.views[0].marker.getHeadBufferPosition().row
    }
  }

  update() {
    this.view.update({status: this._status, condition: this._condition})
  }

  _destroy() {
    this.view.destroy()
  }
}

export default class BreakpointManager {
  constructor(scopes) {
    this.subs = new CompositeDisposable()
    this.scopes = []
    this.breakpoints = []

    this.subs.add(atom.workspace.observeTextEditors((ed) => {
      this.subs.add(ed.observeGrammar((grammar) => {
        if (scopes.indexOf(grammar.scopeName) > -1) {
          this.init(ed)
        } else {
          this.deinit(ed)
        }
      }))
    }))

    return this
  }

  destroy() {
    this.subs.dispose()
    for (let ed of atom.workspace.getTextEditors()) {
      this.deinit(ed)
    }
  }

  init(ed) {
    let g = ed.addGutter({name: 'ink-breakpoints'})
    // TODO: once atom 1.13 is out we can do this properly, but for now the
    //       shadowDOM makes this a bit difficult

    // click on gutter creates new bp
    // this.listener.add('.gutter[gutter-name="ink-breakpoints"', 'click', event => {
    //   console.log('clicked! yay :D');
    //   let ed = atom.workspace.getActiveTextEditor()
    //   let row = ed.getElement().component.screenPositionForMouseEvent(event)[0]
    //   this.add(file, row)
    // })
    for (let bp of this.breakpoints) {
      if (bp.file === ed.getPath()) {
        bp.views.push(this.addToEd(ed, bp))
      }
    }
  }

  deinit(ed) {
    if (g = ed.gutterWithName('ink-breakpoints')) g.destroy()
  }

  editorsForFile(file) {
    return atom.workspace.getTextEditors().filter((ed) => ed.getPath() === file)
  }

  addToEd(ed, bp) {
    let marker = ed.markBufferPosition({row: bp.line})
    let gutter = ed.gutterWithName('ink-breakpoints')
    let item   = bp.view
    let decoration = gutter.decorateMarker(marker, {item})

    // TODO: this seems like a nicer approach than
    // Breakpoint.updateLineToMarkerPosition, but is racy:

    // marker.onDidChange(e => {
    //   let newpos = e.newHeadBufferPosition
    //   bp.line = newpos.row
    // })

    return {marker, gutter, decoration, item}
  }

  add(file, line, status) {
    let bp = new Breakpoint(file, line, status)
    for (let ed of this.editorsForFile(file)) {
      bp.views.push(this.addToEd(ed, bp))
    }
    this.breakpoints.push(bp)
    bp.destroy = () => {
      for (let v of bp.views) {
        v.marker.destroy()
      }
      this.breakpoints = this.breakpoints.filter(x => x !== bp)
      bp._destroy()
    }
    return bp
  }
}
