'use babel'
/** @jsx etch.dom */

import {CompositeDisposable, Emitter} from 'atom'
import { showBasicModal } from '../util/basic-modal'
import {Etch} from '../util/etch'

import etch from 'etch'

function editorsForFile(file) {
  return atom.workspace.getTextEditors().filter(ed => ed.getPath() === file)
}

class BreakpointView extends Etch {
  render() {
    let status = this.props.breakpoint.isactive ? "active" : "inactive"
    status += this.props.breakpoint.condition ? " conditional" : ""
    return <span className={'ink-bp icon icon-primitive-dot ' + status} />
  }
}

class Breakpoint {
  constructor({file, line, condition, isactive, description, typ, id}) {
    this.file = file || ''
    this.line = line || ''
    this.description = description || ''
    this.condition = condition || ''
    this.isactive = isactive
    this.typ = typ || 'source'
    this.id = id
    this.views = []
  }

  updateLine (line) {
    this.line = line + 1
    for (const view of this.views) {
      view.marker.setBufferRange([[line, 0], [line, Infinity]])
    }
  }

  destroy() {
    this.views.forEach(v => {
      v.destroy()
    })
  }
}

export default class BreakpointManager {
  constructor(scopes, {toggle, clear, toggleUncaught, toggleException,
                       refresh, addArgs, toggleAllActive, toggleActive,
                       addCondition, setLevel, toggleCompiled}) {
    this.subs = new CompositeDisposable()
    this.scopes = scopes
    this.name = `ink-breakpoints-${scopes}`
    this.breakpoints = []
    this.fileBreakpoints = []
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
    this._setLevel = setLevel
    this._toggleCompiled = toggleCompiled

    this.onException = false
    this.onUncaught = false
    this.compiledMode = false

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
    return this.fileBreakpoints.filter(({file}) => file === path)
  }

  get(file, l) {
    return this.getForFile(file).filter(({line}) => line === l)[0]
  }

  appliesToEditor(ed) {
    return this.scopes.indexOf(ed.getGrammar().scopeName) > -1
  }

  init(ed) {
    ed.addGutter({
      name: this.name,
      priority: 0
    })

    // click on gutter creates new bp
    const editorElement = atom.views.getView(ed)

    const addClickListener = () => {
      const gutterElement = editorElement.querySelector(`.gutter[gutter-name="${this.name}"]`)

      if (gutterElement == null) {
        window.requestAnimationFrame(addClickListener)
        return
      }

      gutterElement.addEventListener('click', event => {
        if (!ed || !ed.getPath()) {
          atom.notifications.addError('Need a saved file to add a breakpoint')
          return
        }
        let row = ed.component.screenPositionForMouseEvent(event)
        row = ed.bufferPositionForScreenPosition(row).row
        this.toggleAtSourceLocation({
          file: ed.getPath(),
          line: row + 1
        })
      })
    }
    addClickListener()

    this.getForFile(ed.getPath()).map(bp => this.insertView(ed, bp))
  }

  deinit(ed) {
    const gutter = ed.gutterWithName(this.name)
    if (gutter) gutter.destroy()
  }

  insertView(ed, bp) {
    if (!this.appliesToEditor(ed)) return
    if (!Number.isInteger(bp.line)) return
    const marker = ed.markBufferRange([[bp.line-1, 0], [bp.line-1, Infinity]], {invalidate: 'never'})
    // TODO: remove bps if they are past the end of a file
    marker.onDidChange((ev) => {
      const newLine = ev.newHeadBufferPosition.row
      bp.updateLine(newLine)

      this.emitter.emit('update')
    })
    const gutter = ed.gutterWithName(this.name)

    const view = new BreakpointView({breakpoint: bp})
    this.emitter.on('update', () => view.update())
    const decoration = gutter.decorateMarker(marker, {item: view.element})
    bp.views.push({
      destroy() {
        view.destroy()
        marker.destroy()
        decoration.destroy()
      },
      marker: marker
    })
  }

  onUpdate (f) {
    this.emitter.on('update', f)
  }

  setFuncBreakpoints (bps) {
    while (this.breakpoints.length > 0) {
      this.breakpoints.pop().destroy()
    }
    if (!bps) {
      bps = []
    }
    bps.forEach(bp => {
      bp.typ = 'func'
      this.add(bp)
    })

    this.emitter.emit('update')
  }

  add (opts) {
    const bp = new Breakpoint(opts)
    if (opts.typ == 'source') {
      editorsForFile(opts.file).forEach(ed => this.insertView(ed, bp))
      this.fileBreakpoints.push(bp)
    } else {
      this.breakpoints.push(bp)
    }

    this.emitter.emit('update')
    return bp
  }

  remove (bp) {
    if (bp.typ === 'source') {
      this.fileBreakpoints.splice(this.fileBreakpoints.indexOf(bp), 1)
    } else {
      this._toggle(bp).then(({response, error}) => {
        if (error) {
          this.showError(error)
        } else {
          this.setFuncBreakpoints(response)
        }
      })
    }

    bp.destroy()
    this.emitter.emit('update')
  }

  getFileBreakpoints () {
    return this.fileBreakpoints
  }

  getFuncBreakpoints () {
    return this.breakpoints
  }

  toggleAtSourceLocation ({file, line}) {
    let found = false
    let ind = 0
    this.fileBreakpoints.forEach(bp => {
      if (bp.file === file && bp.line === line) {
        this.fileBreakpoints.splice(ind, 1)[0].destroy()
        found = true
      }
      ind += 1
    })
    if (!found) {
      this.add({
        file: file,
        line: line,
        isactive: true,
        condition: null,
        typ: 'source'
      })
    }

    this.emitter.emit('update')
  }

  toggleConditionAtSourceLocation ({file, line}) {
    const activePane = atom.workspace.getActivePane()

    let found = false
    this.fileBreakpoints.forEach(bp => {
      if (bp.file === file && bp.line === line) {
        showBasicModal([{
          name: 'Condition',
          value: bp.condition
        }]).then(items => {
          const condition = items['Condition']
          this.addCondition(bp, condition)
          this.emitter.emit('update')
          activePane.activate() // Re-activate previously active pane
        })
      }
      found = true
    })

    if (!found) {
      showBasicModal([{
        name: 'Condition',
        value: '',
      }]).then(items => {
        const condition = items['Condition']
        this.add({
          file: file,
          line: line,
          isactive: true,
          condition: condition,
          typ: 'source'
        })
        this.emitter.emit('update')
        activePane.activate() // Re-activate previously active pane
      })
    }
  }

  toggleActive (bp) {
    if (bp.typ === 'source') {
      const ind = this.fileBreakpoints.indexOf(bp)
      if (ind > -1) {
        this.fileBreakpoints[ind].isactive = !this.fileBreakpoints[ind].isactive
      }
    } else {
      this._toggleActive(bp).then(({response, error}) => {
        if (error) {
          this.showError(error)
        } else {
          this.setFuncBreakpoints(response)
        }
      })
    }
    this.emitter.emit('update')
  }

  toggleAllActive (state) {
    this.fileBreakpoints.forEach(bp => {
      bp.isactive = !state
    })
    this._toggleAllActive(state).then(({response, error}) => {
      if (error) {
        this.showError(error)
      } else {
        this.setFuncBreakpoints(response)
      }
    })
    this.emitter.emit('update')
  }

  addArgsBreakpoint (args) {
    this._addArgs(args).then(({response, error}) => {
      if (error) {
        this.showError(error)
      } else {
        this.setFuncBreakpoints(response)
      }
    })
    this.emitter.emit('update')
  }

  clear (uiOnly = false) {
    this.fileBreakpoints.reverse().forEach(bp => bp.destroy())
    this.fileBreakpoints = []

    if (!uiOnly) {
      this._clear().then(({response, error}) => {
        if (error) {
          this.showError(error)
        } else {
          this.setFuncBreakpoints(response)
        }
      })
    }
    this.setFuncBreakpoints()
    this.emitter.emit('update')
  }

  toggleCompiled () {
    this._toggleCompiled().then(({response, error}) => {
      if (error) {
        this.showError(error)
      } else {
        this.compiledMode = response
      }
      this.emitter.emit('update')
    })
  }

  toggleException () {
    this._toggleException().then(({response, error}) => {
      if (error) {
        this.showError(error)
      } else {
        this.onException = response
      }
      this.emitter.emit('update')
    })
  }

  toggleUncaughtException () {
    this._toggleUncaught().then(({response, error}) => {
      if (error) {
        this.showError(error)
      } else {
        this.onUncaught = response
      }
      this.emitter.emit('update')
    })
  }

  refresh () {
    this._refresh().then(({response=[], error}) => {
      if (error) {
        this.showError(error)
      } else {
        if (response && response.breakpoints) {
          this.setFuncBreakpoints(response.breakpoints)
          this.onUncaught = response.onUncaught
          this.onException = response.onException
        } else {
          this.setFuncBreakpoints(response)
        }
      }
      this.emitter.emit('update')
    })
  }

  addCondition (bp, cond) {
    if (bp.typ === 'source') {
      const ind = this.fileBreakpoints.indexOf(bp)
      if (ind > -1) {
        this.fileBreakpoints[ind].condition = cond
      }
    } else {
      this._addCondition(bp, cond).then(({response=[], error}) => {
        if (error) {
          this.showError(error)
        } else {
          this.setFuncBreakpoints(response)
        }
      })
    }
    this.emitter.emit('update')
  }

  setLevel (level) {
    this._setLevel(level).then(({response, error}) => {
      if (error) {
        this.showError(error)
      }
      this.emitter.emit('update')
    })
  }

  showError (err) {
    atom.notifications.addError('Error in Debugger', {
      detail: err
    })
  }
}
