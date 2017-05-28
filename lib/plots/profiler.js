'use babel';
/** @jsx etch.dom */

import { CompositeDisposable } from 'atom';
import etch from 'etch';
import Canopy from './canopy';
import { Badge, Icon, view } from '../util/etch.js'
import { prewalk, prefor } from './tree.js'

function namestring (func, file, line) {
  if (!func && !file) { return "Program" }
  return (func ? func + " at " : "") + file + (line == -1 ? "" : ":"+line)
}

function process (view, tree) {
  tree.name = "Program"
  return prewalk(tree, ({count, children, location, func, path, line}) => ({
    count,
    children,
    onmouseover: () => view.current = {func, location, line, count},
    onmouseout: () => view.current = null,
    onclick: () => atom.workspace.open(path, {initialLine: line-1, searchAllPanes: true})
  }))
}

function flatten (tree) {
  let cache = {}
  prefor(tree, ({path, line, count}) => {
    let key = JSON.stringify([path, line])
    let val = cache[key]
    if (!val) val = cache[key] = {file: path, line: line-1, count: 0}
    val.count += count
  })

  let lines = []
  for (k in cache) {
    cache[k].count /= tree.count
    lines.push(cache[k])
  }
  return lines
}

function toolbarView (current) {
  if (!current) return <span/>
  let {func, location, line, count} = current
  return <span>
    <span className='inline-block'><Badge>{count}</Badge></span>
    <span style='vertical-align:middle'>{namestring(func, location, line)}</span>
  </span>
}

export class ProfileViewer {
  constructor ({data}) {
    this.toolbar = view(() => toolbarView(this.current))
    this.data = process(this, data)
    this.highlights = require('../editor/highlights').profileLines(flatten(data))
    etch.initialize(this)
  }

  update ({data}) {
    this.data = process(this, data)
    etch.update(this)
  }

  _current = ""
  get current () { return this._current }
  set current (x) {
    this._current = x
    this.toolbar.update();
  }

  render () {
    return <Canopy data={this.data} />
  }

  destroy () {
    etch.destroy(this)
    this.highlights.destroy()
  }
}
