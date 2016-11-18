'use babel'
/** @jsx etch.dom */

import etch from 'etch';

export function view(f) {
  class AnonEtch {
    constructor() { etch.initialize(this); }
    update() {}
    render() { return f(); }
  }
  let anon = new AnonEtch();
  anon.update = () => etch.update(anon);
  anon.destroy = () => etch.destroy(anon);
  return anon;
}

export class Progress {
  constructor() { etch.initialize(this); }
  update({}, [level]) {
    this.level = level;
    etch.update(this);
  }
  render() {
    return <progress className="ink" value={this.level} />;
  }
  writeAfterUpdate() {
    if (this.level == null) {
      this.element.removeAttribute('value');
    }
  }
}

export class Tip {
  shouldUpdate = true;
  constructor() {
    etch.initialize(this);
    this.tooltip = atom.tooltips.add(this.element,
      {title: () => this.text});
  }
  destroy() {
    etch.destroy(this);
    this.tooltip.dispose()
  }
  update({alt}, children) {
    this.text = alt;
    this.children = children;
    etch.update(this);
  }
  render() {
    return <span>{this.children}</span>;
  }
}
