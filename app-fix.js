/**
 * app-fix.js — نسخهٔ نهایی (بدون تداخل + عنوان‌محور)
 * - نام فایل بر اساس عنوان پروژه (نه pid)
 * - حذف خودکار فایل قدیمی هنگام تغییر عنوان
 * - Loading Overlay در بارگذاری اولیه
 * - ذخیره‌سازی سریع و پایدار
 */
(function () {
  'use strict';

  var APP_NAME = 'دستیار پژوهش دینزی';
  var lastKnownFileName = null;
  var initialLoadDone = false;

  function getPid() { return window.projectId || 'default'; }

  // ─── عنوان پروژه (از هر منبع) ───
  function getProjectTitle() {
    if (window.researchInfo && window.researchInfo.title && String(window.researchInfo.title).trim()) {
      return String(window.researchInfo.title).trim();
    }
    try {
      var rawInfo = localStorage.getItem('research_info_v8_' + getPid());
      if (rawInfo) {
        var pi = JSON.parse(rawInfo);
        if (pi && pi.title && String(pi.title).trim()) return String(pi.title).trim();
      }
    } catch (e) {}
    try {
      var raw = localStorage.getItem('research_app_v8_' + getPid());
      if (raw) {
        var p = JSON.parse(raw);
        if (p && p.info && p.info.title && String(p.info.title).trim()) return String(p.info.title).trim();
      }
    } catch (e) {}
    if (getPid() === 'default') return 'پروژه نمونه';
    return getPid();
  }

  // ─── نام امن فایل ───
  function safeFileName(title) {
    title = String(title || '').trim() || 'پروژه';
    var clean = title.replace(/[\\\/:*?"<>|\x00-\x1f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
    return (clean || 'پروژه') + '.json';
  }

  function legacyPidFileName(pid) {
    var p = String(pid || 'default').replace(/[^a-zA-Z0-9\u0600-\u06FF_\-]/g, '_').slice(0, 80);
    return (p || 'default') + '.json';
  }

  // ============================================================
  // ★ Loading Overlay
  // ============================================================
  function showLoadingOverlay(msg) {
    var ov = document.getElementById('p3-init-loading');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'p3-init-loading';
      ov.style.cssText = 'position:fixed;inset:0;background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);z-index:9999998;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#fff;font-family:Vazirmatn,sans-serif;direction:rtl;transition:opacity 0.4s;';
      ov.innerHTML =
        '<div style="font-size:3rem;margin-bottom:20px;animation:p3-init-pulse 1.4s ease-in-out infinite;">📚</div>' +
        '<div id="p3-init-loading-msg" style="font-size:1rem;font-weight:700;margin-bottom:8px;">' + (msg || 'در حال آماده‌سازی...') + '</div>' +
        '<div style="width:200px;height:4px;background:rgba(255,255,255,0.15);border-radius:10px;overflow:hidden;margin-top:14px;">' +
          '<div style="height:100%;width:0;background:linear-gradient(90deg,#facc15,#f59e0b);border-radius:10px;animation:p3-init-bar 1.6s ease-in-out infinite;"></div>' +
        '</div>' +
        '<style>' +
          '@keyframes p3-init-pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.6;transform:scale(0.94);}}' +
          '@keyframes p3-init-bar{0%{width:0;}50%{width:80%;}100%{width:100%;}}' +
        '</style>';
      document.body.appendChild(ov);
    } else {
      ov.style.display = 'flex';
      ov.style.opacity = '1';
      var m = document.getElementById('p3-init-loading-msg');
      if (m) m.textContent = msg || 'در حال آماده‌سازی...';
    }
  }

  function hideLoadingOverlay() {
    var ov = document.getElementById('p3-init-loading');
    if (!ov) return;
    ov.style.opacity = '0';
    setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 400);
  }

  function setLoadingMsg(msg) {
    var m = document.getElementById('p3-init-loading-msg');
    if (m) m.textContent = msg;
  }

  // ============================================================
  // ★ ذخیره در پوشه
  // ============================================================
  window.saveToFolder = async function () {
    if (!window.projectFolderHandle) return false;
    try {
      var newFileName = safeFileName(getProjectTitle());

      var data = {
        pages: window.pages || [],
        expanded: window.expandedChapters || {},
        info: window.researchInfo || {},
        bibliography: window.projectBibliography || [],
        printSettings: window.printSettings || null,
        glossary: window.glossary || [],
        projectId: getPid(),
        savedAt: new Date().toISOString()
      };

      // ۱. نوشتن در فایل جدید
      var fh = await window.projectFolderHandle.getFileHandle(newFileName, { create: true });
      var w = await fh.createWritable();
      await w.write(JSON.stringify(data, null, 2));
      await w.close();

      // ۲. پاک کردن فایل‌های قدیمی
      var filesToDelete = [];

      // فایل pid
      var pidFile = legacyPidFileName(getPid());
      if (pidFile !== newFileName) filesToDelete.push(pidFile);

      // default.json
      if (newFileName !== 'default.json') filesToDelete.push('default.json');

      // فایل قبلی (اگه اسمش عوض شده)
      if (lastKnownFileName && lastKnownFileName !== newFileName) {
        filesToDelete.push(lastKnownFileName);
      }

      for (var i = 0; i < filesToDelete.length; i++) {
        try {
          await window.projectFolderHandle.removeEntry(filesToDelete[i]);
          console.log('[app-fix] deleted old file: ' + filesToDelete[i]);
        } catch (e) {
          // فایل وجود نداره یا پاک شدنی نیست — مشکلی نیست
        }
      }

      lastKnownFileName = newFileName;
      return true;
    } catch (e) {
      console.error('[app-fix] saveToFolder error:', e);
      return false;
    }
  };

  // ============================================================
  // ★ بارگذاری از پوشه (چند مسیر رو امتحان می‌کنه)
  // ============================================================
  window.loadFromFolder = async function () {
    if (!window.projectFolderHandle) return false;

    var candidates = [];

    // ۱. اول اسم فعلی (بر اساس عنوان)
    candidates.push(safeFileName(getProjectTitle()));

    // ۲. آخرین فایل شناخته‌شده
    if (lastKnownFileName) candidates.push(lastKnownFileName);

    // ۳. pid.json
    candidates.push(legacyPidFileName(getPid()));

    // ۴. default.json
    if (candidates.indexOf('default.json') === -1) candidates.push('default.json');

    // حذف تکراری
    candidates = candidates.filter(function (v, i, a) { return a.indexOf(v) === i; });

    for (var i = 0; i < candidates.length; i++) {
      var fileName = candidates[i];
      try {
        var fh = await window.projectFolderHandle.getFileHandle(fileName);
        var file = await fh.getFile();
        var text = await file.text();
        var data = JSON.parse(text);
        if (!data.pages || !Array.isArray(data.pages)) continue;

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
        if (data.printSettings) window.printSettings = Object.assign(window.printSettings || {}, data.printSettings);
        if (data.glossary) window.glossary = data.glossary;
        if (window.syncNextId) window.syncNextId();

        lastKnownFileName = fileName;
        console.log('[app-fix] loaded from: ' + fileName + ' (' + data.pages.length + ' pages)');
        return true;
      } catch (e) {
        // فایل وجود نداره — برو بعدی
      }
    }
    return false;
  };

  // ============================================================
  // ★ saveData — سریع + تأخیری برای پوشه
  // ============================================================
  var folderSaveT = null;
  window.saveData = function () {
    var el = document.getElementById('saveIndicator');
    if (el) el.textContent = '💾';

    try {
      var pid = getPid();
      var payload = {
        pages: window.pages || [],
        expanded: window.expandedChapters || {},
        info: window.researchInfo || {},
        bibliography: window.projectBibliography || [],
        glossary: window.glossary || [],
        printSettings: window.printSettings || null,
        version: 'app-fix-v3',
        lastModified: Date.now()
      };
      localStorage.setItem('research_app_v8_' + pid, JSON.stringify(payload));
      localStorage.setItem('research_info_v8_' + pid, JSON.stringify(window.researchInfo || {}));
      if (el) { el.textContent = '✅'; el.style.color = '#10b981'; setTimeout(function(){ el.style.color = ''; }, 1000); }
    } catch (e) { console.warn('[app-fix] ls save error:', e); }

    clearTimeout(folderSaveT);
    folderSaveT = setTimeout(function () {
      if (window.projectFolderHandle) window.saveToFolder().catch(function(){});
    }, 700);
  };

  // ============================================================
  // ★ updateNodeContent
  // ============================================================
  var nodeT = null, statsT = null;
  window.updateNodeContent = function (id, html) {
    var p = window.pages && window.pages[window.currentPageIndex];
    if (!p) return;
    var n = window.findNode ? window.findNode(p.tree, id) : null;
    if (!n) return;
    n.content = html;
    n.updatedAt = new Date().toISOString();
    var el = document.getElementById('saveIndicator');
    if (el) el.textContent = '💾';
    clearTimeout(nodeT);
    nodeT = setTimeout(function () { window.saveData(); }, 1000);
    clearTimeout(statsT);
    statsT = setTimeout(function () { if (window.updateStats) window.updateStats(); }, 4000);
  };

  // ============================================================
  // ★ forceConnectFolder
  // ============================================================
  window.forceConnectFolder = async function () {
    if (!window.showDirectoryPicker) { alert('مرورگر پشتیبانی نمی‌کند.'); return; }
    try {
      showLoadingOverlay('منتظر انتخاب پوشه...');
      var handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      if (!handle) { hideLoadingOverlay(); return; }

      showLoadingOverlay('در حال بارگذاری پروژه...');
      window.projectFolderHandle = handle;
      window.folderConnected = true;

      // امتحان کن از پوشه لود کنی
      var loaded = false;
      try { loaded = await window.loadFromFolder(); } catch (e) { console.warn(e); }

      if (!loaded) {
        // پوشه خالیه — از localStorage بازیابی کن
        setLoadingMsg('بازیابی از حافظهٔ داخلی...');
        try {
          var saved = localStorage.getItem('research_app_v8_' + getPid());
          if (saved) {
            var d = JSON.parse(saved);
            if (d.pages && d.pages.length > 0) {
              window.pages = d.pages;
              window.pages.forEach(function (p) { if (window.ensurePageCards) window.ensurePageCards(p); });
              if (d.info) {
                window.researchInfo = d.info;
                var t = document.getElementById('researchTitle'); if (t) t.value = d.info.title || '';
                var r = document.getElementById('researcherName'); if (r) r.value = d.info.researcher || '';
                var s = document.getElementById('supervisorName'); if (s) s.value = d.info.supervisor || '';
              }
              if (d.bibliography) window.projectBibliography = d.bibliography;
              if (window.syncNextId) window.syncNextId();
            }
          }
        } catch (e) {}
      }

      // رندر
      setLoadingMsg('آماده‌سازی نمایش...');
      if (window.syncNextId) window.syncNextId();
      if (window.renderAll) window.renderAll();

      // آپدیت Recent
      try {
        var recents = JSON.parse(localStorage.getItem('ux_recent_projects') || '[]');
        recents = recents.filter(function (p) { return p.id !== getPid(); });
        var title = getProjectTitle();
        recents.unshift({ id: getPid(), title: title, at: Date.now() });
        localStorage.setItem('ux_recent_projects', JSON.stringify(recents.slice(0, 5)));
      } catch (e) {}

      if (window.updateFolderStatus) window.updateFolderStatus();
      var ov = document.getElementById('forceFolderOverlay');
      if (ov) ov.classList.remove('show');

      // یک ثانیه صبر کن تا UI پایدار بشه
      await new Promise(function (r) { setTimeout(r, 500); });
      hideLoadingOverlay();
      initialLoadDone = true;
      if (window.showToast) window.showToast('✅ آماده');
    } catch (e) {
      hideLoadingOverlay();
      if (e.name !== 'AbortError') alert('خطا: ' + e.message);
    }
  };

  // ============================================================
  // ★ changeFolderPath
  // ============================================================
  window.changeFolderPath = async function () {
    if (!window.showDirectoryPicker) { alert('مرورگر پشتیبانی نمی‌کند.'); return; }
    try {
      showLoadingOverlay('منتظر انتخاب پوشه...');
      var handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      if (!handle) { hideLoadingOverlay(); return; }

      setLoadingMsg('ذخیره در پوشهٔ فعلی...');
      // ذخیره در پوشهٔ قدیم
      if (window.projectFolderHandle) {
        try { await window.saveToFolder(); } catch (e) {}
      }

      window.projectFolderHandle = handle;
      window.folderConnected = true;
      lastKnownFileName = null;

      setLoadingMsg('بارگذاری از پوشهٔ جدید...');
      var loaded = false;
      try { loaded = await window.loadFromFolder(); } catch (e) {}

      if (!loaded) {
        setLoadingMsg('ذخیره در پوشهٔ جدید...');
        await window.saveToFolder();
      }

      if (window.updateFolderStatus) window.updateFolderStatus();
      if (window.renderAll) window.renderAll();

      await new Promise(function (r) { setTimeout(r, 400); });
      hideLoadingOverlay();
      if (window.showToast) window.showToast('✅ پوشه تغییر کرد');
    } catch (e) {
      hideLoadingOverlay();
      if (e.name !== 'AbortError') alert('خطا: ' + e.message);
    }
  };

  // ============================================================
  // ★ Rename فایل هنگام تغییر عنوان
  // ============================================================
  window.__af_renameOnTitleChange = async function (oldTitle, newTitle) {
    if (!window.projectFolderHandle) return;
    try {
      var newFileName = safeFileName(newTitle);
      var oldFileName = safeFileName(oldTitle);
      if (newFileName === oldFileName) return;

      // پاک کردن فایل قدیمی
      try {
        await window.projectFolderHandle.removeEntry(oldFileName);
        console.log('[app-fix] deleted: ' + oldFileName);
      } catch (e) {}

      // فایل pid هم پاک کن
      try {
        await window.projectFolderHandle.removeEntry(legacyPidFileName(getPid()));
      } catch (e) {}

      // ذخیره با نام جدید
      await window.saveToFolder();
      console.log('[app-fix] renamed to: ' + newFileName);
    } catch (e) {
      console.error('[app-fix] rename error:', e);
    }
  };

  // ============================================================
  // ★ دکمه‌ها
  // ============================================================
  function addFolderButton() {
    var actions = document.querySelector('.panel-toolbar .actions');
    if (!actions || actions.querySelector('[data-app-folder]')) return;
    var btn = document.createElement('button');
    btn.setAttribute('data-app-folder', '1');
    btn.title = 'تغییر مسیر پوشه ذخیره';
    btn.style.cssText = 'background:#0891b2;color:#fff;';
    btn.textContent = '📁 مسیر پوشه';
    btn.onclick = window.changeFolderPath;
    actions.appendChild(btn);
  }

  // ============================================================
  // ★ زیربخش‌ها
  // ============================================================
  function injectSubButtons() {
    var page = window.pages && window.pages[window.currentPageIndex];
    if (!page) return;
    var nodes = document.querySelectorAll('.tree-node');
    for (var i = 0; i < nodes.length; i++) {
      var nodeEl = nodes[i];
      if (nodeEl.querySelector('.uf-sub-btn')) continue;
      var nodeId = nodeEl.dataset.nodeId;
      var node = window.findNode ? window.findNode(page.tree, nodeId) : null;
      if (!node || node.type === 'chapter') continue;
      var wrapper = nodeEl.querySelector('.tree-content-editor-wrapper');
      if (!wrapper) continue;
      var btn = document.createElement('button');
      btn.className = 'uf-sub-btn';
      btn.type = 'button';
      btn.style.cssText = 'display:block;margin:6px 4px 4px 4px;background:#e0f2fe;border:1px dashed #7dd3fc;color:#0369a1;padding:5px 14px;border-radius:8px;font-family:Vazirmatn,sans-serif;font-size:0.7rem;cursor:pointer;font-weight:600;';
      btn.textContent = '➕ افزودن زیربخش به «' + (node.title || '').slice(0, 40) + '»';
      btn.onclick = (function (nid) {
        return function (e) {
          e.stopPropagation();
          e.preventDefault();
          if (window.openModalForNode) window.openModalForNode(nid);
        };
      })(nodeId);
      wrapper.appendChild(btn);
    }
  }

  var origRP = window.renderPages;
  if (typeof origRP === 'function') {
    window.renderPages = function () {
      var r = origRP.apply(this, arguments);
      setTimeout(injectSubButtons, 60);
      setTimeout(injectSubButtons, 300);
      return r;
    };
  }

  // ============================================================
  // ★ focus caret
  // ============================================================
  document.addEventListener('click', function (e) {
    var ed = e.target.closest && e.target.closest('.tree-content-editor');
    if (!ed) return;
    setTimeout(function () {
      if (document.activeElement !== ed) { try { ed.focus(); } catch (e) {} }
    }, 5);
  }, true);

  // ============================================================
  // ★ customPrompt focus
  // ============================================================
  var origCP = window.customPrompt;
  if (typeof origCP === 'function') {
    window.customPrompt = function (msg, def) {
      var p = origCP(msg, def);
      var inp = document.getElementById('cpInput');
      if (inp) { try { inp.focus(); inp.select(); } catch (e) {} }
      return p;
    };
  }

  // ============================================================
  // ★ Boot
  // ============================================================
  function boot() {
    if (document.title !== APP_NAME) document.title = APP_NAME;
    setTimeout(function () { if (document.title !== APP_NAME) document.title = APP_NAME; }, 1500);

    // غیرفعال کردن بازیابی خودکار (خودمون مدیریت می‌کنیم)
    window.restoreFolderOnLoad = async function () { return false; };
    window.restoreFolder = async function () {};

    // نمایش overlay
    var ov = document.getElementById('forceFolderOverlay');
    if (ov && !window.projectFolderHandle) {
      ov.classList.add('show');
    }

    if (window.projectFolderHandle) {
      var btn = document.getElementById('folderBtn');
      if (btn) { btn.textContent = '📁 ' + window.projectFolderHandle.name; btn.style.background = '#16a34a'; }
    }

    addFolderButton();
    setTimeout(injectSubButtons, 500);
    setTimeout(injectSubButtons, 1500);

    console.log('✅ app-fix v3 ready (title-based filename · loading overlay)');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 200); });
  } else {
    setTimeout(boot, 200);
  }
})();