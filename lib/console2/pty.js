'use babel';

/* global emit */

// from atom/terminal to reduce cpu usage

import pty from 'ptyw.js';
import path from 'path';
import consistentEnv from 'consistent-env';

export default function(ptyCwd, sh, cols, rows, args, LANG) {
  const env = consistentEnv();

  let shell;
  const callback = this.async();
  if (sh) {
    shell = sh;
  } else {
    shell = env.SHELL;
    if (!shell) {
      // Try to salvage some sort of shell to execute. Horrible code below.
      if (process.platform === 'win32') {
        shell = path.resolve(
          env.SystemRoot,
          'System32',
          'WindowsPowerShell',
          'v1.0',
          'powershell.exe',
        );
      } else {
        shell = '/bin/sh';
      }
    }
  }

  const cleanEnv = Object.assign({}, env, { LANG });
  delete cleanEnv.NODE_ENV;
  delete cleanEnv.NODE_PATH;

  const ptyProcess = pty.fork(shell, args, {
    name: 'xterm-256color',
    cols,
    rows,
    env: cleanEnv,
    cwd: ptyCwd,
  });

  ptyProcess.on('data', data =>
    emit('xterm:data', new Buffer(data).toString('base64')),
  );

  ptyProcess.on('exit', () => {
    emit('xterm:exit');
    return callback();
  });

  return process.on(
    'message',
    ({ event, cols: newCols, rows: newRows, text } = {}) => {
      switch (event) {
        case 'resize':
          ptyProcess.resize(newCols, newRows);
          break;
        case 'input':
          ptyProcess.write(new Buffer(text, 'base64'));
          break;
        default:
          break;
      }
    },
  );
}
