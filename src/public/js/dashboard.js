/* ============================================================
   DoCompose — Dashboard View
   ============================================================ */

'use strict';

// Per-service update state: null | 'checking' | 'available' | 'updating'
// DC.updates is initialized (and restored from localStorage) in app.js
let dashFilter = null; // null | 'running' | 'stopped' | 'updates'

function openAddServiceModal() {
  const overlay = document.getElementById('addSvcOverlay');
  if (!overlay) return;
  ['addSvcName', 'addSvcImage', 'addSvcPorts', 'addSvcVolumes', 'addSvcEnv'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const restart = document.getElementById('addSvcRestart');
  if (restart) restart.value = 'unless-stopped';
  const startCb = document.getElementById('addSvcStart');
  if (startCb) startCb.checked = true;
  overlay.classList.add('is-open');
  const nameInput = document.getElementById('addSvcName');
  setTimeout(() => { if (nameInput) nameInput.focus(); }, 50);
}

function closeAddServiceModal() {
  const overlay = document.getElementById('addSvcOverlay');
  if (overlay) overlay.classList.remove('is-open');
}

async function submitAddService() {
  const name = (document.getElementById('addSvcName')?.value || '').trim();
  const image = (document.getElementById('addSvcImage')?.value || '').trim();
  if (!name) { showToast('Service name is required', 'error'); return; }
  if (!image) { showToast('Image is required', 'error'); return; }

  const parseLines = (id) => (document.getElementById(id)?.value || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const containerName = name;
  const hostname = name;
  const restart = document.getElementById('addSvcRestart')?.value || '';
  const ports = parseLines('addSvcPorts');
  const volumes = parseLines('addSvcVolumes');
  const environment = parseLines('addSvcEnv');
  const start = document.getElementById('addSvcStart')?.checked ?? true;

  const saveBtn = document.getElementById('addSvcSave');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Adding…'; }
  try {
    const result = await api('POST', '/api/services', { name, image, containerName, hostname, restart, ports, volumes, environment, start });
    closeAddServiceModal();
    if (result.startError) {
      showToast(`Service added but failed to start: ${result.startError}`, 'warning');
    } else {
      showToast(`Service "${name}" added${start ? ' and started' : ''}`, 'success');
    }
    await loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Add Service'; }
  }
}

async function removeService(name) {
  const ok = await dcConfirm(`Stop and permanently remove service "${name}" from compose and Docker?`, 'Remove Service');
  if (!ok) return;
  try {
    await api('DELETE', `/api/services/${encodeURIComponent(name)}`);
    showToast(`Service "${name}" removed`, 'success');
    if (window.svcName === name) showView('dashboard');
    await loadDashboard();
  } catch (err) {
    showToast(`Remove failed: ${err.message}`, 'error');
  }
}
window.removeService = removeService;

function showSelfUpdateOverlay() {
  let el = document.getElementById('selfUpdateOverlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'selfUpdateOverlay';
    el.innerHTML = `<div class="self-update-box"><div class="self-update-spinner"></div><div class="self-update-title">Updating DoCompose…</div><div class="self-update-sub">The app will reload automatically when ready.</div></div>`;
    document.body.appendChild(el);
  }
  el.style.display = 'flex';
}

function pollUntilBack() {
  // Wait for the old container to actually die before polling.
  // Without this delay, health check returns 200 immediately (server still alive)
  // and the page reloads before the new image has been started.
  setTimeout(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) { clearInterval(interval); location.reload(); }
      } catch {}
    }, 2000);
  }, 7000);
}

function dashboardInit() {
  const container = document.getElementById('view-dashboard');
  container.innerHTML = `
    <div class="view-header">
      <div class="pane-head">
        <div class="pane-title">Dashboard</div>
        <div class="dash-stats-inline" id="dashStats" style="display:none">
          <span class="stat-chip stat-chip-filter" data-filter="all"><span class="stat-num" id="statTotal">0</span> Total</span>
          <span class="stat-chip stat-chip-run stat-chip-filter" data-filter="running"><span class="stat-num" id="statRunning">0</span> Running</span>
          <span class="stat-chip stat-chip-stop stat-chip-filter" data-filter="stopped"><span class="stat-num" id="statStopped">0</span> Stopped</span>
          <span class="stat-chip stat-chip-upd stat-chip-filter" id="statUpdateChip" data-filter="updates"><span class="stat-num" id="statUpdates">—</span> Updates</span>
        </div>
        <div class="pane-head-actions">
          <button class="btn btn-secondary btn-sm" id="dashCheckAllBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Check for Updates
          </button>
          <button class="btn btn-secondary btn-sm" id="dashRefreshBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
          <button class="btn btn-primary btn-sm" id="dashAddBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Service
          </button>
        </div>
      </div>
    </div>

    <div class="dashboard-grid" id="dashGrid">
      <div class="loading"><div class="spinner"></div> Loading services…</div>
    </div>

    <!-- Add Service Modal -->
    <div class="modal-overlay" id="addSvcOverlay">
      <div class="modal" style="width:480px;max-width:96vw">
        <div class="modal-header">
          <div class="modal-title">Add Service</div>
          <button class="btn btn-ghost btn-icon" id="addSvcClose" title="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body" style="padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:0.9rem;overflow-y:auto;max-height:calc(90vh - 130px)">
          <div class="field">
            <label class="field-label">Service name <span style="color:var(--error)">*</span></label>
            <input class="input" id="addSvcName" placeholder="e.g. nginx" autocomplete="off" spellcheck="false">
          </div>
          <div class="field">
            <label class="field-label">Image <span style="color:var(--error)">*</span></label>
            <input class="input" id="addSvcImage" placeholder="e.g. nginx:latest" autocomplete="off" spellcheck="false">
          </div>
          <div class="field">
            <label class="field-label">Restart policy</label>
            <select class="input" id="addSvcRestart">
              <option value="">none</option>
              <option value="unless-stopped" selected>unless-stopped</option>
              <option value="always">always</option>
              <option value="on-failure">on-failure</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">Ports <span style="color:var(--text-muted);font-weight:400">(one per line, e.g. 8080:80)</span></label>
            <textarea class="input" id="addSvcPorts" rows="3" placeholder="8080:80&#10;443:443" spellcheck="false"></textarea>
          </div>
          <div class="field">
            <label class="field-label">Volumes <span style="color:var(--text-muted);font-weight:400">(one per line)</span></label>
            <textarea class="input" id="addSvcVolumes" rows="3" placeholder="./data:/data&#10;/etc/localtime:/etc/localtime:ro" spellcheck="false"></textarea>
          </div>
          <div class="field">
            <label class="field-label">Environment variables <span style="color:var(--text-muted);font-weight:400">(one per line)</span></label>
            <textarea class="input" id="addSvcEnv" rows="3" placeholder="TZ=UTC&#10;DEBUG=false" spellcheck="false"></textarea>
          </div>
          <label class="toggle-row" style="gap:0.75rem;cursor:pointer">
            <input type="checkbox" id="addSvcStart" checked>
            <span>Start container after adding</span>
          </label>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="addSvcCancel">Cancel</button>
          <button class="btn btn-primary" id="addSvcSave">Add Service</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('dashRefreshBtn').addEventListener('click', loadDashboard);
  document.getElementById('dashCheckAllBtn').addEventListener('click', checkAllUpdates);
  document.getElementById('dashAddBtn').addEventListener('click', openAddServiceModal);
  document.getElementById('addSvcClose').addEventListener('click', closeAddServiceModal);
  document.getElementById('addSvcCancel').addEventListener('click', closeAddServiceModal);
  document.getElementById('addSvcSave').addEventListener('click', submitAddService);
  document.getElementById('addSvcOverlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('addSvcOverlay')) closeAddServiceModal();
  });

  // Filter chips — clicking a chip filters cards by that state
  document.getElementById('dashStats').addEventListener('click', (e) => {
    const chip = e.target.closest('[data-filter]');
    if (!chip) return;
    const f = chip.dataset.filter;
    dashFilter = (dashFilter === f || f === 'all') ? null : f;
    applyDashFilter();
    updateFilterChipStyles();
  });

  loadDashboard();
}
window.dashboardInit = dashboardInit;

function updateFilterChipStyles() {
  document.querySelectorAll('.stat-chip-filter').forEach((chip) => {
    chip.classList.toggle('stat-chip-active', chip.dataset.filter !== 'all' && chip.dataset.filter === dashFilter);
  });
}

function applyDashFilter() {
  const grid = document.getElementById('dashGrid');
  if (!grid) return;
  grid.querySelectorAll('.service-card').forEach((card) => {
    const name = card.dataset.service;
    const svc = (DC.services || []).find((s) => s.name === name);
    let show = true;
    if (svc && dashFilter === 'running') show = (svc.state || '').toLowerCase() === 'running';
    else if (svc && dashFilter === 'stopped') show = (svc.state || '').toLowerCase() !== 'running';
    else if (dashFilter === 'updates') show = DC.updates[name] === 'available';
    card.style.display = show ? '' : 'none';
  });
}

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
  const checkedKeys = Object.keys(DC.updates).filter((k) => DC.updates[k] !== 'checking');
  const updateCount = checkedKeys.filter((k) => DC.updates[k] === 'available').length;

  const el = document.getElementById('dashStats');
  if (!el) return;
  if (total === 0) { el.style.display = 'none'; return; }
  el.style.display = 'flex';

  const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  set('statTotal', total);
  set('statRunning', running);
  set('statStopped', stopped);
  set('statUpdates', checkedKeys.length === 0 ? '—' : updateCount === 0 ? '✓' : updateCount);

  const chip = document.getElementById('statUpdateChip');
  if (chip) {
    chip.className = 'stat-chip stat-chip-upd stat-chip-filter' +
      (checkedKeys.length === 0 ? '' : updateCount > 0 ? ' has-updates' : ' is-ok') +
      (dashFilter === 'updates' ? ' stat-chip-active' : '');
  }
  updateFilterChipStyles();
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
  applyDashFilter();
}

function attachCardListeners(root) {
  (root || document).querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllCardMenus();
      serviceAction(btn.dataset.service, btn.dataset.action, btn);
    });
  });
}

function toggleCardMenu(name) {
  const menu = document.getElementById(`cardMenu-${escHtml(name)}`);
  if (!menu) return;
  const isOpen = menu.classList.contains('open');
  closeAllCardMenus();
  if (!isOpen) {
    menu.classList.add('open');
    // Flip up if dropdown would extend past the viewport bottom
    const rect = menu.getBoundingClientRect();
    menu.classList.toggle('flip-up', rect.bottom > window.innerHeight - 8);
  }
}
window.toggleCardMenu = toggleCardMenu;

function closeAllCardMenus() {
  document.querySelectorAll('.card-menu.open').forEach((m) => m.classList.remove('open'));
}
window.closeAllCardMenus = closeAllCardMenus;

// Close menus when clicking anywhere outside
document.addEventListener('click', closeAllCardMenus);

/* ---- Card menu content ---- */
function buildUpdateMenuItem(name, svc) {
  const excluded = (DC.settings && DC.settings.excludedFromUpdates) || [];
  if (excluded.includes(name) || (svc && svc.isCustom)) return '';
  const st = DC.updates[name];
  const n = escHtml(name);
  if (!st || st === 'idle') {
    return `<button class="card-menu-item" data-action="check-update" data-service="${n}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
      Check for update
    </button>`;
  }
  if (st === 'checking') {
    return `<button class="card-menu-item card-menu-checking" disabled>
      <div class="spinner" style="width:13px;height:13px"></div>
      Checking…
    </button>`;
  }
  if (st === 'available') {
    return `<button class="card-menu-item card-menu-update" data-action="update" data-service="${n}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
      Update available
    </button>`;
  }
  if (st === 'updating') {
    return `<button class="card-menu-item" disabled>
      <div class="spinner" style="width:13px;height:13px"></div>
      Updating…
    </button>`;
  }
  if (st === 'unreachable') {
    return `<button class="card-menu-item" disabled title="Registry unreachable">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      Can't check registry
    </button>`;
  }
  return '';
}

function buildCardMenu(svc) {
  const n = escHtml(svc.name);
  const state = (svc.state || 'absent').toLowerCase();
  const isRunning = state === 'running';
  const updateItem = buildUpdateMenuItem(svc.name, svc);
  return `
    <button class="card-menu-item ${isRunning ? 'card-menu-stop' : 'card-menu-start'}" data-action="${isRunning ? 'stop' : 'start'}" data-service="${n}">
      ${isRunning
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="12" height="12"/></svg> Stop`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Start`}
    </button>
    <button class="card-menu-item" data-action="restart" data-service="${n}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
      Restart
    </button>
    <button class="card-menu-item" data-action="recreate" data-service="${n}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
      Recreate
    </button>
    <div class="card-menu-sep"></div>
    <button class="card-menu-item" data-action="logs" data-service="${n}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      Logs
    </button>
    <button class="card-menu-item" data-action="terminal" data-service="${n}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
      Terminal
    </button>
    <button class="card-menu-item" data-action="config" data-service="${n}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      Configuration
    </button>
    <button class="card-menu-item" data-action="vars" data-service="${n}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
      Variables
    </button>
    ${updateItem ? `<div class="card-menu-sep"></div>${updateItem}` : ''}
    <div class="card-menu-sep"></div>
    <button class="card-menu-item card-menu-danger" onclick="closeAllCardMenus();removeService(${JSON.stringify(svc.name)})">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      Remove
    </button>
  `;
}

function refreshUpdateCell(name) {
  // Rebuild the card menu for this service (update item state may have changed)
  const menu = document.getElementById(`cardMenu-${name}`);
  if (menu) {
    const svc = (DC.services || []).find((s) => s.name === name);
    if (svc) { menu.innerHTML = buildCardMenu(svc); attachCardListeners(menu); }
  }
  const card = document.querySelector(`.service-card[data-service="${CSS.escape(name)}"]`);
  if (card) card.classList.toggle('has-update', DC.updates[name] === 'available');
  renderStats();
}

/* ---- Card ---- */
function buildServiceCard(s) {
  const state = (s.state || 'absent').toLowerCase();
  const isRunning = state === 'running';
  const n = escHtml(s.name);
  const hasUpdate = DC.updates[s.name] === 'available';

  // Port badges (no image shown on card)
  const allPorts = Array.isArray(s.ports) ? s.ports : [];
  const portStr = allPorts.slice(0, 3).map((p) => String(p).split(':').slice(-2).join(':')).join('  ');
  const extraPorts = allPorts.length > 3 ? ` +${allPorts.length - 3}` : '';
  const meta = portStr ? portStr + extraPorts : (s.isCustom ? 'local build' : '');

  return `
    <div class="service-card ${stateClass(state)}${hasUpdate ? ' has-update' : ''}" data-service="${n}" onclick='showServiceDetail(${JSON.stringify(s.name)})'>
      <span class="status-dot ${statusClass(state)}"></span>
      <div class="card-info">
        <div class="card-title">${n}</div>
        ${meta ? `<div class="card-meta">${escHtml(meta)}</div>` : ''}
      </div>
      ${isRunning && s.health ? `<span class="card-health card-health-${s.health}" title="${s.health}">${s.health === 'healthy' ? '✓' : s.health === 'unhealthy' ? '✗' : '⟳'}</span>` : ''}
      <div class="card-menu-wrap" onclick="event.stopPropagation()">
        <button class="card-menu-btn" onclick='toggleCardMenu(${JSON.stringify(s.name)})' title="More actions">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/>
          </svg>
        </button>
        <div class="card-menu" id="cardMenu-${n}">
          ${buildCardMenu(s)}
        </div>
      </div>
    </div>
  `;
}

/* ---- Targeted card update (no full re-render) ---- */
function updateCardState(name, newState, clearHealth) {
  const svc = DC.services.find((s) => s.name === name);
  if (svc) {
    svc.state = newState;
    if (clearHealth) svc.health = null;
  }

  const grid = document.getElementById('dashGrid');
  if (!grid || !svc) return;
  const oldCard = grid.querySelector(`.service-card[data-service="${CSS.escape(name)}"]`);
  if (!oldCard) return;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = buildServiceCard(svc);
  const newCard = wrapper.firstElementChild;
  oldCard.replaceWith(newCard);
  attachCardListeners(newCard);
  applyDashFilter();
  renderSidebarServices(DC.services);
  renderStats();
}

/* ---- Check all updates (3 concurrent max to avoid overloading Docker) ---- */
async function checkAllUpdates() {
  const services = DC.services || [];
  if (!services.length) return;

  const btn = document.getElementById('dashCheckAllBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:13px;height:13px;display:inline-block;vertical-align:middle"></div> Checking…'; }

  const excluded = (DC.settings && DC.settings.excludedFromUpdates) || [];
  const checkable = services.filter((s) => !excluded.includes(s.name));
  checkable.forEach((s) => { DC.updates[s.name] = 'checking'; refreshUpdateCell(s.name); });

  await Promise.all(checkable.map(async (s) => {
    try {
      const { hasUpdate, reason } = await api('GET', `/api/services/${encodeURIComponent(s.name)}/check-update`);
      if (reason === 'registry-unreachable') DC.updates[s.name] = 'unreachable';
      else DC.updates[s.name] = hasUpdate ? 'available' : null;
    } catch {
      DC.updates[s.name] = null;
    }
    refreshUpdateCell(s.name);
  }));

  const updateCount = Object.values(DC.updates).filter((v) => v === 'available').length;
  showToast(
    updateCount === 0
      ? 'All containers are up to date'
      : `${updateCount} update${updateCount > 1 ? 's' : ''} available`,
    updateCount === 0 ? 'success' : 'info'
  );

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> Check for Updates';
  }
  saveUpdateCache();
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
      const { hasUpdate, reason } = await api('GET', `/api/services/${encodeURIComponent(name)}/check-update`);
      if (reason === 'registry-unreachable') {
        DC.updates[name] = 'unreachable';
        showToast(`${name}: registry unreachable — check credentials in Settings`, 'error');
      } else {
        DC.updates[name] = hasUpdate ? 'available' : null;
        showToast(hasUpdate ? `${name}: update available — click Update to apply` : `${name}: already up to date`, hasUpdate ? 'info' : 'success');
      }
    } catch (err) {
      DC.updates[name] = null;
      showToast(`${name}: ${err.message}`, 'error');
    }
    refreshUpdateCell(name);
    saveUpdateCache();
    return;
  }

  if (action === 'update') {
    const svc = (DC.services || []).find((s) => s.name === name);
    const isSelf = name === 'docompose' || (svc && svc.image && svc.image.includes('claudeailab/docompose'));

    if (isSelf) {
      const ok = await dcConfirm(
        'This will update DoCompose itself. The app will restart and reconnect automatically.',
        'Update DoCompose'
      );
      if (!ok) return;
      DC.updates[name] = 'updating';
      refreshUpdateCell(name);
      showSelfUpdateOverlay();
      try { await api('POST', `/api/services/${encodeURIComponent(name)}/update`); } catch {}
      pollUntilBack();
      return;
    }

    const ok = await dcConfirm(`Pull the latest image for "${name}" and recreate the container?`, 'Pull & Update');
    if (!ok) return;
    DC.updates[name] = 'updating';
    refreshUpdateCell(name);
    try {
      await api('POST', `/api/services/${encodeURIComponent(name)}/update`);
      DC.updates[name] = null;
      showToast(`${name}: updated and restarted`, 'success');
      updateCardState(name, 'running');
      saveUpdateCache();
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
    if (action === 'recreate') {
      showServiceDetail(name, 'logs');
      return;
    }
    showToast(`${name}: ${action} successful`, 'success');
    const newState = action === 'stop' ? 'exited' : 'running';
    const clearHealth = action === 'stop';
    updateCardState(name, newState, clearHealth);
  } catch (err) {
    showToast(`${name}: ${err.message}`, 'error');
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  }
}
