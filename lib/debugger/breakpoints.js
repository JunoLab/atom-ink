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
    this.name = `ink-breakpoints-${scopes}`
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
    this.emitter = new Emitter()
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
        this.toggle(ed.getPath(), row)
      })
    }
    console.log("trying to add listener for the first time");
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

  onAdd (f) {
    this.emitter.on('add', f)
  }

  onRemove (f) {
    this.emitter.on('remove', f)
  }

  add(file, line) {
    let bp = new Breakpoint(this, {file, line})
    editorsForFile(file).forEach(ed => this.insertView(ed, bp))
    this.breakpoints.push(bp)
    this.emitter.emit('add', {file, line})
    return bp
  }

  remove(bp) {
    bp.views.forEach(v => v.destroy())
    this.emitter.emit('remove', bp)
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
    this.breakpoints.forEach(bp => this.remove(bp))
  }
}
