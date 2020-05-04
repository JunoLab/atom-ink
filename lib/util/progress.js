'use babel'
/** @jsx dom */

import { CompositeDisposable, Disposable } from 'atom'
import etch from 'etch'
import { Etch, Progress, view, dom } from './etch';
import Tooltip from './tooltip';

// Progress Bars
//
// This module provides an API for displaying progress bars in Atom. The methods
// below allow modifing the stack of progress bars, which is represented by
// corresponding UI elements:
//    - A "global" progress bar is shown in the status bar. In pratice, this is
//      the first determinate progress bar in the stack. If there is none, the
//      first element (which then is indeterminate) will be shown instead. If the
//      stack is empty, an empty progress bar will be shown instead.
//    - Hovering over that status bar element will show the complete stack as
//      an overlay.
//    - Hovering over the actual progress bar of one such stack element will show
//      the message correesponding to that progress bar, if there is any.
//
// Methods:
//
// add(p = {progress: 0})
//    Create and return a ProgressBar with the initial properties specified by `p`,
//    which has the following methods available to it:
//
//    p.level
//        Updates `p`s progress. `prog` is a number between 0 and 1 or `null`; if
//        it is `null`, an indeterminate progress bar will be displayed.
//
//    p.description
//        Sets the text displayed to the left of the progress bar.
//
//    p.destroy()
//        Destroys `p` and removes it from the display stack.

let stack = []
let subs, activated, overlay, tileView, tooltip, tile

function clamp (x, min, max) {
  return Math.min(Math.max(x, min), max)
}

class ProgressBar {
  constructor (level, {description} = {}) {
    this._level = level
    this._description = description
  }

  destroy () {
    let i = stack.indexOf(this)
    if (i < 0) return
    stack.splice(i, 1)
    update()
  }
}

['level', 'description', 'rightText', 'message'].forEach(key => {
  Object.defineProperty(ProgressBar.prototype, key, {
    get: function () { return this['_' + key] },
    set: function (val) {
      this['_' + key] = val
      update()
    }
  })
})

class StackView extends Etch {
  get stack () {
    if (this._stack) {
      return this._stack
    } else {
      return []
    }
  }

  update (stack) {
    if (stack && stack.length > 0) this._stack = stack
    etch.update(this)
  }

  render () {
    return <table>{
      this.stack.slice().reverse().map(({description='', rightText='', level=0, message=""}) =>
        <tr>
          <td className='progress-tr'>{description}</td>
          <td className='progress-tr'><Progress level={level} message={message}/></td>
          <td className='progress-tr'>{rightText}</td>
        </tr>
      )
    }</table>
  }
}

function globalLevel () {
  if (stack.length === 0) return 0
  let global = stack.find(({level}) => level != null)
  if (global && global.level > 0.01) return global.level
}

function update () {
  if (stack.length === 0) tooltip.hide()
  overlay.update(stack)
  tileView.update()
}

export function consumeStatusBar (statusBar) {
  subs = new CompositeDisposable()
  tileView = view(() => (
    <span className='inline-block' style='display: none'>
      <Progress level={globalLevel()} />
    </span>
  ))
  overlay = new StackView()
  tooltip = new Tooltip(tileView.element, overlay.element, {
    cond: () => stack.length
  })
  tile = statusBar.addLeftTile({
    item: tileView.element,
    priority: -1
  })
  subs.add(new Disposable(() => {
    for (let t of [overlay, tileView, tooltip, tile]) {
      if (t) t.destroy()
    }
    activated = false
  }))
  activated = true
  return subs
}

export function add (prog, opts) {
  if (!activated) return
  show()
  let p = new ProgressBar(prog, opts)
  stack.push(p)
  update()
  return p
}

export function watch (p, opts) {
  let prog = add(null, opts)
  p.catch(() => {}).then(() => prog.destroy())
  return prog
}

export function show () {
  tileView.element.style.display = ''
}

export function hide () {
  tileView.element.style.display = 'none'
}

export function deactivate () {
  if (subs) subs.dispose()
}
