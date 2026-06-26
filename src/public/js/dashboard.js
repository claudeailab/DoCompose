/* ============================================================
   DoCompose — Dashboard View
   ============================================================ */

'use strict';

function dashboardInit() {
  const container = document.getElementById('view-dashboard');
  container.innerHTML = `
    <div class="view-header">
      <h1 class="view-title">Dashboard</h1>
      <button class="btn btn-secondary" id="dashRefreshBtn">
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

  // Attach action listeners
  grid.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const name = btn.dataset.service;
      await serviceAction(name, action, btn);
    });
  });
}

function buildServiceCard(s) {
  const state = (s.state || 'absent').toLowerCase();
  const statusLabel = s.status || s.state || 'unknown';
  const ports = Array.isArray(s.ports) ? s.ports : [];

  return `
    <div class="service-card ${stateClass(state)}">
      <div class="card-header">
        <span class="card-status-dot status-dot ${statusClass(state)}"></span>
        <div>
          <div class="card-title">${escHtml(s.name)}</div>
          <div class="card-subtitle">${escHtml(s.containerName || s.name)}</div>
        </div>
        <span class="card-status-text">${escHtml(state)}</span>
      </div>

      ${s.image ? `<div class="card-image" title="${escHtml(s.image)}">${escHtml(s.image)}</div>` : ''}

      ${ports.length ? `
        <div class="card-ports">
          ${ports.map((p) => `<span class="port-badge">${escHtml(String(p))}</span>`).join('')}
        </div>` : ''}

      <div class="card-actions">
        ${state !== 'running' ? `
          <button class="btn btn-success btn-sm" data-action="start" data-service="${escHtml(s.name)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Start
          </button>` : `
          <button class="btn btn-danger btn-sm" data-action="stop" data-service="${escHtml(s.name)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="12" height="12"/></svg>
            Stop
          </button>`}
        <button class="btn btn-secondary btn-sm" data-action="restart" data-service="${escHtml(s.name)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Restart
        </button>
        <button class="btn btn-secondary btn-sm" data-action="pull" data-service="${escHtml(s.name)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Pull
        </button>
        <button class="btn btn-secondary btn-sm" data-action="logs" data-service="${escHtml(s.name)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Logs
        </button>
      </div>
    </div>
  `;
}

async function serviceAction(name, action, btn) {
  if (action === 'logs') {
    // Switch to logs view with this service pre-selected
    showView('logs');
    setTimeout(() => {
      const sel = document.getElementById('logsServiceSelect');
      if (sel) {
        // Find container name matching service
        const svc = DC.services.find((s) => s.name === name);
        const containerName = svc ? svc.containerName : name;
        for (const opt of sel.options) {
          if (opt.value === containerName || opt.value.includes(name)) {
            sel.value = opt.value;
            sel.dispatchEvent(new Event('change'));
            break;
          }
        }
      }
    }, 300);
    return;
  }

  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:12px;height:12px"></div>';

  try {
    await api('POST', `/api/services/${encodeURIComponent(name)}/${action}`);
    showToast(`${name}: ${action} successful`, 'success');
    // Refresh dashboard after short delay
    setTimeout(loadDashboard, 800);
  } catch (err) {
    showToast(`${name}: ${err.message}`, 'error');
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}
