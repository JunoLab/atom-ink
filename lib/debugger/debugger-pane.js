'use babel'
/** @jsx etch.dom */

import etch from 'etch'
import { toView, Toolbar, Button, Icon, makeicon, Etch, Raw } from '../util/etch'
import { CompositeDisposable, TextEditor } from 'atom'
import PaneItem from '../util/pane-item'
import { open } from '../util/opener'
import { DebuggerToolbar } from './toolbar'

// pane for side-to-side view of compiled code and source code
export default class DebuggerPane extends PaneItem {
  name = 'DebuggerPane'

  static activate () {
    subs = new CompositeDisposable()
  }

  static deactivate () {
    subs.dispose()
  }

  constructor (stepper, breakpointManager, buttons=[]) {
    super()

    this.stepper = stepper
    this.breakpointManager = breakpointManager

    this.toolbar = new DebuggerToolbar(buttons)

    this.stepper.onStep(arg => this.updateStep(arg))
    this.breakpointManager.onUpdate(arg => this.updateBreakpoints(arg))

    this.breakOnException = false
    this.breakOnUncaughtException = false

    this.stack = []
    this.breakpoints = []

    this.info = {}

    this.setTitle('Debugger')
    this.currentlyAtEditor = new TextEditor({
      showLineNumbers: false,
      readOnly: true
    })
    this.currentlyAtEditor.setGrammar(atom.grammars.grammarForScopeName("source.julia"))
    etch.initialize(this)
  }

  updateStep ({file, line, text, info}) {
    this.currentlyAtEditor.setText(info.moreinfo.code, {
      bypassReadOnly: true
    })
    let row = info.moreinfo.currentline - info.moreinfo.firstline
    this.currentlyAtEditor.setCursorBufferPosition([row, 0])
    this.info = {
      file,
      line,
      text,
      code: info.moreinfo.code
    }
    this.stack = info.stack
    etch.update(this)
  }

  updateBreakpoints ({breakpoints, breakOnException, breakOnUncaughtException}) {
    this.breakpoints = breakpoints
    etch.update(this)
  }

  reset () {
    this.breakOnException = false
    this.breakOnUncaughtException = false

    this.stack = []

    this.info = {}
    etch.update(this)
  }

  update () {}

  render () {
    return  <div className="ink-debugger-container">
              {this.toolbarView()}
              {this.currentlyAtView()}
              {this.breakpointListView()}
            </div>
  }

  // stepping
  toolbarView () {
    return  <div className="item toolbar">
      <div className="next-expression">
        Next expression: {toView(this.info.text)}
      </div>
      <div className="toolbar">
        {toView(this.toolbar.view)}
      </div>
    </div>
  }

  // callstack + current code
  currentlyAtView () {
    let editorHidden = !(this.info.code && this.info.code.length > 0)
    return  <div className="item">
      <div className={"debugger-editor " + (editorHidden ? "hidden" : "")}>
        {toView(this.currentlyAtEditor.element)}
      </div>
      <h4 className="callstack">Callstack</h4>
      <div className="ink-table-container">
        <table className="ink-table">
          <thead>
            <tr>
              <th className="table-cell table-header">Level</th>
              <th className="table-cell table-header">Function</th>
              <th className="table-cell table-header">File</th>
            </tr>
          </thead>
          <tbody>
            {this.stack.map(item => {
              return  <tr>
                        <td className="table-cell">{item.level || ''}</td>
                        <td className="table-cell">{item.name || '???'}</td>
                        <td className="table-cell">
                          <a onclick={() => open(item.file, item.line)}>{item.shortpath}:{item.line || '?'}</a>
                        </td>
                      </tr>
            })}
          </tbody>
        </table>
      </div>
    </div>
  }

  // breakpoints
  breakpointListView () {
    return  <div className="item ink-table-container">
              <h4>Breakpoints</h4>
              <table className="ink-table">
                <thead>
                  <tr>
                    <th className="table-cell table-header">Active</th>
                    <th className="table-cell table-header">File</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="table-cell">{this.breakOnException ? 'y' : 'n'}</td>
                    <td className="table-cell">Break on Exception</td>
                  </tr>
                  <tr>
                    <td className="table-cell">{this.breakOnUncaughtException ? 'y' : 'n'}</td>
                    <td className="table-cell">Break on uncaught Exception</td>
                  </tr>
                  {this.breakpoints.map(item => {
                    return <tr>
                             <td className="table-cell">{item.isactive ? 'y' : 'n'}</td>
                             <td className="table-cell">
                               <a onclick={() => open(item.file, item.line)}>{item.shortpath}:{item.line || '?'}</a>
                             </td>
                           </tr>
                  })}
                </tbody>
              </table>
            </div>
  }

  getIconName () {
    return 'bug'
  }
}

DebuggerPane.registerView()
