'use babel'
/** @jsx etch.dom */

import etch from 'etch';
import { Emitter, CompositeDisposable } from 'atom'

import { Raw, Toolbar, Button } from '../util/etch.js'
import PaneItem from '../util/pane-item'
import ConsoleElement from './view'
import HistoryProvider from './history'
import { closest } from './helpers'

let getConsole = el => closest(el, 'ink-console').getModel()

// ## Console API - in Javascript

// NOTE: This is incomplete, but it should help you get a an overview of the console itself

// In general you need to do 4 things to get a working console:
// - Register a console object via: ink.Console.fromId('console-id')
// - set the console modes via: console.setModes(modes), where modes is a vector of
//     {name: 'mode-name', default: true, grammar: 'source.language', icon: 'icon-name'}, and
//     console is the previously created console
// - activate the console object via: console.activate()
// - open a console pane via: atom.workspace.open('atom://language-client/console',
//                                                { split: 'down', searchAllPanes: true })
//   with a unique URI for your language, the position of the console on the workspace and
//   whether or not to have a unique console in your workspace. The previous works provided that
//   you have already registered an opener for your console via: atom.workspace.addOpener(uri-function)

// Once created you can interact with the console like this:
// - console.stderr('string') displays the string with a yellow color and a warning sign on the gutter
// - console.stdout('string') displays the string with the default color and a quotation mark on the gutter
// - console.info('string') displays the string with a blue color and an `i` on the gutter
// - console.result(HTMLElement, {error: true|false}) displays the HTML element according to the error flag
//    on error: red text with an `x` on the gutter
//    on normal-result:  default text color with  a `✓` on the gutter

export default class Console extends PaneItem {
  static activate() {
    this.subs = new CompositeDisposable
    this.subs.add(atom.commands.add('ink-console .editor', {
      'console:evaluate': ({target}) => getConsole(target).eval(target),
      'core:move-up':     (e)        => getConsole(e.target).keyUp(e, e.target),
      'core:move-down':   (e)        => getConsole(e.target).keyDown(e, e.target),
      'core:move-left':   ({target}) => getConsole(target).resetPrefix(),
      'core:move-right':  ({target}) => getConsole(target).resetPrefix(),
      'core:backspace':   ({target}) => getConsole(target).cancelMode(target)
    }))

    this.subs.add(atom.commands.add('ink-console', {
      'core:copy': () => {
        let sel
        if (sel = document.getSelection().toString()) {
          atom.clipboard.write(sel)
        }
      },
      'console:previous-in-history': () => this.previous(),
      'console:next-in-history': () => this.next()
    }))
  }

  static deactivate() {
    this.subs.dispose()
  }

  constructor({initialInput}={}) {
    super()
    this.setTitle('Console')
    this.items = []
    this.maxSize = 1000
    this.history = new HistoryProvider
    this.emitter = new Emitter
    if (typeof initialInput === 'undefined' || initialInput === null) { initialInput = true }
    if (initialInput) { setTimeout((() => this.input()), 100) } // Wait for grammars to load
    this.view = new ConsoleElement
    this.view.initialize(this)
    etch.initialize(this)
    this.element.tabIndex = -1
    this.element.onfocus = () => {
      if (document.activeElement == this.element) this.view.focus()
    }
  }

  _toolbar = []

  set toolbar(bar) {
    this._toolbar = bar
    etch.update(this)
  }
  get toolbar() { return this._toolbar }

  update() {}

  render() {
    let bar = [
      <div className='btn-group'>
        <Button alt='Previous Input' icon='arrow-up' onclick={()=>this.previous()} />
        <Button alt='Next Input' icon='arrow-down' onclick={()=>this.next()} />
      </div>,
      <div className='btn-group'>
        <Button alt='Run' icon='zap' onclick={()=>this.eval(this.getInput())} />
        <Button alt='Clear' icon='circle-slash' onclick={()=>this.reset()} />
      </div>,
    ]
    if (this.toolbar) bar.push(...this.toolbar)
    return <Toolbar items={bar}>
      <Raw>{this.view}</Raw>
    </Toolbar>
  }

  getIconName() {
    return "terminal"
  }

  // Basic item / input logic

  push(cell) {
    this.items.push(cell)
    this.emitter.emit('did-add-item', cell)
    this.limitHistory()
  }

  updateItem(item, changed) {
    return (() => {
      let result = []
      for (let key in changed) {
        let val = changed[key]
        item[key] = val
        result.push(this.emitter.emit('did-update-item', {item, key}))
      }
      return result
    })()
  }

  onDidUpdateItem(f) { return this.emitter.on('did-update-item', f) }

  onDidAddItem(f) { return this.emitter.on('did-add-item', f) }

  onDidDeleteFirstItems(f) { return this.emitter.on('did-delete-first-items', f) }

  insert(cell, i) {
    if (i >= this.items.length || this.items.length === 0) {
      this.push(cell)
    } else {
      this.items.splice(i, 0, cell)
      this.emitter.emit('did-insert-item', [cell, i])
      this.limitHistory()
    }
  }

  limitHistory() {
    let itemsToDelete = this.items.length - this.maxSize
    if (itemsToDelete <= 0) return
    this.items.splice(0, itemsToDelete)
    this.emitter.emit('did-delete-first-items', itemsToDelete)
  }

  onDidInsertItem(f) { return this.emitter.on('did-insert-item', f) }

  clear(cell) {
    this.items = []
    this.emitter.emit('did-clear')
  }

  onDidClear(f) { return this.emitter.on('did-clear', f) }

  onceDidClear(f) { let d
  return d = this.onDidClear(x => (d.dispose(), f(x))) }

  getInput() {
    let last = this.items[this.items.length-1]
    if (last && last.input) return last
  }

  lastOutput() { return this.items[this.items.length - (this.getInput() ? 2 : 1)] }

  input() {
    this.resetPrefix()
    if (!this.getInput()) {
      let item = {type: 'input', input: true}
      this.push(this.setMode(item))
      this.watchModes(item)
      this.focusInput()
      return item
    } else {
      return this.getInput()
    }
  }

  done() {
    if (this.getInput()) {
      this.getInput().input = false
      this.emitter.emit('done')
    }
  }

  onDone(f) { return this.emitter.on('done', f) }

  output(cell) {
    if (this.getInput() != null) {
      this.insert(cell, this.items.length-1)
    } else {
      this.push(cell)
    }
  }

  reset() {
    let inputText = this.items.length > 1 && this.getInput() ? this.getInput().editor.getText() : ""
    this.done()
    this.clear()
    this.input().editor.setText(inputText)
    this.history.resetPosition()
    this.focusInput()
  }

  itemForView(view) {
    if (!(view instanceof HTMLElement)) { return view }
    for (let item of this.items) {
      if (item.cell.contains(view)) {
        return item
      }
    }
    return false
  }

  eval(item) {
    let input
    item = this.itemForView(item)
    if (!item) return
    if (item.eval != null) {
      item.eval()
    } else if (item.input) {
      this.emitter.emit('eval', item)
    } else if (input = this.getInput()) {
      input.editor.setText(item.editor.getText())
      this.focusInput()
    }
  }

  onEval(f) { return this.emitter.on('eval', f) }

  focusInput() {
    if (this.getInput() != null) { this.emitter.emit('focus-input') }
  }

  onFocusInput(f) { return this.emitter.on('focus-input', f) }

  loading(status) { return this.emitter.emit('loading', status) }

  onLoading(f) { return this.emitter.on('loading', f) }

  // Output

  bufferOut(item) {
    let {type, text} = item
    let last = this.lastOutput()
    if (last && last.type === type && (last.expires > performance.now() || !last.text)) {
      this.updateItem(last, {text: last.text + text})
    } else {
      this.output(item)
    }
    this.lastOutput().expires = performance.now() + 100
  }

  stdout(s) { this.bufferOut({type: 'stdout', icon: 'quote', text: s}) }

  stderr(s) { this.bufferOut({type: 'stderr', icon: 'alert', text: s}) }

  info(s) { this.bufferOut({type: 'info', icon: 'info', text: s}) }

  result(r, {error}={}) {
    this.output({
      type: 'result',
      icon: error ? 'x' : 'check',
      result: r,
      error
    })
  }

//                ___                 _ _ _
//               ( /            _/_  ( / ) )      /
//                /_   ,_   , , /     / / / __ __/ _  (
//              _// /_/|_)_(_/_(__   / / (_(_)(_/_(/_/_)_
//                        /|
//                       (/

  getModes() { return [] }

  setModes(modes) { this.getModes = () => modes }

  defaultMode() {
    for (let mode of this.getModes()) {
      if (mode.prefix == null) { return mode }
    }
    return {}
  }

  getMode(name) {
    if (name instanceof Object) { return name }
    for (let mode of this.getModes()) {
      if (mode.name === name) { return mode }
    }
    return this.defaultMode()
  }

  modeForPrefix(prefix) {
    for (let mode of this.getModes()) {
      if (mode.prefix === prefix || mode.prefix === prefix) { return mode }
    }
  }

  setMode(item, mode = this.defaultMode()) {
    mode = this.getMode(mode)
    this.updateItem(item, {mode, icon: mode.icon || 'chevron-right', grammar: mode.grammar})
    return item
  }

  cursorAtBeginning(ed) {
    return ed.getCursors().length === 1 &&
    ed.getCursors()[0].getBufferPosition().isEqual([0, 0])
  }

  watchModes(item) {
    let {editor, mode} = item
    if (editor == null) { return }
    if (this.edListener) this.edListener.dispose()
    this.edListener = editor.onWillInsertText(e => {
      let newmode = this.modeForPrefix(e.text)
      if ((newmode != null) && this.cursorAtBeginning(editor) && newmode !== mode) {
        e.cancel()
        return this.setMode(item, newmode)
      }
    }
    )
    return item
  }

  cancelMode(item) {
    let {editor} = item = this.itemForView(item)
    if (this.cursorAtBeginning(editor)) {
      this.setMode(item)
    }
  }

//                        __  ___      __
//                       / / / (_)____/ /_____  _______  __
//                      / /_/ / / ___/ __/ __ \/ ___/ / / /
//                     / __  / (__  ) /_/ /_/ / /  / /_/ /
//                    /_/ /_/_/____/\__/\____/_/   \__, /
//                                                /____/

  logInput() {
    let inp = this.getInput()
    if (inp == null) return
    let {editor, mode} = inp
    this.history.push({
      input: editor.getText(),
      mode: mode && mode.name
    })
  }

  resetPrefix() {
    this.prefix && this.prefix.listener && this.prefix.listener.dispose()
    delete this.prefix
  }

  moveHistory(up) {
    let inp = this.getInput()
    if (inp == null) return

    let {editor} = inp
    let {pos} = this.prefix || {}
    if ((editor.getText() || !this.prefix) && (pos && pos[0]) !== Infinity) {
      this.resetPrefix()
      let pos = editor.getCursorBufferPosition()
      let text = editor.getTextInRange([[0,0], pos])
      if (text === '') { pos = [Infinity, Infinity] }
      this.prefix = {pos, text}
    }
    let next = up ?
      this.history.getPrevious(this.prefix.text) :
      this.history.getNext(this.prefix.text)
    this.prefix.listener && this.prefix.listener.dispose()
    editor.setText(next.input)
    this.setMode(this.getInput(), next.mode)
    editor.setCursorBufferPosition((this.prefix && this.prefix.pos) || [0, 0])
    // HACK: delay this a little so that we don't see the grammar change event
    setTimeout(() => this.prefix && (this.prefix.listener = editor.onDidChange((e)=>this.resetPrefix())), 10)
  }

  previous() { this.moveHistory(true) }
  next() { this.moveHistory(false) }

  keyUp(e, item) {
    let {editor, input} = this.itemForView(item)
    if (input) {
      let curs = editor.getCursorsOrderedByBufferPosition()
      if (curs.length === 1 && ((this.prefix != null) || curs[0].getBufferRow() === 0)) {
        e.stopImmediatePropagation()
        this.previous()
      }
    }
  }

  keyDown(e, item) {
    let {editor, input} = this.itemForView(item)
    if (input) {
      let curs = editor.getCursorsOrderedByBufferPosition()
      if (curs.length === 1 && ((this.prefix != null) || curs[0].getBufferRow()+1 === editor.getLineCount())) {
        e.stopImmediatePropagation()
        this.next()
      }
    }
  }
}

Console.registerView()
