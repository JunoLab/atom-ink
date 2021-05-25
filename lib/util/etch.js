'use babel'
/** @jsx etch.dom */

import etch from 'etch';

export const dom = etch.dom;

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
  if (elem == null) {
    return <div/>
  } else if (elem instanceof HTMLElement || elem instanceof SVGElement) {
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
  const anon = {
    update() { return etch.update(this); },
    render() { return f(); },
    destroy() { return etch.destroy(this); }
  };
  etch.initialize(anon);
  return anon;
}

export class Progress extends Etch {
  constructor (props, children) {
    super(props, children)

    this.tt = null
  }

  render() {
    let vals
    if (this.props.level == null || isNaN(this.props.level)) {
      vals = {}
    } else {
      vals = {value: this.props.level}
    }

    return <progress className="ink" attributes={vals}/>
  }

  writeAfterUpdate() {
    if (this.props.level == null) {
      this.element.removeAttribute('value');
    }

    if (this.props.message) {
      if (!this.tt) {
        this.tt = atom.tooltips.add(this.element, {title: this.props.message})
      } else {
        atom.tooltips.findTooltips(this.element).forEach(tooltip => {
          tooltip.options.title = this.props.message
          tooltip.setContent()
        })
      }
    }
  }

  destroy () {
    if (this.tt) this.tt.dispose()
  }
}

export class Tip {
  constructor({alt}, [child]) {
    this.text = alt;
    this.child = child;
    etch.initialize(this);
    this.tooltip = atom.tooltips.add(this.element, {title: () => this.text});
  }
  destroy() {
    etch.destroy(this);
    if (this.tooltip) this.tooltip.dispose();
  }
  update({alt}, [child]) {
    if (this.tooltip) {
      this.tooltip.dispose()
      this.tooltip = atom.tooltips.add(this.element, {title: () => this.text});
    }

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
    const iconClass = this.props.icon ? ` icon icon-${this.props.icon}` : '';
    const sizeClass = this.props.size ? ` badge-${this.props.size}` : '';
    return <span className={'badge'+iconClass+sizeClass}>{this.children}</span>;
  }
}

export class Button extends Etch {
  render() {
    const iconclass = this.props.icon ? ` icon icon-${this.props.icon}` : '';
    const classname = this.props.className || ''
    return <Tip alt={this.props.alt}>
      <button className={'btn' + iconclass + ' ' + classname} disabled={this.props.disabled} onclick={this.props.onclick}>{
        this.children
      }</button>
    </Tip>;
  }
}

export function toButtons(btns) {
  return btns.map(btn =>
    btn.type == 'group' ? <div className='btn-group'>{toButtons(btn.children)}</div> :
    btn.icon ?  <Button icon={btn.icon} alt={btn.alt} onclick={btn.onclick} /> :
    btn
  )
}

export function makeIcon(icon) {
  if (!icon) return 'v'
  if (icon.startsWith('icon-')) return <span className={`icon ${icon}`}/>
  return icon.length === 1 ? icon : 'v'
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
