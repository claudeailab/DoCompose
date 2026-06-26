/* ============================================================
   DoCompose — Logs View
   ============================================================ */

'use strict';

let logsEventSource = null;
let logsAutoScroll = true;
let logsSearchQuery = '';

function logsInit() {
  const container = document.getElementById('view-logs');
  container.innerHTML = `
    <div class="logs-container">
      <div class="logs-toolbar">
        <select id="logsServiceSelect">
          <option value="">— Select container —</option>
        </select>
        <button class="btn btn-secondary btn-sm" id="logsStartBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Stream
        </button>
        <button class="btn btn-danger btn-sm" id="logsStopBtn" disabled>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="12" height="12"/></svg>
          Stop
        </button>
        <button class="btn btn-secondary btn-sm" id="logsClearBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
          </svg>
          Clear
        </button>
        <label class="btn btn-secondary btn-sm" style="cursor:pointer">
          <input type="checkbox" id="logsAutoScrollToggle" checked style="margin-right:4px" />
          Auto-scroll
        </label>
        <input type="text" id="logsSearch" placeholder="Filter…" style="width:140px" />
        <span id="logsStatus" style="font-size:0.8rem;color:var(--text-muted);margin-left:auto"></span>
      </div>
      <div class="logs-output" id="logsOutput">
        <span style="color:var(--text-muted);font-size:0.85rem">Select a container and click Stream to view logs.</span>
      </div>
    </div>
  `;

  loadLogsContainerList();

  document.getElementById('logsStartBtn').addEventListener('click', logsStart);
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

  const output = document.getElementById('logsOutput');
  output.addEventListener('scroll', () => {
    const atBottom = output.scrollHeight - output.scrollTop <= output.clientHeight + 50;
    if (!atBottom) {
      document.getElementById('logsAutoScrollToggle').checked = false;
      logsAutoScroll = false;
    }
  });
}
window.logsInit = logsInit;

async function loadLogsContainerList() {
  try {
    const { containers } = await fetch('/api/logs').then((r) => r.json());
    const sel = document.getElementById('logsServiceSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">— Select container —</option>';
    (containers || []).forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.name.split(', ')[0];
      opt.textContent = `${c.name} (${c.state})`;
      sel.appendChild(opt);
    });

    sel.addEventListener('change', () => {
      logsStop();
      document.getElementById('logsOutput').innerHTML = '';
    });
  } catch (err) {
    console.warn('Failed to load container list:', err.message);
  }
}

function logsStart() {
  const sel = document.getElementById('logsServiceSelect');
  const containerName = sel ? sel.value : '';
  if (!containerName) { showToast('Select a container first', 'info'); return; }

  logsStop();

  const output = document.getElementById('logsOutput');
  output.innerHTML = '';
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

  document.getElementById('logsStartBtn').disabled = true;
  document.getElementById('logsStopBtn').disabled = false;
}

function logsStop() {
  if (logsEventSource) {
    logsEventSource.close();
    logsEventSource = null;
  }
  const startBtn = document.getElementById('logsStartBtn');
  const stopBtn = document.getElementById('logsStopBtn');
  if (startBtn) startBtn.disabled = false;
  if (stopBtn) stopBtn.disabled = true;
  setLogsStatus('Stopped');
}

function appendLogLine(text) {
  const output = document.getElementById('logsOutput');
  if (!output) return;

  const lines = String(text).split('\n');
  for (const rawLine of lines) {
    if (!rawLine) continue;

    // Parse timestamp if present (Docker format: 2024-01-01T00:00:00.000000000Z text)
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

    const textNode = document.createTextNode(content);
    span.appendChild(textNode);

    // Highlight search query
    if (logsSearchQuery && content.toLowerCase().includes(logsSearchQuery)) {
      span.classList.add('highlight');
    }

    output.appendChild(span);
  }

  if (logsAutoScroll) {
    output.scrollTop = output.scrollHeight;
  }
}

function highlightLogsSearch() {
  const output = document.getElementById('logsOutput');
  if (!output) return;
  output.querySelectorAll('.log-line').forEach((line) => {
    if (!logsSearchQuery) {
      line.classList.remove('highlight');
      return;
    }
    const text = line.textContent.toLowerCase();
    if (text.includes(logsSearchQuery)) {
      line.classList.add('highlight');
    } else {
      line.classList.remove('highlight');
    }
  });
}

function setLogsStatus(msg) {
  const el = document.getElementById('logsStatus');
  if (el) el.textContent = msg;
}
