'use babel'
/** @jsx etch.dom */

import {CompositeDisposable} from 'atom'
import {Etch} from '../util/etch'

import etch from 'etch'

function editorsForFile(file) {
  return atom.workspace.getTextEditors().filter(ed => ed.getPath() === file)
}

class BreakpointView extends Etch {
  render() {
    return <span className={'ink-bp icon icon-primitive-dot ' + this.props.status} />
  }
}

class Breakpoint {
  constructor(manager, {file, line}) {
    this.manager = manager
    this.file = file
    this.line = line
    this.views = []
  }

  updateLineToMarkerPosition() {
    if (this.views.length > 0) {
      this.line = this.views[0].marker.getHeadBufferPosition().row
    }
  }

  destroy() {
    this.manager.remove(this)
  }
}

export default class BreakpointManager {
  constructor(scopes) {
    this.subs = new CompositeDisposable()
    this.scopes = scopes
    this.breakpoints = []

    this.subs.add(atom.workspace.observeTextEditors(ed => {
      this.subs.add(ed.observeGrammar(() => {
        if (this.appliesToEditor(ed)) {
          this.init(ed)
        } else {
          this.deinit(ed)
        }
      }))
    }))
  }

  destroy() {
    this.subs.dispose()
    atom.workspace.getTextEditors().forEach(ed => this.deinit(ed))
  }

  appliesToEditor(ed) {
    return this.scopes.indexOf(ed.getGrammar().scopeName) > -1
  }

  init(ed) {
    // TODO: gutter should be namespaced
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

    this.breakpoints
      .filter(({file}) => file === ed.getPath())
      .map(bp => this.addToEd(ed, bp))
  }

  deinit(ed) {
    if (g = ed.gutterWithName('ink-breakpoints')) g.destroy()
  }

  addToEd(ed, bp) {
    if (!this.appliesToEditor(ed)) return
    let marker = ed.markBufferPosition({row: bp.line})
    let gutter = ed.gutterWithName('ink-breakpoints')
    let view = new BreakpointView({})
    let decoration = gutter.decorateMarker(marker, {item: view.element})
    bp.views.push({
      destroy() {
        view.destroy()
        marker.destroy()
      }
    })
  }

  add(file, line) {
    let bp = new Breakpoint(this, {file, line})
    editorsForFile(file).forEach(ed => this.addToEd(ed, bp))
    this.breakpoints.push(bp)
    return bp
  }

  remove(bp) {
    bp.views.forEach(v => v.destroy())
    this.breakpoints = this.breakpoints.filter(x => x !== bp)
  }

  clear() {
    bps = this.breakpoints
    this.breakpoints = []
    bps.forEach(bp => bp.destroy())
  }
}
