/**
 * project-titles.js — مدیریت عنوان پروژه‌ها
 * - نام نمایشی «پروژه نمونه» برای پروژهٔ پیش‌فرض
 * - ویرایش عنوان همهٔ پروژه‌ها
 */
(function () {
  'use strict';

  function getPid() { return window.projectId || 'default'; }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ─── نام نمایشی پروژه ───
  function getProjectDisplayName(pid) {
    if (!pid) return 'پروژه';
    // اول از data (چون معمولاً کامل‌تره)
    try {
      var key = 'research_app_v8_' + pid;
      var raw = localStorage.getItem(key);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.info && parsed.info.title && String(parsed.info.title).trim()) {
          return String(parsed.info.title).trim();
        }
      }
    } catch (e) {}
    // دوم از info
    try {
      var rawInfo = localStorage.getItem('research_info_v8_' + pid);
      if (rawInfo) {
        var parsedInfo = JSON.parse(rawInfo);
        if (parsedInfo && parsedInfo.title && String(parsedInfo.title).trim()) {
          return String(parsedInfo.title).trim();
        }
      }
    } catch (e) {}
    // fallback
    if (pid === 'default') return 'پروژه نمونه';
    return pid;
  }

  // ─── ذخیرهٔ عنوان پروژه ───
  function setProjectTitle(pid, newTitle) {
    newTitle = String(newTitle || '').trim();
    if (!newTitle) return false;

    // ۱. data
    try {
      var key = 'research_app_v8_' + pid;
      var raw = localStorage.getItem(key);
      var parsed = raw ? JSON.parse(raw) : { pages: [], expanded: {}, info: {} };
      if (!parsed.info) parsed.info = {};
      parsed.info.title = newTitle;
      localStorage.setItem(key, JSON.stringify(parsed));
    } catch (e) { console.error('[pt] data save error:', e); return false; }

    // ۲. info
    try {
      var infoKey = 'research_info_v8_' + pid;
      var rawInfo = localStorage.getItem(infoKey);
      var parsedInfo = rawInfo ? JSON.parse(rawInfo) : {};
      parsedInfo.title = newTitle;
      localStorage.setItem(infoKey, JSON.stringify(parsedInfo));
    } catch (e) { console.warn('[pt] info save error:', e); }

    // ۳. اگه پروژهٔ فعلیه، در حافظه هم آپدیت کن
    if (pid === getPid()) {
      if (!window.researchInfo) window.researchInfo = {};
      window.researchInfo.title = newTitle;
      var t = document.getElementById('researchTitle');
      if (t) t.value = newTitle;
      try { if (window.saveData) window.saveData(); } catch (e) {}
    }

    return true;
  }

  // ─── آپدیت بَج ───
  function updateProjectBadge() {
    var badge = document.getElementById('projectNameBadge');
    if (!badge) return;
    var pid = getPid();
    var name = getProjectDisplayName(pid);
    if (badge.textContent !== name) badge.textContent = name;
    badge.title = 'شناسه: ' + pid;
  }

  // ─── مودال پروژه‌ها (بازنویسی) ───
  function buildProjectsModal() {
    try { if (window.saveData) window.saveData(); } catch (e) {}

    var list = document.getElementById('projectsList');
    if (!list) return;

    var allKeys = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('research_app_v8_') === 0) {
        var pid = k.slice('research_app_v8_'.length);
        try {
          var data = JSON.parse(localStorage.getItem(k));
          var pc = (data && data.pages) ? data.pages.length : 0;
          allKeys.push({ id: pid, title: getProjectDisplayName(pid), pages: pc });
        } catch (e) {
          allKeys.push({ id: pid, title: pid, pages: 0 });
        }
      }
    }

    // مرتب‌سازی — default اول، بقیه الفبا
    allKeys.sort(function (a, b) {
      if (a.id === 'default') return -1;
      if (b.id === 'default') return 1;
      return a.title.localeCompare(b.title);
    });

    if (allKeys.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:14px;color:var(--text-muted);font-size:0.75rem;">پروژه‌ای نیست.</div>';
    } else {
      list.innerHTML = allKeys.map(function (p) {
        var active = (p.id === getPid());
        return '<div style="display:flex;align-items:center;gap:6px;padding:8px 10px;margin-bottom:6px;border-radius:10px;border:1px solid ' + (active ? '#facc15' : 'var(--border-light)') + ';background:' + (active ? '#fef3c7' : 'var(--bg-main)') + ';">' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:0.8rem;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHtml(p.title) + '</div>' +
            '<div style="font-size:0.6rem;color:var(--text-muted);">شناسه: ' + escapeHtml(p.id) + ' · ' + p.pages + ' صفحه</div>' +
          '</div>' +
          (active
            ? '<span style="font-size:0.65rem;color:#166534;background:#bbf7d0;padding:2px 8px;border-radius:30px;">فعال</span>'
            : '<button onclick="__pt_switchProject(\'' + escapeHtml(p.id) + '\')" style="background:var(--primary);color:#fff;border:none;padding:4px 10px;border-radius:30px;font-family:Vazirmatn,sans-serif;font-size:0.65rem;cursor:pointer;">باز کردن</button>') +
          '<button onclick="__pt_editTitle(\'' + escapeHtml(p.id) + '\')" title="ویرایش عنوان" style="background:#0ea5e9;color:#fff;border:none;padding:4px 9px;border-radius:30px;font-family:Vazirmatn,sans-serif;font-size:0.7rem;cursor:pointer;">✏️</button>' +
          '<button onclick="__pt_deleteProject(\'' + escapeHtml(p.id) + '\')" title="حذف" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:0.85rem;padding:0 4px;">✕</button>' +
        '</div>';
      }).join('');
    }

    document.getElementById('newProjectNameInput').value = '';
    document.getElementById('projectsOverlay').classList.add('show');
  }

  // Override
  window.showProjectsModal = buildProjectsModal;

  // ─── باز کردن پروژه ───
  window.__pt_switchProject = function (pid) {
    try { if (window.saveData) window.saveData(); } catch (e) {}
    if (!pid || pid === 'default') {
      window.location.href = window.location.href.split('#')[0];
    } else {
      window.location.hash = encodeURIComponent(pid);
      window.location.reload();
    }
  };

  // ─── حذف پروژه ───
  window.__pt_deleteProject = function (pid) {
    if (pid === getPid()) {
      alert('نمی‌توان پروژه فعلی را حذف کرد. ابتدا به پروژهٔ دیگری بروید.');
      return;
    }
    if (!confirm('پروژه «' + getProjectDisplayName(pid) + '» به‌طور کامل حذف شود؟')) return;
    ['research_app_v8_', 'research_history_v8_', 'research_info_v8_', 'research_bib_', 'research_glossary_', 'research_trcache_', 'research_print_', 'research_theme_', 'research_custom_theme_'].forEach(function (pre) {
      try { localStorage.removeItem(pre + pid); } catch (e) {}
    });
    buildProjectsModal();
    if (window.showToast) window.showToast('🗑️ پروژه حذف شد');
  };

  // ─── ویرایش عنوان ───
  window.__pt_editTitle = async function (pid) {
    var current = getProjectDisplayName(pid);
    var newTitle;

    if (typeof window.customPrompt === 'function') {
      newTitle = await window.customPrompt('عنوان جدید پروژه:', current);
    } else {
      newTitle = prompt('عنوان جدید پروژه:', current);
    }

    if (newTitle === null) return;
    newTitle = String(newTitle).trim();
    if (!newTitle) {
      setTimeout(function () { if (window.alert) window.alert('عنوان نمی‌تواند خالی باشد.'); }, 100);
      return;
    }

    var ok = setProjectTitle(pid, newTitle);
    if (!ok) {
      setTimeout(function () { if (window.alert) window.alert('خطا در ذخیره.'); }, 100);
      return;
    }

        if (pid === getPid()) updateProjectBadge();

    // ★ اگه پروژهٔ فعلیه و پوشه متصل — فایل رو rename کن
    if (pid === getPid() && window.projectFolderHandle && window.__af_renameOnTitleChange) {
      try {
        await window.__af_renameOnTitleChange(current, newTitle);
      } catch (e) { console.warn('rename error:', e); }
    }

    setTimeout(function () { buildProjectsModal(); }, 200);
    if (window.showToast) window.showToast('✅ عنوان تغییر کرد: ' + newTitle);
  };

  // ─── نام‌گذاری پروژهٔ نمونه در اولین اجرا ───
  function initializeDefaultProjectTitle() {
    if (getPid() !== 'default') return;
    var title = String((window.researchInfo && window.researchInfo.title) || '').trim();
    var hasPages = (window.pages && window.pages.length > 0);
    if (title || hasPages) return;

    var newTitle = 'پروژه نمونه';
    if (!window.researchInfo) window.researchInfo = {};
    window.researchInfo.title = newTitle;
    var t = document.getElementById('researchTitle');
    if (t) t.value = newTitle;
    try { if (window.saveData) window.saveData(); } catch (e) {}
    console.log('[pt] ✅ نام پروژه نمونه تنظیم شد');
  }

  // ─── Boot ───
  function boot() {
    initializeDefaultProjectTitle();
    updateProjectBadge();
    setInterval(updateProjectBadge, 3000);
    console.log('✅ project-titles ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 1500); });
  } else {
    setTimeout(boot, 1500);
  }
})();