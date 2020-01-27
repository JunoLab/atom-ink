'use babel'
import { CompositeDisposable } from 'atom'
import views from '../util/views'
import ansiToHTML from '../util/ansitohtml'

let { span, div } = views.tags

const MIN_RESULT_WIDTH = 30
const RESULT_OFFSET = 20
const RESULT_HIDE_OFFSET = 3

export default class ResultView {
  constructor (model, opts = {}) {
    this.model = model
    this.disposables = new CompositeDisposable()
    this.completeView(opts)

    this.model.onDidRemove(() => this.destroy())
    this.model.onDidUpdate(() => this.modelUpdated = true)
    this.model.onDidInvalidate(() => this.view.classList.add('invalid'))
    this.model.onDidValidate(() => this.view.classList.remove('invalid'))
    this.model.onDidAttach(() => this.overlayElement = this.complete.parentElement)

    this.lastEdWidth = -1

    // HACK: compatibility to proto-repl:
    this.classList = {add() {}}

    return this
  }

  getView () {
    return this.model.type == 'inline' ? this.complete : this.view
  }

  getContent () {
    return this.view
  }

  getRawContent () {
    return this.rawContent
  }

  completeView (opts) {
    this.complete = document.createElement('div')
    this.complete.classList.add('ink-result-container')
    if (!opts.noTB && opts.type === 'inline') {
      this.toolbarView = this.toolbar(opts.buttons, opts.customButtons)
      this.complete.appendChild(this.toolbarView)
    }

    this.complete.appendChild(this.content(opts))

    this.disposables.add(atom.config.observe('editor.lineHeight', (h) => {
      this.complete.style.top = -h + 'em'
      this.complete.style.minHeight = h + 'em'
    }))
  }

  content (opts) {
    let {content, fade, loading, type} = opts
    this.view = document.createElement('div')
    this.view.setAttribute('tabindex', '-1')
    this.view.classList.add('ink', 'result', opts.scope)
    if (type === 'inline') {
      this.view.classList.add('inline')
    } else if (type === 'block') {
      this.view.classList.add('under')
    }

    this.view.addEventListener('mousewheel', (e) => {
      if ((this.view.offsetHeight < this.view.scrollHeight ||
           this.view.offsetWidth  < this.view.scrollWidth) &&
          ((e.deltaY > 0 && this.view.scrollHeight - this.view.scrollTop > this.view.clientHeight) ||
           (e.deltaY < 0 && this.view.scrollTop > 0) ||
           (e.deltaX > 0 && this.view.scrollWidth - this.view.scrollLeft > this.view.clientWidth) ||
           (e.deltaX < 0 && this.view.scrollLeft > 0))) {
        e.stopPropagation()
      }
    })

    this.view.addEventListener('mouseup', ev => {
      if (ev.button === 1) {
        // middle mouse button
        this.model.remove()
        this.focusEditor()
      } else if (document.getSelection().toString().length === 0) {
        this.focusEditor()
      }
    })

    this.view.addEventListener('mousedown', ev => {
      this.blurEditor()
    })

    this.view.addEventListener('mouseleave', ev => {
      this.focusEditor()
    })

    if (fade) this.fadeIn()
    if (content != null) this.setContent(content, opts)
    if (loading) this.setContent(views.render(span('loading icon icon-gear')), opts)

    return this.view
  }

  blurEditor (ed) {
    const c = this.model.editor.component
    if (c && c.didBlurHiddenInput) {
      c.didBlurHiddenInput({
        relatedTarget: null
      })
    }
  }

  focusEditor () {
    const c = this.model.editor.component
    if (c && c.didFocus) {
      c.didFocus()
    }
  }

  fadeIn () {
    this.view.classList.add('ink-hide')
    setTimeout(() => this.view.classList.remove('ink-hide'), 20)
  }

  setContent (view, {error = false, loading = false}) {
    this.rawContent  = [view, {error, loading}]
    while (this.view.firstChild != null) {
      this.view.removeChild(this.view.firstChild)
    }
    error ? this.view.classList.add('error') : this.view.classList.remove('error')
    loading ? this.view.classList.add('loading') : this.view.classList.remove('loading')

    ansiToHTML(view)

    this.view.appendChild(view)

    // HACK: don't display toolbar for "small" results
    if (this.toolbarView) {
      if (this.model.type === 'inline' && view.innerHTML && view.innerHTML.length < 100 ) {
        this.toolbarView.classList.add('hide')
      } else {
        this.toolbarView.classList.remove('hide')
      }
    }
  }

  toolbar (buttons, customButtons) {
    let tb = views.render(div('btn-group'))
    let addButtons = (buttons) => {
      for (let b of buttons(this.model)) {
        let v = document.createElement('button')
        v.classList.add('btn', b.icon)
        v.addEventListener('click', b.onclick)
        tb.appendChild(v)
      }
    }
    if (customButtons) addButtons(customButtons)
    addButtons(buttons)
    return views.render(div('ink-result-toolbar', tb))
  }

  // only read from the DOM
  decideUpdateWidth (edRect, winWidth) {
    this.edRect = edRect
    this.winWidth = winWidth
    this.isVisible = false
    this.left = 0
    this.shouldRedraw = false
    if (this.overlayElement) {
      let rect = this.getView().getBoundingClientRect()
      let parentRect = this.getView().parentElement.getBoundingClientRect()
      this.left = parseInt(this.getView().parentElement.style.left)
      this.isVisible = parentRect.top - RESULT_HIDE_OFFSET < edRect.bottom &&
                       rect.top + RESULT_HIDE_OFFSET > edRect.top &&
                       rect.left > edRect.left
      this.shouldRedraw = true
    }
  }

  // only write to the DOM
  updateWidth () {
    if (!!this.isVisible || this.model.expanded) {
      this.getView().style.visibility = 'visible'
      this.getView().style.pointerEvents = 'auto'
    } else {
      this.getView().style.visibility = 'hidden'
      this.getView().style.pointerEvents = 'none'
    }
    if (!!this.isVisible && (this.shouldRedraw || this.modelUpdated)) {
      let w = this.edRect.right - RESULT_OFFSET - 10 - this.left
      if (w < MIN_RESULT_WIDTH) w = MIN_RESULT_WIDTH
      if (this.edRect.width > 0 && this.left + RESULT_OFFSET + w > this.edRect.right) {
        this.getView().style.left = (this.edRect.right - w - 10 - this.left) + 'px'
        this.getView().style.opacity = 0.75
      } else {
        this.getView().style.left = RESULT_OFFSET + 'px'
        this.getView().style.opacity = 1.0
      }
      this.getView().parentElement.style.maxWidth = (this.winWidth - RESULT_OFFSET - 10 - this.left) + 'px'
      this.getView().style.maxWidth = w + 'px'
      this.modelUpdated = false
    }
  }

  destroy () {
    this.view.classList.add('ink-hide')
    this.disposables.dispose()
  }
}
