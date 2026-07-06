/* ============================================================
   DoCompose — Settings View (tabbed, unified design system)
   ============================================================ */

'use strict';

let stgCurrentTab = 'general';

// Small inline icon helpers
const IC = {
  paint: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.996 6.012 17.51 2 12 2z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
  folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  jobs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  block: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>',
};

async function settingsInit() {
  const c = document.getElementById('view-settings');
  if (!c) return;

  c.innerHTML = `
    <div class="stg-layout">
      <nav class="stg-sidebar">
        <button class="stg-tab active" data-tab="general">${IC.paint}General</button>
        <button class="stg-tab" data-tab="registry"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Registries</button>
        <button class="stg-tab" data-tab="excluded">${IC.block}Exclusions</button>
        <button class="stg-tab" data-tab="backups">${IC.jobs}Backups</button>
      </nav>

      <div class="stg-content">
        <!-- GENERAL -->
        <div class="stg-pane active" id="stgPaneGeneral">
          <div class="pane-head"><div class="pane-title">General</div></div>
          <div class="stg-section-list">
            <div class="stg-section">
              <div class="stg-section-title">Appearance</div>
              <div class="field">
                <div class="field-label">Color scheme</div>
                <div class="segmented" id="stgThemePicker">
                  <button class="segmented-btn theme-btn" data-theme="light"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>Light</button>
                  <button class="segmented-btn theme-btn" data-theme="dark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>Dark</button>
                  <button class="segmented-btn theme-btn" data-theme="auto"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2v20" stroke-dasharray="2 2"/></svg>Auto</button>
                </div>
                <div class="field-hint">Auto follows your operating system preference.</div>
              </div>
            </div>

            <div class="stg-section">
              <div class="stg-section-title">Date &amp; Time</div>
              <div class="field">
                <div class="field-label">Timezone</div>
                <select id="stgTimezone" class="settings-select"><option value="">System default</option></select>
              </div>
              <div class="field">
                <div class="field-label">Time format</div>
                <select id="stgTimeFormat" class="settings-select">
                  <option value="12">12-hour (3:45 PM)</option>
                  <option value="24">24-hour (15:45)</option>
                </select>
              </div>
            </div>

            <div class="stg-section">
              <div class="stg-section-title">Updates</div>
              <div class="field">
                <div class="field-label">Check interval</div>
                <select id="stgUpdateInterval" class="settings-select">
                  <option value="0">Disabled (manual only)</option>
                  <option value="3600">Every hour</option>
                  <option value="21600">Every 6 hours</option>
                  <option value="43200">Every 12 hours</option>
                  <option value="86400">Every 24 hours</option>
                </select>
                <div class="field-hint">How often to automatically check registries for newer images.</div>
              </div>
            </div>
          </div>
        </div>

        <!-- REGISTRIES -->
        <div class="stg-pane" id="stgPaneRegistry">
          <div class="pane-head">
            <div class="pane-title">Registries</div>
            <div class="pane-head-actions"><button class="btn btn-primary btn-sm" id="stgAddRegistryBtn">${IC.plus}Add Registry</button></div>
          </div>
          <div class="stg-section-list" id="stgRegistryList"></div>
        </div>

        <!-- EXCLUSIONS -->
        <div class="stg-pane" id="stgPaneExcluded">
          <div class="pane-head">
            <div class="pane-title">Exclusions</div>
            <div class="pane-head-actions"><span class="stg-count-badge" id="stgExcludeCount"></span></div>
          </div>
          <div class="stg-section-list">
            <div class="stg-section">
              <input type="text" id="stgExcludeSearch" class="settings-input" placeholder="Search containers…">
              <div class="check-list" id="stgExcludeList"><div class="loading"><div class="spinner"></div> Loading services…</div></div>
            </div>
          </div>
        </div>

        <!-- BACKUPS -->
        <div class="stg-pane" id="stgPaneBackups">
          <div class="pane-head">
            <div class="pane-title">Backups</div>
            <div class="pane-head-actions" id="stgAddProviderBar"></div>
          </div>
          <div class="stg-section-list">
            <div class="stg-section" id="stgOdSection" style="display:none"><div class="loading"><div class="spinner"></div> Loading…</div></div>
            <div class="stg-section" id="stgDbSection" style="display:none"><div class="loading"><div class="spinner"></div> Loading…</div></div>
            <div class="stg-section" id="stgNoProviderHint">
              <div class="stg-empty">No backup providers configured. Use the buttons above to add OneDrive or Dropbox.</div>
            </div>
            <div class="stg-section">
              <div class="stg-section-head">
                <div class="stg-section-title">Backup Jobs</div>
                <button class="btn btn-primary btn-sm" id="stgAddBackupJobBtn">${IC.plus}Add Job</button>
              </div>
              <div id="stgBackupJobsList" class="stg-stack"></div>
            </div>
          </div>
        </div>

        <div class="stg-footer">
          <button class="btn btn-primary" id="stgSaveBtn" disabled>${IC.save}Save Changes</button>
          <span id="stgSaveStatus" class="stg-save-status"></span>
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

  // ── Dirty tracking ────────────────────────────────────────────
  const saveBtn = document.getElementById('stgSaveBtn');
  function markDirty() { saveBtn.disabled = false; }

  // ── General tab ──────────────────────────────────────────────
  const intEl = document.getElementById('stgUpdateInterval');
  if (intEl && settings.updateIntervalSeconds !== undefined) intEl.value = String(settings.updateIntervalSeconds);
  intEl.addEventListener('change', markDirty);

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

  const tzEl = document.getElementById('stgTimezone');
  const knownTzs = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : [];
  for (const tz of knownTzs) {
    const opt = document.createElement('option');
    opt.value = tz; opt.textContent = tz.replace(/_/g, ' ');
    tzEl.appendChild(opt);
  }
  tzEl.value = settings.timezone || '';
  tzEl.addEventListener('change', markDirty);

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
      list.innerHTML = `<div class="stg-empty"><p>No registries configured. Add one to authenticate against a private registry like <code>ghcr.io</code>.</p></div>`;
      return;
    }
    list.innerHTML = registries.map((reg, idx) => `
      <div class="stg-section" id="regCard${idx}">
        <div class="stg-section-head">
          <label class="toggle" title="${reg.enabled !== false ? 'Enabled' : 'Disabled'}">
            <input type="checkbox" class="reg-enabled" data-idx="${idx}" ${reg.enabled !== false ? 'checked' : ''}>
            <span class="toggle-track"><span class="toggle-thumb"></span></span>
          </label>
          <span class="stg-section-title">${escHtml(reg.name || reg.server || 'Docker Hub')}</span>
          <button class="btn-icon reg-delete" data-idx="${idx}" title="Remove registry">${IC.trash}</button>
        </div>
        <div class="field">
          <div class="field-label">Registry server</div>
          <input type="text" class="settings-input reg-server" data-idx="${idx}" value="${escHtml(reg.server || '')}" placeholder="ghcr.io" autocomplete="off">
          <div class="field-hint">e.g. <code>ghcr.io</code> — leave blank for Docker Hub.</div>
        </div>
        <div class="field">
          <div class="field-label">Username</div>
          <input type="text" class="settings-input reg-username" data-idx="${idx}" value="${escHtml(reg.username || '')}" placeholder="username" autocomplete="off">
        </div>
        <div class="field">
          <div class="field-label">Password / Token</div>
          <div class="input-wrap">
            <input type="password" class="settings-input reg-password" data-idx="${idx}" placeholder="${reg.hasPassword ? '(saved — enter to change)' : '••••••••'}" autocomplete="new-password">
            <button class="input-eye reg-eye" type="button" data-idx="${idx}" title="Show/hide">${IC.eye}</button>
          </div>
          <div class="field-hint">GitHub PAT needs <code>read:packages</code>.</div>
        </div>
        <div class="stg-section-foot">
          <span class="reg-test-status" id="regTestStatus${idx}"></span>
          <button class="btn btn-secondary btn-sm reg-test" data-idx="${idx}">${IC.check}Test Connection</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.reg-enabled').forEach((cb) => cb.addEventListener('change', (e) => { registries[+e.target.dataset.idx].enabled = e.target.checked; markDirty(); }));
    list.querySelectorAll('.reg-server').forEach((el) => el.addEventListener('input', (e) => { registries[+e.target.dataset.idx].server = e.target.value; markDirty(); }));
    list.querySelectorAll('.reg-username').forEach((el) => el.addEventListener('input', (e) => { registries[+e.target.dataset.idx].username = e.target.value; markDirty(); }));
    list.querySelectorAll('.reg-password').forEach((el) => el.addEventListener('input', (e) => { registries[+e.target.dataset.idx]._newPass = e.target.value; markDirty(); }));
    list.querySelectorAll('.reg-eye').forEach((btn) => btn.addEventListener('click', () => {
      const inp = list.querySelector(`.reg-password[data-idx="${btn.dataset.idx}"]`);
      if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
    }));
    list.querySelectorAll('.reg-delete').forEach((btn) => btn.addEventListener('click', () => { registries.splice(+btn.dataset.idx, 1); renderRegistries(); markDirty(); }));
    list.querySelectorAll('.reg-test').forEach((btn) => btn.addEventListener('click', async () => {
      const idx = +btn.dataset.idx;
      const reg = registries[idx];
      const statusEl = document.getElementById(`regTestStatus${idx}`);
      const passVal = list.querySelector(`.reg-password[data-idx="${idx}"]`)?.value;
      if (statusEl) { statusEl.textContent = 'Testing…'; statusEl.style.color = 'var(--text-muted)'; }
      try {
        const result = await api('POST', '/api/settings/test-registry', { server: reg.server || '', username: reg.username || '', password: passVal || '' });
        if (statusEl) {
          statusEl.textContent = result.ok ? ('✓ ' + (result.message || 'Connected')) : ('✗ ' + result.error);
          statusEl.style.color = result.ok ? 'var(--success)' : 'var(--danger)';
        }
        if (result.ok && !reg.name) { reg.name = reg.server || 'Docker Hub'; renderRegistries(); }
      } catch (err) {
        if (statusEl) { statusEl.textContent = '✗ ' + err.message; statusEl.style.color = 'var(--danger)'; }
      }
    }));
  }
  renderRegistries();

  document.getElementById('stgAddRegistryBtn').addEventListener('click', () => {
    registries.push({ name: '', server: '', username: '', enabled: true });
    renderRegistries();
    markDirty();
    document.getElementById('stgRegistryList')?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  // ── Excluded tab ─────────────────────────────────────────────
  const excludeList = document.getElementById('stgExcludeList');
  const excluded = new Set(settings.excludedFromUpdates || []);
  const services = DC.services || [];
  function updateExcludeCount() {
    const el = document.getElementById('stgExcludeCount');
    if (el) el.textContent = `${excluded.size} of ${services.length} excluded`;
  }
  function renderExcludeList(filter) {
    const filtered = filter ? services.filter((s) => s.name.toLowerCase().includes(filter)) : services;
    if (!filtered.length) {
      excludeList.innerHTML = '<div class="loading">No services found</div>';
    } else {
      excludeList.innerHTML = filtered.map((s) => `
        <label class="check-row">
          <input type="checkbox" class="stg-exclude-cb" value="${escHtml(s.name)}" ${excluded.has(s.name) ? 'checked' : ''}>
          <span class="check-name">${escHtml(s.name)}</span>
          <span class="check-hint">${escHtml(s.image || '')}</span>
        </label>
      `).join('');
    }
  }
  renderExcludeList('');
  updateExcludeCount();

  document.getElementById('stgExcludeSearch').addEventListener('input', (e) => renderExcludeList(e.target.value.trim().toLowerCase()));
  excludeList.addEventListener('change', (e) => {
    if (!e.target.classList.contains('stg-exclude-cb')) return;
    if (e.target.checked) excluded.add(e.target.value); else excluded.delete(e.target.value);
    updateExcludeCount();
    markDirty();
  });

  // ── Backups tab ───────────────────────────────────────────────
  let backupJobs = (settings.backupJobs || []).map((j) => Object.assign({}, j));
  let odEnabled = !!(settings.onedrive && settings.onedrive.clientId);
  let dbEnabled = !!(settings.dropbox && settings.dropbox.appKey);
  let odBackupFolder = (settings.onedrive && settings.onedrive.backupFolderPath) || 'DoCompose Backups';
  let dbBackupFolder = (settings.dropbox && settings.dropbox.backupFolderPath) || 'DoCompose Backups';

  const odIcon = `<svg class="provider-icon" viewBox="0 0 32 22" xmlns="http://www.w3.org/2000/svg"><ellipse cx="22" cy="14" rx="10" ry="6" fill="#0078D4" opacity="0.65"/><ellipse cx="13" cy="16" rx="6" ry="4" fill="#0078D4" opacity="0.85"/><rect x="6" y="14" width="22" height="6" rx="3" fill="#0078D4"/></svg>`;
  const dbIcon = `<svg class="provider-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M6 2L12 6.5L6 11L0 6.5Z" fill="#0061FF"/><path d="M18 2L24 6.5L18 11L12 6.5Z" fill="#0061FF"/><path d="M0 13.5L6 9L12 13.5L6 18Z" fill="#0061FF"/><path d="M24 13.5L18 9L12 13.5L18 18Z" fill="#0061FF"/><path d="M6 19.5L12 15L18 19.5L12 24Z" fill="#0061FF"/></svg>`;

  function renderProviderBar() {
    const bar = document.getElementById('stgAddProviderBar');
    const hint = document.getElementById('stgNoProviderHint');
    const odSec = document.getElementById('stgOdSection');
    const dbSec = document.getElementById('stgDbSection');
    if (odSec) odSec.style.display = odEnabled ? '' : 'none';
    if (dbSec) dbSec.style.display = dbEnabled ? '' : 'none';
    if (hint) hint.style.display = (!odEnabled && !dbEnabled) ? '' : 'none';
    if (!bar) return;
    let html = '';
    if (!odEnabled) html += `<button class="btn btn-secondary btn-sm" id="stgAddOdBtn">${odIcon}Add OneDrive</button>`;
    if (!dbEnabled) html += `<button class="btn btn-secondary btn-sm" id="stgAddDbBtn">${dbIcon}Add Dropbox</button>`;
    bar.innerHTML = html;
    document.getElementById('stgAddOdBtn')?.addEventListener('click', () => { odEnabled = true; renderProviderBar(); refreshOdStatus(); markDirty(); });
    document.getElementById('stgAddDbBtn')?.addEventListener('click', () => { dbEnabled = true; renderProviderBar(); refreshDbStatus(); markDirty(); });
  }

  // ── OneDrive ──────────────────────────────────────────────────
  let odClientId = (settings.onedrive && settings.onedrive.clientId) || '';

  async function refreshOdStatus() {
    try { const od = await api('GET', '/api/onedrive/status'); renderOdSection(od.connected, od.displayName); }
    catch { renderOdSection(false, ''); }
  }

  function renderOdSection(connected, displayName) {
    const el = document.getElementById('stgOdSection');
    if (!el) return;
    el.innerHTML = `
      <div class="stg-section-head">${odIcon}<span class="stg-section-title">OneDrive</span><span class="provider-dot${connected ? ' connected' : ''}"></span>
        ${connected
          ? `<div class="provider-account">${IC.check}<span>${escHtml(displayName || 'Connected')}</span></div><button class="btn btn-secondary btn-sm" id="stgOdDisconnectBtn">Disconnect</button>`
          : `<button class="btn btn-primary btn-sm" id="stgOdConnectBtn">Connect</button>`}
        <button class="btn-icon" id="stgOdRemoveBtn" title="Remove OneDrive">${IC.trash}</button>
      </div>
      <div class="field">
        <div class="field-label">Client ID</div>
        <input type="text" id="stgOdClientId" class="settings-input" value="${escHtml(odClientId)}" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" autocomplete="off" spellcheck="false">
      </div>
      <div class="field">
        <div class="field-label">Backup folder name</div>
        <input type="text" id="stgOdBackupFolder" class="settings-input" value="${escHtml(odBackupFolder)}" placeholder="DoCompose Backups">
      </div>
      <details class="howto">
        <summary>How to register a free Azure App</summary>
        <ol>
          <li><a href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/CreateApplicationBlade" target="_blank" rel="noopener">portal.azure.com → App registrations → New registration</a></li>
          <li>Account types: <strong>Any org directory and personal Microsoft accounts</strong>. No redirect URI.</li>
          <li>Copy the <strong>Application (client) ID</strong> into the field above.</li>
          <li><strong>Authentication → Allow public client flows → Yes → Save.</strong></li>
          <li><strong>API permissions → Microsoft Graph → Delegated:</strong> <code>Files.ReadWrite</code>, <code>offline_access</code>, <code>User.Read</code></li>
        </ol>
      </details>
      ${connected ? '' : '<div id="stgOdFlowBox"></div>'}`;

    document.getElementById('stgOdClientId')?.addEventListener('input', (e) => { odClientId = e.target.value; markDirty(); });
    document.getElementById('stgOdBackupFolder')?.addEventListener('input', (e) => { odBackupFolder = e.target.value; markDirty(); });
    document.getElementById('stgOdRemoveBtn')?.addEventListener('click', async () => {
      if (connected) { try { await api('POST', '/api/onedrive/auth/disconnect'); } catch {} }
      odClientId = ''; odEnabled = false; renderProviderBar(); markDirty();
    });
    document.getElementById('stgOdDisconnectBtn')?.addEventListener('click', async () => {
      try { await api('POST', '/api/onedrive/auth/disconnect'); refreshOdStatus(); } catch (e) { showToast(e.message, 'error'); }
    });
    document.getElementById('stgOdConnectBtn')?.addEventListener('click', async () => {
      const flowBox = document.getElementById('stgOdFlowBox');
      const cid = document.getElementById('stgOdClientId')?.value.trim();
      if (!cid) { flowBox.innerHTML = '<p style="color:var(--danger);font-size:0.82rem;margin-top:0.5rem">Enter your Client ID first.</p>'; return; }
      odClientId = cid;
      try {
        await api('POST', '/api/settings', { onedrive: { clientId: cid, tenant: 'common' } });
        const r = await api('POST', '/api/onedrive/auth/start');
        flowBox.innerHTML = `<div class="flow-box">
          <p>Visit <a href="${escHtml(r.verificationUrl)}" target="_blank" rel="noopener"><strong>${escHtml(r.verificationUrl)}</strong></a> and enter:</p>
          <div class="flow-code">${escHtml(r.userCode)}</div>
          <p id="stgOdPollStatus">Waiting for authorisation…</p>
        </div>`;
        const deadline = Date.now() + (r.expiresIn || 900) * 1000;
        const poll = setInterval(async () => {
          if (Date.now() > deadline) { clearInterval(poll); const s = document.getElementById('stgOdPollStatus'); if (s) s.textContent = 'Code expired — click Connect again.'; return; }
          try {
            const p = await api('POST', '/api/onedrive/auth/poll');
            if (p.pending) return;
            clearInterval(poll);
            if (p.error) { const s = document.getElementById('stgOdPollStatus'); if (s) s.textContent = 'Error: ' + p.error; return; }
            await refreshOdStatus();
          } catch {}
        }, 5000);
      } catch (e) { if (flowBox) flowBox.innerHTML = `<p style="color:var(--danger);font-size:0.82rem;margin-top:0.5rem">${escHtml(e.message)}</p>`; }
    });
  }
  renderProviderBar();
  if (odEnabled) refreshOdStatus();

  // ── Dropbox ───────────────────────────────────────────────────
  let dbAppKey = (settings.dropbox && settings.dropbox.appKey) || '';
  let dbAppSecret = '';
  let dbAppSecretDirty = false;
  const dbHasSecret = !!(settings.dropbox && settings.dropbox.hasAppSecret);

  async function refreshDbStatus() {
    try { const db = await api('GET', '/api/dropbox/status'); renderDbSection(db.connected, db.displayName); }
    catch { renderDbSection(false, ''); }
  }

  function renderDbSection(connected, displayName) {
    const el = document.getElementById('stgDbSection');
    if (!el) return;
    const redirectUri = window.location.origin + '/api/dropbox/callback';
    el.innerHTML = `
      <div class="stg-section-head">${dbIcon}<span class="stg-section-title">Dropbox</span><span class="provider-dot${connected ? ' connected' : ''}"></span>
        ${connected
          ? `<div class="provider-account">${IC.check}<span>${escHtml(displayName || 'Connected')}</span></div><button class="btn btn-secondary btn-sm" id="stgDbDisconnectBtn">Disconnect</button>`
          : `<button class="btn btn-primary btn-sm" id="stgDbConnectBtn">Connect</button>`}
        <button class="btn-icon" id="stgDbRemoveBtn" title="Remove Dropbox">${IC.trash}</button>
      </div>
      <div class="field">
        <div class="field-label">App key <a class="field-link" href="https://www.dropbox.com/developers/apps" target="_blank" rel="noopener">developers.dropbox.com ↗</a></div>
        <input type="text" id="stgDbAppKey" class="settings-input" value="${escHtml(dbAppKey)}" placeholder="xxxxxxxxxxxxxxx" autocomplete="off" spellcheck="false">
      </div>
      <div class="field">
        <div class="field-label">App secret</div>
        <input type="password" id="stgDbAppSecret" class="settings-input" placeholder="${dbHasSecret ? '(saved — enter to change)' : '••••••••••••••'}" autocomplete="new-password">
      </div>
      <div class="field">
        <div class="field-label">Backup folder name</div>
        <input type="text" id="stgDbBackupFolder" class="settings-input" value="${escHtml(dbBackupFolder)}" placeholder="DoCompose Backups">
      </div>
      <div class="field">
        <div class="field-label">Redirect URI <span class="field-hint" style="font-weight:400">add to your app's OAuth 2 settings</span></div>
        <div class="code-row"><code>${escHtml(redirectUri)}</code><button class="btn btn-secondary btn-sm" id="stgDbCopyUri" type="button" style="flex-shrink:0">Copy</button></div>
      </div>`;

    document.getElementById('stgDbAppKey')?.addEventListener('input', (e) => { dbAppKey = e.target.value; markDirty(); });
    document.getElementById('stgDbAppSecret')?.addEventListener('input', (e) => { dbAppSecret = e.target.value; dbAppSecretDirty = true; markDirty(); });
    document.getElementById('stgDbBackupFolder')?.addEventListener('input', (e) => { dbBackupFolder = e.target.value; markDirty(); });
    document.getElementById('stgDbRemoveBtn')?.addEventListener('click', async () => {
      if (connected) { try { await api('POST', '/api/dropbox/auth/disconnect'); } catch {} }
      dbAppKey = ''; dbEnabled = false; renderProviderBar(); markDirty();
    });
    document.getElementById('stgDbCopyUri')?.addEventListener('click', () => {
      navigator.clipboard.writeText(redirectUri).then(() => {
        const btn = document.getElementById('stgDbCopyUri');
        if (btn) { btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = 'Copy'; }, 2000); }
      });
    });
    document.getElementById('stgDbDisconnectBtn')?.addEventListener('click', async () => {
      try { await api('POST', '/api/dropbox/auth/disconnect'); refreshDbStatus(); } catch (e) { showToast(e.message, 'error'); }
    });
    document.getElementById('stgDbConnectBtn')?.addEventListener('click', async () => {
      const key = document.getElementById('stgDbAppKey')?.value.trim();
      const secret = document.getElementById('stgDbAppSecret')?.value.trim();
      if (!key || (!secret && !dbHasSecret)) { showToast('Enter App key and App secret first.', 'error'); return; }
      dbAppKey = key;
      try {
        const payloadDb = { appKey: key };
        if (secret) payloadDb.appSecret = secret;
        await api('POST', '/api/settings', { dropbox: payloadDb });
        const { url } = await api('GET', `/api/dropbox/auth/url?redirectUri=${encodeURIComponent(redirectUri)}`);
        window.open(url, 'dropbox-auth', 'width=600,height=700');
        const handler = (e) => {
          if (e.origin !== window.location.origin) return;
          if (e.data === 'dropbox-auth-ok') { window.removeEventListener('message', handler); refreshDbStatus(); }
          else if (typeof e.data === 'string' && e.data.startsWith('dropbox-auth-error:')) {
            window.removeEventListener('message', handler);
            showToast('Dropbox auth failed: ' + e.data.replace('dropbox-auth-error:', ''), 'error');
          }
        };
        window.addEventListener('message', handler);
      } catch (e) { showToast('Error: ' + e.message, 'error'); }
    });
  }
  if (dbEnabled) refreshDbStatus();

  // ── File browser modal ────────────────────────────────────────
  function openFileBrowser(jobIdx) {
    let currentPath = '/';
    let selectedPath = null;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay fb-overlay';
    overlay.innerHTML = `
      <div class="modal fb-modal">
        <div class="modal-header"><span class="modal-title">Browse folders</span>
          <button class="btn-icon fb-close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div class="fb-path"><span id="fbCurrentPath">/</span></div>
        <div class="fb-list" id="fbList"><div class="loading"><div class="spinner"></div> Loading…</div></div>
        <div class="modal-footer">
          <span class="fb-selected" id="fbSelected" style="flex:1;font-size:0.83rem;color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">No folder selected</span>
          <button class="btn btn-secondary btn-sm" id="fbAddThisBtn" disabled>Add Folder</button>
          <button class="btn btn-primary btn-sm" id="fbDoneBtn">Done</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    async function navigate(path) {
      currentPath = path;
      document.getElementById('fbCurrentPath').textContent = path;
      const listEl = document.getElementById('fbList');
      listEl.innerHTML = '<div class="loading"><div class="spinner"></div> Loading…</div>';
      try {
        const data = await api('GET', `/api/files/browse?path=${encodeURIComponent(path)}`);
        const dirs = data.entries.filter((e) => e.isDir);
        const files = data.entries.filter((e) => !e.isDir);
        let html = '';
        if (path !== '/') {
          const parent = path.replace(/\/[^/]+\/?$/, '') || '/';
          html += `<div class="fb-entry fb-up" data-path="${escHtml(parent)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg> ..</div>`;
        }
        for (const e of dirs) html += `<div class="fb-entry fb-dir" data-path="${escHtml(e.path)}">${IC.folder}${escHtml(e.name)}</div>`;
        for (const e of files) html += `<div class="fb-entry fb-file" data-path="${escHtml(e.path)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>${escHtml(e.name)}</div>`;
        if (!html) html = '<div class="loading">Empty directory</div>';
        listEl.innerHTML = html;

        listEl.querySelectorAll('.fb-dir, .fb-up').forEach((el) => el.addEventListener('dblclick', () => navigate(el.dataset.path)));
        listEl.querySelectorAll('.fb-entry').forEach((el) => {
          el.addEventListener('click', () => {
            listEl.querySelectorAll('.fb-entry').forEach((e) => e.classList.remove('selected'));
            el.classList.add('selected');
            selectedPath = el.dataset.path;
            const selEl = document.getElementById('fbSelected'); if (selEl) selEl.textContent = selectedPath;
            const addBtn = document.getElementById('fbAddThisBtn'); if (addBtn) addBtn.disabled = false;
          });
        });
        listEl.querySelectorAll('.fb-dir, .fb-up').forEach((el) => {
          el.addEventListener('click', () => { /* single-click selects (handled above); dbl navigates */ });
        });
      } catch (e) {
        listEl.innerHTML = `<div class="loading" style="color:var(--danger)">${escHtml(e.message)}</div>`;
      }
    }

    function addPathToJob(idx, p) {
      if (!p) return;
      if (!backupJobs[idx].paths) backupJobs[idx].paths = [];
      if (!backupJobs[idx].paths.includes(p)) {
        backupJobs[idx].paths.push(p);
        markDirty();
        const ta = document.querySelector(`.bj-paths[data-idx="${idx}"]`);
        if (ta) ta.value = backupJobs[idx].paths.join('\n');
      }
    }

    overlay.querySelector('.fb-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.getElementById('fbAddThisBtn').addEventListener('click', () => addPathToJob(jobIdx, selectedPath || currentPath));
    document.getElementById('fbDoneBtn').addEventListener('click', () => { if (selectedPath) addPathToJob(jobIdx, selectedPath); overlay.remove(); });

    navigate('/compose').catch(() => navigate('/'));
  }

  const SCHEDULE_PRESETS = [
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Daily 2am', value: '0 2 * * *' },
    { label: 'Weekly Sun', value: '0 2 * * 0' },
  ];

  function renderBackupJobs() {
    const list = document.getElementById('stgBackupJobsList');
    if (!list) return;
    if (!backupJobs.length) {
      list.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><p>No backup jobs yet. Click <strong>Add Job</strong> to schedule your first backup.</p></div>`;
      return;
    }
    const containers = (DC.services || []).map((s) => s.name);
    list.innerHTML = backupJobs.map((job, idx) => {
      const isOk = job.lastStatus && job.lastStatus.startsWith('ok');
      const isErr = job.lastStatus && !isOk;
      const statusDetail = job.lastStatus ? job.lastStatus.replace(/^ok\s*/i, '').replace(/^error:\s*/i, '') : '';
      const runTime = job.lastRun ? new Date(job.lastRun).toLocaleString() : '';
      const statusTxt = !job.lastStatus ? 'Never run' : isOk ? `${runTime} — OK ${statusDetail}` : `Error: ${statusDetail}`;
      const dotCls = isOk ? 'ok' : isErr ? 'err' : '';
      const statusTextCls = isOk ? 'ok' : isErr ? 'err' : '';
      const dest = job.destination === 'dropbox' ? 'Dropbox' : 'OneDrive';
      const schedLabel = job.schedule || 'no schedule';
      const containerLabel = job.containerName || 'no container';
      return `
      <div class="card backup-job-card" data-idx="${idx}">
        <div class="job-summary">
          <label class="toggle" onclick="event.stopPropagation()">
            <input type="checkbox" class="bj-enabled" data-idx="${idx}" ${job.enabled ? 'checked' : ''}>
            <span class="toggle-track"><span class="toggle-thumb"></span></span>
          </label>
          <input type="text" class="job-label-input bj-label" data-idx="${idx}" value="${escHtml(job.label || '')}" placeholder="Untitled job" onclick="event.stopPropagation()">
          <div class="job-meta">
            <span class="job-dest">${dest}</span>
            <span class="bj-meta-container">${escHtml(containerLabel)}</span>
            <span>·</span>
            <span class="bj-meta-sched">${escHtml(schedLabel)}</span>
            <span class="job-status-dot ${dotCls}" title="${escHtml(statusTxt)}"></span>
          </div>
          <button class="job-expand bj-expand-btn" data-idx="${idx}" title="Edit">${IC.chevron}</button>
        </div>
        <div class="job-body bj-body-inner" hidden>
          <div class="field"><div class="field-label">Destination</div>
            <select class="settings-select bj-destination" data-idx="${idx}">
              <option value="onedrive" ${(job.destination || 'onedrive') === 'onedrive' ? 'selected' : ''}>OneDrive</option>
              <option value="dropbox" ${job.destination === 'dropbox' ? 'selected' : ''}>Dropbox</option>
            </select>
          </div>
          <div class="field"><div class="field-label">Container</div>
            <select class="settings-select bj-container" data-idx="${idx}">
              <option value="">— select —</option>
              ${containers.map((n) => `<option value="${escHtml(n)}" ${job.containerName === n ? 'selected' : ''}>${escHtml(n)}</option>`).join('')}
            </select>
          </div>
          <div class="field span2"><div class="field-label">Schedule</div>
            <input type="text" class="settings-input bj-schedule" data-idx="${idx}" value="${escHtml(job.schedule || '')}" placeholder="cron expression, e.g. 0 2 * * *" style="font-family:var(--font-mono)">
            <div class="job-presets">${SCHEDULE_PRESETS.map((p) => `<button class="job-preset bj-preset-btn" type="button" data-idx="${idx}" data-cron="${escHtml(p.value)}">${escHtml(p.label)}</button>`).join('')}</div>
          </div>
          <div class="field span2"><div class="field-label">Paths to back up</div>
            <div class="paths-wrap">
              <textarea class="settings-input textarea bj-paths" data-idx="${idx}" rows="3" placeholder="One path per line, e.g. /compose/config/myapp">${escHtml((job.paths || []).join('\n'))}</textarea>
              <button class="btn btn-secondary btn-sm bj-browse" type="button" data-idx="${idx}" style="align-self:flex-start">${IC.folder}Browse</button>
            </div>
          </div>
          <div class="field"><div class="field-label">Keep snapshots</div>
            <input type="number" class="settings-input bj-keep" data-idx="${idx}" value="${job.keepCount || 10}" min="1" max="365" style="max-width:110px">
          </div>
          <div class="job-foot">
            <span class="job-status-text ${statusTextCls}">${escHtml(statusTxt)}</span>
            <div style="display:flex;gap:0.5rem;flex-shrink:0">
              <button class="btn btn-danger btn-sm bj-delete" data-idx="${idx}">Delete</button>
              <button class="btn btn-secondary btn-sm bj-run-now" data-idx="${idx}" data-jobid="${escHtml(job.id)}">Run Now</button>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');

    list.querySelectorAll('.bj-expand-btn').forEach((btn) => btn.addEventListener('click', () => {
      const card = btn.closest('.backup-job-card');
      const body = card.querySelector('.bj-body-inner');
      const open = !body.hidden;
      body.hidden = open;
      btn.classList.toggle('open', !open);
    }));
    // Auto-expand a freshly-added job
    const cards = list.querySelectorAll('.backup-job-card');
    const lastJob = backupJobs[backupJobs.length - 1];
    if (lastJob && !lastJob.label && !lastJob.containerName) {
      const lastBody = cards[cards.length - 1]?.querySelector('.bj-body-inner');
      const lastBtn = cards[cards.length - 1]?.querySelector('.bj-expand-btn');
      if (lastBody) { lastBody.hidden = false; lastBtn?.classList.add('open'); }
    }

    list.querySelectorAll('.bj-enabled').forEach((cb) => cb.addEventListener('change', (e) => { backupJobs[+e.target.dataset.idx].enabled = e.target.checked; markDirty(); }));
    list.querySelectorAll('.bj-label').forEach((el) => el.addEventListener('input', (e) => { backupJobs[+e.target.dataset.idx].label = e.target.value; markDirty(); }));
    list.querySelectorAll('.bj-destination').forEach((el) => el.addEventListener('change', (e) => {
      const idx = +e.target.dataset.idx; backupJobs[idx].destination = e.target.value;
      const badge = e.target.closest('.backup-job-card')?.querySelector('.job-dest');
      if (badge) badge.textContent = e.target.value === 'dropbox' ? 'Dropbox' : 'OneDrive';
      markDirty();
    }));
    list.querySelectorAll('.bj-container').forEach((el) => el.addEventListener('change', (e) => {
      const idx = +e.target.dataset.idx; backupJobs[idx].containerName = e.target.value;
      const meta = e.target.closest('.backup-job-card')?.querySelector('.bj-meta-container');
      if (meta) meta.textContent = e.target.value || 'no container';
      markDirty();
    }));
    list.querySelectorAll('.bj-paths').forEach((el) => el.addEventListener('input', (e) => {
      backupJobs[+e.target.dataset.idx].paths = e.target.value.split('\n').map((l) => l.trim()).filter(Boolean);
      markDirty();
    }));
    list.querySelectorAll('.bj-preset-btn').forEach((btn) => btn.addEventListener('click', () => {
      const idx = +btn.dataset.idx; backupJobs[idx].schedule = btn.dataset.cron;
      const inp = list.querySelector(`.bj-schedule[data-idx="${idx}"]`); if (inp) inp.value = btn.dataset.cron;
      const meta = btn.closest('.backup-job-card')?.querySelector('.bj-meta-sched'); if (meta) meta.textContent = btn.dataset.cron;
      markDirty();
    }));
    list.querySelectorAll('.bj-schedule').forEach((el) => el.addEventListener('input', (e) => {
      const idx = +e.target.dataset.idx; backupJobs[idx].schedule = e.target.value;
      const meta = e.target.closest('.backup-job-card')?.querySelector('.bj-meta-sched'); if (meta) meta.textContent = e.target.value || 'no schedule';
      markDirty();
    }));
    list.querySelectorAll('.bj-keep').forEach((el) => el.addEventListener('change', (e) => { backupJobs[+e.target.dataset.idx].keepCount = +e.target.value || 10; markDirty(); }));
    list.querySelectorAll('.bj-delete').forEach((btn) => btn.addEventListener('click', () => { backupJobs.splice(+btn.dataset.idx, 1); renderBackupJobs(); markDirty(); }));
    list.querySelectorAll('.bj-browse').forEach((btn) => btn.addEventListener('click', () => openFileBrowser(+btn.dataset.idx)));
    list.querySelectorAll('.bj-run-now').forEach((btn) => btn.addEventListener('click', async () => {
      const jobId = btn.dataset.jobid;
      btn.disabled = true; btn.textContent = 'Running…';
      try {
        const dest = backupJobs.find((j) => j.id === jobId)?.destination || 'onedrive';
        const endpoint = dest === 'dropbox' ? `/api/dropbox/backup/${jobId}` : `/api/onedrive/backup/${jobId}`;
        await api('POST', endpoint);
        const s = await api('GET', '/api/settings');
        const idx = backupJobs.findIndex((j) => j.id === jobId);
        const updated = (s.backupJobs || []).find((j) => j.id === jobId);
        if (updated && idx !== -1) { backupJobs[idx].lastRun = updated.lastRun; backupJobs[idx].lastStatus = updated.lastStatus; }
        renderBackupJobs();
      } catch (e) {
        btn.disabled = false; btn.textContent = 'Run Now';
        showToast('Backup failed: ' + e.message, 'error');
      }
    }));
  }
  renderBackupJobs();

  document.getElementById('stgAddBackupJobBtn')?.addEventListener('click', () => {
    backupJobs.push({ id: 'job-' + Date.now(), label: '', containerName: '', paths: [], schedule: '0 2 * * *', keepCount: 10, enabled: true });
    renderBackupJobs();
    markDirty();
    document.getElementById('stgBackupJobsList')?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  // ── Save ──────────────────────────────────────────────────────
  saveBtn.addEventListener('click', async () => {
    const setSt = (msg, ok) => {
      const el = document.getElementById('stgSaveStatus');
      if (el) { el.textContent = msg; el.className = 'stg-save-status' + (ok === false ? ' err' : ok ? ' ok' : ''); }
    };
    setSt('Saving…');
    try {
      const finalRegistries = registries.map((r) => {
        const out = { name: r.name || r.server || 'Docker Hub', server: r.server || '', username: r.username || '', enabled: r.enabled !== false };
        if (r._newPass) out.password = r._newPass;
        else if (r.hasPassword) out.keepPassword = true;
        return out;
      });

      const selectedTheme = document.querySelector('.theme-btn.active')?.dataset.theme || 'dark';
      const dropboxPayload = { appKey: dbAppKey };
      if (dbAppSecretDirty && dbAppSecret) dropboxPayload.appSecret = dbAppSecret;

      const payload = {
        updateIntervalSeconds: parseInt(document.getElementById('stgUpdateInterval').value, 10),
        registries: finalRegistries,
        excludedFromUpdates: Array.from(excluded),
        theme: selectedTheme,
        timezone: document.getElementById('stgTimezone').value,
        timeFormat: document.getElementById('stgTimeFormat').value,
        backupJobs,
        onedrive: { clientId: odClientId, backupFolderPath: odBackupFolder },
        dropbox: Object.assign(dropboxPayload, { backupFolderPath: dbBackupFolder }),
      };
      await api('POST', '/api/settings', payload);
      DC.settings = Object.assign({}, DC.settings, {
        updateIntervalSeconds: payload.updateIntervalSeconds,
        excludedFromUpdates: payload.excludedFromUpdates,
        theme: selectedTheme, timezone: payload.timezone, timeFormat: payload.timeFormat,
      });
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
