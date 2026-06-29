/* ============================================================
   DoCompose — Settings View
   ============================================================ */

'use strict';

async function settingsInit() {
  const c = document.getElementById('view-settings');
  if (!c) return;

  c.innerHTML = `
    <div class="settings-page">
      <div class="settings-header">
        <h1 class="settings-title">Settings</h1>
        <p class="settings-subtitle">Configure DoCompose behaviour</p>
      </div>

      <div class="settings-sections">

        <!-- Updates -->
        <section class="settings-section">
          <h2 class="settings-section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
            Updates
          </h2>
          <div class="settings-group">
            <div class="settings-row">
              <div class="settings-label">
                <span>Update check interval</span>
                <span class="settings-hint">How often to automatically check for image updates. 0 = manual only.</span>
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
        </section>

        <!-- Registry Auth -->
        <section class="settings-section">
          <h2 class="settings-section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Container Registry Authentication
          </h2>
          <p class="settings-section-desc">Used when pulling images or checking for updates on private registries.</p>
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
                <span class="settings-hint">GitHub: Personal Access Token with read:packages scope</span>
              </div>
              <div class="settings-control" style="position:relative">
                <input type="password" id="stgRegPass" class="settings-input" placeholder="••••••••" autocomplete="new-password" style="padding-right:2.2rem" />
                <button class="settings-eye" id="stgRegPassToggle" type="button" title="Show/hide">
                  <svg id="stgEyeIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Excluded containers -->
        <section class="settings-section">
          <h2 class="settings-section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            Excluded from Updates
          </h2>
          <p class="settings-section-desc">Checked containers are skipped during update checks and auto-pulls.</p>
          <div class="settings-exclude-scroll" id="stgExcludeList">
            <div class="settings-loading">Loading services…</div>
          </div>
        </section>

      </div>

      <div class="settings-footer">
        <button class="btn btn-primary" id="stgSaveBtn" disabled>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Save Settings
        </button>
        <span id="stgSaveStatus" class="settings-save-status"></span>
      </div>
    </div>
  `;

  // Load current settings
  let settings = {};
  try {
    settings = await api('GET', '/api/settings');
  } catch {}

  // Populate update interval
  const intEl = document.getElementById('stgUpdateInterval');
  if (intEl && settings.updateIntervalSeconds !== undefined) {
    intEl.value = String(settings.updateIntervalSeconds);
  }

  // Populate registry fields
  const reg = settings.registry || {};
  const setVal = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
  setVal('stgRegServer', reg.server || '');
  setVal('stgRegUser', reg.username || '');
  const passEl = document.getElementById('stgRegPass');
  if (passEl && reg.password) passEl.placeholder = '(saved — enter to change)';

  // Password visibility toggle
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

  // Populate excluded containers
  const excludeList = document.getElementById('stgExcludeList');
  const excluded = new Set(settings.excludedFromUpdates || []);
  const services = DC.services || [];
  if (!services.length) {
    excludeList.innerHTML = '<div class="settings-loading">No services found</div>';
  } else {
    excludeList.innerHTML = services.map((s) => `
      <label class="settings-checkbox-row">
        <input type="checkbox" class="stg-exclude-cb" value="${escHtml(s.name)}" ${excluded.has(s.name) ? 'checked' : ''}>
        <span class="settings-checkbox-name">${escHtml(s.name)}</span>
        <span class="settings-checkbox-hint">${escHtml(s.image || '')}</span>
      </label>
    `).join('');
  }

  // Dirty tracking — enable Save only when something changes
  const saveBtn = document.getElementById('stgSaveBtn');
  const markDirty = () => { saveBtn.disabled = false; };
  document.getElementById('stgUpdateInterval').addEventListener('change', markDirty);
  document.getElementById('stgRegServer').addEventListener('input', markDirty);
  document.getElementById('stgRegUser').addEventListener('input', markDirty);
  document.getElementById('stgRegPass').addEventListener('input', markDirty);
  excludeList.addEventListener('change', markDirty);

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
        excludedFromUpdates: Array.from(document.querySelectorAll('.stg-exclude-cb:checked')).map((cb) => cb.value),
      };
      await api('POST', '/api/settings', payload);
      saveBtn.disabled = true;
      setSt('Saved', true);
      setTimeout(() => setSt(''), 3000);
    } catch (err) {
      setSt('Error: ' + err.message, false);
    }
  });
}
window.settingsInit = settingsInit;
