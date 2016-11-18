import { Emitter } from 'atom';
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
//    p.setProgress(prog)
//        Updates `p`s progress. `prog` is a number between 0 and 1 or `null`; if
//        it is `null`, an indeterminate progress bar will be displayed.
//
//    p.setLeftText(t), p.setRightText(t), p.setMessage(t)
//        Sets the text displayed to the left of the progress bar, right of the
//        progress bar, or when hovering over it.
//
//    p.destroy()
//        Destroys `p` and removes it from the display stack.

export default {
  stack: [],

  activate() {
    if (this.activated) { return; }
    this.activated = true;
    this.emitter = new Emitter;

    this.overlay = this.stackView();
    this.view = this.tileView();

    this.tooltip = new Tooltip(this.view, this.overlay, {cond: () => this.stack.length});

    return this.tile = __guard__(this.statusBar, x => x.addLeftTile({
      item: this.view,
      priority: -1
    }));
  },

  deactivate() {
    this.activated = false;
    __guard__(this.tooltip, x => x.destroy());
    __guard__(this.tile, x1 => x1.destroy());
    return __guard__(this.emitter, x2 => x2.dispose());
  },

  consumeStatusBar(bar) {
    return this.statusBar = bar;
  },

  create(p = {progress: 0}) {
    this.activate();
    p.emitter = new Emitter;

    p.onDidUpdate = f => {
      return p.emitter.on('did-update-progress', f);
    };
    p.setProgress = prog => {
      let oldp = p.progress;
      p.progress = prog;
      p.emitter.emit('did-update-progress');
      // if determinate-ness changes, update the stack display
      if (((oldp != null) && (prog == null)) || ((prog != null) && (oldp == null))) {
        return this.emitter.emit('did-update-stack');
      }
    };
    p.setLeftText = t => {
      p.leftText = t;
      return p.emitter.emit('did-update-progress');
    };
    p.setRightText = t => {
      p.rightText = t;
      return p.emitter.emit('did-update-progress');
    };
    p.setMessage = t => {
      p.msg = t;
      return p.emitter.emit('did-update-progress');
    };
    p.destroy = () => {
      let i = this.stack.indexOf(p);
      p.emitter.dispose();
      if (i < 0) { return; }
      this.stack.splice(i, 1);
      return this.emitter.emit('did-update-stack');
    };
    p.register = () => {
      this.stack.push(p);
      return this.emitter.emit('did-update-stack');
    };

    return p;
  },

  // Public API
  add(prog) {
    let p = create(prog);
    p.register();
    return p;
  },

  // update logic
  hasDeterminateBars() {
    return this.stack.filter(p => p.progress != null).length > 0;
  },

  onDidUpdateStack(f) { return this.emitter.on('did-update-stack', f); },

  onDidUpdateProgress(f) { return this.emitter.on('did-update-progress', f); },

  // UI elements:
  progressView(p, {min} = {}) {
    let span = document.createElement('span');
    let prog = document.createElement('progress');
    prog.classList.add('ink');
    prog.setAttribute('max', 1);
    span.appendChild(prog);

    let updateView = prg => {
      if ((prg.progress != null) && !((min != null) && prg.progress < min)) {
        return prog.setAttribute('value', prg.progress);
      } else {
        return prog.removeAttribute('value');
      }
    };

    p.onDidUpdate(() => updateView(p));
    updateView(p);

    return span;
  },

  msgView(p, parent) {
    let div = document.createElement('div');
    div.classList.add('ink-tooltip-msg');
    div.appendChild.innerText = p.msg;

    p.onDidUpdate(() => {
      if (__guard__(p.msg, x => x.length)) {
        div.innerText = p.msg;
        return parent.classList.add('has-tooltip');
      } else {
        return parent.classList.remove('has-tooltip');
      }
    }
    );

    return div;
  },

  tableRowView(p) {
    let tr = document.createElement('tr');
    // left text
    let tdl = document.createElement('td');
    tdl.classList.add('progress-tr');
    (p.leftText != null) && tdl.appendChild(document.createTextNode(p.leftText));
    // progress bar
    let td = document.createElement('td');
    td.classList.add('progress-tr', 'has-tooltip');
    td.appendChild(this.progressView(p));
    td.appendChild(this.msgView(p, td));
    // right text
    let tdr = document.createElement('td');
    tdr.classList.add('progress-tr');
    (p.rightText != null) && tdr.appendChild(document.createTextNode(p.rightText));

    p.onDidUpdate(() => {
      if (p.rightText != null) {
        if (tdr.firstChild) { tdr.removeChild(tdr.firstChild); }
        tdr.appendChild(document.createTextNode(p.rightText));
      }
      if (p.leftText != null) {
        if (tdl.firstChild) { tdl.removeChild(tdl.firstChild); }
        return tdl.appendChild(document.createTextNode(p.leftText));
      }
    }
    );
    // construct the row
    tr.appendChild(tdl);
    tr.appendChild(td);
    tr.appendChild(tdr);

    return tr;
  },

  stackView() {
    let div = document.createElement('div');

    let table = document.createElement('table');
    div.appendChild(table);

    this.onDidUpdateStack(() => {
      // remove all table rows
      let p;
      while (table.firstChild) {
        table.removeChild(table.firstChild);
      }
      if (!this.stack.length) {
        this.tooltip.hide_();
      }
      // backwards iteration
      return __range__(0, this.stack.length, false).reverse().map((i) =>
        (p = this.stack[i],
        table.appendChild(this.tableRowView(p)),
        p.emitter.emit('did-update-progress')));
    }
    );

    return div;
  },

  tileView() {
    let span = document.createElement('span');
    span.classList.add('inline-block');
    span.appendChild(this.tableRowView(this.create()));

    this.onDidUpdateStack(() => {
      let global;
      let left;
      span.removeChild(span.firstChild);
      // find the first determinate progress bar
      // if there is none, use the first one in the stack
      if ((global = ((left = this.stack.find(p => (p.progress != null)))) != null ? left : this.stack[0]) != null) {
        return span.appendChild(this.progressView(global, {min: 0.01}));
      } else {
        return span.appendChild(this.progressView(this.create()));
      }
    }
    );

    return span;
  }
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
function __range__(left, right, inclusive) {
  let range = [];
  let ascending = left < right;
  let end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}