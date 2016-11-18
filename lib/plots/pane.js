import { Emitter } from 'atom';

import PaneItem from '../util/pane-item';
import PlotPaneElement from './view';

export default class PlotPane extends PaneItem {

  static activate() {
    this.pane = PlotPane.fromId('default');
    return atom.workspace.addOpener(uri => {
      if (uri.startsWith('atom://ink/plots')) {
        return this.pane;
      }
    }
    );
  }

  constructor() {
    this.emitter = new Emitter;
  }

  getTitle() {
    return 'Plots';
  }

  getIconName() {
    return 'graph';
  }

  show(view) {
    this.item = view;
    return this.emitter.emit('did-add-item', view);
  }

  onDidAddItem(f) { return this.emitter.on('did-add-item', f); }
};

PlotPane.attachView(PlotPaneElement);
