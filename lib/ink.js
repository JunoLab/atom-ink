/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
*/
import etch from 'etch';
import {once} from 'underscore';
// these need to be loaded first so deserialization works fine
import PaneItem from './util/pane-item';
import PlotPane from './plots/pane';
import HTMLPane from './plots/htmlpane';
import DocPane from './docs/docpane';
import NotePane from './note/notepane';
import DebuggerPane from './debugger/debugger-pane';
import InkTerminal from './console/console';
import Workspace from './workspace/workspace';
import Outline from './outline/outline';
import * as Linter from './linter/linter'
export {config} from './config.js';

// exportables
import Loading from './util/loading'
import * as progress from './util/progress'
import Tooltip from './util/tooltip'
import block from './editor/block'
import highlights from './editor/highlights'
import Result from './editor/result'
import InlineDoc from './editor/docs'
import Stepper from './debugger/stepper'
import breakpoints from './debugger/breakpoints'
import {Pannable} from './plots/canopy'
import {ProfileViewer as Profiler} from './plots/profiler'
import tree from './tree'
import * as Opener from './util/opener'
import * as matchHighlighter from './util/matchHighlighter'
import ansiToHTML from './util/ansitohtml'

const exportables = {
    PaneItem: once(() => PaneItem),
    PlotPane: once(() => PlotPane),
    DocPane: once(() => DocPane),
    NotePane: once(() => NotePane),
    DebuggerPane: once(() => DebuggerPane),
    InkTerminal: once(() => InkTerminal),
    Workspace: once(() => Workspace),
    Outline: once(() => Outline),
    Linter: once(() => Linter),
    HTMLPane: once(() => HTMLPane),
    Loading: once(() => Loading),
    progress: once(() => progress),
    Tooltip: once(() => Tooltip),
    block: once(() => block),
    highlights: once(() => highlights),
    Result: once(() => Result),
    InlineDoc: once(() => InlineDoc),
    Stepper: once(() => Stepper),
    breakpoints: once(() => breakpoints),
    Pannable: once(() => Pannable),
    Profiler: once(() => Profiler),
    tree: once(() => tree),
    Opener: once(() => Opener),
    matchHighlighter: once(() => matchHighlighter),
    ansiToHTML: once(() => ansiToHTML)
};

export function activate() {
    etch.setScheduler(atom.views);
    [exportables.Opener(), exportables.PaneItem(), exportables.Result(), exportables.InlineDoc(), exportables.PlotPane(), exportables.InkTerminal(), exportables.Linter()].map((mod) => mod.activate());
}

export function deactivate() {
// const pkg = atom.packages.getActivePackage('ink');
// localStorage.setItem(pkg.getCanDeferMainModuleRequireStorageKey(), exportables.false());
    [exportables.Opener(), exportables.PaneItem(), exportables.Result(), exportables.DocPane(), exportables.InlineDoc(), exportables.PlotPane(), exportables.InkTerminal(), exportables.Linter()].map((mod) => mod.deactivate());
}

export function consumeStatusBar(bar) {
    return exportables.progress().consumeStatusBar(bar);
}

export function consumeRemoteFileOpener(opener) {
    return exportables.Opener().consumeRemoteFileOpener(opener);
}

export function provide() {
    const obj = {
        util: {
            focusEditorPane() {
                exportables.PaneItem().focusEditorPane();
            }
        },
        highlight: (ed, start, end, clas) => {
            return exportables.block().highlight(ed, start, end, clas);
        }
    };

    for (const key in exportables) {
        const val = exportables[key];
        Object.defineProperty(obj, key, {
            get: () => val()
        })
    }
    return obj;
}
