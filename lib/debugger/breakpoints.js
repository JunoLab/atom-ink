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

  getForFile(path) {
    return this.breakpoints.filter(({file}) => file === path)
  }

  get(file, l) {
    return this.getForFile(file).filter(({line}) => line === l)[0]
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

    this.getForFile(ed.getPath()).map(bp => this.insertView(ed, bp))
  }

  deinit(ed) {
    if (g = ed.gutterWithName('ink-breakpoints')) g.destroy()
  }

  insertView(ed, bp) {
    if (!this.appliesToEditor(ed)) return
    let marker = ed.markBufferPosition({row: bp.line}, {invalidate: 'never'})
    // TODO: remove bps if they are past the end of a file
    marker.onDidChange(() => marker.setBufferRange([[bp.line, 0], [bp.line, 0]]))
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
    editorsForFile(file).forEach(ed => this.insertView(ed, bp))
    this.breakpoints.push(bp)
    return bp
  }

  remove(bp) {
    bp.views.forEach(v => v.destroy())
    this.breakpoints = this.breakpoints.filter(x => x !== bp)
  }

  toggle(file, line) {
    let bp = this.get(file, line)
    if (bp) {
      bp.destroy()
      return
    } else {
      return this.add(file, line)
    }
  }

  clear() {
    bps = this.breakpoints
    this.breakpoints = []
    bps.forEach(bp => bp.destroy())
  }
}
