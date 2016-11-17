'use babel'
/** @jsx etch.dom */

import etch from 'etch';

// Not sure why this doesn't work.
// export class Raw {
//   update({}, [child]) {
//     this.element = child;
//   }
// }

export function toView(elem) {
  if (elem instanceof HTMLElement || elem instanceof SVGElement) {
    class Elem {
      element = elem;
      update() {}
    }
    return <Elem />;
    // return <Raw>{elem}</Raw>;
  }
  else {
    return elem;
  }
}
