'use babel'
/** @jsx etch.dom */

import {CompositeDisposable} from "atom"
import etch from "etch";

function toView(elem) {
  if (elem instanceof HTMLElement) {
    class Elem {
      update() {}
      get element() { return elem; }
    }
    return <Elem />;
  }
  else {
    return elem;
  }
}

class WorkspaceElement extends HTMLElement {

  createdCallback() {
    this.setAttribute('tabindex', -1);
    atom.config.observe('editor.fontSize', v => {
      this.style.fontSize = v + 'px';
    });
    atom.config.observe('editor.fontFamily', v => {
      this.style.fontFamily = v;
    });
  }

  icon(type) {
    if (!type) return 'c';
    else if (type.startsWith('icon-')) return <span className={`icon ${type}`}/>;
    else if (type.length == 1) return type;
    switch (type) {
      case 'function': return 'λ';
      case 'type': return 'T';
      case 'module': return <span className='icon icon-package'/>;
      case 'mixin': return <span className='icon icon-code'/>;
      default: return 'c';
    }
  }

  render(props, children) {
    let contexts = this.model.items.map(({context, items}) => {
      let rows = items.map(({name, value, type, icon}) => {
        return <tr>
          <td className={`icon ${type}`}>{this.icon(icon || type)}</td>
          <td className="name">{name}</td>
          <td className="value">{toView(value)}</td>
        </tr>
      });
      return <div className="context">
        <div className="header">{context}</div>
        <table className="items">{rows}</table>
      </div>;
    });
    return <div className="contexts">{contexts}</div>;
  }

  update(props, children) {}

  initialize(model) {
    this.model = model;
    this.model.onDidSetItems(() => etch.update(this));
    etch.initialize(this);
    this.appendChild(this.element);
    return this;
  }

  getModel() { return this.model; }
}

export default WorkspaceElement = document.registerElement('ink-workspace', {prototype: WorkspaceElement.prototype});
