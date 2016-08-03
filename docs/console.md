Ink's console provides a powerful REPL-like experience for any language, and even for multiple languages at once.

## Basic Setup

The `Console` main class is available from inside the `ink` object: `ink.Console`. When your package is activated, start by creating an instance of the console. Rather than using a constructor we do this with:

```coffee
cons = Console.fromId 'my-language-client'
```

By providing a unique id (it doesn't matter what), Ink can make sure that serialisation works properly, so that your console saves its state between Atom sessions.

This is already enough to get going. To open the console just call `cons.open()`. The argument to this method is forwarded to `atom.workspace.open` so you can call it like this:

```coffee
cons.open
  split: 'down'
  searchAllPanes: true
```

## Handling Evaluation

Right now the console won't do anything if you hit `Enter` to evaluate. To add some behaviour here we just need to register an `onEval` handler. Here's a handler which simply echoes the input:

```coffee
cons.onEval ({editor}) ->
  cons.done()
  cons.stdout editor.getText()
  cons.input()
```

The eval handler is passed an object which represents the *input cell* which the user just evaluated from. In this case we only want to grab the `editor` object, which contains the input text.

`cons.done()` tells the console that the current input cell is finished with; it will no longer accept new evaluations.

`cons.stdout(...)` shows output in the console (we'll go over this in more detail later).

`cons.input()` displays a new, blank input cell in the console, ready for the next evaluation.

In practice you'll often want to send code into a language client to run it. Here's the skeleton for a more complex eval handler:

```coffee
cons.onEval ({editor}) ->
  return unless editor.getText().trim() # Ignore empty input
  cons.done()
  evaluateInClient(editor.getText()).then ->
    cons.input()
```

## Displaying Output

There are three methods for displaying text output: `.stdout(s)`, `.stderr(s)` and `.info(s)`. Each of these will display a cell containing the string `s` in monospace, with an appropriate colour and icon. This provides a very convenient way to pipe your language client's output streams to the console.

Finally you can call `.result(dom, [error: true/false])` to display some arbitrary HTML element within a cell.

## Console Modes

You'll probably want to have syntax highlighting for your language in the console. That's easy enough:

```coffee
cons.setModes [{grammar: 'source.julia'}]
```

As well as the default syntax your console can have multiple modes which are choosable by the user. For example, Juno sets up the following modes:

```coffee
[
  {name: 'julia', grammar: 'source.julia'}
  {name: 'help', prefix: '?', icon: 'question', grammar: 'source.julia'}
  {name: 'shell', prefix: ';', icon: 'terminal', grammar: 'source.shell'}
]
```

What this means is that when the user types `;` in the console they enter "shell mode" and can execute bash commands like `ls`.

The mode chosen by the user will be passed into the `onEval` handler as the `.mode` key.

## History

The console is able to keep a log of inputs so that the user can browse through their history by pressing up and down. Entering a prefix (like `fo|`) and pressing up will filter inputs that match the prefix (like `fo|o()` and `fo|r ...`).

To enable this simply call `cons.logInput()` just before `cons.done()`.

You may also want to save and restore history by so that it persists between sessions. You can get and set history via `cons.history.items` and `cons.history.set(items)` respectively.
