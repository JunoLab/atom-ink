'use babel'

import { Emitter } from 'atom';

import PaneItem from '../util/pane-item';
import WorkspaceElement from './view';

export default class Workspace extends PaneItem {

  static activate() {}

  constructor() {
    super()
    this.emitter = new Emitter();
    this.items = [];
  }

  setItems(items) { this.items = items; return this.emitter.emit('did-set-items', this.items); }

  onDidSetItems(f) { return this.emitter.on('did-set-items', f); }

  getTitle() {
    return 'Workspace';
  }

  getIconName() {
    return 'book';
  }
};

Workspace.attachView(WorkspaceElement);
