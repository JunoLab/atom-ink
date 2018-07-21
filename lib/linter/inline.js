'use babel'
/** @jsx etch.dom */

import etch from 'etch'
import { Raw, toView, Etch } from '../util/etch.js'
import { CompositeDisposable } from 'atom'
import PaneItem from '../util/pane-item'
import { open } from '../util/opener'

var subs

var markerLayers = new Map()
var lintDecorations = []

var GUTTERNAME = 'ink-linter-gutter'

export function activate () {
  subs = new CompositeDisposable()
}

export function setItems (items) {
  lintDecorations.forEach(item => {
    item.destroy()
  })
  lintDecorations = []
  items.forEach(item => {
    lintDecorations.push(new LintDecoration(item))
  })
}

export function addItem (item) {
  lintDecorations.push(new LintDecoration(item))
}

export class LintDecoration {
  constructor (item) {
    this.item = item
    this.markers = []

    this.subs = new CompositeDisposable()

    let path = item.realpath || item.file

    this.subs.add(atom.workspace.observeTextEditors(ed => {
      if (path == ed.getPath()) {
        let edid = ed.id
        if (!markerLayers.get(edid)) {
          markerLayers.set(edid, ed.addMarkerLayer())
        }
        let gutter
        if (!(gutter = ed.gutterWithName(GUTTERNAME))) {
          gutter = ed.addGutter({
            name: GUTTERNAME,
            priority: -1
          })
        }

        let marker = markerLayers.get(edid).markBufferRange(item.range)

        this.markers.push(marker)

        attachUnderlineDecoration(ed, marker, item)
        attachGutterDecoration(gutter, ed, marker, item)

        ed.onDidDestroy((ev) => {
          markerLayers.get(edid).destroy()
        })
      }
    }))
  }

  destroy () {
    this.markers.forEach(m => m.destroy())
    this.subs.dispose()
  }
}

class InlineDecorationView extends Etch {
  render () {
    return  <div className="ink-lint-inline">
              <div className="ink-lint-arrow-up"></div>
              <div className="ink-lint-description-container" tabindex="-1">
                {
                  this.props.items.map(item => {
                    return  <div className="ink-lint-line">
                              {item.item.description}
                            </div>
                  })
                }
              </div>
            </div>
  }
}

function showInlineDecoration (ed, item, parent) {
  let line = item.range[0][0]
  let marker = markerLayers.get(ed.id).markBufferRange([[line, 0], [line, 0]])

  let items = lintDecorations.filter(item => item.item.range[0][0] === line)

  let hideTimer = null
  let el = new InlineDecorationView({items})
  ed.decorateMarker(marker, {
    type: 'overlay',
    class: 'ink-result-container',
    item: el,
    position: 'tail'
  })

  parent.addEventListener('mouseout', e => {
    hideTimer = setTimeout(e => marker.destroy(), 300)
  })

  el.element.addEventListener('mouseover', e => {
    clearTimeout(hideTimer)
  })

  el.element.addEventListener('mouseout', e => {
    hideTimer = setTimeout(e => marker.destroy(), 300)
  })
}

function attachUnderlineDecoration (ed, marker, item) {
  ed.decorateMarker(marker, {
    type: 'highlight',
    class: `ink-linter-${item.severity.toLowerCase()}`
  })
}

class GutterItemView extends Etch {
  render() {
    return <span className={`ink-linter-gutter-${this.props.item.severity.toLowerCase()} icon icon-primitive-dot`}
                 onMouseOver={ev => showInlineDecoration(this.props.editor, this.props.item, this.element)}/>
  }
}

function attachGutterDecoration (gutter, editor, marker, item) {
  gutter.decorateMarker(marker, {
    type: 'gutter',
    item: new GutterItemView({editor, marker, item})
  })
}

export function deactivate () {
  markerLayers.forEach((layer, id) => {
    layer.destroy()
  })
  subs.dispose()
}
