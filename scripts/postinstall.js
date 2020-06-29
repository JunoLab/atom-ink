var fs = require('fs-extra')

function installXTerm () {
  fs.copySync(__dirname + '/../node_modules/xterm/css/xterm.css', __dirname + '/../styles/xterm.css')
}

installXTerm()
