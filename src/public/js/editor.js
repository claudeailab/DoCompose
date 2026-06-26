/* ============================================================
   DoCompose — Compose YAML Editor View
   ============================================================ */

'use strict';

let editorContent = '';
let editorDirty = false;
let cmView = null; // CodeMirror view if available

function editorInit() {
  const container = document.getElementById('view-editor');
  container.innerHTML = `
    <div class="editor-container">
      <div class="editor-toolbar">
        <button class="btn btn-primary" id="editorSaveBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          Save
        </button>
        <button class="btn btn-secondary" id="editorValidateBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Validate
        </button>
        <button class="btn btn-secondary" id="editorReloadBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Reload
        </button>
        <button class="btn btn-secondary" id="editorBackupBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Backup
        </button>
        <span class="editor-status" id="editorStatus"></span>
      </div>
      <div id="cm-editor" style="flex:1;min-height:0;overflow:auto;">
        <textarea class="yaml-textarea" id="editorTextarea" spellcheck="false"></textarea>
      </div>
    </div>
  `;

  document.getElementById('editorSaveBtn').addEventListener('click', editorSave);
  document.getElementById('editorValidateBtn').addEventListener('click', editorValidate);
  document.getElementById('editorReloadBtn').addEventListener('click', editorLoad);
  document.getElementById('editorBackupBtn').addEventListener('click', editorBackup);

  const textarea = document.getElementById('editorTextarea');
  textarea.addEventListener('input', () => {
    editorContent = textarea.value;
    editorDirty = true;
    setEditorStatus('');
  });

  // Try to load CodeMirror from CDN — use textarea fallback if not available
  tryLoadCodeMirror();

  editorLoad();
}
window.editorInit = editorInit;

function tryLoadCodeMirror() {
  // We use CDN scripts which may or may not be available; textarea is always the fallback.
  // CodeMirror 6 requires module bundler or ESM imports — use textarea as reliable fallback.
}

async function editorLoad() {
  setEditorStatus('Loading…');
  try {
    const { content } = await api('GET', '/api/files/compose');
    editorContent = content;
    editorDirty = false;
    const textarea = document.getElementById('editorTextarea');
    if (textarea) textarea.value = content;
    setEditorStatus('Loaded', 'valid');
  } catch (err) {
    setEditorStatus(`Error: ${err.message}`, 'invalid');
    showToast(`Failed to load compose file: ${err.message}`, 'error');
  }
}

async function editorSave() {
  const textarea = document.getElementById('editorTextarea');
  const content = textarea ? textarea.value : editorContent;

  setEditorStatus('Validating…');
  try {
    const valResult = await api('POST', '/api/files/validate', { content });
    if (!valResult.valid) {
      setEditorStatus('Invalid: ' + valResult.error, 'invalid');
      showToast('Compose file is invalid — not saved', 'error');
      return;
    }
  } catch (err) {
    // Validation endpoint may not work inside container without docker — proceed anyway
    console.warn('Validation failed:', err.message);
  }

  setEditorStatus('Saving…');
  try {
    await api('POST', '/api/files/compose', { content, validate: false });
    editorDirty = false;
    setEditorStatus('Saved', 'valid');
    showToast('Compose file saved', 'success');
  } catch (err) {
    setEditorStatus(`Save failed: ${err.message}`, 'invalid');
    showToast(`Save failed: ${err.message}`, 'error');
  }
}

async function editorValidate() {
  const textarea = document.getElementById('editorTextarea');
  const content = textarea ? textarea.value : editorContent;

  setEditorStatus('Validating…');
  try {
    const result = await api('POST', '/api/files/validate', { content });
    if (result.valid) {
      setEditorStatus('Valid', 'valid');
      showToast('Compose file is valid', 'success');
    } else {
      setEditorStatus('Invalid', 'invalid');
      showToast('Invalid: ' + result.error, 'error', 6000);
    }
  } catch (err) {
    setEditorStatus(`Validation error: ${err.message}`, 'invalid');
  }
}

async function editorBackup() {
  try {
    const { filename } = await api('POST', '/api/backups');
    showToast(`Backup created: ${filename}`, 'success');
  } catch (err) {
    showToast(`Backup failed: ${err.message}`, 'error');
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
        <button class="btn btn-primary" id="envSaveBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
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
  } catch (err) {
    showToast(`Save failed: ${err.message}`, 'error');
  }
}
