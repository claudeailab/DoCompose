/* ============================================================
   DoCompose — Images view
   ============================================================ */
'use strict';

function fmtSize(bytes) {
  if (bytes >= 1e9) return (bytes / 1e9).toFixed(2) + ' GB';
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + ' MB';
  if (bytes >= 1e3) return (bytes / 1e3).toFixed(0) + ' KB';
  return bytes + ' B';
}

function fmtAge(unixSeconds) {
  const secs = Math.floor(Date.now() / 1000) - unixSeconds;
  if (secs < 60)   return 'just now';
  if (secs < 3600) return Math.floor(secs / 60) + 'm ago';
  if (secs < 86400) return Math.floor(secs / 3600) + 'h ago';
  const d = Math.floor(secs / 86400);
  if (d < 30)  return d + 'd ago';
  if (d < 365) return Math.floor(d / 30) + 'mo ago';
  return Math.floor(d / 365) + 'y ago';
}

async function imagesInit() {
  const c = document.getElementById('view-images');
  c.innerHTML = `
    <div class="view-header">
      <div class="pane-head">
        <div class="pane-head-text" style="display:flex;align-items:baseline;gap:0.6rem;flex-wrap:wrap">
          <h1 class="pane-title">Images</h1>
          <span class="pane-subtitle">All Docker images on this host</span>
        </div>
        <div class="pane-head-actions">
          <button class="btn btn-secondary" id="imgRefreshBtn" onclick="imagesInit()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            Refresh
          </button>
          <button class="btn btn-danger-outline" id="imgPruneBtn" onclick="pruneImages()" disabled>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
            Prune Unused
          </button>
        </div>
      </div>
    </div>
    <div class="stg-body" id="imagesBody">
      <div class="images-loading">
        <div class="spinner"></div>
        <span>Loading images…</span>
      </div>
    </div>
  `;

  try {
    const { images } = await api('GET', '/api/images');
    renderImages(images);
  } catch (err) {
    document.getElementById('imagesBody').innerHTML = `
      <div class="images-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:40px;height:40px;color:var(--text-muted)"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div>Failed to load images: ${escHtml(err.message)}</div>
      </div>`;
  }
}
window.imagesInit = imagesInit;

function renderImages(images) {
  const body = document.getElementById('imagesBody');
  if (!body) return;

  if (!images || images.length === 0) {
    body.innerHTML = `<div class="images-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:40px;height:40px;color:var(--text-muted)"><rect x="2" y="5" width="20" height="14" rx="2"/></svg>
      <div>No images found</div>
    </div>`;
    return;
  }

  const unused = images.filter((i) => !i.inUse);

  const pruneBtn = document.getElementById('imgPruneBtn');
  if (pruneBtn) pruneBtn.disabled = unused.length === 0;

  const rows = images.map((img) => {
    const tag = img.tags.length > 0 ? img.tags[0] : `<span style="color:var(--text-muted)">&lt;none&gt;</span>`;
    const extraTags = img.tags.length > 1
      ? `<span class="img-extra-tags">+${img.tags.length - 1} more</span>`
      : '';
    const useBadge = img.inUse
      ? `<span class="img-badge in-use">in use</span>`
      : `<span class="img-badge unused">unused</span>`;

    return `
      <tr data-img-id="${escHtml(img.id)}">
        <td class="img-tag-cell">
          <span class="img-tag">${tag}</span>${extraTags}
        </td>
        <td class="img-id-cell"><code>${escHtml(img.shortId)}</code></td>
        <td>${useBadge}</td>
        <td class="img-size">${fmtSize(img.size)}</td>
        <td class="img-age" title="${new Date(img.created * 1000).toLocaleString()}">${fmtAge(img.created)}</td>
        <td class="img-actions">
          ${!img.inUse
            ? `<button class="btn btn-xs btn-danger-outline" onclick="deleteImage('${escHtml(img.id)}', '${escHtml(img.tags[0] || img.shortId)}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                Delete
               </button>`
            : `<span style="color:var(--text-muted);font-size:0.75rem">in use</span>`}
        </td>
      </tr>`;
  }).join('');

  body.innerHTML = `
    <div class="images-table-wrap">
      <table class="images-table">
        <thead>
          <tr>
            <th>Repository / Tag</th>
            <th>Image ID</th>
            <th>Status</th>
            <th>Size</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

async function deleteImage(id, label) {
  const ok = await dcConfirm(`Delete image "${label}"?\nThis cannot be undone.`, 'Delete Image');
  if (!ok) return;
  try {
    await api('DELETE', `/api/images/${encodeURIComponent(id)}`);
    showToast(`Image deleted`, 'success');
    imagesInit();
  } catch (err) {
    showToast(`Delete failed: ${err.message}`, 'error');
  }
}
window.deleteImage = deleteImage;

async function pruneImages() {
  const ok = await dcConfirm(
    'Remove all unused images (not referenced by any container)?',
    'Prune Unused Images'
  );
  if (!ok) return;
  const pruneBtn = document.getElementById('imgPruneBtn');
  if (pruneBtn) { pruneBtn.disabled = true; pruneBtn.textContent = 'Pruning…'; }
  try {
    const { output } = await api('DELETE', '/api/images');
    showToast('Unused images removed', 'success');
    imagesInit();
    if (output) console.log('[prune]', output);
  } catch (err) {
    showToast(`Prune failed: ${err.message}`, 'error');
    if (pruneBtn) { pruneBtn.disabled = false; pruneBtn.textContent = 'Prune Unused'; }
  }
}
window.pruneImages = pruneImages;
