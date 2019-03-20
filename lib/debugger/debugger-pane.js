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

    this.subs = new CompositeDisposable()

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

    this.newBreakpointEditor = new TextEditor({
      mini: true,
      placeholderText: 'Break on...'
    })

    this.subs.add(atom.commands.add('.ink-breakpoint-container .editor', {
      'breakpoint:add': () => this.addBreakpoint()
    }))

    etch.initialize(this)
  }

  updateStep ({file, line, text, info}) {
    this.currentlyAtEditor.setText(info.moreinfo.code, {
      bypassReadOnly: true
    })
    this.currentlyAtEditor.setGrammar(atom.grammars.grammarForScopeName(this.breakpointManager.scopes))
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
    this.breakOnException = breakOnException
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
      <div className="ink-callstack-container">
        <div className="flex-table-container">
          {this.stack.map(item => {
             return <div class="flex-table row">
                      <div class="flex-row first">
                        {item.level}
                      </div>
                      <div class="flex-row second">
                        {item.name}
                      </div>
                      <div class="flex-row third">
                        <a onclick={() => open(item.file, item.line-1)}>{item.shortpath}:{item.line || '?'}</a>
                      </div>
                    </div>
          })}
        </div>
      </div>
    </div>
  }

  // breakpoints
  breakpointListView () {
    clearbps = () => this.breakpointManager.tryClear()
    toggleExc = () => this.breakpointManager.tryToggleException()
    toggleUnExc = () => this.breakpointManager.tryToggleUncaughtException()
    refresh = () => this.breakpointManager.tryRefresh()
    clearbp = (file, line) => this.breakpointManager.tryToggle(file, line)

    return  <div className="item ink-breakpoint-container">
              <div className="header">
                <h4 style="flex:1">
                  Breakpoints
                </h4>
                <div className='btn-group btn-group-sm'>
                  <Button icon='repo-sync' alt='Refresh' onclick={refresh}/>
                  <Button icon='circle-slash' alt='Clear Breakpoints' onclick={clearbps}/>
                </div>
              </div>
              <div class="flex-table-container">
                <div class="flex-table row">
                  <div class="flex-row first">
                    <input
                      class='input-checkbox'
                      type='checkbox'
                      onclick={toggleExc}
                      checked={this.breakOnException}>
                    </input>
                  </div>
                  <div class="flex-row second">Break on Exception</div>
                  <div class="flex-row third"></div>
                </div>
                {this.breakpoints.map(item => {
                  return <div class="flex-table row">
                           <div class="flex-row first">
                             <input
                               class='input-checkbox'
                               disabled
                               type='checkbox'
                               checked={item.isactive}>
                             </input>
                           </div>
                           <div class="flex-row second ellipsis">
                            <a onclick={() => open(item.file, item.line-1)}>{item.shortpath}:{item.line || '?'}</a>
                           </div>
                           <div class="flex-row third">
                             <Button
                               className="btn-xs"
                               icon='x'
                               alt='Clear Breakpoints'
                               onclick={() => clearbp(item.file, item.line)}
                             />
                           </div>
                         </div>
               })}
                <div class="flex-table row new-bp">
                  <div class="flex-row first">
                  </div>
                  <div class="flex-row second">
                   {toView(this.newBreakpointEditor.element)}
                  </div>
                  <div class="flex-row third">
                    <Button
                      className="btn-xs"
                      icon='plus'
                      alt='Add Breakpoint'
                      onclick={() => this.addBreakpoint()}
                    />
                  </div>
                </div>

              </div>
            </div>
  }

  addBreakpoint () {
    let editorContents = this.newBreakpointEditor.getText()
    this.newBreakpointEditor.setText('')
    this.breakpointManager.tryAddArgs(editorContents)
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
