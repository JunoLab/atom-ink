'use babel'
/** @jsx etch.dom */

import etch from 'etch';

import PaneItem from '../util/pane-item';
import { toView } from '../util/etch'

export default class PlotPane extends PaneItem {

  static activate() {
    this.pane = PlotPane.fromId('default');
    atom.workspace.addOpener(uri => {
      if (uri.startsWith('atom://ink/plots')) {
        return this.pane;
      }
    });
  }

  constructor() {
    super();
    etch.initialize(this);
    this.element.setAttribute('tabindex', -1);
  }

  update() {}

  render() {
    return <span className="ink-plot-pane">{toView(this.item)}</span>;
  }

  show(view) {
    this.item = view;
    etch.update(this);
  }

  getTitle() {
    return 'Plots';
  }

  getIconName() {
    return 'graph';
  }

};

PlotPane.registerView();
