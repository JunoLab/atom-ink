'use babel'
/** @jsx etch.dom */

import etch from "etch";
import PaneItem from '../util/pane-item';

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

function makeicon(type) {
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

export default class Workspace extends PaneItem {

  constructor() {
    super()
    this.items = [];
    etch.initialize(this);
    this.element.setAttribute('tabindex', -1);
    this.element.classList.add('ink-workspace');
    atom.config.observe('editor.fontSize', v => {
      this.element.style.fontSize = v + 'px';
    });
    atom.config.observe('editor.fontFamily', v => {
      this.element.style.fontFamily = v;
    });
  }

  setItems(items) {
    this.items = items;
    etch.update(this);
  }

  getTitle() {
    return 'Workspace';
  }

  getIconName() {
    return 'book';
  }

  update(props, children) {}

  render(props, children) {
    return <div>{
      this.items.map(({context, items}) =>
        <div className="context">
          <div className="header">{context}</div>
          <table className="items">{
            items.map(({name, value, type, icon}) =>
              <tr>
                <td className={`icon ${type}`}>{makeicon(icon || type)}</td>
                <td className="name">{name}</td>
                <td className="value">{toView(value)}</td>
              </tr>
            )
          }</table>
        </div>
      )
    }</div>
  }

};

Workspace.registerView();
