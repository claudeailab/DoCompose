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

function buildUpdateControls(name) {
  const st = DC.updates[name];
  if (!st || st === 'idle') {
    return `
      <button class="card-update-btn" data-action="check-update" data-service="${escHtml(name)}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        Check for updates
      </button>`;
  }
  if (st === 'checking') {
    return `<span class="card-update-status"><div class="spinner" style="width:10px;height:10px"></div> Checking…</span>`;
  }
  if (st === 'current') {
    return `
      <span class="card-update-status is-current">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:11px;height:11px"><polyline points="20 6 9 17 4 12"/></svg>
        Up to date
      </span>
      <button class="card-update-btn" data-action="check-update" data-service="${escHtml(name)}" style="margin-left:auto">Recheck</button>`;
  }
  if (st === 'available') {
    return `
      <span class="card-update-status is-available">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
        Update available
      </span>
      <button class="card-update-btn has-update" data-action="update" data-service="${escHtml(name)}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        Update
      </button>`;
  }
  if (st === 'updating') {
    return `<span class="card-update-status"><div class="spinner" style="width:10px;height:10px"></div> Updating…</span>`;
  }
  return '';
}

function buildServiceCard(s) {
  const state = (s.state || 'absent').toLowerCase();
  const allPorts = Array.isArray(s.ports) ? s.ports : [];
  const visiblePorts = allPorts.slice(0, 4);
  const extraPorts = allPorts.length - visiblePorts.length;

  return `
    <div class="service-card ${stateClass(state)}">
      <div class="card-header" onclick='showServiceDetail(${JSON.stringify(s.name)})'>
        <span class="card-status-dot status-dot ${statusClass(state)}"></span>
        <div class="card-header-info">
          <div class="card-title">${escHtml(s.name)}</div>
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
        <div class="card-actions-primary">
          ${state !== 'running' ? `
            <button class="btn btn-success btn-sm" data-action="start" data-service="${escHtml(s.name)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Start
            </button>` : `
            <button class="btn btn-danger btn-sm" data-action="stop" data-service="${escHtml(s.name)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="6" width="12" height="12"/></svg>
              Stop
            </button>`}
          <button class="btn btn-secondary btn-sm" data-action="restart" data-service="${escHtml(s.name)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            Restart
          </button>
        </div>

        <div class="card-actions-nav">
          <button class="card-nav-btn" data-action="logs" data-service="${escHtml(s.name)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Logs
          </button>
          <button class="card-nav-btn" data-action="terminal" data-service="${escHtml(s.name)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
            Terminal
          </button>
          <button class="card-nav-btn" data-action="config" data-service="${escHtml(s.name)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Config
          </button>
          <button class="card-nav-btn" data-action="vars" data-service="${escHtml(s.name)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
            Vars
          </button>
        </div>

        <div class="card-actions-update" id="cardUpdate-${escHtml(s.name)}">
          ${buildUpdateControls(s.name)}
        </div>
      </div>
    </div>
  `;
}

function refreshUpdateControls(name) {
  const el = document.getElementById(`cardUpdate-${name}`);
  if (!el) return;
  el.innerHTML = buildUpdateControls(name);
  // Re-attach listeners for the new buttons
  el.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      serviceAction(btn.dataset.service, btn.dataset.action, btn);
    });
  });
}

async function serviceAction(name, action, btn) {
  // Nav shortcuts — open service detail on a specific tab
  if (action === 'logs')     { showServiceDetail(name, 'logs');     return; }
  if (action === 'terminal') { showServiceDetail(name, 'terminal'); return; }
  if (action === 'config')   { showServiceDetail(name, 'config');   return; }
  if (action === 'vars')     { showServiceDetail(name, 'vars');     return; }

  // Check for updates
  if (action === 'check-update') {
    DC.updates[name] = 'checking';
    refreshUpdateControls(name);
    try {
      const { hasUpdate } = await api('GET', `/api/services/${encodeURIComponent(name)}/check-update`);
      DC.updates[name] = hasUpdate ? 'available' : 'current';
    } catch (err) {
      DC.updates[name] = null;
      showToast(`${name}: ${err.message}`, 'error');
    }
    refreshUpdateControls(name);
    return;
  }

  // Pull & recreate (update)
  if (action === 'update') {
    DC.updates[name] = 'updating';
    refreshUpdateControls(name);
    try {
      await api('POST', `/api/services/${encodeURIComponent(name)}/recreate`);
      DC.updates[name] = null;
      showToast(`${name}: updated and restarted`, 'success');
      setTimeout(loadDashboard, 1000);
    } catch (err) {
      DC.updates[name] = 'available';
      refreshUpdateControls(name);
      showToast(`${name}: ${err.message}`, 'error');
    }
    return;
  }

  // start / stop / restart
  const originalHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:12px;height:12px"></div>';

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
