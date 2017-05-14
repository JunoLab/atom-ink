'use babel'
import {CompositeDisposable, Emitter} from 'atom'
import ResultView from './result-view'
import fastdom from 'fastdom'

let layers = {}

export default class Result {
  constructor (editor, lineRange, opts) {
    this.emitter = new Emitter()
    this.disposables = new CompositeDisposable()

    this.editor = editor
    let [start, end] = lineRange
    this.start = start
    this.end = end
    this.invalid = false

    opts.scope = opts.scope != null ? opts.scope : ''
    opts.type = opts.type != null ? opts.type : 'inline'
    opts.fade = opts.fade != null ? opts.fade : !(Result.removeLines(this.editor, this.start, this.end))
    opts.loading = opts.loading != null ? opts.content : !(opts.content)
    opts.buttons = this.buttons()

    this.type = opts.type

    this.view = new ResultView(this, opts)
    this.attach()

    this.txt = this.getMarkerText()

    this.disposables.add(this.editor.onDidChange(() => this.validateText()))

    return this
  }

  setContent (view, opts) {
    this.view.setContent(view, opts)
  }

  attach () {
    if (!layers.hasOwnProperty(this.editor.id)) {
      layers[this.editor.id] = this.editor.addMarkerLayer()
    }
    this.marker = layers[this.editor.id].markBufferRange([[this.start, 0],
                    [this.end, this.editor.lineTextForBufferRow(this.end).length]])
    this.marker.result = this

    this.decorateMarker()

    this.disposables.add(this.marker.onDidChange((e) => this.checkMarker(e)))
  }

  buttons () {
    let i1 = this.expanded ? 'icon-fold' : 'icon-unfold'
    return () => [
      {
        icon: i1,
        onclick: () => this.toggle()
      },
      {
        icon: 'icon-x',
        onclick: () => this.remove()
      }
    ]
  }

  decorateMarker () {
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
    setTimeout(() => this.destroy(), 200)
  }

  destroy () {
    this.emitter.emit('did-destroy')
    this.isDestroyed = true
    this.emitter.dispose()
    this.marker.destroy()
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
    let txt = this.getMarkerText()
    if (this.txt === txt && this.invalid) {
      this.validate()
    } else if (this.txt !== txt && !this.invalid) {
      this.invalidate()
    }
  }

  checkMarker (e) {
    if (!e.isValid || this.marker.getBufferRange().isEmpty()) {
      this.remove()
    } else if (e.textChanged) {
      let old = e.oldHeadScreenPosition
      let nu = e.newHeadScreenPosition
      if (old.isLessThan(nu)) {
        let text = this.editor.getTextInRange([old, nu])
        if (text.match(/^\r?\n\s*$/)) {
          this.marker.setHeadBufferPosition(old)
        }
      }
    }
  }

  getMarkerText () {
    return this.editor.getTextInRange(this.marker.getBufferRange()).trim()
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
      delete result.text
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
        if (Result.removeLines(ed, sel.getHeadBufferPosition().row, sel.getTailBufferPosition().row)) {
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
      setTimeout(() => {
        for (let edid in layers) {
          let res = layers[edid].getMarkers().map((m) => m.result)
          res.filter((r) => r.style === 'inline')
          if (res.length === 0) continue
          let rect = null
          fastdom.measure(() => {
            rect = res[0].editor.editorElement.getBoundingClientRect()
            res.forEach((r) => r.view.decideUpdateWidth(rect))
          })

          fastdom.mutate(() => {
            res.forEach((r) => r.view.updateWidth(rect))
          })
        }
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