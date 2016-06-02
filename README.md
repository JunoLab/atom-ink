# Ink

[![Build Status](https://travis-ci.org/JunoLab/atom-ink.svg?branch=master)](https://travis-ci.org/JunoLab/atom-ink)  [![Build status](https://ci.appveyor.com/api/projects/status/8hrbi7ii3vvbd8b1/branch/master?svg=true)](https://ci.appveyor.com/project/pfitzseb/atom-ink/branch/master)

Ink is a toolkit for building IDEs in Atom – in particular, it's aimed at providing the UI
pieces necessary to build richly interactive, live environments for programming – inspired
by the likes of SmallTalk, Lisp, LightTable, DevTools, Swift, and others.

Ink is currently used primarily from the
[julia-client](https://github.com/JunoLab/atom-julia-client) plugin as an IDE for the
Julia language, as well as the awesome [proto-repl](https://github.com/jasongilman/proto-repl) for Clojure. Although Ink is in an early state, people interested in
getting it running with other languages are welcome to reach out.

<div align="center"><img src="https://raw.githubusercontent.com/JunoLab/atom-ink/master/demos/full.gif" /></div>

### Highlights

*(These demos show off Ink as part of [Julia](https://github.com/JunoLab/atom-julia-client)
since it's the most mature project using Ink, but there's nothing Julia-specific about
Ink's design)*

Evaluation of blocks and lines, with inline results, highlighting of the evaluated block,
and loading indicators:

<div align="center"><img src="https://raw.githubusercontent.com/JunoLab/atom-ink/master/demos/eval.gif" /></div>

Smart tree views for complex results and data:

<div align="center"><img src="https://raw.githubusercontent.com/JunoLab/atom-ink/master/demos/tree.gif" /></div>

A rich console with the same support for results, as well as history, shell modes etc.:

<div align="center"><img src="https://raw.githubusercontent.com/JunoLab/atom-ink/master/demos/console.gif" /></div>

Smart errors with live links to files in the backtrace, as well as highlighting of those
lines:

<div align="center"><img src="https://raw.githubusercontent.com/JunoLab/atom-ink/master/demos/errors.gif" /></div>

In future Ink will also support UIs for debugging (e.g. breakpoints), graphics (e.g. plotting panes), documentation (e.g. single-keystroke access to inline docs) and profiling/coverage results (e.g. inline "progress bars" and metrics overlaid with the code).
