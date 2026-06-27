/* ============================================================
   DoCompose — Service Detail (Configuration | Logs | Terminal)
   ============================================================ */

'use strict';

let svcName = null;
let svcInitialTab = 'config';
let svcCurrentTab = 'config';
let svcConfigDirty = false;
let svcLogsEs = null;
let svcLogsAutoScroll = true;
let svcTerm = null;
let svcTermFit = null;
let svcTermWs = null;

function showServiceDetail(name, tab) {
  svcName = name;
  svcInitialTab = tab || 'config';
  showView('service');
}
window.showServiceDetail = showServiceDetail;

function serviceInit() {
  svcLogsStop();
  svcTermDisconnect();
  if (svcTerm) { try { svcTerm.dispose(); } catch {} svcTerm = null; svcTermFit = null; }
  svcConfigDirty = false;

  const name = svcName;
  const c = document.getElementById('view-service');

  // Highlight active service in sidebar
  document.querySelectorAll('.service-item').forEach((el) => {
    el.classList.toggle('active', el.dataset.name === name);
  });

  if (!name) {
    c.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;flex:1;color:var(--text-muted);font-size:0.95rem">← Select a service from the list</div>`;
    return;
  }

  const svc = (DC.services || []).find((s) => s.name === name);
  const state = svc ? (svc.state || 'absent').toLowerCase() : 'absent';
  const containerName = svc ? (svc.containerName || name) : name;

  c.innerHTML = `
    <div class="svc-detail">
      <div class="svc-header">
        <span class="status-dot ${statusClass(state)}" style="width:10px;height:10px;flex-shrink:0"></span>
        <span class="svc-title">${escHtml(name)}</span>
        <div class="svc-tabs">
          <button class="svc-tab" data-tab="config">Configuration</button>
          <button class="svc-tab" data-tab="logs">Logs</button>
          <button class="svc-tab" data-tab="terminal">Terminal</button>
        </div>
      </div>
      <div class="svc-body">
        <div class="svc-pane" id="svcPaneConfig" style="display:none"></div>
        <div class="svc-pane" id="svcPaneLogs" style="display:none"></div>
        <div class="svc-pane" id="svcPaneTerminal" style="display:none"></div>
      </div>
    </div>
  `;

  c.querySelectorAll('.svc-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.tab === svcCurrentTab) return;
      svcSwitchTab(btn.dataset.tab, name, containerName);
    });
  });

  svcSwitchTab(svcInitialTab, name, containerName);
}
window.serviceInit = serviceInit;

function svcSwitchTab(tab, name, containerName) {
  // Hide all panes
  ['config', 'logs', 'terminal'].forEach((t) => {
    const el = document.getElementById('svcPane' + cap(t));
    if (el) el.style.display = 'none';
  });
  // Deactivate all tabs
  document.querySelectorAll('.svc-tab').forEach((b) => b.classList.remove('active'));
  const activeBtn = document.querySelector(`.svc-tab[data-tab="${tab}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  // Show chosen pane
  const pane = document.getElementById('svcPane' + cap(tab));
  if (pane) pane.style.display = '';

  // Stop logs/terminal when leaving
  if (svcCurrentTab === 'logs' && tab !== 'logs') svcLogsStop();

  svcCurrentTab = tab;

  if (tab === 'config') svcRenderConfig(name);
  else if (tab === 'logs') svcRenderLogs(containerName);
  else if (tab === 'terminal') svcRenderTerminal(containerName);
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

/* ---- Configuration tab ---- */
function svcRenderConfig(name) {
  const pane = document.getElementById('svcPaneConfig');
  if (!pane || pane.dataset.loaded) return;
  pane.dataset.loaded = '1';

  pane.innerHTML = `
    <div class="svc-config-toolbar">
      <button class="btn btn-primary btn-sm" id="svcSaveBtn" disabled>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
        </svg>
        Save
      </button>
      <button class="btn btn-secondary btn-sm" id="svcReloadBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        Reload
      </button>
      <span class="svc-status" id="svcConfigStatus" style="margin-left:auto"></span>
    </div>
    <textarea class="yaml-textarea" id="svcConfigTextarea" spellcheck="false"></textarea>
  `;

  document.getElementById('svcSaveBtn').addEventListener('click', () => svcSaveConfig(name));
  document.getElementById('svcReloadBtn').addEventListener('click', () => {
    delete pane.dataset.loaded;
    svcRenderConfig(name);
  });
  document.getElementById('svcConfigTextarea').addEventListener('input', () => {
    svcConfigDirty = true;
    const btn = document.getElementById('svcSaveBtn');
    if (btn) btn.disabled = false;
    svcSetConfigStatus('');
  });

  svcLoadConfig(name);
}

function svcSetConfigStatus(msg, cls) {
  const el = document.getElementById('svcConfigStatus');
  if (!el) return;
  el.textContent = msg;
  el.className = 'svc-status' + (cls ? ' ' + cls : '');
}

async function svcLoadConfig(name) {
  svcSetConfigStatus('Loading…');
  try {
    const { yaml } = await api('GET', `/api/files/service/${encodeURIComponent(name)}`);
    const ta = document.getElementById('svcConfigTextarea');
    if (ta) ta.value = yaml;
    svcConfigDirty = false;
    svcSetConfigStatus('Loaded', 'valid');
    const btn = document.getElementById('svcSaveBtn');
    if (btn) btn.disabled = true;
  } catch (err) {
    svcSetConfigStatus(`Error: ${err.message}`, 'invalid');
    const ta = document.getElementById('svcConfigTextarea');
    if (ta) ta.value = `# Error loading config: ${err.message}`;
  }
}

async function svcSaveConfig(name) {
  const ta = document.getElementById('svcConfigTextarea');
  if (!ta) return;
  svcSetConfigStatus('Saving…');
  try {
    await api('POST', `/api/files/service/${encodeURIComponent(name)}`, { yaml: ta.value });
    svcConfigDirty = false;
    svcSetConfigStatus('Saved', 'valid');
    showToast(`${name} saved`, 'success');
    const btn = document.getElementById('svcSaveBtn');
    if (btn) btn.disabled = true;
  } catch (err) {
    svcSetConfigStatus(`Error: ${err.message}`, 'invalid');
    showToast(`Save failed: ${err.message}`, 'error');
  }
}

/* ---- Logs tab ---- */
function svcRenderLogs(containerName) {
  const pane = document.getElementById('svcPaneLogs');
  if (!pane) return;
  pane.innerHTML = `
    <div class="logs-toolbar">
      <button class="btn btn-danger btn-sm" id="svcLogsStopBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="12" height="12"/></svg>
        Stop
      </button>
      <button class="btn btn-secondary btn-sm" id="svcLogsClearBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
        </svg>
        Clear
      </button>
      <label class="btn btn-secondary btn-sm" style="cursor:pointer;user-select:none">
        <input type="checkbox" id="svcLogsAutoScroll" checked style="margin-right:4px">Auto-scroll
      </label>
      <input type="text" id="svcLogsSearch" placeholder="Filter…"
        style="width:140px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);padding:0.3rem 0.55rem;font-size:0.85rem;outline:none">
      <span id="svcLogsStatus" style="font-size:0.85rem;color:var(--text-muted);margin-left:auto">Connecting…</span>
    </div>
    <div class="logs-output" id="svcLogsOutput"></div>
  `;

  document.getElementById('svcLogsStopBtn').addEventListener('click', svcLogsStop);
  document.getElementById('svcLogsClearBtn').addEventListener('click', () => {
    const out = document.getElementById('svcLogsOutput');
    if (out) out.innerHTML = '';
  });
  document.getElementById('svcLogsAutoScroll').addEventListener('change', (e) => {
    svcLogsAutoScroll = e.target.checked;
  });
  document.getElementById('svcLogsSearch').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('#svcLogsOutput .log-line').forEach((line) => {
      line.classList.toggle('highlight', !!q && line.textContent.toLowerCase().includes(q));
    });
  });
  document.getElementById('svcLogsOutput').addEventListener('scroll', function () {
    if (this.scrollHeight - this.scrollTop > this.clientHeight + 60) {
      svcLogsAutoScroll = false;
      const cb = document.getElementById('svcLogsAutoScroll');
      if (cb) cb.checked = false;
    }
  });

  svcLogsStart(containerName);
}

function svcLogsStop() {
  if (svcLogsEs) { try { svcLogsEs.close(); } catch {} svcLogsEs = null; }
  const btn = document.getElementById('svcLogsStopBtn');
  if (btn) btn.disabled = true;
  const st = document.getElementById('svcLogsStatus');
  if (st) st.textContent = 'Stopped';
}

function svcLogsStart(containerName) {
  svcLogsStop();
  const out = document.getElementById('svcLogsOutput');
  if (!out) return;

  const setSt = (msg) => { const el = document.getElementById('svcLogsStatus'); if (el) el.textContent = msg; };
  setSt('Connecting…');

  svcLogsEs = new EventSource(`/api/logs/${encodeURIComponent(containerName)}?tail=200`);
  svcLogsEs.onopen = () => setSt('Streaming');
  svcLogsEs.onmessage = (e) => {
    const searchQ = (document.getElementById('svcLogsSearch') || {}).value || '';
    try {
      const lines = String(JSON.parse(e.data)).split('\n');
      for (const raw of lines) {
        if (!raw) continue;
        let timeStr = '';
        let content = raw;
        const m = raw.match(/^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\s/);
        if (m) { timeStr = new Date(m[1]).toLocaleTimeString(); content = raw.slice(m[0].length); }
        const span = document.createElement('span');
        span.className = 'log-line';
        if (timeStr) {
          const ts = document.createElement('span');
          ts.className = 'log-time';
          ts.textContent = timeStr;
          span.appendChild(ts);
        }
        span.appendChild(document.createTextNode(content));
        if (searchQ && content.toLowerCase().includes(searchQ.toLowerCase())) span.classList.add('highlight');
        out.appendChild(span);
      }
    } catch {
      const span = document.createElement('span');
      span.className = 'log-line';
      span.textContent = e.data;
      out.appendChild(span);
    }
    if (svcLogsAutoScroll) out.scrollTop = out.scrollHeight;
  };
  svcLogsEs.addEventListener('close', () => { setSt('Ended'); svcLogsStop(); });
  svcLogsEs.onerror = () => { setSt('Error'); svcLogsStop(); };

  const btn = document.getElementById('svcLogsStopBtn');
  if (btn) btn.disabled = false;
}

/* ---- Terminal tab ---- */
function svcRenderTerminal(containerName) {
  const pane = document.getElementById('svcPaneTerminal');
  if (!pane) return;
  pane.innerHTML = `
    <div class="terminal-toolbar">
      <button class="btn btn-secondary btn-sm" id="svcTermClearBtn">Clear</button>
      <button class="btn btn-secondary btn-sm" id="svcTermReconnBtn">Reconnect</button>
      <span id="svcTermStatus" style="font-size:0.9rem;color:var(--text-muted);margin-left:auto">Connecting…</span>
    </div>
    <div id="svcXterm" style="flex:1;padding:0.5rem;min-height:0;overflow:hidden"></div>
  `;

  document.getElementById('svcTermClearBtn').addEventListener('click', () => { if (svcTerm) svcTerm.clear(); });
  document.getElementById('svcTermReconnBtn').addEventListener('click', () => svcTermConnect(containerName));

  if (typeof Terminal === 'undefined') {
    pane.innerHTML += '<div style="padding:1rem;color:var(--danger)">Terminal library not loaded</div>';
    return;
  }

  if (svcTerm) { try { svcTerm.dispose(); } catch {} svcTerm = null; svcTermFit = null; }

  svcTerm = new Terminal({
    theme: {
      background: '#0a0f1a', foreground: '#c9d1d9', cursor: '#3b82f6',
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
    fontSize: 13,
    lineHeight: 1.4,
    cursorBlink: true,
    scrollback: 5000,
  });

  const xtc = document.getElementById('svcXterm');
  svcTerm.open(xtc);

  if (typeof FitAddon !== 'undefined') {
    svcTermFit = new FitAddon.FitAddon();
    svcTerm.loadAddon(svcTermFit);
  }

  new ResizeObserver(() => {
    if (svcTermFit) { try { svcTermFit.fit(); } catch {} }
    if (svcTermWs && svcTermWs.readyState === WebSocket.OPEN) {
      svcTermWs.send(JSON.stringify({ type: 'resize', cols: svcTerm.cols, rows: svcTerm.rows }));
    }
  }).observe(xtc);

  setTimeout(() => {
    if (svcTermFit) try { svcTermFit.fit(); } catch {}
    svcTermConnect(containerName);
  }, 80);
}

function svcTermDisconnect() {
  if (svcTermWs) { try { svcTermWs.close(); } catch {} svcTermWs = null; }
}

function svcTermConnect(containerName) {
  svcTermDisconnect();
  if (!svcTerm) return;
  const setSt = (msg) => { const el = document.getElementById('svcTermStatus'); if (el) el.textContent = msg; };
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  setSt('Connecting…');
  svcTerm.clear();

  try {
    svcTermWs = new WebSocket(`${proto}//${location.host}/ws/terminal?container=${encodeURIComponent(containerName)}`);
  } catch (err) {
    setSt('Failed');
    svcTerm.write(`\r\n\x1b[31mFailed to connect: ${err.message}\x1b[0m\r\n`);
    return;
  }

  svcTermWs.onopen = () => {
    setSt('Connected');
    if (svcTermFit) { try { svcTermFit.fit(); } catch {} }
    svcTermWs.send(JSON.stringify({ type: 'resize', cols: svcTerm.cols, rows: svcTerm.rows }));
  };
  svcTermWs.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === 'output') svcTerm.write(msg.data);
      else if (msg.type === 'exit') { svcTerm.write('\r\n\x1b[33m[Process exited]\x1b[0m\r\n'); setSt('Exited'); }
      else if (msg.type === 'error') svcTerm.write(`\r\n\x1b[31m${msg.data || 'Error'}\x1b[0m\r\n`);
    } catch { svcTerm.write(e.data); }
  };
  svcTermWs.onclose = () => setSt('Disconnected');
  svcTermWs.onerror = () => { setSt('Error'); svcTerm.write('\r\n\x1b[31m[Connection error]\x1b[0m\r\n'); };
  svcTerm.onData((data) => {
    if (svcTermWs && svcTermWs.readyState === WebSocket.OPEN) {
      svcTermWs.send(JSON.stringify({ type: 'input', data }));
    }
  });
}
