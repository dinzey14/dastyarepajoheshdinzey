/**
 * title-fix.js — تکمیل مدیریت عنوان پروژه
 * - نمایش درست در Recent Projects
 * - ذخیرهٔ فایل پشتیبان با عنوان پروژه (نه pid)
 * - rename خودکار فایل هنگام تغییر عنوان
 */
(function () {
  'use strict';

  function getPid() { return window.projectId || 'default'; }

  // ─── خواندن عنوان پروژه از هر منبع ───
  function getProjectTitle(pid) {
    pid = pid || getPid();
    if (pid === getPid() && window.researchInfo && window.researchInfo.title && String(window.researchInfo.title).trim()) {
      return String(window.researchInfo.title).trim();
    }
    try {
      var raw = localStorage.getItem('research_app_v8_' + pid);
      if (raw) {
        var p = JSON.parse(raw);
        if (p && p.info && p.info.title && String(p.info.title).trim()) return String(p.info.title).trim();
      }
    } catch (e) {}
    try {
      var rawInfo = localStorage.getItem('research_info_v8_' + pid);
      if (rawInfo) {
        var pi = JSON.parse(rawInfo);
        if (pi && pi.title && String(pi.title).trim()) return String(pi.title).trim();
      }
    } catch (e) {}
    if (pid === 'default') return 'پروژه نمونه';
    return pid;
  }

  // ─── نام امن فایل ───
  function safeFileName(title) {
    title = String(title || '').trim() || 'پروژه';
    return title.replace(/[\\\/:*?"<>|\x00-\x1f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80) || 'پروژه';
  }

  function pidFileName(pid) {
    var p = String(pid || 'default').replace(/[^a-zA-Z0-9\u0600-\u06FF_\-]/g, '_').slice(0, 80);
    return (p || 'default') + '.json';
  }

  // ============================================================
  // ۱. patch Recent Projects (نمایش «پروژه نمونه»)
  // ============================================================
  var RECENT_KEY = 'ux_recent_projects';

  function patchRecentProjects() {
    try {
      var raw = localStorage.getItem(RECENT_KEY);
      if (!raw) return;
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return;
      var changed = false;
      arr = arr.map(function (p) {
        if (!p || !p.id) return p;
        var newTitle = getProjectTitle(p.id);
        if (newTitle && newTitle !== p.title) {
          changed = true;
          return { id: p.id, title: newTitle, at: p.at || Date.now() };
        }
        return p;
      });
      if (changed) {
        localStorage.setItem(RECENT_KEY, JSON.stringify(arr));
        console.log('[title-fix] Recent projects updated');
        // اگر صفحهٔ خالی هست، rerender کن
        if (window.pages && window.pages.length === 0 && window.renderAll) {
          try { window.renderAll(); } catch (e) {}
        }
      }
    } catch (e) {}
  }

  // ============================================================
  // ۲. ذخیرهٔ فایل پشتیبان با عنوان (نه pid)
  // ============================================================
  function patchSaveToFolder() {
    var original = window.saveToFolder;
    if (typeof original !== 'function') return;

    window.__originalSaveToFolder = original;

    window.saveToFolder = async function () {
      if (!window.projectFolderHandle) return false;

      try {
        // اسم جدید بر اساس عنوان
        var title = getProjectTitle();
        var newFileName = safeFileName(title) + '.json';

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

        // فایل جدید رو بنویس
        var fh = await window.projectFolderHandle.getFileHandle(newFileName, { create: true });
        var w = await fh.createWritable();
        await w.write(JSON.stringify(data, null, 2));
        await w.close();

        // فایل‌های قدیمی رو حذف کن
        var oldPidFile = pidFileName(getPid());
        if (oldPidFile !== newFileName) {
          try { await window.projectFolderHandle.removeEntry(oldPidFile); } catch (e) {}
        }
        // حذف default.json هم اگه اسم جدید فرق می‌کنه
        if (getPid() === 'default' && newFileName !== 'default.json') {
          try { await window.projectFolderHandle.removeEntry('default.json'); } catch (e) {}
        }

        return true;
      } catch (e) {
        console.error('[title-fix] saveToFolder error:', e);
        // اگه خطا داد، از نسخهٔ اصلی استفاده کن
        return original.apply(window, arguments);
      }
    };
  }

  // ============================================================
  // ۳. patch loadFromFolder (اول با عنوان، بعد با pid)
  // ============================================================
  function patchLoadFromFolder() {
    var original = window.loadFromFolder;
    if (typeof original !== 'function') return;

    window.loadFromFolder = async function () {
      if (!window.projectFolderHandle) return false;

      // ۱. اول با اسم عنوان امتحان کن
      try {
        var title = getProjectTitle();
        var newFileName = safeFileName(title) + '.json';
        var fh = await window.projectFolderHandle.getFileHandle(newFileName);
        var file = await fh.getFile();
        var data = JSON.parse(await file.text());
        if (data.pages && Array.isArray(data.pages)) {
          applyLoadedData(data);
          console.log('[title-fix] loaded from: ' + newFileName);
          return true;
        }
      } catch (e) {}

      // ۲. اگه پیدا نشد، از نسخهٔ اصلی (pid.json)
      return original.apply(window, arguments);
    };

    function applyLoadedData(data) {
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
    }
  }

  // ============================================================
  // ۴. patch تغییر عنوان — rename فایل
  // ============================================================
  function patchEditTitle() {
    var original = window.__pt_editTitle;
    if (typeof original !== 'function') return;

    window.__pt_editTitle = async function (pid) {
      // قبل از تغییر، اسم قدیمی
      var oldTitle = getProjectTitle(pid);
      var oldFileName = safeFileName(oldTitle) + '.json';
      var oldPidFile = pidFileName(pid);

      // تغییر عنوان
      var result = await original.apply(this, arguments);

      // بعد از تغییر، اگه پروژه فعلی و پوشه متصل — rename کن
      if (pid === getPid() && window.projectFolderHandle) {
        setTimeout(async function () {
          try {
            var newFileName = safeFileName(getProjectTitle(pid)) + '.json';

            if (oldFileName !== newFileName) {
              try { await window.projectFolderHandle.removeEntry(oldFileName); } catch (e) {}
            }
            if (oldPidFile !== newFileName) {
              try { await window.projectFolderHandle.removeEntry(oldPidFile); } catch (e) {}
            }
            if (getPid() === 'default' && newFileName !== 'default.json') {
              try { await window.projectFolderHandle.removeEntry('default.json'); } catch (e) {}
            }

            // فایل جدید رو بنویس
            if (window.saveToFolder) await window.saveToFolder();
            console.log('[title-fix] file renamed to: ' + newFileName);
          } catch (e) { console.error('[title-fix] rename error:', e); }
        }, 300);
      }

      // Recent رو آپدیت کن
      patchRecentProjects();

      return result;
    };
  }

  // ============================================================
  // ۵. patch مدیریت پروژه‌ها (نمایش درست در Recent)
  // ============================================================
  function patchRecentRenderInEmptyState() {
    // وقتی پروژه‌ها خالی هستن، Recent Projects رو با عنوان واقعی نشون بده
    var original = window.__ux_renderRecentProjects || null;
    // این تابع internal هست؛ فقط recent storage رو sync می‌کنیم
    patchRecentProjects();
  }

  // ============================================================
  // Boot
  // ============================================================
  function boot() {
    patchRecentProjects();
    patchSaveToFolder();
    patchLoadFromFolder();
    patchEditTitle();

    // هر ۳ ثانیه recent رو sync کن
    setInterval(patchRecentProjects, 3000);

    console.log('✅ title-fix ready (file name = project title · recent sync)');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 2500); });
  } else {
    setTimeout(boot, 2500);
  }
})();