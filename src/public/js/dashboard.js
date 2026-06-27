/* ============================================================
   DoCompose — Dashboard View
   ============================================================ */

'use strict';

// Per-service update state: null | 'checking' | 'available' | 'updating'
if (!DC.updates) DC.updates = {};

function dashboardInit() {
  const container = document.getElementById('view-dashboard');
  container.innerHTML = `
    <div class="view-header">
      <h1 class="view-title">Dashboard</h1>
      <button class="btn btn-secondary btn-sm" id="dashCheckAllBtn" title="Check all containers for image updates">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        Check All Updates
      </button>
      <button class="btn btn-secondary btn-sm" id="dashRefreshBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        Refresh
      </button>
    </div>

    <div class="dash-stats" id="dashStats" style="display:none">
      <div class="dash-stat">
        <span class="dash-stat-value" id="statTotal">0</span>
        <span class="dash-stat-label">Total</span>
      </div>
      <div class="dash-stat">
        <span class="dash-stat-value stat-running" id="statRunning">0</span>
        <span class="dash-stat-label">Running</span>
      </div>
      <div class="dash-stat">
        <span class="dash-stat-value stat-stopped" id="statStopped">0</span>
        <span class="dash-stat-label">Stopped</span>
      </div>
      <div class="dash-stat">
        <span class="dash-stat-value stat-updates" id="statUpdates">—</span>
        <span class="dash-stat-label">Updates</span>
      </div>
    </div>

    <div class="dashboard-grid" id="dashGrid">
      <div class="loading"><div class="spinner"></div> Loading services…</div>
    </div>
  `;

  document.getElementById('dashRefreshBtn').addEventListener('click', loadDashboard);
  document.getElementById('dashCheckAllBtn').addEventListener('click', checkAllUpdates);
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
    renderStats();
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><p>Error loading services: ${escHtml(err.message)}</p></div>`;
  }
}

function renderStats() {
  const services = DC.services || [];
  const total = services.length;
  const running = services.filter((s) => (s.state || '').toLowerCase() === 'running').length;
  const stopped = total - running;
  const updateCount = Object.values(DC.updates).filter((v) => v === 'available').length;
  const checked = Object.keys(DC.updates).length;

  const el = document.getElementById('dashStats');
  if (!el) return;
  if (total === 0) { el.style.display = 'none'; return; }
  el.style.display = 'flex';

  const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  set('statTotal', total);
  set('statRunning', running);
  set('statStopped', stopped);
  set('statUpdates', checked === 0 ? '—' : updateCount === 0 ? '✓' : updateCount);

  const updEl = document.getElementById('statUpdates');
  if (updEl) {
    updEl.className = 'dash-stat-value stat-updates' +
      (checked === 0 ? '' : updateCount > 0 ? ' stat-warn' : ' stat-ok');
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
  attachCardListeners(grid);
}

function attachCardListeners(root) {
  (root || document).querySelectorAll('[data-action]').forEach((btn) => {
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
    return `<button class="card-btn" data-action="check-update" data-service="${escHtml(name)}" title="Check for image update">
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
  if (st === 'available') {
    return `<button class="card-btn card-btn-update" data-action="update" data-service="${escHtml(name)}" title="New image pulled — recreate to apply">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
      Update
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
  attachCardListeners(el);
  renderStats();
}

/* ---- Card ---- */
function buildServiceCard(s) {
  const state = (s.state || 'absent').toLowerCase();
  const allPorts = Array.isArray(s.ports) ? s.ports : [];
  const visiblePorts = allPorts.slice(0, 4);
  const extraPorts = allPorts.length - visiblePorts.length;
  const n = escHtml(s.name);

  return `
    <div class="service-card ${stateClass(state)}" data-service="${n}">
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

          <!-- Row 1: power + navigation -->
          <button class="card-btn ${state === 'running' ? 'card-btn-stop' : 'card-btn-start'}"
                  data-action="${state === 'running' ? 'stop' : 'start'}" data-service="${n}">
            ${state === 'running'
              ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="6" width="12" height="12"/></svg>Stop`
              : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>Start`}
          </button>

          <button class="card-btn" data-action="restart" data-service="${n}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            Restart
          </button>

          <button class="card-btn" data-action="logs" data-service="${n}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Logs
          </button>

          <button class="card-btn" data-action="terminal" data-service="${n}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
            Terminal
          </button>

          <!-- Row 2: config + update -->
          <button class="card-btn" data-action="config" data-service="${n}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Config
          </button>

          <button class="card-btn" data-action="vars" data-service="${n}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
            Variables
          </button>

          <button class="card-btn" data-action="recreate" data-service="${n}" title="Recreate container (applies config changes)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
            Recreate
          </button>

          <div id="cardUpdate-${n}">
            ${buildUpdateCell(s.name)}
          </div>

        </div>
      </div>
    </div>
  `;
}

/* ---- Targeted card update (no full re-render) ---- */
function updateCardState(name, newState) {
  const svc = DC.services.find((s) => s.name === name);
  if (svc) svc.state = newState;

  const grid = document.getElementById('dashGrid');
  if (!grid || !svc) return;
  const oldCard = grid.querySelector(`.service-card[data-service="${CSS.escape(name)}"]`);
  if (!oldCard) return;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = buildServiceCard(svc);
  const newCard = wrapper.firstElementChild;
  oldCard.replaceWith(newCard);
  attachCardListeners(newCard);
  renderSidebarServices(DC.services);
  renderStats();
}

/* ---- Check all updates ---- */
async function checkAllUpdates() {
  const services = DC.services || [];
  if (!services.length) return;

  const btn = document.getElementById('dashCheckAllBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:13px;height:13px;display:inline-block;vertical-align:middle"></div> Checking…'; }

  // Set all to checking
  services.forEach((s) => { DC.updates[s.name] = 'checking'; refreshUpdateCell(s.name); });

  const results = await Promise.allSettled(
    services.map(async (s) => {
      try {
        const { hasUpdate } = await api('GET', `/api/services/${encodeURIComponent(s.name)}/check-update`);
        DC.updates[s.name] = hasUpdate ? 'available' : null;
      } catch {
        DC.updates[s.name] = null;
      }
      refreshUpdateCell(s.name);
    })
  );

  const updateCount = Object.values(DC.updates).filter((v) => v === 'available').length;
  showToast(
    updateCount === 0
      ? 'All containers are up to date'
      : `${updateCount} update${updateCount > 1 ? 's' : ''} available`,
    updateCount === 0 ? 'success' : 'info'
  );

  if (btn) { btn.disabled = false; btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Check All Updates'; }
  renderStats();
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
      DC.updates[name] = hasUpdate ? 'available' : null;
      showToast(hasUpdate ? `${name}: update available — click Update to apply` : `${name}: already up to date`, hasUpdate ? 'info' : 'success');
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
      updateCardState(name, 'running');
    } catch (err) {
      DC.updates[name] = 'available';
      refreshUpdateCell(name);
      showToast(`${name}: ${err.message}`, 'error');
    }
    return;
  }

  // start / stop / restart / recreate
  const originalHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:13px;height:13px"></div>';

  try {
    await api('POST', `/api/services/${encodeURIComponent(name)}/${action}`);
    showToast(`${name}: ${action} successful`, 'success');
    // Optimistically update the card — don't re-render whole dashboard
    const newState = action === 'start' || action === 'recreate' ? 'running' : action === 'stop' ? 'exited' : null;
    if (newState !== null) {
      updateCardState(name, newState);
    } else {
      // restart: keep running state, just restore button
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    }
  } catch (err) {
    showToast(`${name}: ${err.message}`, 'error');
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  }
}
