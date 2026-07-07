/* ============================================================
   DoCompose — Service Detail (Logs | Terminal | Configuration | Variables)
   ============================================================ */

'use strict';

let svcName = null;
let svcInitialTab = 'logs';
let svcCurrentTab = null;
let svcRenderedTabs = new Set();

// Config state
let svcConfigDirty = false;

// Logs state
let svcLogsEs = null;
let svcLogsAutoScroll = true;

// Terminal state
let svcTerm = null;
let svcTermFit = null;
let svcTermWs = null;

// Variables state
let svcVarsDirty = false;

function showServiceDetail(name, tab) {
  svcName = name;
  window.svcName = name;
  svcInitialTab = tab || 'logs';
  showView('service');
}
window.showServiceDetail = showServiceDetail;

async function serviceInit() {
  // Tear down previous state
  svcLogsStop();
  svcTermDisconnect();
  if (svcTerm) { try { svcTerm.dispose(); } catch {} svcTerm = null; svcTermFit = null; }
  svcConfigDirty = false;
  svcVarsDirty = false;
  svcCurrentTab = null;
  svcRenderedTabs = new Set();

  const name = svcName;
  const c = document.getElementById('view-service');

  document.querySelectorAll('.service-item').forEach((el) => {
    el.classList.toggle('active', el.dataset.name === name);
  });

  if (!name) {
    c.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;flex:1;color:var(--text-muted);font-size:0.95rem">← Select a service from the list</div>`;
    return;
  }

  // Always fetch fresh state so the Start/Stop button reflects reality
  try {
    const { services } = await api('GET', '/api/services');
    if (services) DC.services = services;
  } catch {}

  const svc = (DC.services || []).find((s) => s.name === name);
  const state = svc ? (svc.state || 'absent').toLowerCase() : 'absent';
  const containerName = svc ? (svc.containerName || name) : name;

  const isRunning = state === 'running';
  const health = svc ? svc.health : null;

  c.innerHTML = `
    <div class="svc-detail">
      <div class="svc-header">
        <div class="svc-header-top">
          <span class="status-dot ${statusClass(state)}" style="width:9px;height:9px;flex-shrink:0"></span>
          <span class="svc-title">${escHtml(name)}</span>
          <span class="svc-state-badge ${stateClass(state)}">${escHtml(state)}</span>
          ${isRunning && health ? `<span class="card-health card-health-${health}">${health === 'healthy' ? '✓ healthy' : health === 'unhealthy' ? '✗ unhealthy' : '⟳ starting'}</span>` : ''}
        </div>
        <div class="svc-tabs">
          <button class="svc-tab" data-tab="logs">Logs</button>
          <button class="svc-tab" data-tab="terminal">Terminal</button>
          <button class="svc-tab" data-tab="config">Configuration</button>
          <button class="svc-tab" data-tab="vars">Variables</button>
          <div class="svc-tabs-sep"></div>
          <button class="svc-tab svc-tab-action" id="svcActStartStop" data-running="${isRunning ? '1' : '0'}">
            ${isRunning
              ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="6" width="12" height="12"/></svg>Stop`
              : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>Start`}
          </button>
          <button class="svc-tab svc-tab-action" id="svcActRestart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            Restart
          </button>
          <button class="svc-tab svc-tab-action" id="svcActRecreate">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
            Recreate
          </button>
          ${DC.updates[name] === 'available' && !((DC.settings && DC.settings.excludedFromUpdates) || []).includes(name) && !svc?.isCustom ? `
          <button class="svc-tab svc-tab-action svc-tab-update" id="svcActUpdate">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
            Update
          </button>` : ''}
          <button class="svc-tab svc-tab-action svc-tab-danger" id="svcActRemove">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            Remove
          </button>
        </div>
      </div>
      <div class="svc-body">
        <div class="svc-pane" id="svcPaneLogs" style="display:none"></div>
        <div class="svc-pane" id="svcPaneTerminal" style="display:none"></div>
        <div class="svc-pane" id="svcPaneConfig" style="display:none"></div>
        <div class="svc-pane" id="svcPaneVars" style="display:none"></div>
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

  // Wire up header action buttons
  async function svcRunAction(action) {
    const startStop = document.getElementById('svcActStartStop');
    const restart = document.getElementById('svcActRestart');
    const recreate = document.getElementById('svcActRecreate');
    [startStop, restart, recreate].forEach((b) => { if (b) b.disabled = true; });
    try {
      await api('POST', `/api/services/${encodeURIComponent(name)}/${action}`);
      showToast(`${name}: ${action} successful`, 'success');
      const newState = action === 'stop' ? 'exited' : 'running';
      const clearHealth = action === 'stop';
      if (window.updateCardState) updateCardState(name, newState, clearHealth);
      // Re-init this view to reflect new state
      showServiceDetail(name, svcCurrentTab);
    } catch (err) {
      showToast(`${name}: ${err.message}`, 'error');
      [startStop, restart, recreate].forEach((b) => { if (b) b.disabled = false; });
    }
  }

  const ssBtn = document.getElementById('svcActStartStop');
  if (ssBtn) ssBtn.addEventListener('click', () => svcRunAction(isRunning ? 'stop' : 'start'));
  const rstBtn = document.getElementById('svcActRestart');
  if (rstBtn) rstBtn.addEventListener('click', () => svcRunAction('restart'));
  const recBtn = document.getElementById('svcActRecreate');
  if (recBtn) recBtn.addEventListener('click', () => svcRunAction('recreate'));

  const rmBtn = document.getElementById('svcActRemove');
  if (rmBtn) rmBtn.addEventListener('click', async () => {
    if (window.removeService) removeService(name);
  });

  const updBtn = document.getElementById('svcActUpdate');
  if (updBtn) updBtn.addEventListener('click', async () => {
    const ok = await dcConfirm(`Pull the latest image for "${name}" and recreate the container?`, 'Pull & Update');
    if (!ok) return;
    [document.getElementById('svcActStartStop'), document.getElementById('svcActRestart'),
     document.getElementById('svcActRecreate'), updBtn].forEach((b) => { if (b) b.disabled = true; });
    try {
      await api('POST', `/api/services/${encodeURIComponent(name)}/update`);
      DC.updates[name] = null;
      showToast(`${name}: updated and restarted`, 'success');
      if (window.updateCardState) updateCardState(name, 'running');
      showServiceDetail(name, svcCurrentTab);
    } catch (err) {
      showToast(`${name}: ${err.message}`, 'error');
      [document.getElementById('svcActStartStop'), document.getElementById('svcActRestart'),
       document.getElementById('svcActRecreate'), document.getElementById('svcActUpdate')].forEach((b) => { if (b) b.disabled = false; });
    }
  });
}
window.serviceInit = serviceInit;

// Called by the 15s sidebar refresh to keep the header in sync without re-rendering tabs
function svcRefreshHeader() {
  if (!svcName || DC.currentView !== 'service') return;
  const svc = (DC.services || []).find((s) => s.name === svcName);
  if (!svc) return;
  const freshState = (svc.state || 'absent').toLowerCase();
  const freshIsRunning = freshState === 'running';

  const badge = document.querySelector('.svc-state-badge');
  if (badge) {
    badge.textContent = freshState;
    badge.className = `svc-state-badge ${stateClass(freshState)}`;
  }

  const ssBtn = document.getElementById('svcActStartStop');
  if (ssBtn) {
    const wasRunning = ssBtn.dataset.running === '1';
    if (wasRunning !== freshIsRunning) {
      ssBtn.dataset.running = freshIsRunning ? '1' : '0';
      ssBtn.innerHTML = freshIsRunning
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="6" width="12" height="12"/></svg>Stop`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>Start`;
      // Re-bind click with updated action
      const newBtn = ssBtn.cloneNode(true);
      ssBtn.replaceWith(newBtn);
      newBtn.addEventListener('click', () => svcRunAction(freshIsRunning ? 'stop' : 'start'));
    }
  }

  const dot = document.querySelector('.svc-header-top .status-dot');
  if (dot) dot.className = `status-dot ${statusClass(freshState)}`;

  const freshHealth = svc.health || null;
  const healthEl = document.querySelector('.svc-header-top .card-health');
  if (freshIsRunning && freshHealth) {
    const healthText = freshHealth === 'healthy' ? '✓ healthy' : freshHealth === 'unhealthy' ? '✗ unhealthy' : '⟳ starting';
    if (healthEl) {
      healthEl.className = `card-health card-health-${freshHealth}`;
      healthEl.textContent = healthText;
    } else {
      const span = document.createElement('span');
      span.className = `card-health card-health-${freshHealth}`;
      span.textContent = healthText;
      document.querySelector('.svc-header-top').appendChild(span);
    }
  } else if (healthEl) {
    healthEl.remove();
  }
}
window.svcRefreshHeader = svcRefreshHeader;

function svcSwitchTab(tab, name, containerName) {
  // Hide all panes, deactivate all tabs
  document.querySelectorAll('.svc-pane').forEach((p) => { p.style.display = 'none'; });
  document.querySelectorAll('.svc-tab').forEach((b) => b.classList.remove('active'));

  const activeBtn = document.querySelector(`.svc-tab[data-tab="${tab}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  const paneId = { logs: 'svcPaneLogs', terminal: 'svcPaneTerminal', config: 'svcPaneConfig', vars: 'svcPaneVars' }[tab];
  const pane = document.getElementById(paneId);
  if (pane) pane.style.display = '';

  // Pause logs when leaving
  if (svcCurrentTab === 'logs' && tab !== 'logs') svcLogsStop();

  svcCurrentTab = tab;

  // Only render each tab once per service view
  if (!svcRenderedTabs.has(tab)) {
    svcRenderedTabs.add(tab);
    if (tab === 'logs')     svcRenderLogs(containerName);
    else if (tab === 'terminal') svcRenderTerminal(containerName);
    else if (tab === 'config')   svcRenderConfig(name);
    else if (tab === 'vars')     svcRenderVars(name);
  }
}

/* ---- Logs tab ---- */
function svcRenderLogs(containerName) {
  const pane = document.getElementById('svcPaneLogs');
  if (!pane) return;
  pane.innerHTML = `
    <div class="logs-toolbar">
      <button class="btn btn-secondary btn-sm" id="svcLogsClearBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
        </svg>
        Clear
      </button>
      <label class="toolbar-check">
        <input type="checkbox" id="svcLogsAutoScroll" checked>Auto-scroll
      </label>
      <label class="toolbar-check">
        <input type="checkbox" id="svcLogsTimestamps" checked>Timestamps
      </label>
      <select id="svcLogsTail" class="toolbar-select">
        <option value="100">Last 100</option>
        <option value="500">Last 500</option>
        <option value="1000">Last 1000</option>
        <option value="all">All</option>
      </select>
      <input type="text" id="svcLogsSearch" class="toolbar-input" placeholder="Filter…">
      <span id="svcLogsCount" style="font-size:0.82rem;color:var(--text-muted)">0 lines</span>
      <span id="svcLogsStatus" style="font-size:0.85rem;color:var(--text-muted);margin-left:auto">Connecting…</span>
    </div>
    <div class="logs-output" id="svcLogsOutput"></div>
  `;

  let svcLogsLineCount = 0;
  const updateCount = () => { const el = document.getElementById('svcLogsCount'); if (el) el.textContent = svcLogsLineCount + ' lines'; };

  document.getElementById('svcLogsClearBtn').addEventListener('click', () => {
    const out = document.getElementById('svcLogsOutput');
    if (out) { out.innerHTML = ''; svcLogsLineCount = 0; updateCount(); }
  });
  document.getElementById('svcLogsAutoScroll').addEventListener('change', (e) => {
    svcLogsAutoScroll = e.target.checked;
  });
  document.getElementById('svcLogsTimestamps').addEventListener('change', (e) => {
    document.getElementById('svcLogsOutput').classList.toggle('logs-hide-ts', !e.target.checked);
  });
  document.getElementById('svcLogsTail').addEventListener('change', () => {
    const out = document.getElementById('svcLogsOutput');
    if (out) { out.innerHTML = ''; svcLogsLineCount = 0; updateCount(); }
    svcLogsStart(containerName);
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
}

function svcLogsStart(containerName) {
  svcLogsStop();
  const out = document.getElementById('svcLogsOutput');
  if (!out) return;

  const setSt = (msg) => { const el = document.getElementById('svcLogsStatus'); if (el) el.textContent = msg; };
  setSt('Connecting…');
  svcLogsAutoScroll = true;

  const tailSel = document.getElementById('svcLogsTail');
  const tail = tailSel ? tailSel.value : '200';
  svcLogsEs = new EventSource(`/api/logs/${encodeURIComponent(containerName)}?tail=${encodeURIComponent(tail)}`);
  svcLogsEs.onopen = () => setSt('Streaming');
  svcLogsEs.onmessage = (e) => {
    const searchQ = (document.getElementById('svcLogsSearch') || {}).value || '';
    let raw;
    try { raw = String(JSON.parse(e.data)); } catch { raw = e.data; }
    const fragment = document.createDocumentFragment();
    let added = 0;
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      let timeStr = '';
      let content = line;
      // Docker --timestamps format: 2024-01-15T12:34:56.789012345Z message
      const m = line.match(/^(\d{4}-\d{2}-\d{2}T[\d:.]+Z) /);
      if (m) {
        const d = new Date(m[1]);
        timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        content = line.slice(m[0].length);
      }

      const cl = content.toLowerCase();
      let level = 'info';
      if (/\b(error|err|fatal|critical|crit|panic|emerg|exception|traceback|failed|failure)\b/.test(cl)) level = 'error';
      else if (/\b(warn|warning)\b/.test(cl)) level = 'warn';
      else if (/\b(debug|trace|verbose)\b/.test(cl)) level = 'debug';

      const row = document.createElement('div');
      row.className = `log-line log-level-${level}`;
      const dot = document.createElement('span');
      dot.className = 'log-dot';
      row.appendChild(dot);
      if (timeStr) {
        const ts = document.createElement('span');
        ts.className = 'log-time';
        ts.textContent = timeStr;
        row.appendChild(ts);
      }
      row.appendChild(document.createTextNode(content));
      if (searchQ && content.toLowerCase().includes(searchQ.toLowerCase())) row.classList.add('highlight');
      fragment.appendChild(row);
      added++;
    }
    if (added) {
      out.appendChild(fragment);
      const countEl = document.getElementById('svcLogsCount');
      if (countEl) countEl.textContent = out.children.length + ' lines';
    }
    if (svcLogsAutoScroll) out.scrollTop = out.scrollHeight;
  };
  svcLogsEs.addEventListener('close', () => { setSt('Ended'); svcLogsStop(); });
  svcLogsEs.onerror = () => { setSt('Disconnected'); svcLogsStop(); };
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
      background: '#0e1428', foreground: '#c9d6ea', cursor: '#4f8cff',
      selection: 'rgba(79,140,255,0.32)',
      black: '#0e1428', brightBlack: '#6e7d95',
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

  // Register onData ONCE — never inside svcTermConnect to avoid duplicates on reconnect
  svcTerm.onData((data) => {
    if (svcTermWs && svcTermWs.readyState === WebSocket.OPEN) {
      svcTermWs.send(JSON.stringify({ type: 'input', data }));
    }
  });

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
  // NOTE: onData is intentionally NOT registered here — it's registered once in svcRenderTerminal
}

/* ---- Configuration tab ---- */
async function svcFormatYaml() {
  const ta = document.getElementById('svcConfigTextarea');
  if (!ta) return;
  svcSetStatus('svcConfigStatus', 'Formatting…');
  try {
    const { yaml, repaired } = await api('POST', '/api/files/format', { yaml: ta.value });
    ta.value = yaml;
    svcSetStatus('svcConfigStatus', repaired ? 'Repaired & formatted' : 'Formatted', 'valid');
    setTimeout(() => svcSetStatus('svcConfigStatus', ''), 3000);
  } catch (err) {
    svcSetStatus('svcConfigStatus', 'Cannot format: ' + err.message, 'invalid');
  }
}

function svcRenderConfig(name) {
  const pane = document.getElementById('svcPaneConfig');
  if (!pane) return;
  pane.innerHTML = `
    <div class="svc-config-toolbar">
      <button class="btn btn-primary btn-sm" id="svcSaveBtn" disabled>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
        </svg>
        Save
      </button>
      <button class="btn btn-secondary btn-sm" id="svcFormatBtn" title="Format YAML">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>
        Format
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
  document.getElementById('svcFormatBtn').addEventListener('click', svcFormatYaml);
  document.getElementById('svcReloadBtn').addEventListener('click', () => {
    svcRenderedTabs.delete('config');
    svcRenderConfig(name);
  });
  document.getElementById('svcConfigTextarea').addEventListener('input', () => {
    svcConfigDirty = true;
    const btn = document.getElementById('svcSaveBtn');
    if (btn) btn.disabled = false;
    svcSetStatus('svcConfigStatus', '');
  });

  svcLoadConfig(name);
}

function svcSetStatus(id, msg, cls) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = 'svc-status' + (cls ? ' ' + cls : '');
}

async function svcLoadConfig(name) {
  svcSetStatus('svcConfigStatus', 'Loading…');
  try {
    const { yaml } = await api('GET', `/api/files/service/${encodeURIComponent(name)}`);
    const ta = document.getElementById('svcConfigTextarea');
    if (ta) ta.value = yaml;
    svcConfigDirty = false;
    svcSetStatus('svcConfigStatus', 'Loaded', 'valid');
    const btn = document.getElementById('svcSaveBtn');
    if (btn) btn.disabled = true;
  } catch (err) {
    svcSetStatus('svcConfigStatus', `Error: ${err.message}`, 'invalid');
    const ta = document.getElementById('svcConfigTextarea');
    if (ta) ta.value = `# Error: ${err.message}`;
  }
}

async function svcSaveConfig(name) {
  const ta = document.getElementById('svcConfigTextarea');
  if (!ta) return;
  // Auto-format before saving (best-effort — don't block save on failure)
  try {
    const { yaml: formatted } = await api('POST', '/api/files/format', { yaml: ta.value });
    ta.value = formatted;
  } catch {}
  svcSetStatus('svcConfigStatus', 'Saving…');
  try {
    await api('POST', `/api/files/service/${encodeURIComponent(name)}`, { yaml: ta.value });
    svcConfigDirty = false;
    svcSetStatus('svcConfigStatus', 'Saved', 'valid');
    showToast(`${name} saved`, 'success');
    const btn = document.getElementById('svcSaveBtn');
    if (btn) btn.disabled = true;
  } catch (err) {
    svcSetStatus('svcConfigStatus', `Error: ${err.message}`, 'invalid');
    showToast(`Save failed: ${err.message}`, 'error');
  }
}

/* ---- Variables tab ---- */
function svcRenderVars(name) {
  const pane = document.getElementById('svcPaneVars');
  if (!pane) return;
  pane.innerHTML = `
    <div class="svc-config-toolbar">
      <button class="btn btn-primary btn-sm" id="svcVarsSaveBtn" disabled>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
        </svg>
        Save
      </button>
      <button class="btn btn-secondary btn-sm" id="svcVarsReloadBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        Reload
      </button>
      <span class="svc-status" id="svcVarsStatus" style="margin-left:auto"></span>
    </div>
    <textarea class="yaml-textarea" id="svcVarsTextarea" spellcheck="false" placeholder="KEY=value&#10;ANOTHER_KEY=value"></textarea>
  `;

  document.getElementById('svcVarsSaveBtn').addEventListener('click', () => svcSaveVars(name));
  document.getElementById('svcVarsReloadBtn').addEventListener('click', () => {
    svcRenderedTabs.delete('vars');
    svcRenderVars(name);
  });
  document.getElementById('svcVarsTextarea').addEventListener('input', () => {
    svcVarsDirty = true;
    const btn = document.getElementById('svcVarsSaveBtn');
    if (btn) btn.disabled = false;
    svcSetStatus('svcVarsStatus', '');
  });

  svcLoadVars(name);
}

async function svcLoadVars(name) {
  svcSetStatus('svcVarsStatus', 'Loading…');
  try {
    const { content } = await api('GET', `/api/files/service/${encodeURIComponent(name)}/env`);
    const ta = document.getElementById('svcVarsTextarea');
    if (ta) ta.value = content || '';
    svcVarsDirty = false;
    svcSetStatus('svcVarsStatus', 'Loaded', 'valid');
    const btn = document.getElementById('svcVarsSaveBtn');
    if (btn) btn.disabled = true;
  } catch (err) {
    svcSetStatus('svcVarsStatus', `Error: ${err.message}`, 'invalid');
  }
}

async function svcSaveVars(name) {
  const ta = document.getElementById('svcVarsTextarea');
  if (!ta) return;
  svcSetStatus('svcVarsStatus', 'Saving…');
  try {
    await api('POST', `/api/files/service/${encodeURIComponent(name)}/env`, { content: ta.value });
    svcVarsDirty = false;
    svcSetStatus('svcVarsStatus', 'Saved', 'valid');
    showToast(`${name} variables saved`, 'success');
    const btn = document.getElementById('svcVarsSaveBtn');
    if (btn) btn.disabled = true;
  } catch (err) {
    svcSetStatus('svcVarsStatus', `Error: ${err.message}`, 'invalid');
    showToast(`Save failed: ${err.message}`, 'error');
  }
}
