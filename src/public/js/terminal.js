/* ============================================================
   DoCompose — Terminal View (xterm.js + WebSocket)
   ============================================================ */

'use strict';

let termInstance = null;
let termFitAddon = null;
let termWs = null;
let termInitialized = false;

function terminalInit() {
  const container = document.getElementById('view-terminal');

  if (!termInitialized) {
    container.innerHTML = `
      <div class="terminal-container">
        <div class="terminal-toolbar">
          <span style="font-size:0.85rem;font-weight:600;color:var(--text-secondary)">Terminal</span>
          <button class="btn btn-secondary btn-sm" id="termClearBtn">Clear</button>
          <button class="btn btn-secondary btn-sm" id="termReconnectBtn">Reconnect</button>
          <span id="termStatus" style="font-size:0.8rem;color:var(--text-muted);margin-left:auto">Disconnected</span>
        </div>
        <div id="xterm-container"></div>
      </div>
    `;

    document.getElementById('termClearBtn').addEventListener('click', () => {
      if (termInstance) termInstance.clear();
    });
    document.getElementById('termReconnectBtn').addEventListener('click', termConnect);
  }

  // Initialize xterm if available
  if (typeof Terminal !== 'undefined') {
    if (!termInstance) {
      termInstance = new Terminal({
        theme: {
          background: '#0a0f1a',
          foreground: '#c9d1d9',
          cursor: '#3b82f6',
          selection: 'rgba(59,130,246,0.3)',
          black: '#0a0f1a',
          brightBlack: '#6e7681',
          red: '#ff7b72',
          brightRed: '#ffa198',
          green: '#3fb950',
          brightGreen: '#56d364',
          yellow: '#d29922',
          brightYellow: '#e3b341',
          blue: '#58a6ff',
          brightBlue: '#79c0ff',
          magenta: '#bc8cff',
          brightMagenta: '#d2a8ff',
          cyan: '#39c5cf',
          brightCyan: '#56d4dd',
          white: '#b1bac4',
          brightWhite: '#f0f6fc',
        },
        fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace",
        fontSize: 13,
        lineHeight: 1.4,
        cursorBlink: true,
        scrollback: 5000,
      });

      const xtermContainer = document.getElementById('xterm-container');
      if (xtermContainer && !termInitialized) {
        termInstance.open(xtermContainer);

        if (typeof FitAddon !== 'undefined') {
          termFitAddon = new FitAddon.FitAddon();
          termInstance.loadAddon(termFitAddon);
        }
      }
    }

    termInitialized = true;

    // Fit on show
    setTimeout(() => {
      if (termFitAddon) termFitAddon.fit();
    }, 100);

    termConnect();

    // Handle resize
    const resizeObs = new ResizeObserver(() => {
      if (termFitAddon) {
        try { termFitAddon.fit(); } catch {}
        if (termWs && termWs.readyState === WebSocket.OPEN) {
          termWs.send(JSON.stringify({
            type: 'resize',
            cols: termInstance.cols,
            rows: termInstance.rows,
          }));
        }
      }
    });
    const xtermContainer = document.getElementById('xterm-container');
    if (xtermContainer) resizeObs.observe(xtermContainer);

  } else {
    // xterm.js not available
    const container2 = document.getElementById('view-terminal');
    if (!termInitialized) {
      container2.innerHTML += `<div class="empty-state"><p>xterm.js not available. Make sure you have internet access for CDN resources.</p></div>`;
    }
    termInitialized = true;
  }
}
window.terminalInit = terminalInit;

function termConnect() {
  termDisconnect();

  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${proto}//${location.host}/ws/terminal`;

  setTermStatus('Connecting…');

  try {
    termWs = new WebSocket(wsUrl);
  } catch (err) {
    setTermStatus('Connection failed');
    if (termInstance) termInstance.write('\r\n\x1b[31mFailed to connect to terminal WebSocket\x1b[0m\r\n');
    return;
  }

  termWs.onopen = () => {
    setTermStatus('Connected');
    // Send initial size
    if (termInstance && termFitAddon) {
      try { termFitAddon.fit(); } catch {}
      termWs.send(JSON.stringify({
        type: 'resize',
        cols: termInstance.cols,
        rows: termInstance.rows,
      }));
    }
  };

  termWs.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === 'output' && termInstance) {
        termInstance.write(msg.data);
      } else if (msg.type === 'exit' && termInstance) {
        termInstance.write('\r\n\x1b[33m[Process exited]\x1b[0m\r\n');
        setTermStatus('Process exited');
      } else if (msg.type === 'error' && termInstance) {
        termInstance.write('\r\n\x1b[31m' + (msg.data || 'Error') + '\x1b[0m\r\n');
      }
    } catch {
      if (termInstance) termInstance.write(e.data);
    }
  };

  termWs.onclose = () => {
    setTermStatus('Disconnected');
  };

  termWs.onerror = () => {
    setTermStatus('Connection error');
    if (termInstance) termInstance.write('\r\n\x1b[31m[Connection error]\x1b[0m\r\n');
  };

  // Forward keyboard input
  if (termInstance) {
    termInstance.onData((data) => {
      if (termWs && termWs.readyState === WebSocket.OPEN) {
        termWs.send(JSON.stringify({ type: 'input', data }));
      }
    });
  }
}

function termDisconnect() {
  if (termWs) {
    try { termWs.close(); } catch {}
    termWs = null;
  }
}

function setTermStatus(msg) {
  const el = document.getElementById('termStatus');
  if (el) el.textContent = msg;
}
