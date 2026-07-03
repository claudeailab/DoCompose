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

  // Parse ?container=name from the WebSocket upgrade URL
  const urlParams = new URLSearchParams((req.url || '').split('?')[1] || '');
  const containerName = urlParams.get('container');

  const cols = 80;
  const rows = 24;

  let ptyProcess;
  try {
    if (containerName) {
      ptyProcess = pty.spawn('docker', ['exec', '-it', containerName, '/bin/sh'], {
        name: 'xterm-256color',
        cols,
        rows,
        cwd: '/',
        env: { ...process.env, TERM: 'xterm-256color' },
      });
    } else {
      const shell = process.env.SHELL || '/bin/sh';
      ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols,
        rows,
        cwd: process.env.COMPOSE_DIR || '/compose',
        env: { ...process.env, TERM: 'xterm-256color' },
      });
    }
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
    let message;
    try {
      message = JSON.parse(msg.toString());
    } catch {
      // Not JSON — treat the raw string as terminal input
      ptyProcess.write(msg.toString());
      return;
    }
    if (message.type === 'input') {
      ptyProcess.write(message.data);
    } else if (message.type === 'resize') {
      const c = Number(message.cols);
      const r = Number(message.rows);
      if (Number.isInteger(c) && Number.isInteger(r) && c > 0 && r > 0 && c <= 1000 && r <= 1000) {
        try { ptyProcess.resize(c, r); } catch {}
      }
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
