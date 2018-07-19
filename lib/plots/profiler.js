'use babel';
/** @jsx etch.dom */

import { CompositeDisposable } from 'atom';
import etch from 'etch';
import Canopy from './canopy';
import { Badge, Icon, view, Button } from '../util/etch.js'
import { prewalk, prefor } from './tree.js'
import { open } from '../util/opener'
import { remote } from 'electron'

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
    onclick: () => open(path, line-1)
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

export class ProfileViewer {
  constructor ({data, save=null}) {
    this.rawData = data
    this.data = process(this, data)
    this.save = save
    this.highlights = require('../editor/highlights').profileLines(flatten(this.rawData))

    this.toolbar = view(() => this.toolbarView(this.current))
    
    etch.initialize(this)
    etch.update(this)
  }

  saveData () {
    path = remote.dialog.showSaveDialog({title: 'Save Profile Trace'})
    this.save(path)
  }

  toolbarView (current) {
    let always = <span className='btn-group'>
                   <Button icon='file' alt='Save' disabled={!this.save} onclick={() => this.saveData()}/>
                 </span>
    if (!current) return <span>{always}</span>
    let {func, location, line, count} = current
    return <span>
      {always}
      <span className='inline-block'><Badge>{count}</Badge></span>
      <span style='vertical-align:middle'>{namestring(func, location, line)}</span>
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
    return <Canopy data={this.data} />
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
