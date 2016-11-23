'use babel'
/** @jsx etch.dom */

import etch from 'etch';

export class Raw {
  constructor({}, [child]) { this.update({}, [child]); }
  update({}, [child]) { this.element = child; }
}

export function toView(elem) {
  if (elem instanceof HTMLElement || elem instanceof SVGElement) {
    return <Raw>{elem}</Raw>;
  } else {
    return elem;
  }
}
