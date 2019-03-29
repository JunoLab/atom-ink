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
  constructor({file, line, condition, isactive}) {
    this.file = file
    this.line = line
    this.condition = condition
    this.isactive = isactive
    this.views = []
  }

  destroy() {
    this.views.forEach(v => {
      v.destroy()
    })
  }
}

export default class BreakpointManager {
  constructor(scopes, {toggle, clear, toggleUncaught, toggleException,
                       refresh, addArgs, toggleAllActive, toggleActive, addCondition}) {
    this.subs = new CompositeDisposable()
    this.scopes = scopes
    this.name = `ink-breakpoints-${scopes}`
    this.breakpoints = []
    this.emitter = new Emitter()
    this._toggle = toggle
    this._clear = clear
    this._toggleUncaught = toggleUncaught
    this._toggleException = toggleException
    this._refresh = refresh
    this._addArgs = addArgs
    this._toggleAllActive = toggleAllActive
    this._toggleActive = toggleActive
    this._addCondition = addCondition

    this.onException = false
    this.onUncaught = false

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
    let g = ed.addGutter({
      name: this.name,
      priority: 0
    })

    // click on gutter creates new bp
    let editorElement = atom.views.getView(ed)

    let addClickListener = () => {
      let gutterElement = editorElement.querySelector(`.gutter[gutter-name="${this.name}"]`)

      if (gutterElement == null) {
        window.requestAnimationFrame(addClickListener)
        return
      }

      gutterElement.addEventListener('click', event => {
        let row = ed.component.screenPositionForMouseEvent(event)
        row = ed.bufferPositionForScreenPosition(row).row
        this.tryToggle({
          file: ed.getPath(),
          line: row + 1
        })
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
    if (!Number.isInteger(bp.line)) return
    let marker = ed.markBufferPosition({row: bp.line-1}, {invalidate: 'never'})
    // TODO: remove bps if they are past the end of a file
    marker.onDidChange(() => marker.setBufferRange([[bp.line-1, 0], [bp.line-1, 0]]))
    let gutter = ed.gutterWithName(this.name)

    let status = bp.isactive ? "active" : "inactive"
    status += bp.condition ? " conditional" : ""
    let view = new BreakpointView({status: status})
    let decoration = gutter.decorateMarker(marker, {item: view.element})
    bp.views.push({
      destroy() {
        view.destroy()
        marker.destroy()
        decoration.destroy()
      }
    })
  }

  onUpdate (f) {
    this.emitter.on('update', f)
  }

  setBreakpoints (bps) {
    this.clear()
    if (!bps) {
      bps = []
    }
    bps.forEach(bp => {
      this.add(bp)
    })

    this.emitter.emit('update', {breakpoints: bps})
  }

  add ({file, line, isactive, condition}) {
    let bp = new Breakpoint({file, line, isactive, condition})
    editorsForFile(file).forEach(ed => this.insertView(ed, bp))
    this.breakpoints.push(bp)
    return bp
  }

  remove (bp) {
    let ind = this.breakpoints.indexOf(bp)
    if (ind > -1) {
      this.breakpoints.splice(ind, ind)
    } else {
      console.error("error removing bp");
    }
    bp.destroy()
  }

  tryToggle (item) {
    // temporary breakpoint for instant feedback
    let bp = this.add({
      file: item.file,
      line: item.line,
      isactive: false,
      condition: null
    })
    this._toggle(item).then(({response, error}) => {
      this.remove(bp)
      if (error) {
        this.showError(error)
      } else {
        this.setBreakpoints(response)
      }
    })
  }

  tryToggleActive (item) {
    this._toggleActive(item).then(({response, error}) => {
      if (error) {
        this.showError(error)
      } else {
        this.setBreakpoints(response)
      }
    })
  }

  tryToggleAllActive (state) {
    this._toggleAllActive(state).then(({response, error}) => {
      if (error) {
        this.showError(error)
      } else {
        this.setBreakpoints(response)
      }
    })
  }

  tryAddArgs (args) {
    this._addArgs(args).then(({response, error}) => {
      if (error) {
        this.showError(error)
      } else {
        this.setBreakpoints(response)
      }
    })
  }

  tryClear () {
    this._clear().then(({response, error}) => {
      if (error) {
        this.showError(error)
      } else {
        this.setBreakpoints(response)
      }
    })
  }

  tryToggleException () {
    let promise = this._toggleException()
    promise.then(({response, error}) => {
      if (error) {
        this.showError(error)
      } else {
        this.onUncaught = response
      }
    })
    return promise
  }

  tryToggleUncaughtException () {
    this._toggleUncaught().then(({response, error}) => {
      if (error) {
        this.showError(error)
      } else {
        this.onUncaught = response
      }
    })
  }

  tryRefresh () {
    this._refresh().then(({response=[], error}) => {
      if (error) {
        this.showError(error)
      } else {
        this.setBreakpoints(response)
      }
    })
  }

  tryAddCondition (item, cond) {
    this._addCondition(item, cond).then(({response=[], error}) => {
      if (error) {
        this.showError(error)
      } else {
        this.setBreakpoints(response)
      }
    })
  }

  showError (err) {
    atom.notifications.addError('Error in Debugger', {
      detail: err
    })
  }

  clear () {
    while (this.breakpoints.length > 0) {
        this.breakpoints.pop().destroy()
    }
    this.emitter.emit('update', {breakpoints: this.breakpoints})
  }
}
