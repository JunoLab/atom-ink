'use babel'
/** @jsx etch.dom */

import {CompositeDisposable, Emitter} from 'atom'
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
  constructor(manager, {file, line, condition, isactive}) {
    this.manager = manager
    this.file = file
    this.line = line
    this.condition = condition
    this.isactive = isactive
    this.views = []
  }

  destroy() {
    this.manager.remove(this)
  }
}

export default class BreakpointManager {
  constructor(scopes, toggle) {
    this.subs = new CompositeDisposable()
    this.scopes = scopes
    this.name = `ink-breakpoints-${scopes}`
    this.breakpoints = []
    this.emitter = new Emitter()
    this.toggle = toggle

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
    let g = ed.addGutter({name: this.name})

    // click on gutter creates new bp
    let editorElement = atom.views.getView(ed)

    let addClickListener = () => {
      let gutterElement = editorElement.querySelector(`.gutter[gutter-name="${this.name}"]`)

      if (gutterElement == null) {
        window.requestAnimationFrame(addClickListener)
        return
      }

      gutterElement.addEventListener('click', event => {
        let row = ed.component.screenPositionForMouseEvent(event).row
        this.tryToggle(ed.getPath(), row)
      })
    }
    addClickListener()

    this.getForFile(ed.getPath()).map(bp => this.insertView(ed, bp))
  }

  deinit(ed) {
    if (g = ed.gutterWithName(this.name)) g.destroy()
  }

  insertView(ed, bp) {
    if (!this.appliesToEditor(ed)) return
    let marker = ed.markBufferPosition({row: bp.line}, {invalidate: 'never'})
    // TODO: remove bps if they are past the end of a file
    marker.onDidChange(() => marker.setBufferRange([[bp.line, 0], [bp.line, 0]]))
    let gutter = ed.gutterWithName(this.name)
    let view = new BreakpointView({})
    let decoration = gutter.decorateMarker(marker, {item: view.element})
    bp.views.push({
      destroy() {
        view.destroy()
        marker.destroy()
      }
    })
  }

  onUpdate (f) {
    this.emitter.on('update', f)
  }

  setBreakpoints (bps) {
    this.clear()
    bps.forEach(bp => {
      this.add(bp.file, bp.line)
    })
    this.emitter.emit('update', {breakpoints: bps})
  }

  add (file, line) {
    let bp = new Breakpoint(this, {file, line})
    editorsForFile(file).forEach(ed => this.insertView(ed, bp))
    this.breakpoints.push(bp)
    return bp
  }

  remove (bp) {
    bp.views.forEach(v => v.destroy())
    let ind = this.breakpoints.indexOf(bp)
    if (ind > -1) {
      this.breakpoints.splice(ind, ind)
    }
  }

  tryToggle (file, line) {
    this.toggle(file, line)
  }

  clear () {
    this.breakpoints.forEach(bp => bp.destroy())
    this.breakpoints = []
  }
}
