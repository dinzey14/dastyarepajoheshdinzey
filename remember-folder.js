/**
 * remember-folder.js — v2 با fallback به localStorage
 */
(function () {
  'use strict';

  var LS_FOLDER_KEY = 'dastyar_last_folder_path';

  function hideOverlay() {
    var ov = document.getElementById('forceFolderOverlay');
    if (ov) ov.classList.remove('show');
  }
  function showOverlay() {
    var ov = document.getElementById('forceFolderOverlay');
    if (ov && !window.projectFolderHandle) ov.classList.add('show');
  }

  async function useHandle(handle, source) {
    if (!handle) return false;
    console.log('[remember] restoring from ' + source + ': ' + handle.name);

    window.projectFolderHandle = handle;
    window.folderConnected = true;

    // ذخیرهٔ مسیر در localStorage برای بار بعد
    if (handle._path) {
      try { localStorage.setItem(LS_FOLDER_KEY, handle._path); } catch (e) {}
    }

    // بارگذاری داده
    var loaded = false;
    if (window.loadFromFolder) {
      try { loaded = await window.loadFromFolder(); } catch (e) { console.warn('[remember] load error:', e); }
    }

    if (window.updateFolderStatus) window.updateFolderStatus();
    if (window.syncNextId) window.syncNextId();
    if (window.renderAll) window.renderAll();
    hideOverlay();

    console.log('[remember] ✅ folder=' + handle.name + ' loaded=' + loaded + ' pages=' + (window.pages || []).length);
    return true;
  }

  async function tryRestore() {
    // ★ روش ۱: از settings.json (main.js)
    if (window.__getLastFolderHandle) {
      try {
        var h1 = await window.__getLastFolderHandle();
        if (h1) return await useHandle(h1, 'settings.json');
      } catch (e) { console.log('[remember] settings.json failed:', e.message); }
    }

    // ★ روش ۲: از localStorage (fallback)
    if (window.__getFolderHandleFromPath) {
      try {
        var savedPath = localStorage.getItem(LS_FOLDER_KEY);
        if (savedPath) {
          console.log('[remember] trying localStorage path: ' + savedPath);
          var h2 = await window.__getFolderHandleFromPath(savedPath);
          if (h2) return await useHandle(h2, 'localStorage');
        }
      } catch (e) { console.log('[remember] localStorage failed:', e.message); }
    }

    console.log('[remember] no saved folder found in any source');
    showOverlay();
    return false;
  }

  // ============================================================
  // ذخیرهٔ مسیر در localStorage بعد از انتخاب دستی
  // ============================================================
  function patchForceConnect() {
    var orig = window.forceConnectFolder;
    if (typeof orig !== 'function') return;
    window.forceConnectFolder = async function () {
      var r = await orig.apply(this, arguments);
      try {
        if (window.projectFolderHandle && window.projectFolderHandle._path) {
          localStorage.setItem(LS_FOLDER_KEY, window.projectFolderHandle._path);
          console.log('[remember] saved path: ' + window.projectFolderHandle._path);
        }
      } catch (e) {}
      return r;
    };
  }

  // ============================================================
  // Boot
  // ============================================================
  function boot() {
    console.log('📌 remember-folder v2 ready');

    // نمایش موقت overlay (که کاربر نگران نشه)
    var ov = document.getElementById('forceFolderOverlay');
    if (ov) ov.classList.add('show');

    patchForceConnect();

    // بعد از ۸۰۰ms تلاش برای بازیابی
    setTimeout(async function () {
      // دیباگ: settings.json چی داره؟
      if (window.__debugSettings) {
        try {
          var info = await window.__debugSettings();
          console.log('[debug] settings.json:', info);
        } catch (e) {}
      }
      await tryRestore();
    }, 800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 200); });
  } else {
    setTimeout(boot, 200);
  }
})();