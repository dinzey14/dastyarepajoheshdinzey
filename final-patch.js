/**
 * final-patch.js — v26
 * - ریست کامل هنگام انتخاب پوشهٔ خالی
 * - پاک کردن Recent Projects و projectId قبلی
 */
(function () {
  'use strict';

  var FOLDER_MARKER = 'dastyar_folder_path';

  function getPid() { return window.projectId || 'default'; }

  function resetEverything() {
    // 1. پاک کردن localStorage پروژه
    var pid = getPid();
    ['research_app_v8_', 'research_info_v8_', 'research_history_v8_',
     'research_bib_', 'research_glossary_', 'research_trcache_'].forEach(function (pre) {
      try { localStorage.removeItem(pre + pid); } catch (e) {}
    });

    // 2. ★ پاک کردن Recent Projects (مشکل اصلی)
    try { localStorage.removeItem('ux_recent_projects'); } catch (e) {}

    // 3. پاک کردن Clipboard History
    try { localStorage.removeItem('ux_clipboard_history'); } catch (e) {}

    // 4. ریست state
    window.pages = [];
    window.currentPageIndex = 0;
    window.researchInfo = { title: '', researcher: '', supervisor: '' };
    window.projectBibliography = [];
    window.expandedChapters = {};
    window.versionHistory = [];
    window.nextId = 1;

    // 5. پاک کردن فیلدهای UI
    var t = document.getElementById('researchTitle'); if (t) t.value = '';
    var r = document.getElementById('researcherName'); if (r) r.value = '';
    var s = document.getElementById('supervisorName'); if (s) s.value = '';

    // 6. آپدیت project badge
    var badge = document.getElementById('projectNameBadge');
    if (badge) badge.textContent = 'default';

    // 7. ★ ریست URL hash به default
    if (window.location.hash) {
      try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch (e) {}
    }
    // ریست متغیر projectId در حافظه
    try { window.projectId = 'default'; } catch (e) {}

    // 8. پاک کردن lastProjectId در تنظیمات Electron
    if (window.__setLastProjectId) {
      try { window.__setLastProjectId(''); } catch (e) {}
    }
  }

  function showLoading(msg) {
    var ov = document.getElementById('uf-loading');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'uf-loading';
      ov.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.9);z-index:9999999;display:none;align-items:center;justify-content:center;flex-direction:column;color:#fff;font-family:Vazirmatn,sans-serif;direction:rtl;';
      ov.innerHTML = '<div style="font-size:3rem;margin-bottom:16px;animation:ufSpin 1.2s linear infinite;">⏳</div>' +
        '<div style="font-size:1rem;font-weight:700;" id="uf-loading-msg"></div>' +
        '<style>@keyframes ufSpin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}</style>';
      document.body.appendChild(ov);
    }
    document.getElementById('uf-loading-msg').textContent = msg || '...';
    ov.style.display = 'flex';
  }
  function hideLoading() {
    var ov = document.getElementById('uf-loading');
    if (ov) ov.style.display = 'none';
  }

  // ============================================================
  // Override forceConnectFolder
  // ============================================================
  window.forceConnectFolder = async function () {
    if (!window.showDirectoryPicker) { alert('مرورگر پشتیبانی نمی‌کند.'); return; }
    try {
      showLoading('منتظر انتخاب پوشه...');
      var handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      if (!handle) { hideLoading(); return; }

      showLoading('در حال بررسی پوشه...');

      window.projectFolderHandle = handle;
      window.folderConnected = true;

      // بررسی: آیا این پوشه قبلاً داده داشته؟
      var fileName = (getPid().replace(/[^a-zA-Z0-9\u0600-\u06FF_\-]/g, '_').slice(0, 80) || 'default') + '.json';
      var hasData = false;
      try {
        await handle.getFileHandle(fileName);
        hasData = true;
      } catch (e) {
        hasData = false;
      }

      if (!hasData) {
        // پوشه خالیه → ریست کامل
        showLoading('در حال آماده‌سازی پروژهٔ جدید...');
        resetEverything();
        if (window.saveToFolder) {
          try { await window.saveToFolder(); } catch (e) {}
        }
      } else {
        // پوشه داده داره → بارگذاری کن
        showLoading('در حال بارگذاری داده‌ها...');
        if (window.loadFromFolder) {
          try { await window.loadFromFolder(); } catch (e) {}
        }
      }

      try { localStorage.setItem(FOLDER_MARKER, handle._path || handle.name || ''); } catch (e) {}

      if (window.updateFolderStatus) window.updateFolderStatus();
      if (window.syncNextId) window.syncNextId();
      if (window.renderAll) window.renderAll();

      var ov = document.getElementById('forceFolderOverlay');
      if (ov) ov.classList.remove('show');

      setTimeout(hideLoading, 250);
      if (window.showToast) window.showToast('✅ آماده');
    } catch (e) {
      hideLoading();
      if (e.name !== 'AbortError') alert('خطا: ' + e.message);
    }
  };

  // ============================================================
  // Override changeFolderPath — همین منطق برای تغییر مسیر
  // ============================================================
  window.changeFolderPath = async function () {
    if (!window.showDirectoryPicker) { alert('مرورگر پشتیبانی نمی‌کند.'); return; }
    var msg = window.projectFolderHandle
      ? 'مسیر جدید ذخیره انتخاب کنید.'
      : 'پوشه‌ای برای ذخیره انتخاب کنید.';
    if (!confirm(msg)) return;
    try {
      var handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      if (!handle) return;

      showLoading('در حال تغییر پوشه...');

      window.projectFolderHandle = handle;
      window.folderConnected = true;

      var fileName = (getPid().replace(/[^a-zA-Z0-9\u0600-\u06FF_\-]/g, '_').slice(0, 80) || 'default') + '.json';
      var hasData = false;
      try {
        await handle.getFileHandle(fileName);
        hasData = true;
      } catch (e) { hasData = false; }

      if (hasData) {
        // پوشه داده داره → بارگذاری کن
        await window.loadFromFolder();
      } else {
        // پوشه خالیه — انتقال یا شروع از صفر
        hideLoading();
        if (window.pages && window.pages.length > 0) {
          if (confirm('پوشهٔ جدید خالی است.\n\nآیا داده‌های فعلی به این پوشه منتقل شود؟')) {
            showLoading('در حال انتقال...');
            await window.saveToFolder();
          } else {
            showLoading('در حال شروع پروژهٔ جدید...');
            resetEverything();
            await window.saveToFolder();
          }
        }
      }

      try { localStorage.setItem(FOLDER_MARKER, handle._path || handle.name || ''); } catch (e) {}
      if (window.updateFolderStatus) window.updateFolderStatus();
      if (window.renderAll) window.renderAll();
      setTimeout(hideLoading, 250);
      if (window.showToast) window.showToast('✅ پوشه تغییر کرد');
    } catch (e) {
      hideLoading();
      if (e.name !== 'AbortError') alert('خطا: ' + e.message);
    }
  };

  console.log('✅ final-patch v26 ready');
})();