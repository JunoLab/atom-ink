'use babel'
/** @jsx etch.dom */

import etch from 'etch';

export let dom = etch.dom;

export class Raw {
  constructor({}, [child]) { this.update({}, [child]); }
  update({}, [child]) { this.element = child; }
}

export class Etch {
  constructor(props, children) {
    this.props = props;
    this.children = children;
    etch.initialize(this);
  }
  update(props, children) {
    if (props == null) return etch.update(this);
    this.props = props;
    this.children = children;
    etch.update(this);
  }
  destroy() {
    etch.destroy(this);
  }
}

export function toView(elem) {
  if (elem instanceof HTMLElement || elem instanceof SVGElement) {
    return <Raw>{elem}</Raw>;
  } else if (elem && elem.element) {
    return <Raw>{elem.element}</Raw>;
  } else if (elem instanceof Array) {
    return elem.map((e) => toView(e))
  } else {
    return elem;
  }
}

export function view(f) {
  let anon = {
    update() { return etch.update(this); },
    render() { return f(); },
    destroy() { return etch.destroy(this); }
  };
  etch.initialize(anon);
  return anon;
}

export class Progress extends Etch {
  render() {
    return <progress className="ink" value={this.props.level} />;
  }
  writeAfterUpdate() {
    if (this.props.level == null) {
      this.element.removeAttribute('value');
    }
  }
}

export class Tip {
  constructor({alt}, [child]) {
    this.text = alt;
    this.child = child;
    etch.initialize(this);
    this.tooltip = atom.tooltips.add(this.element,
      {title: () => this.text});
  }
  destroy() {
    etch.destroy(this);
    this.tooltip.dispose();
  }
  update({alt}, [child]) {
    this.text = alt;
    this.child = child;
    etch.update(this, false);
  }
  render() {
    return this.child;
  }
}

export class Icon extends Etch {
  render() {
    return <span className={`icon icon-${this.props.name}`} />;
  }
}

export class Badge extends Etch {
  render() {
    let iconClass = this.props.icon ? ` icon icon-${this.props.icon}` : '';
    let sizeClass = this.props.size ? ` badge-${this.props.size}` : '';
    return <span className={'badge'+iconClass+sizeClass}>{this.children}</span>;
  }
}

export class Button extends Etch {
  render() {
    let iconclass = this.props.icon ? ` icon icon-${this.props.icon}` : '';
    return <Tip alt={this.props.alt}>
      <button className={'btn' + iconclass} disabled={this.props.disabled} onclick={this.props.onclick}>{
        this.children
      }</button>
    </Tip>;
  }
}

function toButtons(btns) {
  return btns.map(btn =>
    btn.type == 'group' ? <div className='btn-group'>{toButtons(btn.children)}</div> :
    btn.icon ?  <Button icon={btn.icon} alt={btn.alt} onclick={btn.onclick} /> :
    btn
  )
}

export class Toolbar extends Etch {
  render() {
    let items = this.props.items || []
    items = toButtons(items).map(x => <span className='inline-block'>{x}</span>);
    return <div className='ink-toolbar'>
      <div className='bar'>{items}</div>
      {this.children}
    </div>
  }
}
