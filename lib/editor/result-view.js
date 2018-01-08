'use babel'
import { CompositeDisposable } from 'atom'
import AnsiConverter from 'ansi-to-html'
import views from '../util/views'

let { span, div } = views.tags
let converter = new AnsiConverter()

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

    this.view.addEventListener('click', () => {
      if (!(this.overlayElement && this.overlayElement.parentNode)) return
      this.overlayElement.parentNode.appendChild(this.overlayElement)
      let edView
      if (edView = atom.views.getView(atom.workspace.getActiveTextEditor())) {
        edView.focus()
      }
    })

    if (fade) this.fadeIn()
    if (content != null) this.setContent(content, opts)
    if (loading) this.setContent(views.render(span('loading icon icon-gear')), opts)

    return this.view
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

    if (view.childElementCount == 0) {
      view.innerHTML = converter.toHtml(view.innerHTML)
    } else {
      let allNodes = view.getElementsByTagName('*')
      for (let i = -1, l = allNodes.length; ++i < l;) {
        if (allNodes[i].childElementCount == 0) {

          allNodes[i].innerHTML = converter.toHtml(allNodes[i].innerHTML)
        }
      }
    }

    this.view.appendChild(view)

    // HACK: don't display toolbar for "small" results
    if (this.toolbarView) {
      if (this.model.type === 'inline' && view.innerHTML.length < 100 ) {
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
  decideUpdateWidth (edRect) {
    this.isVisible = false
    this.left = 0
    this.newEdWidth = false
    if (this.overlayElement) {
      let rect = this.view.getBoundingClientRect()
      this.isVisible = rect.top < edRect.bottom && rect.bottom > edRect.top
      this.left = parseInt(this.getView().parentElement.style.left)
      this.newEdWidth = edRect.width !== this.lastEdWidth
    }
  }

  // only write to the DOM
  updateWidth (edRect) {
    if ((this.isVisible && this.newEdWidth) || this.modelUpdated) {
      let w = edRect.width + edRect.left - 40 - this.left
      if (w < 100) w = 100
      this.getView().style.maxWidth = w + 'px'
      this.lastEdWidth = edRect.width
      this.modelUpdated = false
    }
  }

  destroy () {
    this.view.classList.add('ink-hide')
    this.disposables.dispose()
  }
}
