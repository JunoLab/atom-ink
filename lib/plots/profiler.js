;
/** @jsx etch.dom */

import etch from 'etch';
import Canopy from './canopy';
import { Badge, view, Button } from '../util/etch.js'
import { prewalk, prefor } from './tree.js'
import { open } from '../util/opener'
import { remote } from 'electron'

function namestring (func, file, line, classes) {
  if (!func && !file) { return "Program" }
  return (
    (func ? func + " at " : "") +
    file +
    (line === -1 ? "" : ":" + line) +
    (classes.length === 0 ? "" : " (" + classes.join(", ") + ")")
  )
}

function process (view, tree) {
  tree.name = "Program"
  return prewalk(tree, ({count, classes, children,
                         location, func, path, line}) => ({
    count,
    classes,
    children,
    onmouseover: () => view.current = {func, location, line, count, classes},
    onmouseout: () => view.current = null,
    onclick: () => open(path, line-1, {pending: true})
  }))
}

function flatten (tree) {
  const cache = {}
  prefor(tree, ({path, line, count, classes}) => {
    const key = JSON.stringify([path, line])
    let val = cache[key]
    if (!val) val = cache[key] = {file: path, line: line-1, count: 0, classes}
    val.count += count
  })

  const lines = []
  for (const k in cache) {
    cache[k].count /= tree.count
    lines.push(cache[k])
  }
  return lines
}

export class ProfileViewer {
  constructor ({data, customClass='', save=null}) {
    this.rawData = data
    this.data = process(this, data)
    this.save = save
    this.customClass = customClass
    this.highlights = require('../editor/highlights').profileLines(flatten(this.rawData))

    this.toolbar = view(() => this.toolbarView(this.current))

    etch.initialize(this)
    etch.update(this)
  }

  saveData () {
    const path = remote.dialog.showSaveDialog({title: 'Save Profile Trace'})
    this.save(path)
  }

  toolbarView (current) {
    const always = <span className='btn-group'>
                   <Button icon='file' alt='Save' disabled={!this.save} onclick={() => this.saveData()}/>
                 </span>
    if (!current) return <span>{always}</span>
    const {func, location, line, count, classes} = current
    return <span>
      {always}
      <span className='inline-block'><Badge>{count}</Badge></span>
      <span style='vertical-align:middle'>{namestring(func, location, line, classes)}</span>
    </span>
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
    return <Canopy className={this.customClass} data={this.data} />
  }

  build () {
    this.teardown()
    this.highlights = require('../editor/highlights').profileLines(flatten(this.rawData))
  }

  teardown () {
    this.highlights.destroy()
  }

  destroy () {
    etch.destroy(this)
  }
}
