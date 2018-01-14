'use babel'
import {CompositeDisposable, Emitter} from 'atom'
import ResultView from './result-view'

let layers = {}

export default class Result {
  constructor (editor, lineRange, opts = {}) {
    this.emitter = new Emitter()
    this.disposables = new CompositeDisposable()
    this.editor = editor
    this.range = lineRange
    this.invalid = false

    opts.scope = opts.scope != null ? opts.scope : 'noscope'
    opts.type = opts.type != null ? opts.type : 'inline'
    opts.fade = opts.fade != null ? opts.fade : !(Result.removeLines(this.editor, this.range[0], this.range[1]))
    opts.loading = opts.loading != null ? opts.content : !(opts.content)
    opts.buttons = this.buttons()

    this.type = opts.type

    this.view = new ResultView(this, opts)
    this.attach()

    this.disposables.add(atom.commands.add(this.view.getView(), {'inline-results:clear': () => this.remove()}))

    this.text = this.getMarkerText()

    this.disposables.add(this.editor.onDidChange(() => this.validateText()))
  }

  setContent (view, opts) {
    this.view.setContent(view, opts)
  }

  attach () {
    if (!layers.hasOwnProperty(this.editor.id)) {
      layers[this.editor.id] = this.editor.addMarkerLayer()
    }
    if (this.isDestroyed) {return}
    this.marker = layers[this.editor.id].markBufferRange([[this.range[0], 0],
                    [this.range[1], this.editor.lineTextForBufferRow(this.range[1]).length]])
    this.marker.result = this

    this.decorateMarker()

    this.disposables.add(this.marker.onDidChange((e) => this.checkMarker(e)))
  }

  buttons () {
    return (result) => {
      return [
        {
          icon: 'icon-unfold',
          onclick: () => result.toggle()
        },
        {
          icon: 'icon-x',
          onclick: () => result.remove()
        }
      ]
    }
  }

  decorateMarker () {
    if (!this || this.isDestroyed) {return}
    let decr = {item: this.view.getView(), avoidOverflow: false}
    if (this.type === 'inline') {
      decr.type = 'overlay'
      decr.class = 'ink-overlay'
    } else if (this.type === 'block') {
      decr.type = 'block'
      decr.position = 'after'
    }
    this.decoration = this.editor.decorateMarker(this.marker, decr)

    setTimeout(() => this.emitter.emit('did-attach'), 50)
  }

  toggle () {
    if (this.type !== 'inline') return
    this.expanded ? this.collapse() : this.expand()
  }

  expand () {
    this.expanded = true
    if (this.decoration) this.decoration.destroy()
    let row = this.marker.getEndBufferPosition().row
    this.expMarker = this.editor.markBufferRange([[row, 0], [row, 1]])
    let decr = {
      item: this.view.getView(),
      avoidOverflow: false,
      type: 'overlay',
      class: 'ink-underlay',
      invalidate: 'never'
    }
    this.expDecoration = this.editor.decorateMarker(this.expMarker, decr)
    this.emitter.emit('did-update')
  }

  collapse () {
    this.expanded = false
    if (this.expMarker) this.expMarker.destroy()
    this.decorateMarker()
    this.emitter.emit('did-update')
  }

  onDidDestroy (f) {
    this.emitter.on('did-destroy', f)
  }

  onDidUpdate (f) {
    this.emitter.on('did-update', f)
  }

  onDidValidate (f) {
    this.emitter.on('did-validate', f)
  }

  onDidInvalidate (f) {
    this.emitter.on('did-invalidate', f)
  }

  onDidAttach (f) {
    this.emitter.on('did-attach', f)
  }

  onDidRemove (f) {
    this.emitter.on('did-remove', f)
  }

  remove () {
    this.emitter.emit('did-remove')
    this.isDestroyed = true
    setTimeout(() => this.destroy(), 200)
  }

  destroy () {
    this.emitter.emit('did-destroy')
    this.emitter.dispose()
    this.marker.destroy()
    if (this.expMarker) this.expMarker.destroy()
    this.disposables.dispose()
  }

  validate () {
    this.invalid = false
    this.emitter.emit('did-validate')
  }

  invalidate () {
    this.invalid = true
    this.emitter.emit('did-invalidate')
  }

  validateText (ed) {
    let text = this.getMarkerText()
    if (this.text === text && this.invalid) {
      this.validate()
    } else if (this.text !== text && !this.invalid) {
      this.invalidate()
    }
  }

  checkMarker (e) {
    if (!e.isValid || this.marker.getBufferRange().isEmpty()) {
      this.remove()
    } else if (e.textChanged) {
      let old = this.editor.bufferPositionForScreenPosition(e.oldHeadScreenPosition)
      let nu = this.editor.bufferPositionForScreenPosition(e.newHeadScreenPosition)
      if (old.isLessThan(nu)) {
        let text = this.editor.getTextInBufferRange([old, nu])
        if (text.match(/^\r?\n\s*$/)) {
          this.marker.setHeadBufferPosition(old)
        }
      }
    }
  }

  getMarkerText () {
    return this.editor.getTextInBufferRange(this.marker.getBufferRange()).trim()
  }

  // static methods

  static all () {
    let results = []
    for (let item of atom.workspace.getPaneItems()) {
      if (!atom.workspace.isTextEditor(item) || !layers[item.id]) continue
      layers[item.id].getMarkers().forEach(m => results.push(m.result))
    }
    return results
  }

  static invalidateAll () {
    for (let result of Result.all()) {
      result.text = ''
      result.invalidate()
    }
  }

  static forLines (ed, start, end, type = 'any') {
    if (!layers[ed.id]) return
    return layers[ed.id].findMarkers({intersectsBufferRowRange: [start, end]})
                        .filter((m) => (type === 'any' || m.result.type === type))
                        .map((m) => m.result)
  }

  static removeLines (ed, start, end, type = 'any') {
    let rs = Result.forLines(ed, start, end, type)
    if (!rs) return
    rs.map((r) => r.remove())
    rs.length > 0
  }

  static removeAll (ed = atom.workspace.getActiveTextEditor()) {
    if (!layers[ed.id]) return
    layers[ed.id].getMarkers().forEach((m) => m.result.remove())
  }

  static removeCurrent (e) {
    const ed = atom.workspace.getActiveTextEditor()
    let done = false
    if (ed) {
      for (let sel of ed.getSelections()) {
        let [start, end] = sel.getBufferRowRange()
        if (Result.removeLines(ed, start, end)) {
          done = true
        }
      }
    }
    if (!done) e.abortKeyBinding()
  }

  static toggleCurrent () {
    const ed = atom.workspace.getActiveTextEditor()
    for (const sel of ed.getSelections()) {
      const rs = Result.forLines(ed, sel.getHeadBufferPosition().row, sel.getTailBufferPosition().row)
      if (!rs) continue
      rs.forEach((r) => r.toggle())
    }
  }

  // Commands

  static activate () {
    this.subs = new CompositeDisposable()
    this.subs.add(atom.commands.add('atom-text-editor:not([mini])',
      {
        'inline:clear-current': (e) => Result.removeCurrent(e),
        'inline-results:clear-all': () => Result.removeAll(),
        'inline-results:toggle': () => Result.toggleCurrent()
      }))

    let listener = () => {
      for (let edid in layers) {
        let res = layers[edid].getMarkers().map((m) => m.result)
        res.filter((r) => r.style === 'inline')
        if (res.length === 0) continue
        // DOM reads
        let rect = res[0].editor.element.getBoundingClientRect()
        res.forEach((r) => r.view.decideUpdateWidth(rect))
        // DOM writes
        res.forEach((r) => r.view.updateWidth(rect))
      }
      setTimeout(() => {
        process.nextTick(() => window.requestAnimationFrame(listener))
      }, 15*1000/60)
    }
    window.requestAnimationFrame(listener)
    return
  }

  static deactivate () {
    this.subs.dispose()
  }
}
