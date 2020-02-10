'use babel';
/** @jsx etch.dom */

import etch from 'etch';
import { prewalk, postwalk, prefor } from './tree.js';
import { Etch, Tip, Button, toView } from '../util/etch.js';

function clamp (x, min, max) {
  return Math.min(Math.max(x, min), max)
}

function maprange([x1, x2], [y1, y2], x) {
  return (x-x1)/(x2-x1)*(y2-y1)+y1;
}

function dims(tree) {
  [tree.height, tree.width] = [1, 1];
  [tree.top, tree.left] = [0, 0];
  prewalk(tree, (parent) => {
    let left = parent.left;
    parent.children.forEach(ch => {
      ch.width = ch.count / parent.count * parent.width;
      ch.height = maprange([0,1],[1/5,1],ch.count/parent.count)*parent.height;
      ch.left = left;
      ch.top = parent.top + parent.height;
      left += ch.width;
    });
    // Centre align children
    chwidth = parent.children.map(({width})=>width).reduce((a,b)=>a+b, 0);
    parent.children.forEach(ch => ch.left += (parent.width-chwidth)/2);
    return parent;
  });
  // Scale total height to 100%
  let max = postwalk(tree, ({height, children}) =>
    Math.max(height, ...children.map(x=>x+height)));
  prewalk(tree, (node) => {
    node.top /= max;
    node.height /= max;
    return node;
  });
  return tree;
}

class Clickable extends Etch {
  hypot([x1, x2], [y1, y2]) {
    return Math.sqrt(Math.pow(y1-x1,2)+Math.pow(y2-x2,2));
  }
  onclick(e) {
    if (!this.clickStart) return;
    if (this.hypot(this.clickStart, [e.clientX, e.clientY]) < 5)
      this.props.onclick(e);
    this.clickStart = null;
  }
  render() {
    return <span onmousedown={e=>this.clickStart=[e.clientX,e.clientY]}
                 onclick={e=>this.onclick(e)}
                 onmouseleave={e=>this.clickStart=null}>{
      this.children
    }</span>;
  }
}

export class Pannable extends Etch {
  constructor (item, opts) {
    opts = Object.assign({}, {
      zoomstrategy: 'transform',
      minScale: 0.001,
      maxScale: 500
    }, opts)

    super()

    this.item = item
    this.zoomstrategy = opts.zoomstrategy
    this.minScale = opts.minScale
    this.maxScale = opts.maxScale
    this.left = 0
    this.top = 0

    this.isLoaded = false

    if (item && item.nodeName && item.nodeName.toLowerCase() === 'img') {
      item.onload = () => {
        etch.update(this).then(() => {
          this.setInitialScale(item)
          this.isLoaded = true
          etch.update(this)
        })
      }
    } else {
      etch.update(this).then(() => {
        this.setInitialScale(item)
        this.isLoaded = true
        etch.update(this)
      })
    }
    etch.update(this)
  }

  readAfterUpdate () {
    this.innerContainerRect = this.refs.innerContainer.getBoundingClientRect()
    this.outerContainerRect = this.refs.outerContainer.getBoundingClientRect()
  }

  setInitialScale (item) {
    this.initialScale = 1
    if (item.naturalHeight && item.naturalWidth && this.outerContainerRect) {
      // only scale down, not up:
      this.initialScale = Math.min(
        this.outerContainerRect.width/item.naturalWidth,
        this.outerContainerRect.height/item.naturalHeight,
        1
      )
    }
  }

  resetAll () {
    this.setInitialScale(this.item)
    this.scale = this.initialScale
    this.left = 0
    this.top = 0

    etch.update(this)
  }

  ondrag({movementX, movementY}) {
    if (!this.dragging) return;

    this.left += movementX
    this.top += movementY
    etch.update(this);
  }

  zoom(e, amount) {
    const zoom = amount || Math.pow(e.shiftKey ? 0.99 : 0.999, e.deltaY)

    if (zoom*this.scale > this.maxScale || zoom*this.scale < this.minScale) return

    this.scale *= zoom

    if (this.innerContainerRect) {
      let x, y
      if (amount) {
        x = this.innerContainerRect.width/2
        y = this.innerContainerRect.height/2
      } else {
        x = clamp(e.clientX - this.innerContainerRect.left, 0, this.innerContainerRect.width)
        y = clamp(e.clientY - this.innerContainerRect.top, 0, this.innerContainerRect.height)
      }

      this.left -= x*zoom - x
      this.top -= y*zoom - y
    }
    etch.update(this);
  }

  toolbarView () {
    return <div className='btn-group'>
      <Button icon='plus' alt='Zoom In' onclick={() => this.zoom(null, 1.1)}/>
      <Button icon='dash' alt='Zoom Out' onclick={() => this.zoom(null, 0.9)}/>
      <Button icon='screen-normal' alt='Reset Plot' onclick={() => this.resetAll()}/>
    </div>
  }

  render() {
    if (!this.scale) this.scale = this.initialScale
    const scale = this.scale*100+'%'

    this.toolbar = [this.toolbarView()]

    if (this.item && this.item.toolbar) {
      this.toolbar = this.toolbar.concat(this.item.toolbar)
    }

    let style = {position:'relative', height:'inherit', width:'inherit', transformOrigin: '0px 0px'}

    if (this.zoomstrategy == 'width') {
      style.transform = 'translate('+this.left+'px,'+this.top+'px)'
      style.height = scale
      style.width = scale
    } else if (this.zoomstrategy == 'transform') {
      style.transform = 'translate('+this.left+'px,'+this.top+'px) scale('+this.scale+')'
    }
    if (this.isLoaded) {
      style.visibility = 'initial'
    } else {
      style.visibility = 'hidden'
    }

    return <div style={{height:'100%',width:'100%'}}
                onmousedown={e=>this.dragging=true}
                onmouseup={e=>this.dragging=false}
                onmouseleave={e=>this.dragging=false}
                onmousemove={e=>this.ondrag(e)}
                onmousewheel={e=>this.zoom(e)}
                ondblclick={e=>this.resetAll()}
                ref='outerContainer'>
      <div style={style} className='ink-pannable' ref='innerContainer'>
        {toView(this.item)}
      </div>
    </div>;
  }

  teardown () {
    if (this.item && this.item.teardown) this.item.teardown()
    etch.update(this)
  }

  build () {
    if (this.item && this.item.build) this.item.build()
    etch.update(this)
  }
}

class NodeView extends Etch {
  render() {
    const {height, width, top, left, onclick, classes, onmouseover, onmouseout} = this.props;
    return <Clickable onclick={onclick}>
      <div className={`node ${classes.join(' ')}`} {...{onmouseover, onmouseout}} style={{
        height: 100*height+'%',
        width:  100*width +'%',
        top:    100*top   +'%',
        left:   100*left  +'%'
      }}>
        <div>
          <div>
          </div>
        </div>
      </div>
    </Clickable>;
  }
}

export default class Canopy extends Etch {
  update({data, className}) {}
  render() {
    const nodes = []
    const className = this.props.className || ''
    prefor(dims(this.props.data), node => nodes.push(<NodeView {...node} />))
    return <div className={"ink-canopy " + className}>
      {nodes}
    </div>
  }
}
