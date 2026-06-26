'use strict';

let pty;
try {
  pty = require('node-pty');
} catch (e) {
  console.warn('node-pty not available, terminal disabled:', e.message);
}

/**
 * Handle a WebSocket connection for the integrated terminal.
 */
function handleTerminal(ws, req) {
  if (!pty) {
    ws.send(JSON.stringify({ type: 'error', data: 'Terminal unavailable (node-pty not installed)' }));
    ws.close();
    return;
  }

  const shell = process.env.SHELL || '/bin/sh';
  const cols = 80;
  const rows = 24;

  let ptyProcess;
  try {
    ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: process.env.COMPOSE_DIR || '/compose',
      env: { ...process.env, TERM: 'xterm-256color' },
    });
  } catch (err) {
    ws.send(JSON.stringify({ type: 'error', data: err.message }));
    ws.close();
    return;
  }

  ptyProcess.onData((data) => {
    if (ws.readyState === ws.constructor.OPEN) {
      ws.send(JSON.stringify({ type: 'output', data }));
    }
  });

  ptyProcess.onExit(({ exitCode }) => {
    if (ws.readyState === ws.constructor.OPEN) {
      ws.send(JSON.stringify({ type: 'exit', exitCode }));
      ws.close();
    }
  });

  ws.on('message', (msg) => {
    try {
      const message = JSON.parse(msg.toString());
      if (message.type === 'input') {
        ptyProcess.write(message.data);
      } else if (message.type === 'resize') {
        ptyProcess.resize(message.cols || cols, message.rows || rows);
      }
    } catch {
      // Treat raw string as input
      ptyProcess.write(msg.toString());
    }
  });

  ws.on('close', () => {
    try { ptyProcess.kill(); } catch {}
  });

  ws.on('error', () => {
    try { ptyProcess.kill(); } catch {}
  });
}

module.exports = { handleTerminal };
