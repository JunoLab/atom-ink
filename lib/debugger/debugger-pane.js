'use babel'
/** @jsx etch.dom */

import etch from 'etch'
import { toView, Toolbar, Tip, Button, Icon, makeicon, Etch, Raw } from '../util/etch'
import { showBasicModal } from '../util/basic-modal'
import { CompositeDisposable, TextEditor } from 'atom'
import PaneItem from '../util/pane-item'
import { open } from '../util/opener'
import views from '../util/views'
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

    this.stepper.onStep(arg => this.updateStepper(arg))
    this.breakpointManager.onUpdate(arg => this.updateBreakpoints(arg))

    this.stack = []
    this.activeLevel = undefined

    this.allActive = true

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

  updateStepper ({file, line, text, info}) {
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
    this.activeLevel = info.level
    etch.update(this)
  }

  updateBreakpoints () {
    etch.update(this)
  }

  reset () {
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
    let toggleCompiled = () => this.breakpointManager.toggleCompiled()

    return  <div className="item toolbar">
      <div className="inner-toolbar">
        {toView(this.toolbar.view)}
      </div>

      <div className="next-expression">
        <span
          className="icon icon-chevron-right"
        >
        </span>
        <span className="code">{toView(views.render(views.tags.span('stepper-label', this.info.text)))}</span>
      </div>

      <div className="flex-table-container">
        <div class="flex-table row">
          <div class="flex-row first">
            <input
              class='input-checkbox'
              type='checkbox'
              onclick={toggleCompiled}
              checked={this.breakpointManager.compiledMode}>
            </input>
          </div>
          <div class="flex-row second">
            Run in Compiled Mode
          </div>
          <div class="flex-row third"></div>
        </div>
      </div>
    </div>
  }

  // callstack + current code
  currentlyAtView () {
    let setLevel = (level) => {
      this.breakpointManager.setLevel(level)
    }

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
             return <div className={`flex-table row ${item.level == this.activeLevel ? "active" : ""}`}>
                      <div className="flex-row first">
                        <a onclick={() => setLevel(item.level)}>
                          {item.level}
                        </a>
                      </div>
                      <div className="flex-row second code">
                        {item.name}
                      </div>
                      <div className="flex-row third">
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
    let clearbps = () => this.breakpointManager.clear()
    let toggleExc = () => this.breakpointManager.toggleException()
    let toggleUnExc = () => this.breakpointManager.toggleUncaughtException()
    let refresh = () => this.breakpointManager.refresh()
    let toggleAllActive = () => {
      this.breakpointManager.toggleAllActive(this.allActive)
      this.allActive = !this.allActive
    }

    return  <div className="item ink-breakpoint-container">
              <div className="header">
                <h4 style="flex:1">
                  Breakpoints
                </h4>
                <div className='btn-group btn-group-sm'>
                  <Button
                    alt='Toggle Breakpoints'
                    onclick={ toggleAllActive }
                  >
                    Toggle All
                  </Button>
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
                      checked={this.breakpointManager.breakOnException}>
                    </input>
                  </div>
                  <div class="flex-row second">Break on Exception</div>
                  <div class="flex-row third"></div>
                </div>
                <div class="flex-table row">
                  <div class="flex-row first">
                    <input
                      class='input-checkbox'
                      type='checkbox'
                      onclick={toggleUnExc}
                      checked={this.breakpointManager.breakOnException}>
                    </input>
                  </div>
                  <div class="flex-row second">Break on Uncaught Exception</div>
                  <div class="flex-row third"></div>
                </div>
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
                {
                  this.breakpointManager.getFileBreakpoints().map(bp => {
                    return this.breakpointView(bp)
                  })
                }
                <hr></hr>
                {
                  this.breakpointManager.getFuncBreakpoints().map(bp => {
                    return this.breakpointView(bp)
                  })
                }
              </div>
            </div>
  }

  breakpointView (bp) {
    let item = bp
    item.toggleActive = () => this.breakpointManager.toggleActive(bp)
    item.onclick = () => open(bp.file, bp.line-1)
    item.remove = () => this.breakpointManager.remove(bp)
    if (item.typ === 'source') {
      item.tooltip = bp.file || ''
      item.condition = bp.condition || ''
      item.description = (bp.shortpath || bp.file || '???')+':'+(bp.line || '?')
    } else {
      item.condition = bp.condition || ''
      item.tooltip = bp.description || ''
      item.description = bp.description || ''
    }

    return <div class="flex-table row">
             <div class="flex-row first">
               <input
                 class='input-checkbox'
                 type='checkbox'
                 onclick={ item.toggleActive }
                 checked={ item.isactive }>
               </input>
             </div>
             <div class="flex-row second ellipsis-outer">
               <div class="ellipsis-inner">
                 <Tip alt={ item.tooltip }>
                   <a onclick={item.onclick}>
                     { ' ' + item.description }
                   </a>
                 </Tip>
               </div>
             </div>
             <div class="flex-row condition ellipsis-outer">
               <div class="ellipsis-inner">
                 <Tip alt={ item.condition }>
                   <span>
                     { ' ' + item.condition }
                   </span>
                 </Tip>
               </div>
             </div>
             <div class="flex-row">
               <Button
                 className="btn-xs"
                 icon='split' alt='Edit Condition'
                 onclick={() => this.addCondition(bp)}
               />
             </div>
             <div class="flex-row">
               <Button
                 className="btn-xs"
                 icon='x'
                 alt='Delete Breakpoint'
                 onclick={ item.remove }
               />
             </div>
           </div>
  }

  addBreakpoint () {
    let editorContents = this.newBreakpointEditor.getText()
    this.newBreakpointEditor.setText('')
    this.breakpointManager.addArgsBreakpoint(editorContents)
  }

  addCondition (bp) {
    showBasicModal([{
      name: "Condition",
      value: bp.condition
    }]).then(items => {
      let cond = items["Condition"]
      this.breakpointManager.addCondition(bp, cond)
    }).catch((err) => {
      console.error(err);
    })
  }

  removeBreakpoint (item) {
    this.breakpointManager.remove(item)
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
