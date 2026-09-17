/**
 * save-fix.js — نسخهٔ ۲ با auto-save مطمئن
 */
(function () {
  'use strict';

  function getPid() { return window.projectId || 'default'; }

  function fileName() {
    var pid = String(getPid()).replace(/[^a-zA-Z0-9\u0600-\u06FF_\-]/g, '_').slice(0, 80) || 'default';
    return pid + '.json';
  }

  // ============ هستهٔ ذخیره ============
  window.__saveNow = async function (reason) {
    reason = reason || 'auto';
    try {
      var pid = getPid();
      var pgs = window.pages || [];
      var payload = {
        pages: pgs,
        expanded: window.expandedChapters || {},
        info: window.researchInfo || {},
        bibliography: window.projectBibliography || [],
        projectId: pid,
        lastModified: Date.now()
      };
      var jsonStr = JSON.stringify(payload);
      var sizeKB = Math.round(jsonStr.length / 1024);
      console.log('[save:' + reason + '] pages=' + pgs.length + ' size=' + sizeKB + 'KB');

      var lsOk = false, folderOk = false;
      try {
        localStorage.setItem('research_app_v8_' + pid, jsonStr);
        localStorage.setItem('research_info_v8_' + pid, JSON.stringify(window.researchInfo || {}));
        lsOk = true;
      } catch (e) { console.warn('[save] LS failed:', e.message); }

      if (window.projectFolderHandle) {
        try {
          var fh = await window.projectFolderHandle.getFileHandle(fileName(), { create: true });
          var w = await fh.createWritable();
          await w.write(JSON.stringify(payload, null, 2));
          await w.close();
          folderOk = true;
        } catch (e) { console.warn('[save] folder failed:', e.message); }
      }

      // اندیکاتور
      var el = document.getElementById('saveIndicator');
      if (el) {
        if (lsOk || folderOk) {
          el.textContent = '✅';
          el.style.color = '#10b981';
          el.title = 'ذخیره: ' + pgs.length + ' صفحه · ' + sizeKB + 'KB';
          setTimeout(function () { el.style.color = ''; }, 1200);
        } else {
          el.textContent = '⚠️';
          el.style.color = '#dc2626';
        }
      }
      return { ls: lsOk, folder: folderOk, size: sizeKB, pages: pgs.length };
    } catch (e) { return { ls: false, folder: false, error: e.message }; }
  };

  window.saveData = function () { return window.__saveNow('auto'); };

  window.saveToFolder = async function () {
    var r = await window.__saveNow('folder');
    return r.folder;
  };

  // ============ بارگذاری ============
  window.loadFromFolder = async function () {
    if (!window.projectFolderHandle) return false;
    try {
      var fh = await window.projectFolderHandle.getFileHandle(fileName());
      var file = await fh.getFile();
      var data = JSON.parse(await file.text());
      if (!data.pages || !Array.isArray(data.pages)) return false;
      window.pages = data.pages;
      window.pages.forEach(function (p) {
        if (window.ensurePageCards) window.ensurePageCards(p);
        if (window.traverseTree) window.traverseTree(p.tree, function (n) { if (!n.comments) n.comments = []; });
      });
      window.expandedChapters = data.expanded || {};
      if (data.info) {
        window.researchInfo = data.info;
        var t = document.getElementById('researchTitle'); if (t) t.value = data.info.title || '';
        var r = document.getElementById('researcherName'); if (r) r.value = data.info.researcher || '';
        var s = document.getElementById('supervisorName'); if (s) s.value = data.info.supervisor || '';
      }
      if (data.bibliography) window.projectBibliography = data.bibliography;
      if (window.syncNextId) window.syncNextId();
      console.log('[load] pages=' + data.pages.length);
      return true;
    } catch (e) {
      if (e.name !== 'NotFoundError') console.error('[load]', e);
      return false;
    }
  };

  // ============ auto-save — با override توابع ============
  // هر عملیات مهم رو wrap کن تا بعدش ذخیره بشه
  var saveDebounceT = null;
  function triggerSave(reason) {
    clearTimeout(saveDebounceT);
    saveDebounceT = setTimeout(function () { window.__saveNow(reason); }, 400);
  }

  function wrapFunction(name, reason) {
    if (typeof window[name] !== 'function') return;
    var orig = window[name];
    window[name] = function () {
      var r = orig.apply(this, arguments);
      triggerSave(reason);
      return r;
    };
  }

  // توابعی که تغییرات مهم می‌سازن
  setTimeout(function () {
    wrapFunction('addNewPage', 'add-page');
    wrapFunction('addNewPageAfterCurrent', 'add-page');
    wrapFunction('confirmAddNode', 'add-node');
    wrapFunction('confirmCard', 'add-card');
    wrapFunction('deleteCard', 'del-card');
    wrapFunction('deleteNode', 'del-node');
    wrapFunction('deletePage', 'del-page');
    wrapFunction('movePageUp', 'move');
    wrapFunction('movePageDown', 'move');
    wrapFunction('moveNodeUp', 'move');
    wrapFunction('moveNodeDown', 'move');
    wrapFunction('confirmAddBib', 'bib');
    wrapFunction('deleteBibItem', 'bib');
    wrapFunction('confirmInsertImage', 'img');
    wrapFunction('confirmInsertTable', 'tbl');
    wrapFunction('openTagModal', 'tag');
    wrapFunction('openStatusModal', 'status');
    wrapFunction('editNodeTitle', 'title');
    wrapFunction('updateNodeNotes', 'notes');
    wrapFunction('toggleChecklistItem', 'check');
    wrapFunction('addChecklistItem', 'check');
    wrapFunction('deleteChecklistItem', 'check');
    wrapFunction('toggleNodeExpanded', 'expand');
    console.log('✅ auto-save wrappers installed');
  }, 800);

  // fallback: هر ۵ ثانیه چک کن
  setInterval(function () {
    var pgs = window.pages || [];
    try {
      var stored = localStorage.getItem('research_app_v8_' + getPid());
      var storedData = stored ? JSON.parse(stored) : null;
      var storedPages = storedData && storedData.pages ? storedData.pages.length : 0;
      if (pgs.length !== storedPages) {
        window.__saveNow('interval-check');
      }
    } catch (e) {}
  }, 5000);

  // ============ انتخاب پوشه ============
  window.forceConnectFolder = async function () {
    if (!window.showDirectoryPicker) { alert('مرورگر پشتیبانی نمی‌کند.'); return; }
    try {
      var handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      if (!handle) return;
      window.projectFolderHandle = handle;
      window.folderConnected = true;

      var hasData = false;
      try { await handle.getFileHandle(fileName()); hasData = true; } catch (e) { hasData = false; }

      if (hasData) {
        await window.loadFromFolder();
        if (window.renderAll) window.renderAll();
      } else {
        if (!window.pages || window.pages.length === 0) {
          try {
            var saved = localStorage.getItem('research_app_v8_' + getPid());
            if (saved) {
              var d = JSON.parse(saved);
              if (d.pages && d.pages.length > 0) {
                window.pages = d.pages;
                if (d.info) {
                  window.researchInfo = d.info;
                  var t = document.getElementById('researchTitle'); if (t) t.value = d.info.title || '';
                  var r = document.getElementById('researcherName'); if (r) r.value = d.info.researcher || '';
                  var s = document.getElementById('supervisorName'); if (s) s.value = d.info.supervisor || '';
                }
                if (d.bibliography) window.projectBibliography = d.bibliography;
                if (window.syncNextId) window.syncNextId();
                if (window.renderAll) window.renderAll();
              }
            }
          } catch (e) {}
        }
        await window.__saveNow('init-folder');
      }

      try {
        var recents = JSON.parse(localStorage.getItem('ux_recent_projects') || '[]');
        recents = recents.filter(function (p) { return p.id !== getPid(); });
        var title = (window.researchInfo && window.researchInfo.title) || 'بدون عنوان';
        recents.unshift({ id: getPid(), title: title, at: Date.now() });
        localStorage.setItem('ux_recent_projects', JSON.stringify(recents.slice(0, 5)));
      } catch (e) {}

      if (window.updateFolderStatus) window.updateFolderStatus();
      var ov = document.getElementById('forceFolderOverlay');
      if (ov) ov.classList.remove('show');
      if (window.showToast) window.showToast('✅ پوشه متصل شد · ' + (window.pages || []).length + ' صفحه');
    } catch (e) {
      if (e.name !== 'AbortError') alert('خطا: ' + e.message);
    }
  };

  window.changeFolderPath = async function () {
    if (!window.showDirectoryPicker) { alert('مرورگر پشتیبانی نمی‌کند.'); return; }
    try {
      var handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      if (!handle) return;
      if (window.projectFolderHandle) await window.__saveNow('switch-old');
      window.projectFolderHandle = handle;
      window.folderConnected = true;
      var loaded = false;
      try { loaded = await window.loadFromFolder(); } catch (e) {}
      if (!loaded) await window.__saveNow('switch-new');
      else if (window.renderAll) window.renderAll();
      if (window.updateFolderStatus) window.updateFolderStatus();
      if (window.showToast) window.showToast('✅ پوشه تغییر کرد');
    } catch (e) {
      if (e.name !== 'AbortError') alert('خطا: ' + e.message);
    }
  };

  // ============ دکمهٔ ذخیره ============
  function addSaveButton() {
    var actions = document.querySelector('.panel-toolbar .actions');
    if (!actions || actions.querySelector('[data-save-btn]')) return;
    var btn = document.createElement('button');
    btn.setAttribute('data-save-btn', '1');
    btn.title = 'ذخیرهٔ فوری (Ctrl+S)';
    btn.style.cssText = 'background:#16a34a;color:#fff;font-weight:700;';
    btn.textContent = '💾 ذخیره';
    btn.onclick = async function () {
      var r = await window.__saveNow('button');
      if (r.ls || r.folder) {
        if (window.showToast) window.showToast('✅ ' + r.pages + ' صفحه · ' + r.size + 'KB');
      } else {
        alert('❌ ذخیره نشد');
      }
    };
    actions.insertBefore(btn, actions.firstChild);
  }

  // ============ دکمهٔ دیباگ (پنل کوچک) ============
  function addDebugButton() {
    var actions = document.querySelector('.panel-toolbar .actions');
    if (!actions || actions.querySelector('[data-dbg-btn]')) return;
    var btn = document.createElement('button');
    btn.setAttribute('data-dbg-btn', '1');
    btn.title = 'نمایش وضعیت ذخیره';
    btn.style.cssText = 'background:#334155;color:#fff;';
    btn.textContent = '🔍 وضعیت';
    btn.onclick = function () {
      var pgs = window.pages || [];
      var lsPages = -1, lsSize = 0;
      try {
        var raw = localStorage.getItem('research_app_v8_' + getPid());
        if (raw) { lsSize = Math.round(raw.length / 1024); lsPages = JSON.parse(raw).pages.length; }
      } catch (e) {}
      var info = 'project: ' + getPid() + '\n' +
        'pages(mem): ' + pgs.length + '\n' +
        'pages(LS): ' + lsPages + '\n' +
        'size: ' + lsSize + 'KB\n' +
        'folder: ' + (window.projectFolderHandle ? '✅' : '❌');
      alert(info);
    };
    actions.insertBefore(btn, actions.firstChild);
  }

  // ============ ذخیره قبل از بستن ============
  window.addEventListener('beforeunload', function () {
    try {
      var payload = {
        pages: window.pages || [],
        expanded: window.expandedChapters || {},
        info: window.researchInfo || {},
        bibliography: window.projectBibliography || [],
        lastModified: Date.now()
      };
      localStorage.setItem('research_app_v8_' + getPid(), JSON.stringify(payload));
    } catch (e) {}
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) window.__saveNow('hidden');
  });

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      window.__saveNow('ctrl-s').then(function (r) {
        if (window.showToast) window.showToast('✅ ' + r.pages + ' صفحه ذخیره شد');
      });
    }
  });
  // ============ غیرفعال کردن auto-restore از patch.js ============
  // ★ patch.js فایل رو با داده خالی overwrite می‌کنه → این جلوش رو می‌گیره
  window.showForceFolder = function () {
    var ov = document.getElementById('forceFolderOverlay');
    if (ov) ov.classList.add('show');
  };

  // ★ blocker: از saveToFolder وقتی داده خالیه جلوگیری کن
  var _origSaveNow = window.__saveNow;
  window.__saveNow = async function (reason) {
    var pgs = window.pages || [];
    var info = window.researchInfo || {};
    var isEmpty = (pgs.length === 0) && (!info.title || info.title.trim() === '');

    // اگه حالت خالیه و داریم به پوشه می‌نویسیم، فقط اگه فایل خالی باشه بنویس
    if (isEmpty && (reason === 'init-folder' || reason === 'folder' || reason === 'switch-old')) {
      if (window.projectFolderHandle) {
        try {
          var fh = await window.projectFolderHandle.getFileHandle(fileName());
          var f = await fh.getFile();
          var existing = JSON.parse(await f.text());
          if (existing && existing.pages && existing.pages.length > 0) {
            console.log('[save:blocked] files has ' + existing.pages.length + ' pages, skipping empty overwrite');
            return { ls: false, folder: false, blocked: true, pages: 0 };
          }
        } catch (e) {
          // فایل وجود نداره → مشکلی نیست
        }
      }
    }
    return _origSaveNow(reason);
  };

  // ============ Boot ============
  function boot() {
    addSaveButton();
    addDebugButton();
    console.log('✅ save-fix v2 ready | pid: ' + getPid() + ' | pages: ' + (window.pages || []).length);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 400); });
  } else {
    setTimeout(boot, 400);
  }
})();