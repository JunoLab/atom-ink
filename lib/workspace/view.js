'use babel';

import views from '../util/views';
let {div, span, table, tr, td} = views.tags;

class WorkspaceElement extends HTMLElement {

  createdCallback() {
    this.setAttribute('tabindex', -1);
    atom.config.observe('editor.fontSize', v => {
      return this.style.fontSize = v + 'px';
    });
    return atom.config.observe('editor.fontFamily', v => {
      return this.style.fontFamily = v;
    });
  }

  icon(type) {
    if (__guard__(type, x => x.startsWith('icon-'))) { return span(`icon ${type}`); }
    if (__guard__(type, x1 => x1.length) === 1) { return type; }
    switch (type) {
      case 'function': return 'λ';
      case 'type': return 'T';
      case 'module': return span('icon icon-package');
      case 'mixin': return span('icon icon-code');
      default: return 'c';
    }
  }

  createView() {
    let rows;
    if (this.view != null) { this.removeChild(this.view); }
    let contexts = this.model.items.map(({context, items}) =>
      (rows = items.map(({name, value, type, icon}) =>
        (name != null) ?
          tr([
            td(`icon ${type}`, this.icon(icon || type)),
            td("name", name),
            td('value', value)
          ])
        :
          tr([
            td(`icon ${type}`, this.icon(icon || type)),
            td({class: "value", colspan: 2}, value)
          ])),
      div('context', [div('header', context), table('items', rows)])));
    this.view = views.render(div('contexts', contexts));
    this.classList.add(this.model.id);
    return this.appendChild(this.view);
  }

  initialize(model) {
    this.model = model;
    this.createView();
    this.model.onDidSetItems(() => this.createView());
    return this;
  }

  getModel() { return this.model; }
}

export default WorkspaceElement = document.registerElement('ink-workspace', {prototype: WorkspaceElement.prototype});

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
