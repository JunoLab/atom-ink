# Ink Docs

This folder provides the developer documentation for the Ink package. If you want to use Ink's features in your language plugin or IDE, you've come to the right place!

This is a work in progress, so if there's something you're particularly interested in we can probably help out over on [Gitter](https://gitter.im/JunoLab/Juno).

## Setting Up

The first step is to load Ink into your package. This happens through Atom's services API, detailed in the Atom flight manual.

```json
"consumedServices": {
  "ink": {
    "versions": {
      "*": "consumeInk"
    }
  }
}
```

In your main module you might do something like:

```coffee
ink = null

module.exports.consumeInk = (x) ->
  ink = x
  # do something with ink
```

Now that the ink module is available you can go ahead and use it!

## Features

* [Console](console.md)
