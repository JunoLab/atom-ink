'use babel'

import { CompositeDisposable } from 'atom'

export class DebuggerToolbar {
  constructor (buttons) {
    this.currentEditor = null
    this.subs = new CompositeDisposable()

    let group = document.createElement('div')
    group.classList.add('btn-group', 'btn-group-sm')
    buttons.forEach((b) => group.appendChild(this.buttonView(b)))

    this.view = document.createElement('div')
    this.view.className = 'ink-debug-toolbar'
    this.view.appendChild(group)
  }

  buttonView ({icon, text, tooltip, command}) {
    let btn = document.createElement('button')
    btn.classList.add('btn', 'btn-primary')
    if (text) btn.innerText = text
    if (icon) btn.classList.add(`icon-${icon}`)
    btn.onclick = () => atom.commands.dispatch(atom.views.getView(atom.workspace), command)
    this.subs.add(atom.tooltips.add(btn, {
      title: tooltip,
      placement: 'top',
      class: 'ink-toolbar-tooltip'
    }))
    return btn
  }

  attach (ed) {
    this.detach()

    this.currentEditor = ed
    let edView = atom.views.getView(ed)
    edView.appendChild(this.view)
  }

  detach () {
    if (this.currentEditor && this.view) {
      atom.views.getView(this.currentEditor).removeChild(this.view)
    }
  }

  destroy () {
    this.detach()
    this.view = null
    this.subs.dispose()
  }
}
