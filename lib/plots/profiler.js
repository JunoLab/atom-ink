'use babel';
/** @jsx etch.dom */

import { CompositeDisposable } from 'atom';
import etch from 'etch';
import Canopy from './canopy';
import { Badge, Icon, view } from '../util/etch.js'
import { prewalk, prefor } from './tree.js'

let testdata = {"location":"","line":-1,"children":[{"location":"sys.dylib","line":-1,"children":[{"location":"base/client.jl","line":238,"children":[{"location":"profile.jl","line":3,"children":[{"location":"base/random.jl","line":1282,"children":[{"location":"base/random.jl","line":1276,"children":[{"location":"base/random.jl","line":1204,"children":[{"location":"base/random.jl","line":127,"children":[],"func":"reserve_1","path":"/Users/mike/projects/julia/base/random.jl","count":6},{"location":"base/random.jl","line":140,"children":[],"func":"rand_ui52_raw_inbounds","path":"/Users/mike/projects/julia/base/random.jl","count":5}],"func":"randn","path":"/Users/mike/projects/julia/base/random.jl","count":11},{"location":"base/random.jl","line":1209,"children":[],"func":"randn","path":"/Users/mike/projects/julia/base/random.jl","count":2},{"location":"base/random.jl","line":1207,"children":[],"func":"randn","path":"/Users/mike/projects/julia/base/random.jl","count":10}],"func":"randn","path":"/Users/mike/projects/julia/base/random.jl","count":24},{"location":"base/random.jl","line":0,"children":[],"func":"randn","path":"/Users/mike/projects/julia/base/random.jl","count":5}],"func":"randn!","path":"/Users/mike/projects/julia/base/random.jl","count":39},{"location":"base/random.jl","line":1281,"children":[],"func":"randn!","path":"/Users/mike/projects/julia/base/random.jl","count":1},{"location":"base/random.jl","line":1276,"children":[],"func":"randn","path":"/Users/mike/projects/julia/base/random.jl","count":1}],"func":"profile_test","path":"/Users/mike/profile.jl","count":43},{"location":"profile.jl","line":4,"children":[],"func":"profile_test","path":"/Users/mike/profile.jl","count":6},{"location":"profile.jl","line":5,"children":[{"location":"base/dft.jl","line":57,"children":[{"location":"base/fft/FFTW.jl","line":618,"children":[],"func":"*","path":"/Users/mike/projects/julia/base/fft/FFTW.jl","count":48},{"location":"base/fft/FFTW.jl","line":585,"children":[{"location":"base/fft/FFTW.jl","line":463,"children":[],"func":"Type","path":"/Users/mike/projects/julia/base/fft/FFTW.jl","count":1},{"location":"base/fft/FFTW.jl","line":87,"children":[],"func":"fakesimilar","path":"/Users/mike/projects/julia/base/fft/FFTW.jl","count":1},{"location":"base/fft/FFTW.jl","line":464,"children":[],"func":"Type","path":"/Users/mike/projects/julia/base/fft/FFTW.jl","count":2}],"func":"#plan_fft#5","path":"/Users/mike/projects/julia/base/fft/FFTW.jl","count":4},{"location":"base/fft/FFTW.jl","line":617,"children":[],"func":"*","path":"/Users/mike/projects/julia/base/fft/FFTW.jl","count":95}],"func":"fft","path":"/Users/mike/projects/julia/base/dft.jl","count":147},{"location":"base/dft.jl","line":44,"children":[{"location":"base/abstractarray.jl","line":558,"children":[],"func":"copy!","path":"/Users/mike/projects/julia/base/abstractarray.jl","count":6},{"location":"base/abstractarray.jl","line":557,"children":[],"func":"copy!","path":"/Users/mike/projects/julia/base/abstractarray.jl","count":2}],"func":"copy1","path":"/Users/mike/projects/julia/base/dft.jl","count":8},{"location":"base/dft.jl","line":43,"children":[],"func":"copy1","path":"/Users/mike/projects/julia/base/dft.jl","count":4}],"func":"profile_test","path":"/Users/mike/profile.jl","count":159},{"location":"profile.jl","line":6,"children":[{"location":"base/abstractarray.jl","line":1755,"children":[{"location":"base/abstractarray.jl","line":0,"children":[],"func":"setindex!","path":"/Users/mike/projects/julia/base/abstractarray.jl","count":11},{"location":"base/abstractarray.jl","line":875,"children":[{"location":"base/multidimensional.jl","line":389,"children":[],"func":"_setindex!","path":"/Users/mike/projects/julia/base/multidimensional.jl","count":2},{"location":"base/multidimensional.jl","line":0,"children":[],"func":"_setindex!","path":"/Users/mike/projects/julia/base/multidimensional.jl","count":1}],"func":"setindex!","path":"/Users/mike/projects/julia/base/abstractarray.jl","count":11}],"func":"mapslices","path":"/Users/mike/projects/julia/base/abstractarray.jl","count":36},{"location":"base/abstractarray.jl","line":1754,"children":[],"func":"mapslices","path":"/Users/mike/projects/julia/base/abstractarray.jl","count":26},{"location":"base/abstractarray.jl","line":1752,"children":[],"func":"mapslices","path":"/Users/mike/projects/julia/base/abstractarray.jl","count":14},{"location":"base/abstractarray.jl","line":1747,"children":[],"func":"mapslices","path":"/Users/mike/projects/julia/base/abstractarray.jl","count":7},{"location":"base/abstractarray.jl","line":1736,"children":[],"func":"mapslices","path":"/Users/mike/projects/julia/base/abstractarray.jl","count":1},{"location":"base/abstractarray.jl","line":1743,"children":[],"func":"mapslices","path":"/Users/mike/projects/julia/base/abstractarray.jl","count":1}],"func":"profile_test","path":"/Users/mike/profile.jl","count":86},{"location":"profile.jl","line":8,"children":[{"location":"base/abstractarray.jl","line":1755,"children":[{"location":"base/sort.jl","line":750,"children":[{"location":"base/sort.jl","line":301,"children":[],"func":"sort!","path":"/Users/mike/projects/julia/base/sort.jl","count":1},{"location":"base/sort.jl","line":307,"children":[],"func":"sort!","path":"/Users/mike/projects/julia/base/sort.jl","count":1},{"location":"base/sort.jl","line":310,"children":[],"func":"sort!","path":"/Users/mike/projects/julia/base/sort.jl","count":1}],"func":"fpsort!","path":"/Users/mike/projects/julia/base/sort.jl","count":3},{"location":"base/sort.jl","line":749,"children":[],"func":"fpsort!","path":"/Users/mike/projects/julia/base/sort.jl","count":1}],"func":"mapslices","path":"/Users/mike/projects/julia/base/abstractarray.jl","count":5},{"location":"base/abstractarray.jl","line":1752,"children":[],"func":"mapslices","path":"/Users/mike/projects/julia/base/abstractarray.jl","count":1},{"location":"base/abstractarray.jl","line":1736,"children":[],"func":"mapslices","path":"/Users/mike/projects/julia/base/abstractarray.jl","count":1},{"location":"base/abstractarray.jl","line":1754,"children":[],"func":"mapslices","path":"/Users/mike/projects/julia/base/abstractarray.jl","count":1}],"func":"profile_test","path":"/Users/mike/profile.jl","count":8}],"func":"process_options","path":"/Users/mike/projects/julia/base/client.jl","count":302},{"location":"base/client.jl","line":272,"children":[],"func":"process_options","path":"/Users/mike/projects/julia/base/client.jl","count":1}],"func":"jlcall__start_20344","path":"/Users/mike/projects/julia/usr/lib/julia/sys.dylib","count":303},{"location":"base/sort.jl","line":0,"children":[],"func":"partition!","path":"/Users/mike/projects/julia/base/sort.jl","count":1}],"func":"","path":"","count":304}

function test() {
  let plot = new ProfileViewer({data: testdata});
  require('./pane').pane.show(plot);
}

function namestring(func, file, line) {
  if (!func && !file) { return "Program"; }
  return (func ? func + " at " : "") + file + (line == -1 ? "" : ":"+line);
}

function process(view, tree) {
  tree.name = "Program";
  return prewalk(tree, ({count, children, location, func, path, line}) => ({
    count,
    children,
    onmouseover: () => view.current = {func, location, line, count},
    onmouseout: () => view.current = null,
    onclick: () => atom.workspace.open(path, {initialLine: line-1, searchAllPanes: true})
  }));
}

function flatten(tree) {
  let cache = {};
  prefor(tree, ({path, line, count}) => {
    let key = JSON.stringify([path, line]);
    let val = cache[key];
    if (!val) val = cache[key] = {file: path, line: line-1, count: 0};
    val.count += count;
  });
  let lines = [];
  for (k in cache) {
    cache[k].count /= tree.count;
    lines.push(cache[k]);
  }
  return lines;
}

function toolbarView(current) {
  if (!current) return <span/>;
  let {func, location, line, count} = current;
  return <span>
    <span className='inline-block'><Badge>{count}</Badge></span>
    <span style='vertical-align:middle'>{namestring(func, location, line)}</span>
  </span>;
}

class ProfileViewer {
  constructor({data}) {
    this.toolbar = view(() => toolbarView(this.current));
    this.data = process(this, data);
    this.highlights = require('../editor/highlights').profileLines(flatten(data));
    etch.initialize(this);
  }
  update({data}) {
    this.data = process(this, data);
    etch.update(this);
  }
  _current = "";
  get current() { return this._current; }
  set current(x) {
    this._current = x;
    this.toolbar.update();
  }
  render() {
    return <Canopy data={this.data} />;
  }
  destroy() {
    etch.destroy(this);
    this.highlights.destroy();
  }
}

let subs;

export function activate() {
  subs = new CompositeDisposable();
  subs.add(atom.commands.add(atom.views.getView(atom.workspace), {
    'ink-profiler:test': () => test()
  }));
}

export function deactivate() {
  subs.dispose();
}
