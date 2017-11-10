'use babel';

import os from 'os';
import fs from 'fs-plus';
import path from 'path';
import Terminal from 'xterm';
// eslint-disable-next-line
import { Disposable, CompositeDisposable, Task } from 'atom';
import { Emitter } from 'event-kit';
import consistentEnv from 'consistent-env';
import LANG from './lang';

const newElementResizeDetector = require('element-resize-detector');

const HOME = consistentEnv().HOME;

Terminal.loadAddon('fit');

const last = str => str[str.length - 1];

const renderTemplate = (template, data) => {
  const vars = Object.keys(data);
  return vars.reduce(
    (_template, key) =>
      _template.split(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`)).join(data[key]),
    template.toString(),
  );
};

class TermView {
  constructor(opts = {}) {
    this.element = document.createElement('div');
    this.element.classList.add('xterm');
    this.opts = opts;
    this.emitter = new Emitter();
    this.elementResizeDetector = newElementResizeDetector();
    if (typeof opts.keyHandler !== 'function') {
      throw new Error('must pass keyHandler');
    }
    this.attached();
  }

  getURI() {
    return 'atom://xterm-term-view';
  }

  serialize() {
    return {
      deserializer: 'xterm/TermView',
    };
  }

  getElement() {
    return this.element;
  }

  getForked() {
    return this.opts.forkPTY;
  }

  onData(callback) {
    return this.emitter.on('data', callback);
  }

  onExit(callback) {
    return this.emitter.on('exit', callback);
  }

  onResize(callback) {
    return this.emitter.on('resize', callback);
  }

  onSTDIN(callback) {
    return this.emitter.on('stdin', callback);
  }

  onSTDOUT(callback) {
    return this.emitter.on('stdout', callback);
  }

  onFocus(callback) {
    return this.emitter.on('focus', callback);
  }

  onBlur(callback) {
    return this.emitter.on('blur', callback);
  }

  input(data) {
    if (!this.term) {
      return;
    }
    try {
      if (this.ptyProcess) {
        const base64ed = Buffer.from(data, 'utf-8').toString('base64');
        this.ptyProcess.send({ event: 'input', text: base64ed });
      } else {
        this.term.write(data);
      }
    } catch (error) {
      console.error(error);
    }
    this.resizeToPane();
    this.focusTerm();
  }

  attached() {
    this.disposable = new CompositeDisposable();

    const {
      shellArguments,
      shellOverride,
      runCommand,
      colors,
      cursorBlink,
      scrollback,
      keyHandler,
    } = this.opts;
    const args = shellArguments || [];

    const parent = this.element;

    this.term = new Terminal({
      colors,
      cursorBlink,
      scrollback,
    });
    const term = this.term;

    term.attachCustomKeyEventHandler(keyHandler);

    term.on('data', data => {
      // let the remote term write to stdin - we slurp up its stdout
      if (this.ptyProcess) {
        this.input(data);
      }
    });

    term.on('title', title => {
      let newTitle = title;
      if (title.length > 20) {
        const split = title.split(path.sep);
        if (split[0] === '') {
          split.shift(1);
        }

        if (split.length === 1) {
          newTitle = `${title.slice(0, 10)}...${title.slice(-10)}`;
        } else {
          newTitle =
            path.sep +
            [split[0], '...', split[split.length - 1]].join(path.sep);
          if (title.length > 25) {
            newTitle =
              path.sep + [split[0], split[split.length - 1]].join(path.sep);
            newTitle = `${title.slice(0, 10)}...${title.slice(-10)}`;
          }
        }
      }

      this.termTitle = newTitle;
      return this.emitter.emit('did-change-title', title);
    });

    term.on('focus', () => this.emitter.emit('focus'));

    term.on('blur', () => this.emitter.emit('blur'));

    term.open(parent, true);

    term.element.id = `xterm-term-${this.id}`;

    term.fit();
    const { cols, rows } = this.getDimensions;

    if (!this.opts.forkPTY) {
      term.end = () => this.exit();
    } else {
      const left = atom.project.getPaths()[0];
      const processPath = require.resolve('./pty');
      this.ptyProcess = Task.once(
        processPath,
        fs.absolute(left != null ? left : '~'),
        shellOverride,
        cols,
        rows,
        args,
        LANG,
      );

      this.ptyProcess.on('xterm:data', data => {
        if (!this.term) {
          return;
        }
        const utf8 = new Buffer(data, 'base64').toString('utf-8');
        this.term.write(utf8);
        this.emitter.emit('stdout', utf8);
      });

      this.ptyProcess.on('xterm:exit', () => this.exit());
    }

    if (runCommand) {
      this.input(`${runCommand}${os.EOL}`);
    }
    this.applyStyle();
    this.attachEvents();
    this.resizeToPane();
    term.focus();
  }

  resize(cols, rows) {
    if (!this.term) {
      return;
    }
    if (!(cols > 0) || !(rows > 0) || !isFinite(cols) || !isFinite(rows)) {
      return;
    }
    try {
      if (this.ptyProcess) {
        this.ptyProcess.send({ event: 'resize', rows, cols });
      }
      if (this.term && !(this.term.rows === rows && this.term.cols === cols)) {
        this.term.resize(cols, rows);
      }
    } catch (error) {
      console.error(error);
      return;
    }

    this.emitter.emit('resize', { cols, rows });
  }

  titleVars() {
    return {
      bashName: last(this.opts.shell.split('/')),
      hostName: os.hostname(),
      platform: process.platform,
      home: HOME,
    };
  }

  getTitle() {
    if (this.termTitle) {
      return this.termTitle;
    }
    this.vars = this.titleVars();
    const titleTemplate = this.opts.titleTemplate || '({{ bashName }})';
    return renderTemplate(titleTemplate, this.vars);
  }

  onDidChangeTitle(callback) {
    return this.emitter.on('did-change-title', callback);
  }

  getIconName() {
    return 'terminal';
  }

  applyStyle() {
    // remove background color in favor of the atom background
    // @term.element.style.background = null
    this.term.element.style.fontFamily =
      this.opts.fontFamily ||
      atom.config.get('editor.fontFamily') ||
      // (Atom doesn't return a default value if there is none)
      // so we use a poor fallback
      'monospace';
    // Atom returns a default for fontSize
    this.term.element.style.fontSize = `${this.opts.fontSize ||
      atom.config.get('editor.fontSize')}px`;
  }

  attachEvents() {
    this.elementResizeDetector.listenTo(this.element, () =>
      this.resizeToPane(),
    );
    this.disposable.add(
      new Disposable(() => this.elementResizeDetector.uninstall(this.element)),
    );

    const el = this.getElement();

    return this.disposable.add(
      atom.commands.add(el, 'xterm:paste', () => this.paste()),
      atom.commands.add(el, {
        'core:move-up': () => this.term.scrollDisp(-1),
        'core:move-down': () => this.term.scrollDisp(1),
        'core:page-up': () => this.term.scrollPages(-1),
        'core:page-down': () => this.term.scrollPages(1),
        'core:move-to-top': () => this.term.scrollToTop(),
        'core:move-to-bottom': () => this.term.scrollToBottom(),
      }),
    );
  }

  clear() {
    if (this.term == null) return;
    this.term.clear();
  }

  paste() {
    return this.input(atom.clipboard.read());
  }

  focus() {
    this.resizeToPane();
    this.focusTerm();
    process.nextTick(() => this.focusTerm());
  }

  focusAndActivatePane() {
    this.getPane().activateItem(this);
    this.focus();
  }

  focusTerm() {
    if (!this.term) {
      return;
    }
    this.term.focus();
  }

  resizeToPane() {
    if (!this.ptyProcess || !this.term) {
      return;
    }
    this.term.fit();
    const { cols, rows } = this.getDimensions();
    this.resize(cols, rows);
  }

  getDimensions() {
    const { cols } = this.term;
    const { rows } = this.term;
    return { cols, rows };
  }

  getSelection() {
    return this.term.getSelection();
  }

  exit() {
    this.destroy();
    this.emitter.emit('exit');
  }

  onDidDestroy(callback) {
    return this.onExit(callback);
  }

  destroy() {
    if (this.ptyProcess) {
      this.ptyProcess.terminate();
      this.ptyProcess = null;
    }
    if (this.term) {
      this.term.destroy();
      this.term = null;
    }
    if (this.disposable) {
      this.disposable.dispose();
      this.disposable = null;
    }
  }

  attachToPane(pane) {
    if (!this.attachedToPane) {
      this.disposable.add(
        pane.observeFlexScale(() => setTimeout(() => this.resizeToPane(), 300)),
      );
      this.attachedToPane = true;
    }
  }

  getPane() {
    for (const pane of atom.workspace.getPanes()) {
      for (const item of pane.getItems()) {
        if (item === this) {
          return pane;
        }
      }
    }
    return undefined;
  }
}

export default TermView;
