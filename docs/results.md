Inline results provide a way to get in-editor evaluation, à la Light Table.

## Basics

The `Result` class is available as part of the `ink` module: `ink.Result`.

```coffee
r = new Result(editor, [start, end], content: dom)
```

`editor` is a text editor object (like `atom.workspace.getActiveTextEditor()`) and `[start, end]` is a range of line numbers to associate with (more on that below). `content` is a dom node which will be displayed in the result.

There's also an `error` option which adds appropriate styling to the result annotation.

## Loading

Rather than waiting for the evaluation to finish, you can display a result immediately with a loading indicator and later fill in the real value, like so:

```coffee
# Immediately on evaluation:
r = new Result(editor, [start, end])
# When the evaluation is done:
r.setContent dom
```

It's also a good idea to give the user visual feedback that an evaluation has happened and on the block of code that was evaluated. To do this you can simply call

```coffee
ink.highlight editor, start, end
```

which will briefly highlight the code between the given line numbers.

## Destruction

Rather than being associated with just a single line, result objects are tied to a range of lines via the `[start, end]` setting. This ensures that results won't be displayed for overlapping code blocks, as well as allowing the user to remove results by pressing <kbd>Esc</kbd> with the cursor in the code block.

There's also the "Inline Results: Clear All" command, <kbd>C-i-c</kbd>, which removes all results in an editor.

Failing that you can call `.destroy()`.
