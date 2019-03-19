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
    etch.updateSync(this)
  }

  reset () {
    this.breakOnException = false
    this.breakOnUncaughtException = false

    this.stack = []

    this.info = {}
    etch.updateSync(this)
  }

  update () {}

  render () {
    return  <div className="ink-debugger-container">
              {this.toolbarView()}
              <div className="inner-container">
                {this.currentlyAtView()}
                {this.breakpointListView()}
              </div>
            </div>
  }

  // stepping
  toolbarView () {
    return  <div className="item toolbar">
      <div className="inner-toolbar">
        {toView(this.toolbar.view)}
      </div>
      <div className="next-expression">
        <span
          className="icon icon-chevron-right"
        >
        </span>
        <span className="code">{toView(this.info.text)}</span>
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
      <div className="header">
        <h4>Callstack</h4>
      </div>
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
                          <a onclick={() => open(item.file, item.line-1)}>{item.shortpath}:{item.line || '?'}</a>
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
    clearbps = () => this.breakpointManager.tryClear()
    toggleExc = () => this.breakpointManager.tryToggleException()
    toggleUnExc = () => this.breakpointManager.tryToggleUncaughtException()
    refresh = () => this.breakpointManager.tryRefresh()
    // FIXME: add this back in once JuliaInterpreter supports it
    // <tr>
    //   <td className="table-cell">
    //     <input
    //       class='input-checkbox'
    //       type='checkbox'
    //       disabled
    //       onclick={toggleUnExc}
    //       checked={this.breakpointManager.breakOnUncaught}>
    //     </input>
    //   </td>
    //   <td className="table-cell">Break on uncaught Exception</td>
    // </tr>
    return  <div className="item ink-table-container">
              <div className="header">
                <h4>Breakpoints</h4>
                <div className='btn-group'>
                  <Button icon='repo-sync' alt='Refresh' onclick={refresh}/>
                  <Button icon='circle-slash' alt='Clear Breakpoints' onclick={clearbps}/>
                </div>
              </div>
              <table className="ink-table">
                <thead>
                  <tr>
                    <th className="table-cell table-header">Active</th>
                    <th className="table-cell table-header">File</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="table-cell">
                      <input
                        class='input-checkbox'
                        type='checkbox'
                        onclick={toggleExc}
                        checked={this.breakpointManager.breakOnException}>
                      </input>
                    </td>
                    <td className="table-cell">Break on Exception</td>
                  </tr>
                  {this.breakpoints.map(item => {
                    return <tr>
                             <td className="table-cell">
                               <input
                                 class='input-checkbox'
                                 disabled
                                 type='checkbox'
                                 checked={item.isactive}>
                               </input>
                             </td>
                             <td className="table-cell">
                               <a onclick={() => open(item.file, item.line-1)}>{item.shortpath}:{item.line || '?'}</a>
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

  getDefaultLocation () {
    return 'right'
  }

  serialize () {
    return undefined
  }
}

DebuggerPane.registerView()
