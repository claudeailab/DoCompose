/* ============================================================
   DoCompose — Settings View (tabbed)
   ============================================================ */

'use strict';

let stgCurrentTab = 'general';

async function settingsInit() {
  const c = document.getElementById('view-settings');
  if (!c) return;

  c.innerHTML = `
    <div class="stg-layout">
      <nav class="stg-sidebar">
        <div class="stg-sidebar-title">Settings</div>
        <button class="stg-tab active" data-tab="general">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          General
        </button>
        <button class="stg-tab" data-tab="registry">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Registry
        </button>
        <button class="stg-tab" data-tab="excluded">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          Exclusions
        </button>
      </nav>

      <div class="stg-content">
        <!-- General -->
        <div class="stg-pane active" id="stgPaneGeneral">
          <h2 class="stg-pane-title">General</h2>
          <div class="settings-section">
            <div class="settings-group">
              <div class="settings-row">
                <div class="settings-label">
                  <span>Update check interval</span>
                  <span class="settings-hint">How often to automatically check for image updates.</span>
                </div>
                <div class="settings-control">
                  <select id="stgUpdateInterval" class="settings-select">
                    <option value="0">Disabled (manual only)</option>
                    <option value="3600">Every hour</option>
                    <option value="21600">Every 6 hours</option>
                    <option value="43200">Every 12 hours</option>
                    <option value="86400">Every 24 hours</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Registry -->
        <div class="stg-pane" id="stgPaneRegistry">
          <h2 class="stg-pane-title">Container Registry</h2>
          <p class="settings-section-desc" style="margin-bottom:1rem">Used when pulling images or checking updates on private registries.</p>
          <div class="settings-section">
            <div class="settings-group">
              <div class="settings-row">
                <div class="settings-label">
                  <span>Registry server</span>
                  <span class="settings-hint">e.g. ghcr.io — leave blank for Docker Hub</span>
                </div>
                <div class="settings-control">
                  <input type="text" id="stgRegServer" class="settings-input" placeholder="ghcr.io" autocomplete="off" />
                </div>
              </div>
              <div class="settings-row">
                <div class="settings-label"><span>Username</span></div>
                <div class="settings-control">
                  <input type="text" id="stgRegUser" class="settings-input" placeholder="username" autocomplete="off" />
                </div>
              </div>
              <div class="settings-row">
                <div class="settings-label">
                  <span>Password / Token</span>
                  <span class="settings-hint">GitHub PAT: needs <code>read:packages</code> scope</span>
                </div>
                <div class="settings-control" style="position:relative">
                  <input type="password" id="stgRegPass" class="settings-input" placeholder="••••••••" autocomplete="new-password" style="padding-right:2.2rem" />
                  <button class="settings-eye" id="stgRegPassToggle" type="button" title="Show/hide">
                    <svg id="stgEyeIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div style="margin-top:1rem;display:flex;align-items:center;gap:0.75rem">
            <button class="btn btn-secondary" id="stgTestRegBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              Test Connection
            </button>
            <span id="stgTestStatus" style="font-size:0.85rem"></span>
          </div>
        </div>

        <!-- Excluded -->
        <div class="stg-pane" id="stgPaneExcluded">
          <h2 class="stg-pane-title">Excluded from Updates</h2>
          <p class="settings-section-desc" style="margin-bottom:0.75rem">Checked containers are skipped during update checks and auto-pulls.</p>
          <input type="text" id="stgExcludeSearch" class="settings-input" placeholder="Search containers…" style="margin-bottom:0.75rem;max-width:320px" />
          <div class="settings-section">
            <div class="settings-exclude-scroll" id="stgExcludeList">
              <div class="settings-loading">Loading services…</div>
            </div>
          </div>
        </div>

        <div class="stg-footer">
          <button class="btn btn-primary" id="stgSaveBtn" disabled>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Save Settings
          </button>
          <span id="stgSaveStatus" class="settings-save-status"></span>
        </div>
      </div>
    </div>
  `;

  // Tab switching
  document.querySelectorAll('.stg-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.stg-tab').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.stg-pane').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      const pane = document.getElementById('stgPane' + btn.dataset.tab.charAt(0).toUpperCase() + btn.dataset.tab.slice(1));
      if (pane) pane.classList.add('active');
      stgCurrentTab = btn.dataset.tab;
    });
  });

  // Load current settings
  let settings = {};
  try {
    settings = await api('GET', '/api/settings');
    DC.settings = settings;
  } catch {}

  // General tab
  const intEl = document.getElementById('stgUpdateInterval');
  if (intEl && settings.updateIntervalSeconds !== undefined) {
    intEl.value = String(settings.updateIntervalSeconds);
  }

  // Registry tab
  const reg = settings.registry || {};
  const setVal = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
  setVal('stgRegServer', reg.server || '');
  setVal('stgRegUser', reg.username || '');
  const passEl = document.getElementById('stgRegPass');
  if (passEl && reg.password) passEl.placeholder = '(saved — enter to change)';

  document.getElementById('stgRegPassToggle').addEventListener('click', () => {
    const inp = document.getElementById('stgRegPass');
    const icon = document.getElementById('stgEyeIcon');
    if (inp.type === 'password') {
      inp.type = 'text';
      icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>';
    } else {
      inp.type = 'password';
      icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
    }
  });

  // Registry test
  document.getElementById('stgTestRegBtn').addEventListener('click', async () => {
    const setSt = (msg, color) => {
      const el = document.getElementById('stgTestStatus');
      if (el) { el.textContent = msg; el.style.color = color || 'var(--text-muted)'; }
    };
    setSt('Testing…');
    try {
      const passVal = document.getElementById('stgRegPass').value;
      const result = await api('POST', '/api/settings/test-registry', {
        server: document.getElementById('stgRegServer').value.trim(),
        username: document.getElementById('stgRegUser').value.trim(),
        password: passVal || reg.password || '',
      });
      setSt(result.ok ? ('✓ ' + (result.message || 'Connected')) : ('✗ ' + result.error), result.ok ? 'var(--success)' : 'var(--danger)');
    } catch (err) {
      setSt('✗ ' + err.message, 'var(--danger)');
    }
  });

  // Excluded tab
  const excludeList = document.getElementById('stgExcludeList');
  const excluded = new Set(settings.excludedFromUpdates || []);
  const services = DC.services || [];
  function renderExcludeList(filter) {
    const filtered = filter ? services.filter((s) => s.name.toLowerCase().includes(filter)) : services;
    if (!filtered.length) {
      excludeList.innerHTML = '<div class="settings-loading">No services found</div>';
    } else {
      excludeList.innerHTML = filtered.map((s) => `
        <label class="settings-checkbox-row">
          <input type="checkbox" class="stg-exclude-cb" value="${escHtml(s.name)}" ${excluded.has(s.name) ? 'checked' : ''}>
          <span class="settings-checkbox-name">${escHtml(s.name)}</span>
          <span class="settings-checkbox-hint">${escHtml(s.image || '')}</span>
        </label>
      `).join('');
    }
  }
  renderExcludeList('');

  document.getElementById('stgExcludeSearch').addEventListener('input', (e) => {
    renderExcludeList(e.target.value.trim().toLowerCase());
  });

  // Update excluded set when checkboxes change
  excludeList.addEventListener('change', (e) => {
    if (!e.target.classList.contains('stg-exclude-cb')) return;
    if (e.target.checked) excluded.add(e.target.value);
    else excluded.delete(e.target.value);
    markDirty();
  });

  // Dirty tracking
  const saveBtn = document.getElementById('stgSaveBtn');
  function markDirty() { saveBtn.disabled = false; }
  document.getElementById('stgUpdateInterval').addEventListener('change', markDirty);
  document.getElementById('stgRegServer').addEventListener('input', markDirty);
  document.getElementById('stgRegUser').addEventListener('input', markDirty);
  document.getElementById('stgRegPass').addEventListener('input', markDirty);

  // Save
  saveBtn.addEventListener('click', async () => {
    const setSt = (msg, ok) => {
      const el = document.getElementById('stgSaveStatus');
      if (el) { el.textContent = msg; el.className = 'settings-save-status' + (ok === false ? ' err' : ok ? ' ok' : ''); }
    };
    setSt('Saving…');
    try {
      const passVal = document.getElementById('stgRegPass').value;
      const payload = {
        updateIntervalSeconds: parseInt(document.getElementById('stgUpdateInterval').value, 10),
        registry: {
          server: document.getElementById('stgRegServer').value.trim(),
          username: document.getElementById('stgRegUser').value.trim(),
          ...(passVal ? { password: passVal } : {}),
        },
        excludedFromUpdates: Array.from(excluded),
      };
      await api('POST', '/api/settings', payload);
      DC.settings = Object.assign({}, DC.settings, payload);
      saveBtn.disabled = true;
      setSt('Saved', true);
      setTimeout(() => setSt(''), 3000);
    } catch (err) {
      setSt('Error: ' + err.message, false);
    }
  });
}
window.settingsInit = settingsInit;
