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
  updates: {},
  settings: {},
};

// ---- Update state persistence ----
const UPDATE_CACHE_KEY = 'dc-updates-cache';
const UPDATE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

function saveUpdateCache() {
  try {
    localStorage.setItem(UPDATE_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: DC.updates }));
  } catch {}
}
window.saveUpdateCache = saveUpdateCache;

function loadUpdateCache() {
  try {
    const raw = localStorage.getItem(UPDATE_CACHE_KEY);
    if (!raw) return;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > UPDATE_CACHE_TTL) { localStorage.removeItem(UPDATE_CACHE_KEY); return; }
    // Restore only terminal states — discard any 'checking' or 'updating' that was in-flight
    DC.updates = {};
    for (const [k, v] of Object.entries(data || {})) {
      if (v === 'available' || v === null) DC.updates[k] = v;
    }
  } catch {}
}

// ---- API helpers ----
async function api(method, path, body) {
  const opts = { method, headers: {} };
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

  switch (viewName) {
    case 'dashboard': if (window.dashboardInit) dashboardInit(); break;
    case 'service':   if (window.serviceInit) serviceInit(); break;
    case 'images':    if (window.imagesInit) imagesInit(); break;
    case 'settings':  if (window.settingsInit) settingsInit(); break;
  }

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

// ---- Sidebar service list ----
async function refreshServiceList() {
  try {
    const { services } = await api('GET', '/api/services');
    DC.services = services || [];
    renderSidebarServices(DC.services);
    if (window.svcRefreshHeader) svcRefreshHeader();
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
  const activeName = (DC.currentView === 'service' && window.svcName) ? window.svcName : null;
  list.innerHTML = services.map((s) => {
    let healthIcon = '';
    if (s.health === 'healthy') {
      healthIcon = `<svg class="service-health-icon health-healthy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>`;
    } else if (s.health === 'unhealthy') {
      healthIcon = `<svg class="service-health-icon health-unhealthy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else if (s.health === 'starting') {
      healthIcon = `<svg class="service-health-icon health-starting" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
    }
    return `
    <div class="service-item${activeName === s.name ? ' active' : ''}" data-name="${escHtml(s.name)}" onclick='showServiceDetail(${JSON.stringify(s.name)})'>
      <span class="status-dot ${statusClass(s.state)}"></span>
      <span class="service-item-name">${escHtml(s.name)}</span>
      ${healthIcon}
    </div>`;
  }).join('');
}

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
    overlay.className = 'modal-overlay is-open';
    overlay.innerHTML = `
      <div class="modal modal-plain">
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
        <div class="search-result-item" onclick='showServiceDetail(${JSON.stringify(r.service)})'>
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

// ---- Theme ----
function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === 'auto') {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    html.setAttribute('data-theme', dark ? 'dark' : 'light');
  } else {
    html.setAttribute('data-theme', theme || 'dark');
  }
  localStorage.setItem('dc-theme', theme || 'dark');
}
window.applyTheme = applyTheme;

// Listen for OS theme changes when in auto mode
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  const t = localStorage.getItem('dc-theme');
  if (t === 'auto') applyTheme('auto');
});

const savedTheme = localStorage.getItem('dc-theme') || 'dark';
applyTheme(savedTheme);

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
    if (badge) badge.textContent = `v${version}`;
    DC.version = `v${version}`;
  }
}).catch(() => {});

// ---- System stats ----
function fmtBytes(b) {
  if (b >= 1e9) return (b / 1e9).toFixed(1) + 'G';
  if (b >= 1e6) return (b / 1e6).toFixed(1) + 'M';
  if (b >= 1e3) return (b / 1e3).toFixed(0) + 'K';
  return (b || 0) + 'B';
}
function fmtBytesRate(b) {
  return fmtBytes(b) + '/s';
}

const CPU_HISTORY_LEN = 40;
const CPU_HISTORY_KEY = 'dc-cpu-history';
// Restore history from sessionStorage so sparkline survives a page refresh
const cpuHistory = (() => {
  try {
    const raw = sessionStorage.getItem(CPU_HISTORY_KEY);
    if (raw) return JSON.parse(raw).slice(-CPU_HISTORY_LEN);
  } catch {}
  return [];
})();

function updateCpuSparkline() {
  const line = document.getElementById('tsCpuLine');
  if (!line || cpuHistory.length < 2) return;
  const max = Math.max(...cpuHistory, 1);
  const w = 120, h = 20;
  const pts = cpuHistory.map((v, i) => {
    const x = (i / (CPU_HISTORY_LEN - 1)) * w;
    const y = h - (v / max) * (h - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  line.setAttribute('points', pts);
}

function updateMemBars(used, total) {
  const el = document.getElementById('tsMemBars');
  if (!el || !total) return;
  const pct = Math.min(used / total, 1);
  const BARS = 10;
  const filled = Math.round(pct * BARS);
  el.innerHTML = Array.from({ length: BARS }, (_, i) =>
    `<span class="ts-membar${i < filled ? ' filled' : ''}"></span>`
  ).join('');
}

async function refreshStats() {
  try {
    const d = await api('GET', '/api/stats');
    const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    // CPU
    cpuHistory.push(d.cpu || 0);
    if (cpuHistory.length > CPU_HISTORY_LEN) cpuHistory.shift();
    try { sessionStorage.setItem(CPU_HISTORY_KEY, JSON.stringify(cpuHistory)); } catch {}
    set('tsCpu', (d.cpu || 0).toFixed(1) + '% / ' + (d.cpuCores || '') + ' CPU');
    updateCpuSparkline();
    // Memory
    set('tsMem', fmtBytes(d.memUsed) + ' / ' + fmtBytes(d.memTotal));
    updateMemBars(d.memUsed, d.memTotal);
    // Network
    set('tsNetOut', fmtBytesRate(d.netOut));
    set('tsNetIn', fmtBytesRate(d.netIn));
    // Disk I/O (if available)
    set('tsDiskOut', d.blkOut !== undefined ? fmtBytesRate(d.blkOut) : '—');
    set('tsDiskIn',  d.blkIn  !== undefined ? fmtBytesRate(d.blkIn)  : '—');
  } catch {}
}

// ---- Topbar date/time ----
function updateTopbarDatetime() {
  const dateEl = document.getElementById('tsDate');
  const timeEl = document.getElementById('tsTime');
  if (!dateEl || !timeEl) return;
  const tz = DC.settings?.timezone || undefined;
  const fmt = DC.settings?.timeFormat || '24';
  const now = new Date();
  try {
    dateEl.textContent = now.toLocaleDateString(undefined, { timeZone: tz, month: 'short', day: 'numeric' });
    timeEl.textContent = now.toLocaleTimeString(undefined, {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: fmt === '12',
    });
  } catch {
    dateEl.textContent = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    timeEl.textContent = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: fmt === '12' });
  }
}
window.updateTopbarDatetime = updateTopbarDatetime;
updateTopbarDatetime();
setInterval(updateTopbarDatetime, 10000);

// ---- Auto-refresh services every 15s; stats every 10s; poll service detail header every 5s ----
setInterval(refreshServiceList, 15000);
setInterval(refreshStats, 10000);
setInterval(async () => {
  if (DC.currentView !== 'service' || !window.svcRefreshHeader) return;
  try {
    const { services } = await api('GET', '/api/services');
    if (services) DC.services = services;
    svcRefreshHeader();
  } catch {}
}, 5000);

// ---- Load settings ----
async function loadSettings() {
  try {
    DC.settings = await fetch('/api/settings').then((r) => r.json());
  } catch {
    DC.settings = {};
  }
}
window.loadSettings = loadSettings;

// ---- Boot ----
(async () => {
  loadUpdateCache();
  await loadSettings();
  // Apply persisted theme from server settings (overrides localStorage)
  if (DC.settings.theme) applyTheme(DC.settings.theme);
  updateTopbarDatetime();
  await loadProjects();
  await refreshServiceList();
  refreshStats();
  showView('dashboard');
})();
