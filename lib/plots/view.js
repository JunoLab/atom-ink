class PlotPaneElement extends HTMLElement {

  createdCallback() {
    return this.setAttribute('tabindex', -1);
  }

  initialize(model) {
    this.model = model;
    this.model.onDidAddItem(item => this.addItem(item));
    return this;
  }

  addItem(item) {
    __guard__(this.item, x => x.parentElement.removeChild(this.item));
    this.item = item;
    return this.appendChild(this.item);
  }

  getModel() { return this.model; }
}

export default PlotPaneElement = document.registerElement('ink-plot-pane', {prototype: PlotPaneElement.prototype});

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}