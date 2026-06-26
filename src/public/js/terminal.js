/* ============================================================
   DoCompose — Terminal View (click container → exec terminal)
   ============================================================ */

'use strict';

let termInstance = null;
let termFitAddon = null;
let termWs = null;
let termActiveContainer = null;

function terminalInit() {
  termDisconnect();
  termActiveContainer = null;

  const container = document.getElementById('view-terminal');
  container.innerHTML = `
    <div class="terminal-container" style="display:flex;flex-direction:column;height:100%">
      <div class="container-picker" id="termContainerPicker">
        <div class="container-picker-label">Click a running container to open its terminal</div>
        <div class="container-picker-grid" id="termChips">
          <div class="loading"><div class="spinner"></div></div>
        </div>
      </div>
      <div class="terminal-toolbar" id="termToolbar" style="display:none">
        <span id="termContainerLabel" style="font-size:1rem;font-weight:700;color:var(--text-secondary)"></span>
        <button class="btn btn-secondary btn-sm" id="termClearBtn">Clear</button>
        <button class="btn btn-secondary btn-sm" id="termReconnectBtn">Reconnect</button>
        <span id="termStatus" style="font-size:0.9rem;color:var(--text-muted);margin-left:auto">Disconnected</span>
      </div>
      <div id="xterm-container" style="flex:1;padding:0.5rem;min-height:0;overflow:hidden;display:none"></div>
    </div>
  `;

  document.getElementById('termClearBtn').addEventListener('click', () => {
    if (termInstance) termInstance.clear();
  });
  document.getElementById('termReconnectBtn').addEventListener('click', () => {
    if (termActiveContainer) termConnect(termActiveContainer);
  });

  loadTermContainerList();
}
window.terminalInit = terminalInit;

async function loadTermContainerList() {
  const chipsEl = document.getElementById('termChips');
  if (!chipsEl) return;

  try {
    const { containers } = await fetch('/api/logs').then((r) => r.json());
    const list = (containers || []).filter((c) => c.state === 'running' || c.state === 'Running');

    if (!list.length) {
      chipsEl.innerHTML = '<span style="font-size:0.875rem;color:var(--text-muted)">No running containers</span>';
      return;
    }

    chipsEl.innerHTML = list.map((c) => {
      const name = c.name.split(', ')[0];
      return `
        <button class="container-chip${termActiveContainer === name ? ' active' : ''}"
                onclick="termSelectContainer(${JSON.stringify(name)})"
                data-container="${escHtml(name)}">
          <span class="status-dot status-running" style="width:8px;height:8px"></span>
          ${escHtml(name)}
        </button>`;
    }).join('');
  } catch (err) {
    chipsEl.innerHTML = `<span style="font-size:0.875rem;color:var(--danger)">${escHtml(err.message)}</span>`;
  }
}

function termSelectContainer(name) {
  termActiveContainer = name;

  // Update chip highlight
  document.querySelectorAll('#termChips .container-chip').forEach((ch) => {
    ch.classList.toggle('active', ch.dataset.container === name);
  });

  // Show toolbar + terminal
  document.getElementById('termToolbar').style.display = '';
  document.getElementById('xterm-container').style.display = '';
  const label = document.getElementById('termContainerLabel');
  if (label) label.textContent = name;

  // Re-create xterm instance for the new DOM node
  if (termInstance) { try { termInstance.dispose(); } catch {} termInstance = null; termFitAddon = null; }

  if (typeof Terminal !== 'undefined') {
    termInstance = new Terminal({
      theme: {
        background: '#0a0f1a',
        foreground: '#c9d1d9',
        cursor: '#3b82f6',
        selection: 'rgba(59,130,246,0.3)',
        black: '#0a0f1a', brightBlack: '#6e7681',
        red: '#ff7b72', brightRed: '#ffa198',
        green: '#3fb950', brightGreen: '#56d364',
        yellow: '#d29922', brightYellow: '#e3b341',
        blue: '#58a6ff', brightBlue: '#79c0ff',
        magenta: '#bc8cff', brightMagenta: '#d2a8ff',
        cyan: '#39c5cf', brightCyan: '#56d4dd',
        white: '#b1bac4', brightWhite: '#f0f6fc',
      },
      fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace",
      fontSize: 14,
      lineHeight: 1.4,
      cursorBlink: true,
      scrollback: 5000,
    });

    const xtermContainer = document.getElementById('xterm-container');
    termInstance.open(xtermContainer);

    if (typeof FitAddon !== 'undefined') {
      termFitAddon = new FitAddon.FitAddon();
      termInstance.loadAddon(termFitAddon);
    }

    const resizeObs = new ResizeObserver(() => {
      if (termFitAddon) {
        try { termFitAddon.fit(); } catch {}
        if (termWs && termWs.readyState === WebSocket.OPEN) {
          termWs.send(JSON.stringify({ type: 'resize', cols: termInstance.cols, rows: termInstance.rows }));
        }
      }
    });
    resizeObs.observe(xtermContainer);
  }

  setTimeout(() => {
    if (termFitAddon) try { termFitAddon.fit(); } catch {}
    termConnect(name);
  }, 80);
}
window.termSelectContainer = termSelectContainer;

function termConnect(containerName) {
  termDisconnect();
  if (!termInstance) return;

  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${proto}//${location.host}/ws/terminal?container=${encodeURIComponent(containerName)}`;

  setTermStatus('Connecting…');
  termInstance.clear();

  try {
    termWs = new WebSocket(wsUrl);
  } catch (err) {
    setTermStatus('Connection failed');
    termInstance.write(`\r\n\x1b[31mFailed to connect: ${err.message}\x1b[0m\r\n`);
    return;
  }

  termWs.onopen = () => {
    setTermStatus('Connected');
    if (termFitAddon) {
      try { termFitAddon.fit(); } catch {}
      termWs.send(JSON.stringify({ type: 'resize', cols: termInstance.cols, rows: termInstance.rows }));
    }
  };

  termWs.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === 'output') termInstance.write(msg.data);
      else if (msg.type === 'exit') {
        termInstance.write('\r\n\x1b[33m[Process exited]\x1b[0m\r\n');
        setTermStatus('Exited');
      } else if (msg.type === 'error') {
        termInstance.write(`\r\n\x1b[31m${msg.data || 'Error'}\x1b[0m\r\n`);
      }
    } catch {
      termInstance.write(e.data);
    }
  };

  termWs.onclose = () => setTermStatus('Disconnected');
  termWs.onerror = () => {
    setTermStatus('Error');
    termInstance.write('\r\n\x1b[31m[Connection error]\x1b[0m\r\n');
  };

  termInstance.onData((data) => {
    if (termWs && termWs.readyState === WebSocket.OPEN) {
      termWs.send(JSON.stringify({ type: 'input', data }));
    }
  });
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
