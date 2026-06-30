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
        <button class="stg-tab" data-tab="backups">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Backups
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

        <!-- Backups -->
        <div class="stg-pane" id="stgPaneBackups">
          <h2 class="stg-pane-title">Backups</h2>

          <div class="settings-section">
            <div class="settings-section-label">OneDrive</div>
            <div id="stgOdSection"><div class="settings-loading">Loading…</div></div>
          </div>

          <div class="settings-section" style="margin-top:1.5rem">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem">
              <div class="settings-section-label" style="margin-bottom:0">Backup Jobs</div>
              <button class="btn btn-primary btn-sm" id="stgAddBackupJobBtn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Job
              </button>
            </div>
            <div id="stgBackupJobsList"></div>
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

  // ── Backups tab ───────────────────────────────────────────────
  let backupJobs = (settings.backupJobs || []).map((j) => Object.assign({}, j));

  async function refreshOdStatus() {
    try {
      const od = await api('GET', '/api/onedrive/status');
      renderOdSection(od.connected, od.displayName);
    } catch {
      renderOdSection(false, '');
    }
  }

  function renderOdSection(connected, displayName) {
    const el = document.getElementById('stgOdSection');
    if (!el) return;
    if (connected) {
      const savedFolder = settings.onedriveFolderPath || '/DoCompose Backups';
      el.innerHTML = `
        <div class="settings-group">
          <div class="settings-row">
            <div class="settings-label"><span>Account</span></div>
            <div class="settings-control" style="display:flex;align-items:center;gap:0.75rem">
              <span style="flex:1;font-size:0.9rem">${escHtml(displayName || 'Connected')}</span>
              <button class="btn btn-secondary btn-sm" id="stgOdDisconnectBtn">Disconnect</button>
            </div>
          </div>
          <div class="settings-row">
            <div class="settings-label"><span>Backup folder</span><span class="settings-hint">Path in your OneDrive root</span></div>
            <div class="settings-control">
              <input type="text" id="stgOdFolderPath" class="settings-input" value="${escHtml(savedFolder)}" placeholder="/DoCompose Backups">
            </div>
          </div>
        </div>`;
      document.getElementById('stgOdFolderPath')?.addEventListener('input', markDirty);
      document.getElementById('stgOdDisconnectBtn')?.addEventListener('click', async () => {
        try {
          await api('POST', '/api/onedrive/auth/disconnect');
          refreshOdStatus();
        } catch (e) { alert('Error: ' + e.message); }
      });
    } else {
      el.innerHTML = `
        <div class="settings-group">
          <div class="settings-row">
            <div class="settings-label"><span>OneDrive account</span><span class="settings-hint">No Azure setup required.</span></div>
            <div class="settings-control">
              <button class="btn btn-primary btn-sm" id="stgOdConnectBtn">Connect OneDrive</button>
            </div>
          </div>
          <div id="stgOdFlowBox"></div>
        </div>`;
      document.getElementById('stgOdConnectBtn')?.addEventListener('click', async () => {
        const flowBox = document.getElementById('stgOdFlowBox');
        try {
          const r = await api('POST', '/api/onedrive/auth/start');
          flowBox.innerHTML = `
            <div class="od-device-flow-box">
              <p>Visit <strong><a href="${escHtml(r.verificationUrl)}" target="_blank" rel="noopener">${escHtml(r.verificationUrl)}</a></strong> and enter this code:</p>
              <div class="od-code">${escHtml(r.userCode)}</div>
              <p id="stgOdPollStatus">Waiting for authorisation…</p>
            </div>`;
          const deadline = Date.now() + (r.expiresIn || 900) * 1000;
          const poll = setInterval(async () => {
            if (Date.now() > deadline) { clearInterval(poll); document.getElementById('stgOdPollStatus').textContent = 'Code expired — click Connect again.'; return; }
            try {
              const p = await api('POST', '/api/onedrive/auth/poll');
              if (p.pending) return;
              clearInterval(poll);
              if (p.error) { document.getElementById('stgOdPollStatus').textContent = 'Error: ' + p.error; return; }
              await refreshOdStatus();
            } catch {}
          }, 5000);
        } catch (e) { if (flowBox) flowBox.innerHTML = `<p style="color:var(--danger)">${escHtml(e.message)}</p>`; }
      });
    }
  }

  refreshOdStatus();

  const SCHEDULE_PRESETS = [
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Daily 2am', value: '0 2 * * *' },
    { label: 'Weekly Sun', value: '0 2 * * 0' },
  ];

  function renderBackupJobs() {
    const list = document.getElementById('stgBackupJobsList');
    if (!list) return;
    if (!backupJobs.length) {
      list.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:1.5rem;font-size:0.9rem">No backup jobs. Click "Add Job" to create one.</div>';
      return;
    }
    const containers = (DC.services || []).map((s) => s.name);
    list.innerHTML = backupJobs.map((job, idx) => {
      const statusCls = job.lastStatus === 'ok' ? 'backup-status-ok' : job.lastStatus ? 'backup-status-err' : '';
      const statusTxt = job.lastStatus ? (job.lastStatus === 'ok' ? `Last run: ${job.lastRun ? new Date(job.lastRun).toLocaleString() : 'unknown'} — OK` : `Error: ${job.lastStatus.replace(/^error:\s*/i, '')}`) : 'Never run';
      return `
      <div class="backup-job-card">
        <div class="backup-job-header">
          <label class="toggle-switch" title="${job.enabled ? 'Enabled' : 'Disabled'}">
            <input type="checkbox" class="bj-enabled" data-idx="${idx}" ${job.enabled ? 'checked' : ''}>
            <span class="toggle-track"><span class="toggle-thumb"></span></span>
          </label>
          <input type="text" class="backup-job-label-input bj-label" data-idx="${idx}" value="${escHtml(job.label || '')}" placeholder="Job label">
          <button class="btn-icon bj-delete" data-idx="${idx}" title="Remove job" style="margin-left:auto">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
        <div class="backup-job-body">
          <div class="backup-job-row">
            <label>Container</label>
            <select class="settings-select bj-container" data-idx="${idx}">
              <option value="">— select —</option>
              ${containers.map((n) => `<option value="${escHtml(n)}" ${job.containerName === n ? 'selected' : ''}>${escHtml(n)}</option>`).join('')}
            </select>
          </div>
          <div class="backup-job-row">
            <label>Paths</label>
            <textarea class="settings-input bj-paths" data-idx="${idx}" placeholder="One path per line e.g. /compose/config/prometheus">${escHtml((job.paths || []).join('\n'))}</textarea>
          </div>
          <div class="backup-job-row">
            <label>Schedule</label>
            <div>
              <div class="schedule-presets">
                ${SCHEDULE_PRESETS.map((p) => `<button class="schedule-preset-btn" type="button" data-idx="${idx}" data-cron="${escHtml(p.value)}">${escHtml(p.label)}</button>`).join('')}
              </div>
              <input type="text" class="settings-input bj-schedule" data-idx="${idx}" value="${escHtml(job.schedule || '')}" placeholder="cron e.g. 0 2 * * *" style="font-family:monospace">
            </div>
          </div>
          <div class="backup-job-row">
            <label>Keep copies</label>
            <input type="number" class="settings-input bj-keep" data-idx="${idx}" value="${job.keepCount || 10}" min="1" max="365" style="max-width:80px">
          </div>
        </div>
        <div class="backup-job-footer">
          <span class="backup-job-status ${statusCls}">${escHtml(statusTxt)}</span>
          <button class="btn btn-secondary btn-sm bj-run-now" data-idx="${idx}" data-jobid="${escHtml(job.id)}">Run Now</button>
        </div>
      </div>`;
    }).join('');

    list.querySelectorAll('.bj-enabled').forEach((cb) => {
      cb.addEventListener('change', (e) => { backupJobs[+e.target.dataset.idx].enabled = e.target.checked; markDirty(); });
    });
    list.querySelectorAll('.bj-label').forEach((el) => {
      el.addEventListener('input', (e) => { backupJobs[+e.target.dataset.idx].label = e.target.value; markDirty(); });
    });
    list.querySelectorAll('.bj-container').forEach((el) => {
      el.addEventListener('change', (e) => { backupJobs[+e.target.dataset.idx].containerName = e.target.value; markDirty(); });
    });
    list.querySelectorAll('.bj-paths').forEach((el) => {
      el.addEventListener('input', (e) => {
        backupJobs[+e.target.dataset.idx].paths = e.target.value.split('\n').map((l) => l.trim()).filter(Boolean);
        markDirty();
      });
    });
    list.querySelectorAll('.schedule-preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = +btn.dataset.idx;
        backupJobs[idx].schedule = btn.dataset.cron;
        const inp = list.querySelector(`.bj-schedule[data-idx="${idx}"]`);
        if (inp) inp.value = btn.dataset.cron;
        markDirty();
      });
    });
    list.querySelectorAll('.bj-schedule').forEach((el) => {
      el.addEventListener('input', (e) => { backupJobs[+e.target.dataset.idx].schedule = e.target.value; markDirty(); });
    });
    list.querySelectorAll('.bj-keep').forEach((el) => {
      el.addEventListener('change', (e) => { backupJobs[+e.target.dataset.idx].keepCount = +e.target.value || 10; markDirty(); });
    });
    list.querySelectorAll('.bj-delete').forEach((btn) => {
      btn.addEventListener('click', () => { backupJobs.splice(+btn.dataset.idx, 1); renderBackupJobs(); markDirty(); });
    });
    list.querySelectorAll('.bj-run-now').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const jobId = btn.dataset.jobid;
        btn.disabled = true;
        btn.textContent = 'Running…';
        try {
          await api('POST', `/api/onedrive/backup/${jobId}`);
          const s = await api('GET', '/api/settings');
          const idx = backupJobs.findIndex((j) => j.id === jobId);
          const updated = (s.backupJobs || []).find((j) => j.id === jobId);
          if (updated && idx !== -1) { backupJobs[idx].lastRun = updated.lastRun; backupJobs[idx].lastStatus = updated.lastStatus; }
          renderBackupJobs();
        } catch (e) {
          btn.disabled = false;
          btn.textContent = 'Run Now';
          alert('Backup failed: ' + e.message);
        }
      });
    });
  }

  renderBackupJobs();

  document.getElementById('stgAddBackupJobBtn')?.addEventListener('click', () => {
    backupJobs.push({ id: 'job-' + Date.now(), label: '', containerName: '', paths: [], schedule: '0 2 * * *', keepCount: 10, enabled: true });
    renderBackupJobs();
    markDirty();
    document.getElementById('stgBackupJobsList')?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

      const folderPathEl = document.getElementById('stgOdFolderPath');
      const payload = {
        updateIntervalSeconds: parseInt(document.getElementById('stgUpdateInterval').value, 10),
        registries: finalRegistries,
        excludedFromUpdates: Array.from(excluded),
        theme: selectedTheme,
        timezone: document.getElementById('stgTimezone').value,
        timeFormat: document.getElementById('stgTimeFormat').value,
        backupJobs,
        onedriveFolderPath: folderPathEl ? folderPathEl.value.trim() || '/DoCompose Backups' : (settings.onedriveFolderPath || '/DoCompose Backups'),
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
