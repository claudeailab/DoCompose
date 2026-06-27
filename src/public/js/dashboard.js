/* ============================================================
   DoCompose — Dashboard View
   ============================================================ */

'use strict';

// Per-service update state: null | 'checking' | 'current' | 'available' | 'updating'
if (!DC.updates) DC.updates = {};

function dashboardInit() {
  const container = document.getElementById('view-dashboard');
  container.innerHTML = `
    <div class="view-header">
      <h1 class="view-title">Dashboard</h1>
      <button class="btn btn-secondary btn-sm" id="dashRefreshBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        Refresh
      </button>
    </div>
    <div class="dashboard-grid" id="dashGrid">
      <div class="loading"><div class="spinner"></div> Loading services…</div>
    </div>
  `;
  document.getElementById('dashRefreshBtn').addEventListener('click', loadDashboard);
  loadDashboard();
}
window.dashboardInit = dashboardInit;

async function loadDashboard() {
  const grid = document.getElementById('dashGrid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading"><div class="spinner"></div> Loading services…</div>';
  try {
    const { services } = await api('GET', '/api/services');
    DC.services = services || [];
    renderSidebarServices(DC.services);
    renderDashboard(DC.services);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><p>Error loading services: ${escHtml(err.message)}</p></div>`;
  }
}

function renderDashboard(services) {
  const grid = document.getElementById('dashGrid');
  if (!grid) return;
  if (!services.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <path d="M8 21h8M12 17v4"/>
        </svg>
        <p>No services found. Make sure a <code>docker-compose.yml</code> exists in the compose directory.</p>
      </div>`;
    return;
  }
  grid.innerHTML = services.map((s) => buildServiceCard(s)).join('');
  grid.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      serviceAction(btn.dataset.service, btn.dataset.action, btn);
    });
  });
}

/* ---- Update cell ---- */
function buildUpdateCell(name) {
  const st = DC.updates[name];
  if (!st || st === 'idle') {
    return `
      <button class="card-btn" data-action="check-update" data-service="${escHtml(name)}" title="Check for updates">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        Check
      </button>`;
  }
  if (st === 'checking') {
    return `<button class="card-btn" disabled>
      <div class="spinner" style="width:13px;height:13px"></div>
      Checking…
    </button>`;
  }
  if (st === 'current') {
    return `
      <button class="card-btn card-btn-current" title="Image is up to date">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        Latest
      </button>
      <button class="card-btn" data-action="check-update" data-service="${escHtml(name)}" title="Check again">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        Recheck
      </button>`;
  }
  if (st === 'available') {
    return `
      <button class="card-btn card-btn-update" data-action="update" data-service="${escHtml(name)}" title="Apply update (recreate container)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
        Update
      </button>
      <button class="card-btn" data-action="check-update" data-service="${escHtml(name)}" title="Re-check">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        Recheck
      </button>`;
  }
  if (st === 'updating') {
    return `<button class="card-btn" disabled>
      <div class="spinner" style="width:13px;height:13px"></div>
      Updating…
    </button>`;
  }
  return '';
}

function refreshUpdateCell(name) {
  const el = document.getElementById(`cardUpdate-${name}`);
  if (!el) return;
  el.innerHTML = buildUpdateCell(name);
  el.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      serviceAction(btn.dataset.service, btn.dataset.action, btn);
    });
  });
}

/* ---- Card ---- */
function buildServiceCard(s) {
  const state = (s.state || 'absent').toLowerCase();
  const allPorts = Array.isArray(s.ports) ? s.ports : [];
  const visiblePorts = allPorts.slice(0, 4);
  const extraPorts = allPorts.length - visiblePorts.length;
  const n = escHtml(s.name);

  const startStopIcon = state === 'running'
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="6" width="12" height="12"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;

  return `
    <div class="service-card ${stateClass(state)}">
      <div class="card-header" onclick='showServiceDetail(${JSON.stringify(s.name)})'>
        <span class="card-status-dot status-dot ${statusClass(state)}"></span>
        <div class="card-header-info">
          <div class="card-title">${n}</div>
          ${s.containerName && s.containerName !== s.name ? `<div class="card-subtitle">${escHtml(s.containerName)}</div>` : ''}
        </div>
        <span class="card-status-text">${escHtml(state)}</span>
      </div>

      ${s.image ? `<div class="card-image" title="${escHtml(s.image)}">${escHtml(s.image)}</div>` : ''}

      ${allPorts.length ? `
        <div class="card-ports">
          ${visiblePorts.map((p) => `<span class="port-badge">${escHtml(String(p))}</span>`).join('')}
          ${extraPorts > 0 ? `<span class="port-badge-more">+${extraPorts}</span>` : ''}
        </div>` : ''}

      <div class="card-actions" onclick="event.stopPropagation()">
        <div class="card-btn-grid">

          <!-- Row 1: control + navigation -->
          <button class="card-btn ${state === 'running' ? 'card-btn-stop' : 'card-btn-start'}"
                  data-action="${state === 'running' ? 'stop' : 'start'}" data-service="${n}">
            ${startStopIcon}
            ${state === 'running' ? 'Stop' : 'Start'}
          </button>

          <button class="card-btn" data-action="restart" data-service="${n}" title="Restart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            Restart
          </button>

          <button class="card-btn" data-action="logs" data-service="${n}" title="Logs">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Logs
          </button>

          <button class="card-btn" data-action="terminal" data-service="${n}" title="Terminal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
            Terminal
          </button>

          <!-- Row 2: settings + update -->
          <button class="card-btn" data-action="config" data-service="${n}" title="Configuration">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Config
          </button>

          <button class="card-btn" data-action="vars" data-service="${n}" title="Environment variables">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
            Variables
          </button>

          <!-- Update cell spans last 2 columns -->
          <div class="card-update-cell" id="cardUpdate-${n}">
            ${buildUpdateCell(s.name)}
          </div>

        </div>
      </div>
    </div>
  `;
}

/* ---- Actions ---- */
async function serviceAction(name, action, btn) {
  if (action === 'logs')     { showServiceDetail(name, 'logs');     return; }
  if (action === 'terminal') { showServiceDetail(name, 'terminal'); return; }
  if (action === 'config')   { showServiceDetail(name, 'config');   return; }
  if (action === 'vars')     { showServiceDetail(name, 'vars');     return; }

  if (action === 'check-update') {
    DC.updates[name] = 'checking';
    refreshUpdateCell(name);
    try {
      const { hasUpdate } = await api('GET', `/api/services/${encodeURIComponent(name)}/check-update`);
      DC.updates[name] = hasUpdate ? 'available' : 'current';
    } catch (err) {
      DC.updates[name] = null;
      showToast(`${name}: ${err.message}`, 'error');
    }
    refreshUpdateCell(name);
    return;
  }

  if (action === 'update') {
    DC.updates[name] = 'updating';
    refreshUpdateCell(name);
    try {
      await api('POST', `/api/services/${encodeURIComponent(name)}/recreate`);
      DC.updates[name] = null;
      showToast(`${name}: updated and restarted`, 'success');
      setTimeout(loadDashboard, 1000);
    } catch (err) {
      DC.updates[name] = 'available';
      refreshUpdateCell(name);
      showToast(`${name}: ${err.message}`, 'error');
    }
    return;
  }

  // start / stop / restart
  const originalHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:13px;height:13px"></div>';
  try {
    await api('POST', `/api/services/${encodeURIComponent(name)}/${action}`);
    showToast(`${name}: ${action} successful`, 'success');
    setTimeout(loadDashboard, 800);
  } catch (err) {
    showToast(`${name}: ${err.message}`, 'error');
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  }
}
