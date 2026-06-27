/* ============================================================
   DoCompose — Compose Editor (per-service split panel)
   ============================================================ */

'use strict';

let editorServices = [];
let editorSelectedService = null;
let editorDirty = false;

function editorInit() {
  const autoSelect = DC._autoSelectService || null;
  DC._autoSelectService = null;

  const container = document.getElementById('view-editor');
  container.innerHTML = `
    <div class="editor-split">
      <div class="editor-service-list" id="editorServiceList">
        <div class="editor-service-list-header">Services</div>
        <div id="editorServiceBtns"><div class="loading"><div class="spinner"></div></div></div>
      </div>
      <div class="editor-panel" id="editorPanel">
        <div class="editor-panel-empty">
          ← Select a service to edit its configuration.
        </div>
      </div>
    </div>
  `;
  editorSelectedService = null;
  editorDirty = false;
  loadEditorServices(autoSelect);
}
window.editorInit = editorInit;

async function loadEditorServices(autoSelect) {
  try {
    console.log('[editor] loading, autoSelect=', autoSelect, 'project=', DC.currentProject);
    const { parsed } = await api('GET', '/api/files/compose');
    editorServices = Object.keys((parsed && parsed.services) || {});
    console.log('[editor] services:', editorServices);
    renderEditorServiceList();
    if (autoSelect && editorServices.includes(autoSelect)) {
      selectEditorService(autoSelect);
    } else if (autoSelect) {
      console.warn('[editor] service not found in compose:', autoSelect, editorServices);
      const panel = document.getElementById('editorPanel');
      if (panel) panel.innerHTML = `<div class="editor-panel-empty" style="color:var(--danger)">Service "${escHtml(autoSelect)}" not found in compose file.<br><small>Available: ${escHtml(editorServices.join(', ') || 'none')}</small></div>`;
    }
  } catch (err) {
    console.error('[editor] error:', err);
    const btns = document.getElementById('editorServiceBtns');
    if (btns) btns.innerHTML = `<div style="padding:0.75rem;font-size:0.9rem;color:var(--danger)">${escHtml(err.message)}</div>`;
    const panel = document.getElementById('editorPanel');
    if (panel) panel.innerHTML = `<div class="editor-panel-empty" style="color:var(--danger)">Error: ${escHtml(err.message)}</div>`;
  }
}

function renderEditorServiceList() {
  const btns = document.getElementById('editorServiceBtns');
  if (!btns) return;
  if (!editorServices.length) {
    btns.innerHTML = '<div style="padding:0.75rem 0.85rem;font-size:0.85rem;color:var(--text-muted)">No services found</div>';
    return;
  }
  btns.innerHTML = editorServices.map((name) => {
    const svc = (DC.services || []).find((s) => s.name === name);
    const state = svc ? (svc.state || 'absent').toLowerCase() : 'absent';
    return `
      <button class="editor-service-btn${editorSelectedService === name ? ' active' : ''}" onclick="selectEditorService(${JSON.stringify(name)})">
        <span class="status-dot ${statusClass(state)}" style="flex-shrink:0"></span>
        ${escHtml(name)}
      </button>`;
  }).join('');
}

async function selectEditorService(name) {
  if (editorDirty && editorSelectedService && editorSelectedService !== name) {
    const ok = await dcConfirm('You have unsaved changes. Discard them?', 'Unsaved Changes');
    if (!ok) return;
  }

  editorSelectedService = name;
  editorDirty = false;

  // Highlight active btn
  document.querySelectorAll('.editor-service-btn').forEach((b) => {
    b.classList.toggle('active', b.textContent.trim() === name);
  });

  const panel = document.getElementById('editorPanel');
  if (!panel) return;

  panel.innerHTML = `
    <div class="editor-panel-toolbar">
      <span class="editor-panel-title">${escHtml(name)}</span>
      <button class="btn btn-primary btn-sm" id="editorSaveBtn" disabled>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
        </svg>
        Save
      </button>
      <button class="btn btn-secondary btn-sm" id="editorReloadBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        Reload
      </button>
      <span class="editor-status" id="editorStatus" style="margin-left:auto"></span>
    </div>
    <textarea class="yaml-textarea" id="editorTextarea" spellcheck="false" style="flex:1"></textarea>
  `;

  document.getElementById('editorSaveBtn').addEventListener('click', editorSave);
  document.getElementById('editorReloadBtn').addEventListener('click', () => selectEditorService(name));
  const ta = document.getElementById('editorTextarea');
  ta.addEventListener('input', () => {
    editorDirty = true;
    setEditorStatus('');
    const saveBtn = document.getElementById('editorSaveBtn');
    if (saveBtn) saveBtn.disabled = false;
  });

  await editorLoadService(name);
}
window.selectEditorService = selectEditorService;

async function editorLoadService(name) {
  setEditorStatus('Loading…');
  try {
    console.log('[editor] loading service:', name);
    const { yaml } = await api('GET', `/api/files/service/${encodeURIComponent(name)}`);
    console.log('[editor] loaded yaml length:', yaml && yaml.length);
    const ta = document.getElementById('editorTextarea');
    if (ta) ta.value = yaml;
    editorDirty = false;
    setEditorStatus('Loaded', 'valid');
  } catch (err) {
    console.error('[editor] load service error:', err);
    setEditorStatus(`Error: ${err.message}`, 'invalid');
    const ta = document.getElementById('editorTextarea');
    if (ta) ta.value = `# Error loading service: ${err.message}`;
  }
}

async function editorSave() {
  const ta = document.getElementById('editorTextarea');
  if (!ta || !editorSelectedService) return;

  setEditorStatus('Saving…');
  try {
    await api('POST', `/api/files/service/${encodeURIComponent(editorSelectedService)}`, { yaml: ta.value });
    editorDirty = false;
    setEditorStatus('Saved', 'valid');
    showToast(`${editorSelectedService} saved`, 'success');
    const saveBtn = document.getElementById('editorSaveBtn');
    if (saveBtn) saveBtn.disabled = true;
  } catch (err) {
    setEditorStatus(`Error: ${err.message}`, 'invalid');
    showToast(`Save failed: ${err.message}`, 'error');
  }
}

function setEditorStatus(msg, cls) {
  const el = document.getElementById('editorStatus');
  if (!el) return;
  el.textContent = msg;
  el.className = 'editor-status' + (cls ? ' ' + cls : '');
}

// ---- Env Editor ----
function envInit() {
  const container = document.getElementById('view-env');
  container.innerHTML = `
    <div class="env-editor">
      <div class="env-toolbar">
        <h2 style="font-size:1rem;font-weight:700;margin-right:auto">.env File</h2>
        <button class="btn btn-primary" id="envSaveBtn" disabled>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
          </svg>
          Save
        </button>
        <button class="btn btn-secondary" id="envReloadBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Reload
        </button>
      </div>
      <textarea class="env-textarea" id="envTextarea" spellcheck="false" placeholder="KEY=value&#10;ANOTHER_KEY=value"></textarea>
    </div>
  `;

  document.getElementById('envSaveBtn').addEventListener('click', envSave);
  document.getElementById('envReloadBtn').addEventListener('click', envLoad);

  document.getElementById('envTextarea').addEventListener('input', () => {
    const btn = document.getElementById('envSaveBtn');
    if (btn) btn.disabled = false;
  });

  envLoad();
}
window.envInit = envInit;

async function envLoad() {
  try {
    const { content } = await api('GET', '/api/files/env');
    const textarea = document.getElementById('envTextarea');
    if (textarea) textarea.value = content || '';
  } catch (err) {
    showToast(`Failed to load .env: ${err.message}`, 'error');
  }
}

async function envSave() {
  const textarea = document.getElementById('envTextarea');
  const content = textarea ? textarea.value : '';
  try {
    await api('POST', '/api/files/env', { content });
    showToast('.env file saved', 'success');
    const btn = document.getElementById('envSaveBtn');
    if (btn) btn.disabled = true;
  } catch (err) {
    showToast(`Save failed: ${err.message}`, 'error');
  }
}
