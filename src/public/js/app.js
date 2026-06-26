/* ============================================================
   DoCompose — Main SPA Router & Shared Utilities
   ============================================================ */

'use strict';

// ---- State ----
window.DC = {
  currentView: 'dashboard',
  currentProject: '',
  projects: [],
  services: [],
  version: 'v0.1.0',
};

// ---- API helpers ----
async function api(method, path, body) {
  const opts = {
    method,
    headers: {},
  };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const qs = DC.currentProject ? `?project=${encodeURIComponent(DC.currentProject)}` : '';
  const url = path.includes('?') ? path : path + qs;
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}
window.api = api;

// ---- Toast ----
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 350);
  }, duration);
}
window.showToast = showToast;

// ---- View router ----
function showView(viewName) {
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));

  const viewEl = document.getElementById(`view-${viewName}`);
  const navEl = document.querySelector(`.nav-item[data-view="${viewName}"]`);

  if (viewEl) viewEl.classList.add('active');
  if (navEl) navEl.classList.add('active');

  DC.currentView = viewName;

  // Trigger view-specific init
  switch (viewName) {
    case 'dashboard': if (window.dashboardInit) dashboardInit(); break;
    case 'editor': if (window.editorInit) editorInit(); break;
    case 'env': if (window.envInit) envInit(); break;
    case 'logs': if (window.logsInit) logsInit(); break;
    case 'terminal': if (window.terminalInit) terminalInit(); break;
  }

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
  }
}
window.showView = showView;

// ---- Status dot class ----
function statusClass(state) {
  if (!state) return 'status-absent';
  const s = state.toLowerCase();
  if (s === 'running') return 'status-running';
  if (s === 'paused') return 'status-paused';
  if (s === 'exited' || s === 'stopped') return 'status-stopped';
  return 'status-absent';
}
window.statusClass = statusClass;

function stateClass(state) {
  if (!state) return 'state-absent';
  const s = state.toLowerCase();
  if (s === 'running') return 'state-running';
  if (s === 'paused') return 'state-paused';
  if (s === 'exited' || s === 'stopped') return 'state-exited';
  return 'state-absent';
}
window.stateClass = stateClass;

// ---- Load projects ----
async function loadProjects() {
  try {
    const { projects } = await fetch('/api/files/projects').then((r) => r.json());
    DC.projects = projects || [];
    const sel = document.getElementById('projectSelect');
    sel.innerHTML = '';
    for (const p of DC.projects) {
      const opt = document.createElement('option');
      opt.value = p.dir;
      opt.textContent = p.name;
      sel.appendChild(opt);
    }
    if (DC.projects.length > 0 && !DC.currentProject) {
      DC.currentProject = DC.projects[0].dir;
      sel.value = DC.currentProject;
    }
  } catch (err) {
    console.warn('Could not load projects:', err.message);
  }
}

// ---- Load & display services in sidebar ----
async function refreshServiceList() {
  try {
    const { services } = await api('GET', '/api/services');
    DC.services = services || [];
    renderSidebarServices(DC.services);
  } catch (err) {
    console.warn('Services load error:', err.message);
  }
}
window.refreshServiceList = refreshServiceList;

function renderSidebarServices(services) {
  const list = document.getElementById('serviceList');
  if (!services.length) {
    list.innerHTML = '<div style="padding:0.5rem 0.85rem;font-size:0.85rem;color:var(--text-muted)">No services found</div>';
    return;
  }
  list.innerHTML = services.map((s) => `
    <div class="service-item" onclick="openServiceEditor(${JSON.stringify(s.name)})">
      <span class="status-dot ${statusClass(s.state)}"></span>
      <span>${escHtml(s.name)}</span>
    </div>
  `).join('');
}

function openServiceEditor(name) {
  showView('editor');
  // editorInit sets up the split panel; once ready, select the service
  setTimeout(() => {
    if (typeof selectEditorService === 'function') selectEditorService(name);
  }, 50);
}
window.openServiceEditor = openServiceEditor;

// ---- Escape HTML ----
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
window.escHtml = escHtml;

// ---- Confirmation modal ----
function confirm(message, title = 'Confirm') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-title">${escHtml(title)}</div>
        <div class="modal-body">${escHtml(message)}</div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="modalCancel">Cancel</button>
          <button class="btn btn-primary" id="modalOk">Confirm</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#modalOk').onclick = () => { overlay.remove(); resolve(true); };
    overlay.querySelector('#modalCancel').onclick = () => { overlay.remove(); resolve(false); };
  });
}
window.dcConfirm = confirm;

// ---- Search ----
let searchTimeout;
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  const q = searchInput.value.trim();
  if (!q) { searchResults.hidden = true; return; }
  searchTimeout = setTimeout(() => doSearch(q), 250);
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { searchResults.hidden = true; searchInput.blur(); }
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.topbar-search')) searchResults.hidden = true;
});

async function doSearch(q) {
  try {
    const qs = `?q=${encodeURIComponent(q)}&project=${encodeURIComponent(DC.currentProject)}`;
    const { results } = await fetch('/api/search' + qs).then((r) => r.json());
    if (!results || !results.length) {
      searchResults.innerHTML = '<div class="search-result-item" style="color:var(--text-muted)">No results</div>';
    } else {
      searchResults.innerHTML = results.map((r) => `
        <div class="search-result-item" onclick="showView('dashboard')">
          <div class="search-result-service">${escHtml(r.service)}</div>
          ${r.matches.map((m) => `<div class="search-result-match">${escHtml(m.field)}: ${escHtml(m.value)}</div>`).join('')}
        </div>
      `).join('');
    }
    searchResults.hidden = false;
  } catch (err) {
    console.warn('Search error:', err.message);
  }
}

// ---- Theme toggle ----
document.getElementById('themeToggle').addEventListener('click', () => {
  const html = document.documentElement;
  const theme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', theme);
  localStorage.setItem('dc-theme', theme);
});

// Restore saved theme
const savedTheme = localStorage.getItem('dc-theme');
if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

// ---- Nav ----
document.querySelectorAll('.nav-item').forEach((btn) => {
  btn.addEventListener('click', () => showView(btn.dataset.view));
});

// ---- Project selector ----
document.getElementById('projectSelect').addEventListener('change', (e) => {
  DC.currentProject = e.target.value;
  refreshServiceList();
  if (DC.currentView === 'dashboard' && window.dashboardInit) dashboardInit();
});

// ---- Hamburger / mobile sidebar ----
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebarOverlay');
document.getElementById('hamburgerBtn').addEventListener('click', () => {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('open');
});
overlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  overlay.classList.remove('open');
});

// ---- Version ----
fetch('/api/version').then((r) => r.json()).then(({ version }) => {
  if (version) {
    const badge = document.getElementById('versionBadge');
    badge.textContent = `v${version}`;
    DC.version = `v${version}`;
  }
}).catch(() => {});

// ---- Auto-refresh services every 15s ----
setInterval(refreshServiceList, 15000);

// ---- Boot ----
(async () => {
  await loadProjects();
  await refreshServiceList();
  showView('dashboard');
})();
