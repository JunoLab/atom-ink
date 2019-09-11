var fs = require('fs-extra')
var replace = require('replace-in-file')

function installKaTeX () {
  fs.copySync(__dirname + '/../node_modules/katex/dist/fonts', __dirname + '/../styles/fonts')
  fs.copySync(__dirname + '/../node_modules/katex/dist/katex.css', __dirname + '/../styles/katex.css')

  replace.sync({
    files: __dirname + '/../styles/katex.css',
    from:  /url\(fonts/g,
    to:    'url(atom:\/\/ink\/styles\/fonts'
  })
}

function installXTerm () {
  fs.copySync(__dirname + '/../node_modules/xterm/css/xterm.css', __dirname + '/../styles/xterm.css')
}

installKaTeX()
installXTerm()
