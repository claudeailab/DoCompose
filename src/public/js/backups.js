/* ============================================================
   DoCompose — Backups View
   ============================================================ */

'use strict';

function backupsInit() {
  const container = document.getElementById('view-backups');
  container.innerHTML = `
    <div class="view-header">
      <h1 class="view-title">Backups</h1>
      <button class="btn btn-primary" id="createBackupBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Create Backup
      </button>
    </div>
    <div class="backups-container" id="backupsList">
      <div class="loading"><div class="spinner"></div> Loading backups…</div>
    </div>
  `;

  document.getElementById('createBackupBtn').addEventListener('click', createBackup);
  loadBackups();
}
window.backupsInit = backupsInit;

async function loadBackups() {
  const container = document.getElementById('backupsList');
  if (!container) return;

  try {
    const { backups } = await api('GET', '/api/backups');
    renderBackups(backups || []);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><p>Error: ${escHtml(err.message)}</p></div>`;
  }
}

function renderBackups(backups) {
  const container = document.getElementById('backupsList');
  if (!container) return;

  if (!backups.length) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <p>No backups yet. Click "Create Backup" to snapshot your current compose file.</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <table class="backup-table">
      <thead>
        <tr>
          <th>Filename</th>
          <th>Size</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${backups.map((b) => `
          <tr>
            <td><span class="backup-filename">${escHtml(b.filename)}</span></td>
            <td>${formatBytes(b.size)}</td>
            <td>${formatDate(b.createdAt)}</td>
            <td>
              <div style="display:flex;gap:0.4rem;flex-wrap:wrap">
                <button class="btn btn-secondary btn-sm" onclick="restoreBackup('${escHtml(b.filename)}')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px">
                    <polyline points="23 4 23 10 17 10"/>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                  Restore
                </button>
                <a class="btn btn-secondary btn-sm" href="/api/backups/${encodeURIComponent(b.filename)}/download?project=${encodeURIComponent(DC.currentProject)}" download>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download
                </a>
                <button class="btn btn-danger btn-sm" onclick="deleteBackup('${escHtml(b.filename)}')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                  </svg>
                  Delete
                </button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function createBackup() {
  try {
    const { filename } = await api('POST', '/api/backups');
    showToast(`Backup created: ${filename}`, 'success');
    loadBackups();
  } catch (err) {
    showToast(`Backup failed: ${err.message}`, 'error');
  }
}

async function restoreBackup(filename) {
  const ok = await dcConfirm(
    `Restore backup "${filename}"? This will overwrite your current compose file.`,
    'Restore Backup'
  );
  if (!ok) return;

  try {
    const qs = DC.currentProject ? `?project=${encodeURIComponent(DC.currentProject)}` : '';
    await fetch(`/api/backups/${encodeURIComponent(filename)}/restore${qs}`, { method: 'POST' }).then((r) => r.json());
    showToast('Backup restored successfully', 'success');
  } catch (err) {
    showToast(`Restore failed: ${err.message}`, 'error');
  }
}
window.restoreBackup = restoreBackup;

async function deleteBackup(filename) {
  const ok = await dcConfirm(`Delete backup "${filename}"?`, 'Delete Backup');
  if (!ok) return;

  try {
    const qs = DC.currentProject ? `?project=${encodeURIComponent(DC.currentProject)}` : '';
    await fetch(`/api/backups/${encodeURIComponent(filename)}${qs}`, { method: 'DELETE' });
    showToast('Backup deleted', 'info');
    loadBackups();
  } catch (err) {
    showToast(`Delete failed: ${err.message}`, 'error');
  }
}
window.deleteBackup = deleteBackup;

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
