/* ============================================================
   DoCompose — Logs View (click container → stream immediately)
   ============================================================ */

'use strict';

let logsEventSource = null;
let logsAutoScroll = true;
let logsSearchQuery = '';
let logsActiveContainer = null;

function logsInit() {
  logsStop();
  logsActiveContainer = null;

  const container = document.getElementById('view-logs');
  container.innerHTML = `
    <div class="logs-container">
      <div class="container-picker" id="logsContainerPicker">
        <div class="container-picker-label">Click a container to stream its logs</div>
        <div class="container-picker-grid" id="logsChips">
          <div class="loading"><div class="spinner"></div></div>
        </div>
      </div>
      <div class="logs-toolbar" id="logsToolbar" style="display:none">
        <button class="btn btn-danger btn-sm" id="logsStopBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="12" height="12"/></svg>
          Stop
        </button>
        <button class="btn btn-secondary btn-sm" id="logsClearBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
          </svg>
          Clear
        </button>
        <label class="btn btn-secondary btn-sm" style="cursor:pointer">
          <input type="checkbox" id="logsAutoScrollToggle" checked style="margin-right:4px" />
          Auto-scroll
        </label>
        <input type="text" id="logsSearch" placeholder="Filter…" style="width:150px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);padding:0.35rem 0.6rem;font-size:0.9rem;outline:none" />
        <span id="logsStatus" style="font-size:0.9rem;color:var(--text-muted);margin-left:auto"></span>
      </div>
      <div class="logs-output" id="logsOutput" style="display:none"></div>
    </div>
  `;

  document.getElementById('logsStopBtn').addEventListener('click', logsStop);
  document.getElementById('logsClearBtn').addEventListener('click', () => {
    document.getElementById('logsOutput').innerHTML = '';
  });
  document.getElementById('logsAutoScrollToggle').addEventListener('change', (e) => {
    logsAutoScroll = e.target.checked;
  });
  document.getElementById('logsSearch').addEventListener('input', (e) => {
    logsSearchQuery = e.target.value.toLowerCase();
    highlightLogsSearch();
  });
  document.getElementById('logsOutput').addEventListener('scroll', function() {
    const atBottom = this.scrollHeight - this.scrollTop <= this.clientHeight + 50;
    if (!atBottom) {
      document.getElementById('logsAutoScrollToggle').checked = false;
      logsAutoScroll = false;
    }
  });

  loadLogsContainerList();
}
window.logsInit = logsInit;

async function loadLogsContainerList() {
  const chipsEl = document.getElementById('logsChips');
  if (!chipsEl) return;

  try {
    const { containers } = await fetch('/api/logs').then((r) => r.json());
    const list = containers || [];

    if (!list.length) {
      chipsEl.innerHTML = '<span style="font-size:0.875rem;color:var(--text-muted)">No containers found</span>';
      return;
    }

    chipsEl.innerHTML = list.map((c) => {
      const name = c.name.split(', ')[0];
      const state = (c.state || '').toLowerCase();
      return `
        <button class="container-chip${logsActiveContainer === name ? ' active' : ''}"
                onclick='logsSelectContainer(${JSON.stringify(name)})'
                data-container="${escHtml(name)}">
          <span class="status-dot ${statusClass(state)}" style="width:8px;height:8px"></span>
          ${escHtml(name)}
        </button>`;
    }).join('');
  } catch (err) {
    chipsEl.innerHTML = `<span style="font-size:0.875rem;color:var(--danger)">${escHtml(err.message)}</span>`;
  }
}

function logsSelectContainer(name) {
  logsStop();
  logsActiveContainer = name;

  // Update chip highlight
  document.querySelectorAll('#logsChips .container-chip').forEach((ch) => {
    ch.classList.toggle('active', ch.dataset.container === name);
  });

  // Show toolbar and output
  document.getElementById('logsToolbar').style.display = '';
  const output = document.getElementById('logsOutput');
  output.style.display = '';
  output.innerHTML = '';

  logsAutoScroll = true;
  const toggle = document.getElementById('logsAutoScrollToggle');
  if (toggle) toggle.checked = true;

  // Start streaming immediately
  logsStart(name);
}
window.logsSelectContainer = logsSelectContainer;

function logsStart(containerName) {
  logsStop();

  const output = document.getElementById('logsOutput');
  if (!output) return;

  setLogsStatus('Connecting…');

  const url = `/api/logs/${encodeURIComponent(containerName)}?tail=200`;
  logsEventSource = new EventSource(url);

  logsEventSource.onopen = () => setLogsStatus('Streaming');
  logsEventSource.onmessage = (e) => {
    try {
      const line = JSON.parse(e.data);
      appendLogLine(line);
    } catch {
      appendLogLine(e.data);
    }
  };
  logsEventSource.addEventListener('close', () => {
    setLogsStatus('Ended');
    logsStop();
  });
  logsEventSource.onerror = () => {
    setLogsStatus('Connection error');
    logsStop();
  };

  document.getElementById('logsStopBtn').disabled = false;
}

function logsStop() {
  if (logsEventSource) {
    logsEventSource.close();
    logsEventSource = null;
  }
  const stopBtn = document.getElementById('logsStopBtn');
  if (stopBtn) stopBtn.disabled = true;
  setLogsStatus('Stopped');
}

function appendLogLine(text) {
  const output = document.getElementById('logsOutput');
  if (!output) return;

  const lines = String(text).split('\n');
  for (const rawLine of lines) {
    if (!rawLine) continue;

    let timeStr = '';
    let content = rawLine;
    const tsMatch = rawLine.match(/^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\s/);
    if (tsMatch) {
      const d = new Date(tsMatch[1]);
      timeStr = d.toLocaleTimeString();
      content = rawLine.slice(tsMatch[0].length);
    }

    const span = document.createElement('span');
    span.className = 'log-line';

    if (timeStr) {
      const ts = document.createElement('span');
      ts.className = 'log-time';
      ts.textContent = timeStr;
      span.appendChild(ts);
    }

    span.appendChild(document.createTextNode(content));

    if (logsSearchQuery && content.toLowerCase().includes(logsSearchQuery)) {
      span.classList.add('highlight');
    }

    output.appendChild(span);
  }

  if (logsAutoScroll) output.scrollTop = output.scrollHeight;
}

function highlightLogsSearch() {
  const output = document.getElementById('logsOutput');
  if (!output) return;
  output.querySelectorAll('.log-line').forEach((line) => {
    if (!logsSearchQuery) { line.classList.remove('highlight'); return; }
    line.classList.toggle('highlight', line.textContent.toLowerCase().includes(logsSearchQuery));
  });
}

function setLogsStatus(msg) {
  const el = document.getElementById('logsStatus');
  if (el) el.textContent = msg;
}
