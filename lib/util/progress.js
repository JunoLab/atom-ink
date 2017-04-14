'use babel'
/** @jsx dom */

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
let statusBar, overlay, tileView, tooltip, tile, activated

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
    return this.children[0]
  }

  update ({}, [stack]) {
    if (stack.length > 0) super.update({}, [stack])
  }

  render () {
    return <table>{
      this.stack.slice().reverse().map(({description, rightText, level}) =>
        <tr>
          <td className='progress-tr'>{description}</td>
          <td className='progress-tr'><Progress level={level} /></td>
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
  overlay.update()
  tileView.update()
}

export function activate () {
  if (activated) return
  activated = true

  overlay = view(() => <StackView>{stack}</StackView>)
  tileView = view(() => <span className='inline-block'>
    <Progress level={globalLevel()} />
  </span>)
  tooltip = new Tooltip(tileView.element, overlay.element, {cond: () => stack.length})

  if (statusBar) {
    tile = statusBar.addLeftTile({item: tileView.element, priority: -1})
  }
}

export function deactivate () {
  activated = false
  for (let t of [overlay, tileView, tooltip, tile]) {
    if (t) t.destroy()
  }
}

export function consumeStatusBar (bar) {
  statusBar = bar
}

export function add (prog, opts) {
  activate()
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
