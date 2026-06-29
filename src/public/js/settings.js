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
          Registries
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
            <div class="settings-section-label">Appearance</div>
            <div class="settings-group">
              <div class="settings-row">
                <div class="settings-label">
                  <span>Color scheme</span>
                  <span class="settings-hint">Auto follows your system preference.</span>
                </div>
                <div class="settings-control">
                  <div class="theme-picker" id="stgThemePicker">
                    <button class="theme-btn" data-theme="light">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                      Light
                    </button>
                    <button class="theme-btn" data-theme="dark">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                      Dark
                    </button>
                    <button class="theme-btn" data-theme="auto">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2v20M2 12h20" stroke-dasharray="2 2"/></svg>
                      Auto
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <div class="settings-section-label">Date &amp; Time</div>
            <div class="settings-group">
              <div class="settings-row">
                <div class="settings-label">
                  <span>Timezone</span>
                  <span class="settings-hint">Used for the clock in the top bar.</span>
                </div>
                <div class="settings-control">
                  <select id="stgTimezone" class="settings-select">
                    <option value="">System default</option>
                  </select>
                </div>
              </div>
              <div class="settings-row">
                <div class="settings-label">
                  <span>Time format</span>
                </div>
                <div class="settings-control">
                  <select id="stgTimeFormat" class="settings-select">
                    <option value="12">12-hour (3:45 PM)</option>
                    <option value="24">24-hour (15:45)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <div class="settings-section-label">Updates</div>
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

        <!-- Registries -->
        <div class="stg-pane" id="stgPaneRegistry">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
            <h2 class="stg-pane-title" style="margin-bottom:0">Container Registries</h2>
            <button class="btn btn-primary btn-sm" id="stgAddRegistryBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Registry
            </button>
          </div>
          <p class="settings-section-desc" style="margin-bottom:1.25rem">Configure credentials for private container registries. Disabled registries are skipped during update checks.</p>
          <div id="stgRegistryList"></div>
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

  // ── General tab ──────────────────────────────────────────────
  const intEl = document.getElementById('stgUpdateInterval');
  if (intEl && settings.updateIntervalSeconds !== undefined) {
    intEl.value = String(settings.updateIntervalSeconds);
  }

  // Theme picker
  const currentTheme = settings.theme || localStorage.getItem('dc-theme') || 'dark';
  document.querySelectorAll('.theme-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.theme === currentTheme);
    btn.addEventListener('click', () => {
      document.querySelectorAll('.theme-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      applyTheme(btn.dataset.theme);
      markDirty();
    });
  });

  // Timezone
  const tzEl = document.getElementById('stgTimezone');
  const knownTzs = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : [];
  for (const tz of knownTzs) {
    const opt = document.createElement('option');
    opt.value = tz;
    opt.textContent = tz.replace(/_/g, ' ');
    tzEl.appendChild(opt);
  }
  tzEl.value = settings.timezone || '';
  tzEl.addEventListener('change', markDirty);

  // Time format
  const tfEl = document.getElementById('stgTimeFormat');
  tfEl.value = settings.timeFormat || '24';
  tfEl.addEventListener('change', markDirty);

  // ── Registries tab ───────────────────────────────────────────
  let registries = Array.isArray(settings.registries)
    ? settings.registries.map((r) => Object.assign({}, r))
    : (settings.registry ? [Object.assign({ enabled: true, name: 'Default' }, settings.registry)] : []);

  function renderRegistries() {
    const list = document.getElementById('stgRegistryList');
    if (!list) return;
    if (!registries.length) {
      list.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:2rem;font-size:0.9rem">No registries configured. Click "Add Registry" to add one.</div>';
      return;
    }
    list.innerHTML = registries.map((reg, idx) => `
      <div class="registry-card" id="regCard${idx}">
        <div class="registry-card-header">
          <label class="toggle-switch" title="${reg.enabled ? 'Enabled' : 'Disabled'}">
            <input type="checkbox" class="reg-enabled" data-idx="${idx}" ${reg.enabled !== false ? 'checked' : ''}>
            <span class="toggle-track"><span class="toggle-thumb"></span></span>
          </label>
          <span class="registry-card-name">${escHtml(reg.name || reg.server || 'Docker Hub')}</span>
          <button class="btn-icon reg-delete" data-idx="${idx}" title="Remove registry" style="margin-left:auto">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
        <div class="registry-card-body">
          <div class="settings-row" style="margin-bottom:0.5rem">
            <div class="settings-label"><span>Registry server</span><span class="settings-hint">e.g. ghcr.io — blank = Docker Hub</span></div>
            <div class="settings-control">
              <input type="text" class="settings-input reg-server" data-idx="${idx}" value="${escHtml(reg.server || '')}" placeholder="ghcr.io" autocomplete="off">
            </div>
          </div>
          <div class="settings-row" style="margin-bottom:0.5rem">
            <div class="settings-label"><span>Username</span></div>
            <div class="settings-control">
              <input type="text" class="settings-input reg-username" data-idx="${idx}" value="${escHtml(reg.username || '')}" placeholder="username" autocomplete="off">
            </div>
          </div>
          <div class="settings-row" style="margin-bottom:0.75rem">
            <div class="settings-label"><span>Password / Token</span><span class="settings-hint">GitHub PAT needs <code>read:packages</code></span></div>
            <div class="settings-control" style="position:relative">
              <input type="password" class="settings-input reg-password" data-idx="${idx}" placeholder="${reg.password ? '(saved — enter to change)' : '••••••••'}" autocomplete="new-password" style="padding-right:2.2rem">
              <button class="settings-eye reg-eye" type="button" data-idx="${idx}" title="Show/hide">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:0.75rem">
            <button class="btn btn-secondary btn-sm reg-test" data-idx="${idx}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              Test Connection
            </button>
            <span class="reg-test-status" id="regTestStatus${idx}" style="font-size:0.85rem"></span>
          </div>
        </div>
      </div>
    `).join('');

    // Events
    list.querySelectorAll('.reg-enabled').forEach((cb) => {
      cb.addEventListener('change', (e) => {
        registries[+e.target.dataset.idx].enabled = e.target.checked;
        markDirty();
      });
    });
    list.querySelectorAll('.reg-server').forEach((el) => {
      el.addEventListener('input', (e) => { registries[+e.target.dataset.idx].server = e.target.value; markDirty(); });
    });
    list.querySelectorAll('.reg-username').forEach((el) => {
      el.addEventListener('input', (e) => { registries[+e.target.dataset.idx].username = e.target.value; markDirty(); });
    });
    list.querySelectorAll('.reg-password').forEach((el) => {
      el.addEventListener('input', (e) => { registries[+e.target.dataset.idx]._newPass = e.target.value; markDirty(); });
    });
    list.querySelectorAll('.reg-eye').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = +btn.dataset.idx;
        const inp = list.querySelector(`.reg-password[data-idx="${idx}"]`);
        if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
      });
    });
    list.querySelectorAll('.reg-delete').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        registries.splice(+btn.dataset.idx, 1);
        renderRegistries();
        markDirty();
      });
    });
    list.querySelectorAll('.reg-test').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const idx = +btn.dataset.idx;
        const reg = registries[idx];
        const statusEl = document.getElementById(`regTestStatus${idx}`);
        const passVal = list.querySelector(`.reg-password[data-idx="${idx}"]`)?.value;
        if (statusEl) { statusEl.textContent = 'Testing…'; statusEl.style.color = 'var(--text-muted)'; }
        try {
          const result = await api('POST', '/api/settings/test-registry', {
            server: reg.server || '',
            username: reg.username || '',
            password: passVal || reg.password || '',
          });
          if (statusEl) {
            statusEl.textContent = result.ok ? ('✓ ' + (result.message || 'Connected')) : ('✗ ' + result.error);
            statusEl.style.color = result.ok ? 'var(--success)' : 'var(--danger)';
          }
          // Auto-update name if empty
          if (result.ok && !reg.name) {
            reg.name = reg.server || 'Docker Hub';
            renderRegistries();
          }
        } catch (err) {
          if (statusEl) { statusEl.textContent = '✗ ' + err.message; statusEl.style.color = 'var(--danger)'; }
        }
      });
    });
  }

  renderRegistries();

  document.getElementById('stgAddRegistryBtn').addEventListener('click', () => {
    registries.push({ name: '', server: '', username: '', password: '', enabled: true });
    renderRegistries();
    markDirty();
    // Scroll to new card
    const list = document.getElementById('stgRegistryList');
    if (list) list.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  // ── Excluded tab ─────────────────────────────────────────────
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

  excludeList.addEventListener('change', (e) => {
    if (!e.target.classList.contains('stg-exclude-cb')) return;
    if (e.target.checked) excluded.add(e.target.value);
    else excluded.delete(e.target.value);
    markDirty();
  });

  // ── Dirty tracking ────────────────────────────────────────────
  const saveBtn = document.getElementById('stgSaveBtn');
  function markDirty() { saveBtn.disabled = false; }
  document.getElementById('stgUpdateInterval').addEventListener('change', markDirty);

  // ── Save ──────────────────────────────────────────────────────
  saveBtn.addEventListener('click', async () => {
    const setSt = (msg, ok) => {
      const el = document.getElementById('stgSaveStatus');
      if (el) { el.textContent = msg; el.className = 'settings-save-status' + (ok === false ? ' err' : ok ? ' ok' : ''); }
    };
    setSt('Saving…');
    try {
      // Build registries array (merge new passwords)
      const finalRegistries = registries.map((r) => {
        const out = { name: r.name || r.server || 'Docker Hub', server: r.server || '', username: r.username || '', enabled: r.enabled !== false };
        if (r._newPass) out.password = r._newPass;
        else if (r.password) out.password = r.password;
        return out;
      });

      const selectedTheme = document.querySelector('.theme-btn.active')?.dataset.theme || 'dark';

      const payload = {
        updateIntervalSeconds: parseInt(document.getElementById('stgUpdateInterval').value, 10),
        registries: finalRegistries,
        excludedFromUpdates: Array.from(excluded),
        theme: selectedTheme,
        timezone: document.getElementById('stgTimezone').value,
        timeFormat: document.getElementById('stgTimeFormat').value,
      };
      await api('POST', '/api/settings', payload);
      DC.settings = Object.assign({}, DC.settings, payload);
      // Apply theme + datetime settings immediately
      applyTheme(selectedTheme);
      if (window.updateTopbarDatetime) updateTopbarDatetime();
      saveBtn.disabled = true;
      setSt('Saved', true);
      setTimeout(() => setSt(''), 3000);
    } catch (err) {
      setSt('Error: ' + err.message, false);
    }
  });
}
window.settingsInit = settingsInit;
