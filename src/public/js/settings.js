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
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
};

async function settingsInit() {
  const c = document.getElementById('view-settings');
  if (!c) return;

  c.innerHTML = `
    <div class="stg-layout">
      <nav class="stg-sidebar">
        <button class="stg-tab active" data-tab="general">${IC.paint}General</button>
        <button class="stg-tab" data-tab="registry"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Registries</button>
        <button class="stg-tab" data-tab="updates">${IC.refresh}Updates</button>
        <button class="stg-tab" data-tab="excluded">${IC.block}Exclusions</button>
        <button class="stg-tab" data-tab="backups">${IC.jobs}Backups</button>
      </nav>

      <div class="stg-content">
        <!-- GENERAL -->
        <div class="stg-pane active" id="stgPaneGeneral">
          <div class="pane-head">
            <div class="pane-title">General</div>
            <div class="pane-subtitle">Appearance, timezone and time format</div>
          </div>
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

          </div>
        </div>

        <!-- UPDATES -->
        <div class="stg-pane" id="stgPaneUpdates">
          <div class="pane-head">
            <div class="pane-title">Updates</div>
            <div class="pane-subtitle">Automatic update checks and scheduled container updates</div>
          </div>
          <div class="stg-section-list">
            <div class="stg-section">
              <div class="stg-section-title">Update Checks</div>
              <div class="field">
                <div class="field-label">Check interval</div>
                <select id="stgUpdateInterval" class="settings-select">
                  <option value="0">Disabled (manual only)</option>
                  <option value="3600">Every hour</option>
                  <option value="21600">Every 6 hours</option>
                  <option value="43200">Every 12 hours</option>
                  <option value="86400">Every 24 hours</option>
                  <option value="259200">Every 3 days</option>
                  <option value="604800">Every week</option>
                  <option value="2592000">Every month</option>
                </select>
              </div>
            </div>
            <div class="stg-section">
              <div class="stg-section-title">Scheduled Updates</div>
              <div id="stgUpdateSchedulesList" class="stg-stack"></div>
              <button class="btn btn-primary btn-sm stg-add-btn" id="stgAddUpdateScheduleBtn">${IC.plus}Add Schedule</button>
            </div>
          </div>
        </div>

        <!-- REGISTRIES -->
        <div class="stg-pane" id="stgPaneRegistry">
          <div class="pane-head">
            <div class="pane-title">Registries</div>
            <div class="pane-subtitle">Credentials for private container registries</div>
            <div class="pane-head-actions"><button class="btn btn-primary btn-sm" id="stgAddRegistryBtn">${IC.plus}Add Registry</button></div>
          </div>
          <div class="stg-section-list" id="stgRegistryList"></div>
        </div>

        <!-- EXCLUSIONS -->
        <div class="stg-pane" id="stgPaneExcluded">
          <div class="pane-head">
            <div class="pane-title">Exclusions</div>
            <div class="pane-subtitle">Services skipped during update checks and auto-pulls</div>
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
            <div class="pane-subtitle">Schedule automatic backups of your Compose data to the cloud</div>
            <div class="pane-head-actions" id="stgAddProviderBar"></div>
          </div>
          <div class="stg-section-list">
            <div class="stg-section" id="stgOdSection" style="display:none"><div class="loading"><div class="spinner"></div> Loading…</div></div>
            <div class="stg-section" id="stgDbSection" style="display:none"><div class="loading"><div class="spinner"></div> Loading…</div></div>
            <div class="stg-section" id="stgNoProviderHint">
              <div class="stg-empty">No backup providers configured. Use the buttons above to add OneDrive or Dropbox.</div>
            </div>
            <div class="stg-section">
              <div class="stg-section-title">Backup Jobs</div>
              <div id="stgBackupJobsList" class="stg-stack"></div>
              <button class="btn btn-primary btn-sm stg-add-btn" id="stgAddBackupJobBtn">${IC.plus}Add Job</button>
            </div>
          </div>
        </div>
        <div id="bjModalOverlay" class="modal-overlay"></div>

        <div class="stg-footer">
          <button class="btn btn-primary" id="stgSaveBtn" disabled>${IC.save}Save Changes</button>
          <button class="btn btn-secondary" id="stgDiscardBtn" disabled>Discard Changes</button>
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
  const discardBtn = document.getElementById('stgDiscardBtn');
  // Snapshots of the original loaded values for revert detection.
  // Scalar fields captured now; arrays/objects referenced via closure at call time.
  const _origTheme    = settings.theme || 'dark';
  const _origTz       = settings.timezone || '';
  const _origTf       = settings.timeFormat || '24';
  const _origInterval = String(settings.updateIntervalSeconds ?? '');
  const _origOdId     = (settings.onedrive || {}).clientId || '';
  const _origOdTenant = (settings.onedrive || {}).tenant || '';
  const _origOdFolder = (settings.onedrive || {}).backupFolderPath || '';
  const _origDbKey    = (settings.dropbox || {}).appKey || '';
  const _origDbFolder = (settings.dropbox || {}).backupFolderPath || '';
  const _origSchedules = JSON.stringify(settings.updateSchedules || []);
  const _origJobs      = JSON.stringify(settings.backupJobs || []);
  const _origRegistries = JSON.stringify((settings.registries || []).map(
    (r) => ({ name: r.name || '', server: r.server || '', username: r.username || '', enabled: r.enabled !== false })
  ));
  const _origExcluded = JSON.stringify([...(settings.excludedFromUpdates || [])].sort());

  function checkDirty() {
    const curTheme = document.querySelector('.theme-btn.active')?.dataset.theme || 'dark';
    const curTz    = document.getElementById('stgTimezone')?.value ?? '';
    const curTf    = document.getElementById('stgTimeFormat')?.value ?? '';
    const curInt   = document.getElementById('stgUpdateInterval')?.value ?? '';
    // registries/excluded may not be declared yet when checkDirty is first wired up,
    // but it's only ever *called* from event handlers that fire after full init.
    const curSchedules  = JSON.stringify(typeof updateSchedules !== 'undefined' ? updateSchedules : []);
    const curJobs       = JSON.stringify(typeof backupJobs !== 'undefined' ? backupJobs : []);
    const curRegistries = JSON.stringify(typeof registries !== 'undefined' ? registries.map(
      (r) => ({ name: r.name || '', server: r.server || '', username: r.username || '', enabled: r.enabled !== false })
    ) : []);
    const curExcluded = JSON.stringify(typeof excluded !== 'undefined' ? [...excluded].sort() : []);
    const curOdId     = typeof odClientId !== 'undefined' ? odClientId : '';
    const curOdTenant = typeof odTenant   !== 'undefined' ? odTenant   : '';
    const curOdFolder = typeof odBackupFolder !== 'undefined' ? odBackupFolder : '';
    const curDbKey    = typeof dbAppKey   !== 'undefined' ? dbAppKey   : '';
    const curDbFolder = typeof dbBackupFolder !== 'undefined' ? dbBackupFolder : '';

    const clean = curTheme === _origTheme && curTz === _origTz && curTf === _origTf &&
      curInt === _origInterval && curSchedules === _origSchedules && curJobs === _origJobs &&
      curRegistries === _origRegistries && curExcluded === _origExcluded &&
      curOdId === _origOdId && curOdTenant === _origOdTenant && curOdFolder === _origOdFolder &&
      curDbKey === _origDbKey && curDbFolder === _origDbFolder;
    saveBtn.disabled = clean;
    discardBtn.disabled = clean;
  }
  function markDirty() { checkDirty(); }
  function markClean() { saveBtn.disabled = true; discardBtn.disabled = true; }

  discardBtn.addEventListener('click', () => {
    const tab = stgCurrentTab;
    settingsInit().then(() => {
      const btn = document.querySelector(`.stg-tab[data-tab="${tab}"]`);
      if (btn) btn.click();
    });
  });

  // ── General tab ──────────────────────────────────────────────
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

  // ── Updates tab ──────────────────────────────────────────────
  const intEl = document.getElementById('stgUpdateInterval');
  if (intEl && settings.updateIntervalSeconds !== undefined) intEl.value = String(settings.updateIntervalSeconds);
  if (intEl) intEl.addEventListener('change', markDirty);

  let updateSchedules = (settings.updateSchedules || []).map((j) => Object.assign({}, j));
  const allServices = DC.services || [];

  const FREQ_LABELS = {
    once: 'Once',
    hourly: 'Every hour',
    every6h: 'Every 6 hours',
    every12h: 'Every 12 hours',
    daily: 'Daily',
    weekly: 'Weekly',
  };
  const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function scheduleDescription(entry) {
    const h = String(entry.hour || 0).padStart(2, '0');
    const m = String(entry.minute || 0).padStart(2, '0');
    const timeStr = `${h}:${m}`;
    switch (entry.frequency) {
      case 'once':     return `Once at ${timeStr}`;
      case 'hourly':   return `Every hour`;
      case 'every6h':  return `Every 6 hours`;
      case 'every12h': return `Every 12 hours`;
      case 'daily':    return `Daily at ${timeStr}`;
      case 'weekly':   return `Weekly on ${WEEKDAY_NAMES[entry.weekday || 0]} at ${timeStr}`;
      default: return '—';
    }
  }

  function renderUpdateSchedules() {
    const list = document.getElementById('stgUpdateSchedulesList');
    if (!list) return;
    if (!updateSchedules.length) {
      list.innerHTML = '<div class="stg-empty" style="padding:1rem 0;font-size:0.88rem">No scheduled updates. Click Add Schedule to set one up.</div>';
      return;
    }
    list.innerHTML = `<div class="bj-list">${updateSchedules.map((entry, idx) => `
      <div class="bj-row upd-sched-card" data-idx="${idx}">
        <div class="job-summary">
          <label class="toggle" title="${entry.enabled ? 'Enabled' : 'Disabled'}">
            <input type="checkbox" class="upd-enabled-cb" data-idx="${idx}" ${entry.enabled ? 'checked' : ''}>
            <span class="toggle-track"><span class="toggle-thumb"></span></span>
          </label>
          <span class="job-name">${escHtml(entry.serviceName || 'No container selected')}</span>
          <span class="job-sched-hint">${escHtml(scheduleDescription(entry))}</span>
          <button class="job-expand upd-edit-btn" data-idx="${idx}" title="Edit">${IC.edit}</button>
          <button class="job-expand upd-history-btn" data-idx="${idx}" title="Run history">${IC.clock}</button>
          <button class="job-expand upd-delete-btn" data-idx="${idx}" title="Delete">${IC.trash}</button>
        </div>
      </div>
    `).join('')}</div>`;

    list.querySelectorAll('.upd-enabled-cb').forEach((cb) => {
      cb.addEventListener('change', () => {
        updateSchedules[+cb.dataset.idx].enabled = cb.checked;
        markDirty();
      });
    });
    list.querySelectorAll('.upd-edit-btn').forEach((btn) => {
      btn.addEventListener('click', () => openUpdateScheduleModal(+btn.dataset.idx));
    });
    list.querySelectorAll('.upd-history-btn').forEach((btn) => {
      btn.addEventListener('click', () => openUpdateHistoryModal(+btn.dataset.idx));
    });
    list.querySelectorAll('.upd-delete-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        updateSchedules.splice(+btn.dataset.idx, 1);
        renderUpdateSchedules();
        markDirty();
      });
    });
  }

  function openUpdateHistoryModal(idx) {
    const entry = updateSchedules[idx];
    const existing = document.getElementById('updHistModalOverlay');
    if (existing) existing.remove();

    const hist = entry.history || [];
    const rows = hist.length
      ? hist.map((h) => {
          const isOk = h.status && h.status.startsWith('ok');
          const dot = `<span class="status-dot ${isOk ? 'running' : 'exited'}" style="display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;flex-shrink:0"></span>`;
          const time = new Date(h.runAt).toLocaleString();
          const statusText = h.status || '';
          return `<div style="display:flex;align-items:flex-start;gap:0.5rem;padding:0.55rem 0;border-bottom:1px solid var(--border)">
            <div style="display:flex;align-items:center;min-width:0;flex:1">
              ${dot}
              <div style="min-width:0">
                <div style="font-size:0.82rem;color:var(--text-2)">${escHtml(time)}</div>
                <div style="font-size:0.85rem;word-break:break-word">${escHtml(statusText)}</div>
              </div>
            </div>
          </div>`;
        }).join('')
      : '<div style="padding:1.5rem 0;text-align:center;color:var(--text-2);font-size:0.88rem">No runs recorded yet.</div>';

    const overlay = document.createElement('div');
    overlay.id = 'updHistModalOverlay';
    overlay.className = 'modal-overlay is-open';
    overlay.innerHTML = `
      <div class="modal" style="width:420px;max-width:95vw">
        <div class="modal-header">
          <span class="modal-title">Run History — ${escHtml(entry.serviceName || 'Unknown')}</span>
          <button class="btn-icon" id="updHistModalClose">${IC.x}</button>
        </div>
        <div class="modal-body" style="padding:0 1.25rem;max-height:60vh;overflow-y:auto">
          ${rows}
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.getElementById('updHistModalClose').addEventListener('click', () => overlay.remove());
  }
  renderUpdateSchedules();

  document.getElementById('stgAddUpdateScheduleBtn')?.addEventListener('click', () => {
    openUpdateScheduleModal(-1);
  });

  // Modal for editing a schedule entry. idx === -1 means new entry (not added until Save).
  function openUpdateScheduleModal(idx) {
    const isNew = idx === -1;
    const entry = isNew
      ? { id: 'us-' + Date.now(), serviceName: '', frequency: 'daily', hour: 3, minute: 0, weekday: 0, enabled: true }
      : updateSchedules[idx];
    const existing = document.getElementById('updSchModalOverlay');
    if (existing) existing.remove();

    const serviceOptions = allServices.map((s) =>
      `<option value="${escHtml(s.name)}" ${s.name === entry.serviceName ? 'selected' : ''}>${escHtml(s.name)}</option>`
    ).join('');

    const needsTime = ['once', 'daily', 'weekly'].includes(entry.frequency);
    const needsDay = entry.frequency === 'weekly';

    const overlay = document.createElement('div');
    overlay.id = 'updSchModalOverlay';
    overlay.className = 'modal-overlay is-open';
    overlay.innerHTML = `
      <div class="modal" style="width:420px;max-width:95vw">
        <div class="modal-header">
          <span class="modal-title">${isNew ? 'Add' : 'Edit'} Scheduled Update</span>
          <button class="btn-icon" id="updSchModalClose">${IC.x}</button>
        </div>
        <div class="modal-body" style="display:flex;flex-direction:column;gap:1.1rem">
          <div class="field">
            <div class="field-label">Container</div>
            <select id="updSchContainer" class="settings-select">
              <option value="">— select a container —</option>
              ${serviceOptions}
            </select>
          </div>
          <div class="field">
            <div class="field-label">Frequency</div>
            <select id="updSchFrequency" class="settings-select">
              <option value="once" ${entry.frequency === 'once' ? 'selected' : ''}>Once</option>
              <option value="hourly" ${entry.frequency === 'hourly' ? 'selected' : ''}>Every hour</option>
              <option value="every6h" ${entry.frequency === 'every6h' ? 'selected' : ''}>Every 6 hours</option>
              <option value="every12h" ${entry.frequency === 'every12h' ? 'selected' : ''}>Every 12 hours</option>
              <option value="daily" ${entry.frequency === 'daily' ? 'selected' : ''}>Daily</option>
              <option value="weekly" ${entry.frequency === 'weekly' ? 'selected' : ''}>Weekly</option>
            </select>
          </div>
          <div id="updSchTimeRow" class="field" style="display:${needsTime ? '' : 'none'}">
            <div class="field-label">Time</div>
            <div style="display:flex;gap:0.5rem;align-items:center">
              <select id="updSchHour" class="settings-select" style="width:90px">
                ${Array.from({length:24},(_,i)=>`<option value="${i}" ${i===entry.hour?'selected':''}>${String(i).padStart(2,'0')}</option>`).join('')}
              </select>
              <span style="color:var(--text-muted);font-weight:600">:</span>
              <select id="updSchMinute" class="settings-select" style="width:90px">
                ${Array.from({length:60},(_,m)=>`<option value="${m}" ${m===entry.minute?'selected':''}>${String(m).padStart(2,'0')}</option>`).join('')}
              </select>
            </div>
          </div>
          <div id="updSchDayRow" class="field" style="display:${needsDay ? '' : 'none'}">
            <div class="field-label">Day of week</div>
            <select id="updSchWeekday" class="settings-select">
              ${WEEKDAY_NAMES.map((d,i)=>`<option value="${i}" ${i===(entry.weekday||0)?'selected':''}>${d}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="updSchModalCancel">Cancel</button>
          <button class="btn btn-primary" id="updSchModalSave">Save</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const freqSel = document.getElementById('updSchFrequency');
    const timeRow = document.getElementById('updSchTimeRow');
    const dayRow = document.getElementById('updSchDayRow');
    freqSel.addEventListener('change', () => {
      const f = freqSel.value;
      timeRow.style.display = ['once','daily','weekly'].includes(f) ? '' : 'none';
      dayRow.style.display = f === 'weekly' ? '' : 'none';
    });

    const close = () => overlay.remove();
    document.getElementById('updSchModalClose').addEventListener('click', close);
    document.getElementById('updSchModalCancel').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    document.getElementById('updSchModalSave').addEventListener('click', () => {
      const svcName = document.getElementById('updSchContainer').value;
      if (!svcName) { showToast('Please select a container', 'error'); return; }
      const updated = {
        ...entry,
        serviceName: svcName,
        frequency: document.getElementById('updSchFrequency').value,
        hour: parseInt(document.getElementById('updSchHour')?.value || 0, 10),
        minute: parseInt(document.getElementById('updSchMinute')?.value || 0, 10),
        weekday: parseInt(document.getElementById('updSchWeekday')?.value || 0, 10),
      };
      if (isNew) {
        updateSchedules.push(updated);
      } else {
        updateSchedules[idx] = updated;
      }
      renderUpdateSchedules();
      markDirty();
      close();
    });
  }

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
        const result = await api('POST', '/api/settings/test-registry', {
          server: reg.server || '',
          username: reg.username || '',
          password: passVal || '',
          useStoredPassword: !passVal && !!reg.hasPassword
        });
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
  let odBackupFolder = (settings.onedrive && settings.onedrive.backupFolderPath) || 'DoCompose';
  let dbBackupFolder = (settings.dropbox && settings.dropbox.backupFolderPath) || 'DoCompose';

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
  let odTenant = (settings.onedrive && settings.onedrive.tenant) || '';

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
        <div class="field-label">Application (client) ID <button class="help-btn" id="stgOdHelpBtn" type="button" title="How to register the Azure App">?</button></div>
        <input type="text" id="stgOdClientId" class="settings-input" value="${escHtml(odClientId)}" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" autocomplete="off" spellcheck="false">
      </div>
      <div class="field">
        <div class="field-label">Directory (tenant) ID</div>
        <input type="text" id="stgOdTenant" class="settings-input" value="${escHtml(odTenant)}" placeholder="Optional — leave blank for personal/multi-tenant accounts" autocomplete="off" spellcheck="false">
      </div>
      <div class="field">
        <div class="field-label">Backup folder path</div>
        <div class="field-row">
          <input type="text" id="stgOdBackupFolder" class="settings-input" value="${escHtml(odBackupFolder)}" placeholder="DoCompose">
          ${connected ? `<button class="btn btn-secondary btn-sm" id="stgOdBrowseBtn" type="button">Browse</button>` : ''}
        </div>
      </div>
      ${connected ? '' : '<div id="stgOdFlowBox"></div>'}`;

    document.getElementById('stgOdClientId')?.addEventListener('input', (e) => { odClientId = e.target.value; markDirty(); });
    document.getElementById('stgOdTenant')?.addEventListener('input', (e) => { odTenant = e.target.value; markDirty(); });
    document.getElementById('stgOdBackupFolder')?.addEventListener('input', (e) => { odBackupFolder = e.target.value; markDirty(); });
    document.getElementById('stgOdBrowseBtn')?.addEventListener('click', () => {
      openFolderPickerModal('onedrive', odBackupFolder, (selected) => {
        odBackupFolder = selected;
        const inp = document.getElementById('stgOdBackupFolder');
        if (inp) inp.value = selected;
        markDirty();
      });
    });
    document.getElementById('stgOdHelpBtn')?.addEventListener('click', () => {
      const ov = document.createElement('div');
      ov.className = 'modal-overlay is-open';
      ov.innerHTML = `
        <div class="modal help-modal">
          <div class="modal-header">
            <span class="modal-title">How to register an Azure App for OneDrive</span>
            <button class="btn-icon od-help-close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
          <div class="help-modal-body">
            <ol>
              <li>Visit <a href="https://portal.azure.com/" target="_blank" rel="noopener">portal.azure.com</a></li>
              <li>Select <strong>All Services</strong>, search for <strong>App registrations</strong> and select it.</li>
              <li>Click <strong>New Registration</strong>:
                <ul>
                  <li>Name: <code>DoCompose</code></li>
                  <li>Supported account types: <strong>Single tenant</strong></li>
                  <li>Click <strong>Register</strong></li>
                </ul>
              </li>
              <li>Copy the <strong>Application (client) ID</strong> and the <strong>Directory (tenant) ID</strong> from the Overview page and paste them into the fields above.</li>
              <li>Go to <strong>Manage → Authentication</strong>, scroll to <strong>Advanced settings</strong>, set <strong>Allow public client flows</strong> to <strong style="color:#f59e0b">Yes</strong>, then click <strong>Save</strong>. <em style="color:#f87171">Required — connection will fail without this.</em></li>
              <li>Go to <strong>Overview → View API Permissions → Add a permission → Microsoft Graph → Delegated permissions</strong> and add:
                <ul>
                  <li><code>Files.ReadWrite</code></li>
                  <li><code>offline_access</code></li>
                  <li><code>User.Read</code></li>
                </ul>
              </li>
              <li>Click <strong>Grant admin consent</strong> for your directory.</li>
            </ol>
          </div>
        </div>`;
      document.body.appendChild(ov);
      const close = () => ov.remove();
      ov.querySelector('.od-help-close').addEventListener('click', close);
      ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
    });
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
      const tid = document.getElementById('stgOdTenant')?.value.trim();
      if (!cid) { flowBox.innerHTML = '<p style="color:var(--danger);font-size:0.82rem;margin-top:0.5rem">Enter your Client ID first.</p>'; return; }
      odClientId = cid; odTenant = tid;
      try {
        await api('POST', '/api/settings', { onedrive: { clientId: cid, tenant: tid } });
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
        <div class="field-label">Backup folder path</div>
        <div class="field-row">
          <input type="text" id="stgDbBackupFolder" class="settings-input" value="${escHtml(dbBackupFolder)}" placeholder="DoCompose">
          ${connected ? `<button class="btn btn-secondary btn-sm" id="stgDbBrowseBtn" type="button">Browse</button>` : ''}
        </div>
      </div>
      <div class="field">
        <div class="field-label">Redirect URI <span class="field-hint" style="font-weight:400">add to your app's OAuth 2 settings</span></div>
        <div class="code-row"><code>${escHtml(redirectUri)}</code><button class="btn btn-secondary btn-sm" id="stgDbCopyUri" type="button" style="flex-shrink:0">Copy</button></div>
      </div>`;

    document.getElementById('stgDbAppKey')?.addEventListener('input', (e) => { dbAppKey = e.target.value; markDirty(); });
    document.getElementById('stgDbAppSecret')?.addEventListener('input', (e) => { dbAppSecret = e.target.value; dbAppSecretDirty = true; markDirty(); });
    document.getElementById('stgDbBackupFolder')?.addEventListener('input', (e) => { dbBackupFolder = e.target.value; markDirty(); });
    document.getElementById('stgDbBrowseBtn')?.addEventListener('click', () => {
      openFolderPickerModal('dropbox', dbBackupFolder, (selected) => {
        dbBackupFolder = selected;
        const inp = document.getElementById('stgDbBackupFolder');
        if (inp) inp.value = selected;
        markDirty();
      });
    });
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

  // ── Cloud folder picker modal ──────────────────────────────────
  function openFolderPickerModal(provider, initialPath, onSelect) {
    let currentPath = (initialPath || '').replace(/^\/+|\/+$/g, '');

    let modal = document.getElementById('folderPickerModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'folderPickerModal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal" style="width:480px;max-width:95vw">
          <div class="modal-header">
            <span class="modal-title">Choose backup folder</span>
            <button class="btn-icon" id="fpCloseBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
          <div class="modal-body" style="padding:0">
            <div id="fpBreadcrumb" class="fp-breadcrumb"></div>
            <div id="fpList" class="fp-list"></div>
          </div>
          <div class="modal-footer">
            <div id="fpCurrentPath" class="fp-current-path"></div>
            <button class="btn btn-primary" id="fpSelectBtn">Select this folder</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
    }
    modal.classList.add('is-open');

    document.getElementById('fpCloseBtn').onclick = () => { modal.classList.remove('is-open'); };
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('is-open'); };
    document.getElementById('fpSelectBtn').onclick = () => {
      modal.classList.remove('is-open');
      onSelect(currentPath || 'DoCompose');
    };

    async function navigate(path) {
      currentPath = (path || '').replace(/^\/+|\/+$/g, '');
      const list = document.getElementById('fpList');
      const crumb = document.getElementById('fpBreadcrumb');
      const cur = document.getElementById('fpCurrentPath');
      list.innerHTML = '<div class="fp-loading">Loading…</div>';

      // Breadcrumb
      const parts = currentPath ? currentPath.split('/') : [];
      let crumbHtml = `<span class="fp-crumb" data-path="">Root</span>`;
      parts.forEach((part, i) => {
        const p = parts.slice(0, i + 1).join('/');
        crumbHtml += `<span class="fp-crumb-sep">›</span><span class="fp-crumb" data-path="${escHtml(p)}">${escHtml(part)}</span>`;
      });
      crumb.innerHTML = crumbHtml;
      crumb.querySelectorAll('.fp-crumb').forEach((el) => {
        el.addEventListener('click', () => navigate(el.dataset.path));
      });

      cur.textContent = currentPath ? `/${currentPath}` : '/';

      try {
        const qs = currentPath ? `?path=${encodeURIComponent(currentPath)}` : '';
        const data = await api('GET', `/api/${provider}/folders${qs}`);
        const folders = data.folders || [];
        if (folders.length === 0) {
          list.innerHTML = '<div class="fp-empty">No subfolders here</div>';
        } else {
          list.innerHTML = folders.map((f) => {
            const fullPath = currentPath ? `${currentPath}/${f}` : f;
            return `<div class="fp-item" data-path="${escHtml(fullPath)}">${IC.folder || '📁'} ${escHtml(f)}</div>`;
          }).join('');
          list.querySelectorAll('.fp-item').forEach((el) => {
            el.addEventListener('click', () => navigate(el.dataset.path));
          });
        }
      } catch (err) {
        list.innerHTML = `<div class="fp-empty" style="color:var(--danger)">Error: ${escHtml(err.message)}</div>`;
      }
    }

    navigate(currentPath);
  }

  // ── Path chips (shared between openJobModal and openFileBrowser) ─
  function isFilePath(p) {
    // Heuristic: if the last segment contains a dot it's likely a file.
    // The server also stores a _type hint when paths are added via the browser.
    const job = backupJobs.find((j) => j.paths && j.paths.includes(p));
    if (job && job._pathTypes && job._pathTypes[p]) return job._pathTypes[p] === 'file';
    return /\.[^/]+$/.test(p.split('/').pop());
  }

  function renderPathChips(idx) {
    const container = document.getElementById('bjmPathChips');
    if (!container) return;
    const paths = backupJobs[idx].paths || [];
    if (paths.length === 0) {
      container.innerHTML = `<span class="path-chips-empty">No paths selected — click Browse to add a file or folder</span>`;
    } else {
      const types = backupJobs[idx]._pathTypes || {};
      container.innerHTML = paths.map((p) => {
        const isFile = types[p] === 'file';
        const icon = isFile
          ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px;flex-shrink:0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`
          : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px;flex-shrink:0"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
        const badge = isFile
          ? `<span class="path-chip-type file">file</span>`
          : `<span class="path-chip-type folder">folder</span>`;
        return `<span class="path-chip">
          ${icon}${badge}
          <span class="path-chip-label">${escHtml(p)}</span>
          <button class="path-chip-remove" onclick="removePathFromJobGlobal(${idx},${JSON.stringify(p)})" title="Remove">×</button>
        </span>`;
      }).join('');
    }
  }

  function removePathFromJobInner(idx, p) {
    if (!backupJobs[idx].paths) return;
    backupJobs[idx].paths = backupJobs[idx].paths.filter((x) => x !== p);
    markDirty();
    renderPathChips(idx);
  }
  window.removePathFromJobGlobal = (idx, p) => removePathFromJobInner(idx, p);

  // ── File browser modal ────────────────────────────────────────
  function openFileBrowser(jobIdx) {
    let currentPath = '/';
    let selectedPath = null;
    let selectedIsFile = false;

    const FOLDER_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="fb-icon fb-icon-folder"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
    const FILE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="fb-icon fb-icon-file"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    const NAV_ARROW = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="fb-nav-arrow"><polyline points="9 18 15 12 9 6"/></svg>`;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay fb-overlay is-open';
    overlay.innerHTML = `
      <div class="modal fb-modal">
        <div class="modal-header">
          <span class="modal-title">Select file or folder to back up</span>
          <button class="btn-icon fb-close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div class="fb-path-bar">
          <span class="fb-path-label">Current folder:</span>
          <span id="fbCurrentPath" class="fb-path-value">/</span>
        </div>
        <div class="fb-hint">Click to select · Double-click a folder to open it</div>
        <div class="fb-list" id="fbList"><div class="loading"><div class="spinner"></div> Loading…</div></div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-sm" id="fbCancelBtn">Cancel</button>
          <button class="btn btn-primary btn-sm" id="fbAddThisBtn">Add Current Folder</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    function updateAddButton() {
      const btn = document.getElementById('fbAddThisBtn');
      if (!btn) return;
      if (selectedPath) {
        btn.textContent = selectedIsFile ? 'Add This File' : 'Add This Folder';
      } else {
        btn.textContent = 'Add Current Folder';
      }
    }

    async function navigate(path) {
      currentPath = path;
      selectedPath = null;
      selectedIsFile = false;
      document.getElementById('fbCurrentPath').textContent = path;
      updateAddButton();
      const listEl = document.getElementById('fbList');
      listEl.innerHTML = '<div class="loading"><div class="spinner"></div> Loading…</div>';
      try {
        const data = await api('GET', `/api/files/browse?path=${encodeURIComponent(path)}`);
        const dirs = data.entries.filter((e) => e.isDir);
        const files = data.entries.filter((e) => !e.isDir);
        let html = '';
        if (path !== '/') {
          const parent = path.replace(/\/[^/]+\/?$/, '') || '/';
          html += `<div class="fb-entry fb-up" data-path="${escHtml(parent)}" data-isdir="1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="fb-icon"><polyline points="15 18 9 12 15 6"/></svg>
            <span class="fb-entry-name">..</span>
          </div>`;
        }
        for (const e of dirs) {
          html += `<div class="fb-entry fb-dir" data-path="${escHtml(e.path)}" data-isdir="1" title="Click to select · Double-click to open">
            ${FOLDER_ICON}<span class="fb-entry-name">${escHtml(e.name)}</span>${NAV_ARROW}
          </div>`;
        }
        for (const e of files) {
          html += `<div class="fb-entry fb-file" data-path="${escHtml(e.path)}" data-isdir="0" title="Click to select this file">
            ${FILE_ICON}<span class="fb-entry-name">${escHtml(e.name)}</span>
          </div>`;
        }
        if (!dirs.length && !files.length) html = '<div class="loading">Empty directory</div>';
        listEl.innerHTML = html;

        listEl.querySelectorAll('.fb-entry').forEach((el) => {
          const isDir = el.dataset.isdir === '1';
          const isUp = el.classList.contains('fb-up');

          if (isUp) {
            el.addEventListener('click', () => navigate(el.dataset.path));
            return;
          }

          // Single click = select
          el.addEventListener('click', () => {
            listEl.querySelectorAll('.fb-entry').forEach((e) => e.classList.remove('selected'));
            el.classList.add('selected');
            selectedPath = el.dataset.path;
            selectedIsFile = !isDir;
            updateAddButton();
          });

          // Double click on folder = navigate in
          if (isDir) {
            el.addEventListener('dblclick', () => {
              navigate(el.dataset.path);
            });
            // Nav arrow click also navigates
            el.querySelector('.fb-nav-arrow')?.addEventListener('click', (ev) => {
              ev.stopPropagation();
              navigate(el.dataset.path);
            });
          }
        });
      } catch (e) {
        listEl.innerHTML = `<div class="loading" style="color:var(--danger)">${escHtml(e.message)}</div>`;
      }
    }

    function addPathToJob(idx, p, isFile) {
      if (!p) return;
      if (!backupJobs[idx].paths) backupJobs[idx].paths = [];
      if (!backupJobs[idx].paths.includes(p)) {
        backupJobs[idx].paths.push(p);
        if (!backupJobs[idx]._pathTypes) backupJobs[idx]._pathTypes = {};
        backupJobs[idx]._pathTypes[p] = isFile ? 'file' : 'folder';
        markDirty();
        renderPathChips(idx);
      }
    }

    overlay.querySelector('.fb-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.getElementById('fbCancelBtn').addEventListener('click', () => overlay.remove());
    document.getElementById('fbAddThisBtn').addEventListener('click', () => {
      if (selectedPath) {
        addPathToJob(jobIdx, selectedPath, selectedIsFile);
      } else {
        addPathToJob(jobIdx, currentPath, false);
      }
      overlay.remove();
    });

    navigate('/compose').catch(() => navigate('/'));
  }

  const SCHEDULE_PRESETS = [
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Daily 2am', value: '0 2 * * *' },
    { label: 'Weekly Sun', value: '0 2 * * 0' },
  ];

  // ── Schedule GUI helpers ───────────────────────────────────────
  function parseCron(cron) {
    const p = (cron || '').trim().split(/\s+/);
    if (p.length !== 5) return null;
    return { min: p[0], hour: p[1], dom: p[2], mon: p[3], dow: p[4] };
  }

  function cronToGui(cron) {
    const p = parseCron(cron);
    if (!p) return { freq: 'custom', hour: '2', min: '00', dow: '0', cron };
    if (p.dom === '*' && p.mon === '*' && p.dow === '*') {
      if (p.hour === '*') return { freq: 'hourly', hour: '0', min: p.min, dow: '0', cron };
      const [h, m] = [p.hour, p.min];
      return { freq: 'daily', hour: h, min: m.padStart(2, '0'), dow: '0', cron };
    }
    if (p.dom === '*' && p.mon === '*' && p.dow !== '*') {
      return { freq: 'weekly', hour: p.hour, min: p.min.padStart(2, '0'), dow: p.dow, cron };
    }
    return { freq: 'custom', hour: p.hour, min: p.min, dow: p.dow, cron };
  }

  function guiToCron(freq, hour, min, dow) {
    if (freq === 'hourly') return `${+min || 0} * * * *`;
    if (freq === 'daily')  return `${+min || 0} ${+hour || 0} * * *`;
    if (freq === 'weekly') return `${+min || 0} ${+hour || 0} * * ${dow}`;
    return null; // custom — don't auto-generate
  }

  const DOW_LABELS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  function cronLabel(cron) {
    if (!cron) return 'no schedule';
    const g = cronToGui(cron);
    const t = `${String(+g.hour).padStart(2,'0')}:${String(+g.min).padStart(2,'0')}`;
    if (g.freq === 'hourly') return 'Every hour';
    if (g.freq === 'daily')  return `Daily at ${t}`;
    if (g.freq === 'weekly') return `Weekly on ${DOW_LABELS[+g.dow]} at ${t}`;
    return cron;
  }
  const HOURS = Array.from({length:24}, (_,i) => i);

  function buildSchedGui(cron) {
    const g = cronToGui(cron);
    const freqOpts = [
      { v:'hourly', l:'Every hour' }, { v:'daily', l:'Daily' },
      { v:'weekly', l:'Weekly' }, { v:'custom', l:'Custom (cron)' },
    ].map((o) => `<option value="${o.v}" ${g.freq===o.v?'selected':''}>${o.l}</option>`).join('');

    const hourOpts = HOURS.map((h) => `<option value="${h}" ${+g.hour===h?'selected':''}>${String(h).padStart(2,'0')}:00</option>`).join('');
    const dowOpts = DOW_LABELS.map((l,i) => `<option value="${i}" ${+g.dow===i?'selected':''}>${l}</option>`).join('');

    const showDayTime = g.freq==='daily'||g.freq==='weekly' ? 'display:inline-flex;align-items:center;gap:0.4rem' : 'display:none';
    const showDow     = g.freq==='weekly' ? 'display:inline-flex;align-items:center;gap:0.4rem' : 'display:none';
    const showCustom  = g.freq==='custom' ? '' : 'display:none';

    const customRow = `<div style="${showCustom}"><input type="text" class="settings-input" id="bjmCronRaw" value="${escHtml(g.freq==='custom'?cron:'')}" placeholder="e.g. 0 2 * * *" style="font-family:var(--font-mono)"></div>`;

    // All controls on ONE row: [freq] [on day] [at hour : min]
    return `<div class="sched-gui">
      <div class="sched-row">
        <select class="settings-select" id="bjmFreq" style="width:auto">${freqOpts}</select>
        <span id="bjmDowWrap" style="${showDow}"><label>on</label><select class="settings-select" id="bjmDow" style="width:auto">${dowOpts}</select></span>
        <span id="bjmDayTimeRow" style="${showDayTime}"><label>at</label><select class="settings-select" id="bjmHour" style="width:auto">${hourOpts}</select><label>:</label><select class="settings-select" id="bjmMin" style="width:auto">${Array.from({length:60},(_,m)=>`<option value="${m}" ${+g.min===m?'selected':''}>${String(m).padStart(2,'0')}</option>`).join('')}</select></span>
      </div>
      ${customRow}
    </div>`;
  }

  function syncSchedGui() {
    const freq       = document.getElementById('bjmFreq').value;
    const dayTimeRow = document.getElementById('bjmDayTimeRow');
    const dowWrap    = document.getElementById('bjmDowWrap');
    const customEl   = document.getElementById('bjmCronRaw');
    if (dayTimeRow) dayTimeRow.style.display = (freq==='daily'||freq==='weekly') ? 'inline-flex' : 'none';
    if (dowWrap)    dowWrap.style.display    = freq==='weekly' ? 'inline-flex' : 'none';
    if (customEl)   customEl.parentElement.style.display = freq==='custom' ? '' : 'none';

    let cron;
    if (freq === 'custom') {
      cron = (customEl && customEl.value.trim()) || backupJobs[bjModalIdx].schedule || '';
    } else {
      const h   = (document.getElementById('bjmHour') || {}).value || '2';
      const m   = (document.getElementById('bjmMin')  || {}).value || '0';
      const dow = (document.getElementById('bjmDow')  || {}).value || '0';
      cron = guiToCron(freq, h, m, dow) || '';
    }
    backupJobs[bjModalIdx].schedule = cron;
    syncJobRow(bjModalIdx);
    markDirty();
  }

  // ── Backup job edit modal ──────────────────────────────────────
  let bjModalIdx = -1;
  let bjFileBrowserForModal = false;

  function openJobModal(idx) {
    const isNew = idx === -1;
    let job;
    if (isNew) {
      job = { id: 'job-' + Date.now(), containerName: '', paths: [], _pathTypes: {}, schedule: '0 2 * * *', keepCount: 10, enabled: true };
    } else {
      job = backupJobs[idx];
    }
    bjModalIdx = idx;
    const containers = (DC.services || []).map((s) => s.name);
    const isOk = job.lastStatus && job.lastStatus.startsWith('ok');
    const isErr = job.lastStatus && !isOk;
    const statusDetail = job.lastStatus ? job.lastStatus.replace(/^ok\s*/i, '').replace(/^error:\s*/i, '') : '';
    const runTime = job.lastRun ? new Date(job.lastRun).toLocaleString() : '';
    const statusTxt = !job.lastStatus ? 'Never run' : isOk ? `${runTime} — OK ${statusDetail}` : `Error: ${statusDetail}`;
    const statusTextCls = isOk ? 'ok' : isErr ? 'err' : '';
    const overlay = document.getElementById('bjModalOverlay');
    overlay.innerHTML = `
      <div class="modal bj-edit-modal" role="dialog" aria-modal="true">
        <div class="modal-head">
          <span class="modal-title">${isNew ? 'Add Backup Job' : 'Edit Backup Job'}</span>
          <button class="btn-icon modal-close" id="bjModalClose" aria-label="Close">${IC.x}</button>
        </div>
        <div class="bj-modal-body">
          <div class="field-grid" style="grid-template-columns:1fr 1fr;gap:0.75rem">
            <div class="field">
              <div class="field-label">Destination</div>
              <select class="settings-select" id="bjmDestination">
                ${odEnabled ? `<option value="onedrive" ${(job.destination || 'onedrive') === 'onedrive' ? 'selected' : ''}>OneDrive</option>` : ''}
                ${dbEnabled ? `<option value="dropbox" ${job.destination === 'dropbox' ? 'selected' : ''}>Dropbox</option>` : ''}
              </select>
            </div>
            <div class="field">
              <div class="field-label">Container</div>
              <select class="settings-select" id="bjmContainer">
                <option value="">— select —</option>
                ${containers.map((n) => `<option value="${escHtml(n)}" ${job.containerName === n ? 'selected' : ''}>${escHtml(n)}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="field">
            <div class="field-label">Schedule</div>
            ${buildSchedGui(job.schedule || '0 2 * * *')}
          </div>
          <div class="field">
            <div class="field-label">Folders to back up</div>
            <div id="bjmPathChips" class="path-chips-wrap"></div>
            <button class="btn btn-secondary btn-sm" id="bjmBrowse" type="button" style="margin-top:0.5rem;align-self:flex-start;width:fit-content">${IC.folder}Browse</button>
          </div>
          <div class="field-grid" style="grid-template-columns:1fr 1fr;gap:0.75rem">
            <div class="field">
              <div class="field-label">Backups to keep</div>
              <input type="number" class="settings-input" id="bjmKeep" value="${job.keepCount || 10}" min="1" max="365">
            </div>
          </div>
          <div class="bj-modal-foot">
            ${!isNew ? `<span class="job-status-text ${statusTextCls}" style="font-size:0.78rem">${escHtml(statusTxt)}</span>` : '<span></span>'}
            <div style="display:flex;gap:0.5rem">
              <button class="btn btn-secondary btn-sm" id="bjmCancel">Cancel</button>
              ${!isNew ? `<button class="btn btn-secondary btn-sm" id="bjmRunNow" data-jobid="${escHtml(job.id)}">Run Now</button>` : ''}
              <button class="btn btn-primary btn-sm" id="bjmSave">Save</button>
            </div>
          </div>
        </div>
      </div>`;
    overlay.classList.add('is-open');

    document.getElementById('bjmDestination').addEventListener('change', (e) => { backupJobs[bjModalIdx].destination = e.target.value; syncJobRow(bjModalIdx); markDirty(); });
    document.getElementById('bjmContainer').addEventListener('change', (e) => { backupJobs[bjModalIdx].containerName = e.target.value; syncJobRow(bjModalIdx); markDirty(); });
    ['bjmFreq','bjmHour','bjmMin','bjmDow'].forEach((id) => { const el = document.getElementById(id); if (el) el.addEventListener('change', syncSchedGui); });
    const cronRaw = document.getElementById('bjmCronRaw'); if (cronRaw) cronRaw.addEventListener('input', syncSchedGui);
    document.getElementById('bjmKeep').addEventListener('change', (e) => { backupJobs[bjModalIdx].keepCount = +e.target.value || 10; markDirty(); });
    document.getElementById('bjmBrowse').addEventListener('click', () => { bjFileBrowserForModal = true; openFileBrowser(bjModalIdx); });
    if (isNew) {
      backupJobs.push(job);
      bjModalIdx = backupJobs.length - 1;
    }
    renderPathChips(bjModalIdx);
    document.getElementById('bjmCancel').addEventListener('click', () => {
      if (isNew) { backupJobs.splice(bjModalIdx, 1); renderBackupJobs(); }
      closeJobModal();
    });
    document.getElementById('bjModalClose').addEventListener('click', () => {
      if (isNew) { backupJobs.splice(bjModalIdx, 1); renderBackupJobs(); }
      closeJobModal();
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        if (isNew) { backupJobs.splice(bjModalIdx, 1); renderBackupJobs(); }
        closeJobModal();
      }
    }, { once: true });
    document.getElementById('bjmSave').addEventListener('click', () => {
      if (isNew) { renderBackupJobs(); markDirty(); }
      closeJobModal();
    });
    document.getElementById('bjmRunNow')?.addEventListener('click', async () => {
      const btn = document.getElementById('bjmRunNow');
      const jobId = job.id;
      btn.disabled = true; btn.textContent = 'Running…';
      try {
        const dest = backupJobs[bjModalIdx]?.destination || 'onedrive';
        const endpoint = dest === 'dropbox' ? `/api/dropbox/backup/${jobId}` : `/api/onedrive/backup/${jobId}`;
        await api('POST', endpoint);
        const s = await api('GET', '/api/settings');
        const updated = (s.backupJobs || []).find((j) => j.id === jobId);
        if (updated && bjModalIdx !== -1) { backupJobs[bjModalIdx].lastRun = updated.lastRun; backupJobs[bjModalIdx].lastStatus = updated.lastStatus; }
        closeJobModal(); renderBackupJobs(); openJobModal(bjModalIdx !== -1 ? bjModalIdx : 0);
      } catch (e) {
        btn.disabled = false; btn.textContent = 'Run Now';
        showToast('Backup failed: ' + e.message, 'error');
      }
    });
  }

  function closeJobModal() {
    const overlay = document.getElementById('bjModalOverlay');
    if (overlay) overlay.classList.remove('is-open');
    bjModalIdx = -1;
  }

  function syncJobRow(idx) {
    const job = backupJobs[idx];
    const row = document.querySelector(`.backup-job-card[data-idx="${idx}"]`);
    if (!row) return;
    const dest = job.destination === 'dropbox' ? 'Dropbox' : 'OneDrive';
    row.querySelector('.job-dest').textContent = dest;
    row.querySelector('.job-name').textContent = job.containerName || 'No container';
    row.querySelector('.bj-meta-sched').textContent = cronLabel(job.schedule);
  }

  function renderBackupJobs() {
    const list = document.getElementById('stgBackupJobsList');
    if (!list) return;
    if (!backupJobs.length) {
      list.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><p>No backup jobs yet. Click <strong>Add Job</strong> to schedule your first backup.</p></div>`;
      return;
    }
    list.innerHTML = `<div class="bj-list">${backupJobs.map((job, idx) => {
      const isOk = job.lastStatus && job.lastStatus.startsWith('ok');
      const isErr = job.lastStatus && !isOk;
      const statusDetail = job.lastStatus ? job.lastStatus.replace(/^ok\s*/i, '').replace(/^error:\s*/i, '') : '';
      const runTime = job.lastRun ? new Date(job.lastRun).toLocaleString() : '';
      const statusTxt = !job.lastStatus ? 'Never run' : isOk ? `${runTime} — OK ${statusDetail}` : `Error: ${statusDetail}`;
      const dotCls = isOk ? 'ok' : isErr ? 'err' : '';
      const dest = job.destination === 'dropbox' ? 'Dropbox' : 'OneDrive';
      return `
      <div class="bj-row backup-job-card" data-idx="${idx}">
        <div class="job-summary">
          <label class="toggle" onclick="event.stopPropagation()">
            <input type="checkbox" class="bj-enabled" data-idx="${idx}" ${job.enabled ? 'checked' : ''}>
            <span class="toggle-track"><span class="toggle-thumb"></span></span>
          </label>
          <span class="job-name">${escHtml(job.containerName || 'No container')}</span>
          <div class="job-meta">
            <span class="job-dest">${dest}</span>
            <span>·</span>
            <span class="bj-meta-sched">${escHtml(cronLabel(job.schedule))}</span>
            <span class="job-status-dot ${dotCls}" title="${escHtml(statusTxt)}"></span>
          </div>
          <button class="job-expand bj-edit-btn" data-idx="${idx}" title="Edit">${IC.edit || IC.chevron}</button>
        </div>
      </div>`;
    }).join('')}</div>`;

    list.querySelectorAll('.bj-enabled').forEach((cb) => cb.addEventListener('change', (e) => { backupJobs[+e.target.dataset.idx].enabled = e.target.checked; markDirty(); }));
    list.querySelectorAll('.bj-edit-btn').forEach((btn) => btn.addEventListener('click', () => openJobModal(+btn.dataset.idx)));
  }
  renderBackupJobs();

  document.getElementById('stgAddBackupJobBtn')?.addEventListener('click', () => {
    openJobModal(-1);
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
        updateSchedules,
        onedrive: { clientId: odClientId, tenant: odTenant, backupFolderPath: odBackupFolder },
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
      markClean();
      setSt('Saved', true);
      setTimeout(() => setSt(''), 3000);
    } catch (err) {
      setSt('Error: ' + err.message, false);
    }
  });
}
window.settingsInit = settingsInit;
