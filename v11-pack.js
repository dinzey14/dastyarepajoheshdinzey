/**
 * v11-pack.js — نسخهٔ ۱.۱
 * - سازمان‌دهی نوار ابزار
 * - ادغام تمرکز + تایپیست
 * - واگرد ۱۰ مرحله‌ای (Ctrl+Z)
 * - نمایش همهٔ یادداشت‌ها/چک‌لیست‌ها/کامنت‌ها
 * - جستجوی هشتگی
 * - پومودورو + هدف کلمات + تخلیه ذهن
 */
(function () {
  'use strict';

  // ============================================================
  // ═══════════ ابزار پایه ═══════════
  // ============================================================
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function esc(s) { return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }

  function showModal(html, maxW) {
    var ov = document.getElementById('v11Modal');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'v11Modal';
      ov.className = 'modal-overlay';
      ov.style.zIndex = '5005';
      ov.innerHTML = '<div class="modal-box" id="v11ModalBox"></div>';
      document.body.appendChild(ov);
      ov.addEventListener('click', function (e) { if (e.target === ov) closeModal(); });
    }
    var box = document.getElementById('v11ModalBox');
    box.style.cssText = 'max-width:' + (maxW || '640px') + ';';
    box.innerHTML = html;
    ov.classList.add('show');
  }
  function closeModal() {
    var ov = document.getElementById('v11Modal');
    if (ov) ov.classList.remove('show');
  }

  // ============================================================
  // ۱. سازمان‌دهی نوار ابزار
  // ============================================================
  function reorganizeToolbar() {
    var actions = document.querySelector('.panel-toolbar .actions');
    if (!actions) return;

    // ═══ حذف دکمه‌های اضافی/بی‌فایده ═══
    var toHide = [
      '🔄',           // ریست
      '🔧',           // تعمیر پاورقی
      '🎯 تمرکز',     // ادغام با تایپیست
      '🎯'            // تایپیست (pack2)
    ];

    // دکمه‌های افزودن فیش و پاورقی و ارجاع از بالا (چون در بخش‌ها هستن)
    var btnTextsToRemove = [
      'افزودن فیش',
      '📎 پاورقی',
      '📖 ارجاع',
      'مسیر پوشه',       // منتقل شد به مودال پروژه‌ها
      'پاک‌کردن',        // پاک کردن صفحه - نادر
      'ریست'
    ];

    var allButtons = actions.querySelectorAll('button');
    allButtons.forEach(function (btn) {
      var txt = (btn.textContent || '').trim();
      var title = btn.getAttribute('title') || '';

      // حذف بر اساس متن
      for (var i = 0; i < btnTextsToRemove.length; i++) {
        if (txt.indexOf(btnTextsToRemove[i]) !== -1) {
          btn.style.display = 'none';
          return;
        }
      }

      // حذف پاورقی/ارجاع/تعمیر بر اساس title
      if (title.indexOf('پاورقی') !== -1 && title.indexOf('افزودن') !== -1) { btn.style.display = 'none'; return; }
      if (title.indexOf('تعمیر') !== -1) { btn.style.display = 'none'; return; }
      if (title.indexOf('ریست') !== -1) { btn.style.display = 'none'; return; }
      if (title.indexOf('فیش (') !== -1) { btn.style.display = 'none'; return; } // افزودن فیش از بالا
      if (title.indexOf('درج ارجاع') !== -1) { btn.style.display = 'none'; return; }

      // ادغام تمرکز + تایپیست
      if (txt === '🎯' || txt === '🎯 تمرکز' || title.indexOf('تمرکز') !== -1) {
        btn.style.display = 'none';
      }
      if (txt === '🎯 تایپیست' || title.indexOf('تایپیست') !== -1) {
        btn.style.display = 'none';
      }
    });

    // ═══ دکمه‌های جدید ═══
    if (actions.querySelector('[data-v11]')) return;

    // ۱. تمرکز هوشمند (ادغام تمرکز + تایپیست)
    var focusBtn = document.createElement('button');
    focusBtn.setAttribute('data-v11', 'focus');
    focusBtn.title = 'تمرکز هوشمند — پنهان‌سازی ابزارها + تایپیست';
    focusBtn.style.cssText = 'background:#0f172a;color:#fff;';
    focusBtn.textContent = '🎯 تمرکز';
    focusBtn.onclick = toggleSmartFocus;
    actions.insertBefore(focusBtn, actions.firstChild);

    // ۲. پومودورو
    var pomoBtn = document.createElement('button');
    pomoBtn.setAttribute('data-v11', 'pomodoro');
    pomoBtn.title = 'تایمر پومودورو (۲۵ دقیقه کار / ۵ دقیقه استراحت)';
    pomoBtn.style.cssText = 'background:#dc2626;color:#fff;';
    pomoBtn.textContent = '⏱️ پومودورو';
    pomoBtn.onclick = togglePomodoro;
    actions.insertBefore(pomoBtn, focusBtn.nextSibling);

    // ۳. هدف کلمات
    var goalBtn = document.createElement('button');
    goalBtn.setAttribute('data-v11', 'wordgoal');
    goalBtn.title = 'هدف کلمهٔ روزانه';
    goalBtn.style.cssText = 'background:#10b981;color:#fff;';
    goalBtn.textContent = '🎯 هدف کلمات';
    goalBtn.onclick = openWordGoalModal;
    actions.insertBefore(goalBtn, pomoBtn.nextSibling);

    // ۴. تخلیهٔ ذهن
    var scratchBtn = document.createElement('button');
    scratchBtn.setAttribute('data-v11', 'scratchpad');
    scratchBtn.title = 'تخلیهٔ ذهن — نوشتن سریع افکار موقت';
    scratchBtn.style.cssText = 'background:#f59e0b;color:#fff;';
    scratchBtn.textContent = '📝 تخلیه ذهن';
    scratchBtn.onclick = openScratchpad;
    actions.insertBefore(scratchBtn, goalBtn.nextSibling);

    // ۵. نمایش همه
    var viewerBtn = document.createElement('button');
    viewerBtn.setAttribute('data-v11', 'viewer');
    viewerBtn.title = 'نمایش همهٔ یادداشت‌ها، چک‌لیست‌ها و کامنت‌ها';
    viewerBtn.style.cssText = 'background:#7c3aed;color:#fff;';
    viewerBtn.textContent = '🗂️ نمایش همه';
    viewerBtn.onclick = openUniversalViewer;
    actions.insertBefore(viewerBtn, scratchBtn.nextSibling);

    console.log('✅ [v11] toolbar reorganized');
  }

  // ============================================================
  // ۲. تمرکز هوشمند (ادغام تمرکز + تایپیست)
  // ============================================================
  var smartFocusActive = false;
  var hiddenPanels = { notes: true, checklist: true, comments: true };

  function toggleSmartFocus() {
    smartFocusActive = !smartFocusActive;
    var container = document.getElementById('pageContainer');
    var btn = document.querySelector('[data-v11="focus"]');

    if (smartFocusActive) {
      container.classList.add('focus-mode');
      btn.style.background = '#facc15';
      btn.style.color = '#0f172a';

      // فعال‌سازی تایپیست
      if (typeof window.toggleTypist === 'function' && !document.body.classList.contains('p2-typist')) {
        // تابع تایپیست pack2 رو صدا بزن
        var typistBtn = document.querySelector('[data-pack2="typist"]');
        if (typistBtn) typistBtn.click();
      }

      // پنهان کردن یادداشت/چک‌لیست/کامنت
      container.querySelectorAll('.tree-notes-area, .tree-checklist, .tree-comments-area').forEach(function (el) {
        el.dataset.v11PrevDisplay = el.style.display || '';
        el.style.display = 'none';
      });

      // پنهان کردن ستون فیش‌ها
      var cardsCol = document.querySelector('.page-cards-column');
      if (cardsCol) cardsCol.style.display = 'none';

      // نشانگر
      var ind = document.createElement('div');
      ind.id = 'v11-focus-ind';
      ind.style.cssText = 'position:fixed;top:50px;left:50%;transform:translateX(-50%);background:#facc15;color:#0f172a;padding:6px 18px;border-radius:30px;font-family:Vazirmatn,sans-serif;font-size:0.75rem;font-weight:700;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.2);display:flex;align-items:center;gap:8px;';
      ind.innerHTML = '🎯 تمرکز هوشمند فعال · ' +
        '<button onclick="__v11_togglePanel(\'notes\')" style="background:' + (hiddenPanels.notes ? '#dc2626' : '#10b981') + ';color:#fff;border:none;padding:2px 8px;border-radius:20px;font-family:Vazirmatn;font-size:0.65rem;cursor:pointer;">📝 یادداشت</button>' +
        '<button onclick="__v11_togglePanel(\'checklist\')" style="background:' + (hiddenPanels.checklist ? '#dc2626' : '#10b981') + ';color:#fff;border:none;padding:2px 8px;border-radius:20px;font-family:Vazirmatn;font-size:0.65rem;cursor:pointer;">✅ چک‌لیست</button>' +
        '<button onclick="__v11_togglePanel(\'comments\')" style="background:' + (hiddenPanels.comments ? '#dc2626' : '#10b981') + ';color:#fff;border:none;padding:2px 8px;border-radius:20px;font-family:Vazirmatn;font-size:0.65rem;cursor:pointer;">💬 کامنت</button>' +
        '<button onclick="__v11_toggleFocus()" style="background:#0f172a;color:#fff;border:none;padding:2px 10px;border-radius:20px;font-family:Vazirmatn;font-size:0.65rem;font-weight:700;cursor:pointer;">✕ خروج</button>';
      document.body.appendChild(ind);

      if (window.showToast) window.showToast('🎯 تمرکز هوشمند فعال');
    } else {
      container.classList.remove('focus-mode');
      btn.style.background = '#0f172a';
      btn.style.color = '#fff';

      // خاموش تایپیست
      if (document.body.classList.contains('p2-typist')) {
        var typistBtn = document.querySelector('[data-pack2="typist"]');
        if (typistBtn) typistBtn.click();
      }

      // نمایش مجدد
      container.querySelectorAll('.tree-notes-area, .tree-checklist, .tree-comments-area').forEach(function (el) {
        el.style.display = el.dataset.v11PrevDisplay || '';
        delete el.dataset.v11PrevDisplay;
      });
      var cardsCol = document.querySelector('.page-cards-column');
      if (cardsCol) cardsCol.style.display = '';

      var ind = document.getElementById('v11-focus-ind');
      if (ind) ind.remove();

      if (window.showToast) window.showToast('تمرکز خاموش');
    }
  }
  window.__v11_toggleFocus = toggleSmartFocus;

  window.__v11_togglePanel = function (panel) {
    hiddenPanels[panel] = !hiddenPanels[panel];
    var container = document.getElementById('pageContainer');
    var sel = panel === 'notes' ? '.tree-notes-area' : panel === 'checklist' ? '.tree-checklist' : '.tree-comments-area';
    container.querySelectorAll(sel).forEach(function (el) {
      el.style.display = hiddenPanels[panel] ? 'none' : (el.dataset.v11PrevDisplay || '');
    });
    // آپدیت دکمه‌ها
    var ind = document.getElementById('v11-focus-ind');
    if (ind) {
      var btns = ind.querySelectorAll('button');
      if (btns[0]) btns[0].style.background = hiddenPanels.notes ? '#dc2626' : '#10b981';
      if (btns[1]) btns[1].style.background = hiddenPanels.checklist ? '#dc2626' : '#10b981';
      if (btns[2]) btns[2].style.background = hiddenPanels.comments ? '#dc2626' : '#10b981';
    }
  };

  // ============================================================
  // ۳. واگرد ۱۰ مرحله‌ای (Ctrl+Z)
  // ============================================================
  var undoStack = [];
  var MAX_UNDO = 10;
  var isUndoing = false;

  function captureSnapshot(label) {
    if (isUndoing) return;
    try {
      var snap = {
        label: label || 'تغییر',
        at: Date.now(),
        pages: JSON.parse(JSON.stringify(window.pages || [])),
        info: JSON.parse(JSON.stringify(window.researchInfo || {})),
        bib: JSON.parse(JSON.stringify(window.projectBibliography || []))
      };
      // اگه آخرین اسنپ‌شات یکسانه، دوباره ذخیره نکن
      if (undoStack.length > 0) {
        var last = undoStack[undoStack.length - 1];
        if (JSON.stringify(last.pages) === JSON.stringify(snap.pages)) return;
      }
      undoStack.push(snap);
      if (undoStack.length > MAX_UNDO) undoStack.shift();
      updateUndoBadge();
    } catch (e) { console.error('[v11 undo]', e); }
  }

  function undoLast() {
    if (undoStack.length < 2) {
      if (window.showToast) window.showToast('چیزی برای واگرد نیست');
      return;
    }
    isUndoing = true;
    // آخرین حالت فعلی رو حذف کن، به حالت قبلی برگرد
    undoStack.pop();
    var target = undoStack[undoStack.length - 1];
    try {
      window.pages = JSON.parse(JSON.stringify(target.pages));
      window.researchInfo = JSON.parse(JSON.stringify(target.info));
      window.projectBibliography = JSON.parse(JSON.stringify(target.bib));
      if (window.syncNextId) window.syncNextId();
      if (window.saveData) window.saveData();
      if (window.renderAll) window.renderAll();
      if (window.showToast) window.showToast('↶ واگرد: ' + target.label);
      updateUndoBadge();
    } finally {
      setTimeout(function () { isUndoing = false; }, 100);
    }
  }
  window.__v11_undo = undoLast;

  function updateUndoBadge() {
    var badge = document.getElementById('v11-undo-badge');
    if (!badge) return;
    badge.textContent = undoStack.length;
    badge.style.background = undoStack.length > 0 ? '#dc2626' : '#64748b';
  }

  // ردیابی تغییرات با MutationObserver روی saveData
  function hookSaveData() {
    var orig = window.saveData;
    if (typeof orig !== 'function') return;
    window.saveData = function () {
      captureSnapshot('ذخیره');
      return orig.apply(this, arguments);
    };
  }

  // Ctrl+Z
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && !e.shiftKey && (e.key === 'z' || e.key === 'Z' || e.key === 'ظ')) {
      // فقط اگه توی ادیتور نیست
      var ae = document.activeElement;
      if (ae && (ae.classList.contains('tree-content-editor') || ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) {
        return; // اجازه بده مرورگر خودش undo کنه
      }
      e.preventDefault();
      undoLast();
    }
  });

  // ============================================================
  // ۴. نمایش همه (یادداشت + چک‌لیست + کامنت)
  // ============================================================
  function openUniversalViewer() {
    var tab = window.__v11_viewerTab || 'notes';

    var html = '';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">';
    html += '<h3 style="margin:0;">🗂️ نمایش همهٔ محتوا</h3>';
    html += '<button onclick="closeV11Modal()" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--text-muted);">✕</button>';
    html += '</div>';

    // تب‌ها
    html += '<div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:2px solid var(--border-light);">';
    html += tabBtn('notes', '📝 یادداشت‌ها', tab);
    html += tabBtn('checklist', '✅ چک‌لیست‌ها', tab);
    html += tabBtn('comments', '💬 کامنت‌ها', tab);
    html += tabBtn('tags', '🏷️ هشتگ‌ها', tab);
    html += '</div>';

    // جستجو
    html += '<div style="margin-bottom:12px;">';
    html += '<input type="text" id="v11-viewer-search" placeholder="جستجو..." oninput="__v11_filterViewer(this.value)" style="width:100%;padding:8px 14px;border-radius:10px;border:1px solid var(--border-light);background:var(--bg-main);font-family:Vazirmatn;font-size:0.85rem;" />';
    html += '</div>';

    // محتوا
    html += '<div id="v11-viewer-content" style="max-height:60vh;overflow-y:auto;"></div>';

    showModal(html, '800px');
    renderViewerContent(tab);
  }

  function tabBtn(id, label, active) {
    var sel = active === id;
    return '<button onclick="__v11_changeViewerTab(\'' + id + '\')" style="background:' + (sel ? 'var(--primary)' : 'transparent') + ';color:' + (sel ? '#fff' : 'var(--text-muted)') + ';border:none;padding:8px 16px;border-radius:8px 8px 0 0;font-family:Vazirmatn;font-size:0.8rem;font-weight:700;cursor:pointer;">' + label + '</button>';
  }

  window.__v11_changeViewerTab = function (tab) {
    window.__v11_viewerTab = tab;
    openUniversalViewer();
  };

  window.__v11_filterViewer = function (q) {
    q = (q || '').toLowerCase().trim();
    renderViewerContent(window.__v11_viewerTab || 'notes', q);
  };

  function renderViewerContent(tab, filter) {
    var c = document.getElementById('v11-viewer-content');
    if (!c) return;
    filter = (filter || '').toLowerCase().trim();
    var html = '';
    var count = 0;

    if (tab === 'notes') {
      (window.pages || []).forEach(function (page, pIdx) {
        if (!window.traverseTree) return;
        window.traverseTree(page.tree, function (node) {
          if (node.type === 'chapter' || !node.notes || !node.notes.trim()) return;
          if (filter && node.notes.toLowerCase().indexOf(filter) === -1 && (node.title || '').toLowerCase().indexOf(filter) === -1) return;
          count++;
          html += viewerItem(
            '📄 ' + (page.title || 'بدون عنوان'),
            (node.number ? node.number + ' · ' : '') + (node.title || ''),
            node.notes,
            pIdx, node.id
          );
        });
      });
    } else if (tab === 'checklist') {
      (window.pages || []).forEach(function (page, pIdx) {
        if (!window.traverseTree) return;
        window.traverseTree(page.tree, function (node) {
          if (node.type === 'chapter' || !node.checklist || node.checklist.length === 0) return;
          node.checklist.forEach(function (item, i) {
            if (filter && (item.text || '').toLowerCase().indexOf(filter) === -1) return;
            count++;
            html += viewerItem(
              '📄 ' + (page.title || 'بدون عنوان'),
              (node.number ? node.number + ' · ' : '') + (node.title || ''),
              (item.done ? '✅ ' : '⬜ ') + (item.text || '(بدون متن)'),
              pIdx, node.id
            );
          });
        });
      });
    } else if (tab === 'comments') {
      (window.pages || []).forEach(function (page, pIdx) {
        if (!window.traverseTree) return;
        window.traverseTree(page.tree, function (node) {
          if (node.type === 'chapter' || !node.comments || node.comments.length === 0) return;
          node.comments.forEach(function (cm) {
            if (filter && (cm.text || '').toLowerCase().indexOf(filter) === -1 && (cm.author || '').toLowerCase().indexOf(filter) === -1) return;
            count++;
            html += viewerItem(
              '📄 ' + (page.title || 'بدون عنوان'),
              (node.number ? node.number + ' · ' : '') + (node.title || ''),
              '👤 ' + (cm.author || 'ناشناس') + ': ' + cm.text,
              pIdx, node.id
            );
          });
        });
      });
    } else if (tab === 'tags') {
      var tagMap = {};
      (window.pages || []).forEach(function (page, pIdx) {
        if (!window.traverseTree) return;
        window.traverseTree(page.tree, function (node) {
          if (node.type === 'chapter' || !node.tags || node.tags.length === 0) return;
          node.tags.forEach(function (t) {
            if (!tagMap[t]) tagMap[t] = [];
            tagMap[t].push({ page: page.title, node: node, pageIdx: pIdx });
          });
        });
      });
      var tags = Object.keys(tagMap).sort();
      if (filter) tags = tags.filter(function (t) { return t.toLowerCase().indexOf(filter) !== -1; });
      tags.forEach(function (tag) {
        count++;
        var items = tagMap[tag];
        html += '<div style="background:var(--bg-main);border-radius:10px;padding:10px 14px;margin-bottom:8px;">';
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">';
        html += '<span style="background:#7c3aed;color:#fff;padding:3px 12px;border-radius:20px;font-size:0.8rem;font-weight:700;">#' + escapeHtml(tag) + '</span>';
        html += '<span style="font-size:0.7rem;color:var(--text-muted);">' + items.length + ' مورد</span>';
        html += '</div>';
        items.forEach(function (it) {
          html += '<div style="padding:4px 8px;font-size:0.75rem;cursor:pointer;" onclick="__v11_jumpTo(' + it.pageIdx + ',\'' + it.node.id + '\')">';
          html += '<span style="color:var(--text-muted);">' + escapeHtml(it.page || '') + '</span> · ';
          html += escapeHtml((it.node.number ? it.node.number + ' ' : '') + (it.node.title || ''));
          html += '</div>';
        });
        html += '</div>';
      });
    }

    if (count === 0) {
      c.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted);font-size:0.85rem;">' + (filter ? 'نتیجه‌ای یافت نشد' : 'هیچ محتوایی نیست') + '</div>';
    } else {
      c.innerHTML = '<div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:8px;">' + count + ' مورد</div>' + html;
    }
  }

  function viewerItem(pageTitle, nodeTitle, content, pIdx, nId) {
    return '<div style="background:var(--bg-main);border-radius:10px;padding:10px 14px;margin-bottom:8px;border-right:3px solid var(--primary);">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;font-size:0.7rem;color:var(--text-muted);margin-bottom:6px;">' +
        '<span>' + escapeHtml(pageTitle) + '</span>' +
        '<button onclick="__v11_jumpTo(' + pIdx + ',\'' + nId + '\')" style="background:none;border:1px solid var(--border-light);color:var(--text-muted);padding:2px 8px;border-radius:6px;cursor:pointer;font-family:Vazirmatn;font-size:0.65rem;">↗ رفتن</button>' +
      '</div>' +
      '<div style="font-size:0.8rem;font-weight:700;color:var(--text-dark);margin-bottom:6px;">' + escapeHtml(nodeTitle) + '</div>' +
      '<div style="font-size:0.78rem;line-height:1.9;color:var(--text-dark);white-space:pre-wrap;">' + escapeHtml(content) + '</div>' +
    '</div>';
  }

  window.__v11_jumpTo = function (pIdx, nId) {
    window.currentPageIndex = pIdx;
    if (window.renderAll) window.renderAll();
    closeModal();
    setTimeout(function () {
      var el = document.querySelector('.tree-node[data-node-id="' + nId + '"]');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.transition = 'background 0.3s';
        el.style.background = '#fef3c7';
        setTimeout(function () { el.style.background = ''; }, 2000);
      }
    }, 250);
  };

  window.closeV11Modal = closeModal;

  // ============================================================
  // ۵. جستجوی هشتگی
  // ============================================================
  function setupHashtagSearch() {
    // هر بار روی یه هشتگ توی یه فیلد کلیک شد
    document.addEventListener('click', function (e) {
      var el = e.target;
      if (!el) return;
      // توی خود ادیتور یا محتوا
      var hashtagMatch = null;
      if (el.nodeType === 3 || el.tagName === 'SPAN' || el.tagName === 'SUP') {
        var txt = (el.textContent || '').trim();
        if (txt && txt.match(/^#[\u0600-\u06FFa-zA-Z0-9_\-]+$/)) {
          hashtagMatch = txt.slice(1);
        }
      }
      if (hashtagMatch && (e.ctrlKey || e.altKey)) {
        e.preventDefault();
        openHashtagSearch(hashtagMatch);
      }
    });
  }

  function openHashtagSearch(tag) {
    var tagMap = {};
    (window.pages || []).forEach(function (page, pIdx) {
      if (!window.traverseTree) return;
      window.traverseTree(page.tree, function (node) {
        if (node.type === 'chapter' || !node.tags) return;
        node.tags.forEach(function (t) {
          if (!tagMap[t]) tagMap[t] = [];
          tagMap[t].push({ page: page.title, pageIdx: pIdx, node: node });
        });
      });
      (page.cards || []).forEach(function (card) {
        (card.tags || []).forEach(function (t) {
          if (!tagMap[t]) tagMap[t] = [];
          tagMap[t].push({ page: page.title, pageIdx: pIdx, card: card, isCard: true });
        });
      });
    });

    var matches = tagMap[tag] || [];
    var html = '<h3>🏷️ نتایج جستجو برای #' + escapeHtml(tag) + '</h3>';
    if (matches.length === 0) {
      html += '<div style="text-align:center;padding:30px;color:var(--text-muted);">هیچ موردی با این هشتگ نیست</div>';
    } else {
      html += '<div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:10px;">' + matches.length + ' مورد</div>';
      matches.forEach(function (m) {
        if (m.isCard) {
          html += '<div style="background:#fef9c3;border-radius:10px;padding:10px 14px;margin-bottom:6px;cursor:pointer;border-right:3px solid #f59e0b;" onclick="__v11_jumpTo(' + m.pageIdx + ',\'\')">';
          html += '<div style="font-size:0.7rem;color:var(--text-muted);">📇 فیش در ' + escapeHtml(m.page || '') + '</div>';
          html += '<div style="font-weight:700;">' + escapeHtml(m.card.title || 'بدون عنوان') + '</div>';
          html += '</div>';
        } else {
          html += '<div style="background:var(--bg-main);border-radius:10px;padding:10px 14px;margin-bottom:6px;cursor:pointer;border-right:3px solid var(--primary);" onclick="__v11_jumpTo(' + m.pageIdx + ',\'' + m.node.id + '\')">';
          html += '<div style="font-size:0.7rem;color:var(--text-muted);">📄 ' + escapeHtml(m.page || '') + '</div>';
          html += '<div style="font-weight:700;">' + escapeHtml((m.node.number ? m.node.number + ' · ' : '') + (m.node.title || '')) + '</div>';
          html += '</div>';
        }
      });
    }
    html += '<div class="modal-actions" style="margin-top:12px;"><button class="btn-cancel" onclick="closeV11Modal()">بستن</button></div>';
    showModal(html, '640px');
  }
  window.__v11_openHashtag = openHashtagSearch;

  // ============================================================
  // ۶. پومودورو
  // ============================================================
  var pomoState = {
    active: false, mode: 'work', timeLeft: 25 * 60,
    cycles: 0, timer: null,
    workDuration: 25 * 60, breakDuration: 5 * 60
  };

  function togglePomodoro() {
    if (pomoState.active) {
      // تنظیمات
      openPomodoroSettings();
    } else {
      pomoState.active = true;
      pomoState.mode = 'work';
      pomoState.timeLeft = pomoState.workDuration;
      runPomodoro();
    }
  }

  function runPomodoro() {
    clearInterval(pomoState.timer);
    pomoState.timer = setInterval(function () {
      pomoState.timeLeft--;
      updatePomodoroDisplay();
      if (pomoState.timeLeft <= 0) {
        // پایان جلسه
        if (pomoState.mode === 'work') {
          pomoState.cycles++;
          pomoState.mode = 'break';
          pomoState.timeLeft = pomoState.breakDuration;
          if (window.showToast) window.showToast('✅ جلسه ' + pomoState.cycles + ' تمام شد — استراحت کن');
          try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT'); play(); } catch (e) {}
        } else {
          pomoState.mode = 'work';
          pomoState.timeLeft = pomoState.workDuration;
          if (window.showToast) window.showToast('🎯 وقت کار — ادامه بده');
        }
      }
    }, 1000);
    updatePomodoroDisplay();
  }

  function updatePomodoroDisplay() {
    var el = document.getElementById('v11-pomo-display');
    if (!el) {
      el = document.createElement('div');
      el.id = 'v11-pomo-display';
      el.style.cssText = 'position:fixed;top:50px;left:50%;transform:translateX(-50%);background:' + (pomoState.mode === 'work' ? '#dc2626' : '#10b981') + ';color:#fff;padding:8px 20px;border-radius:30px;font-family:Vazirmatn,sans-serif;font-size:0.85rem;font-weight:700;z-index:99999;box-shadow:0 6px 20px rgba(0,0,0,0.3);display:flex;align-items:center;gap:10px;';
      document.body.appendChild(el);
    }
    var min = Math.floor(pomoState.timeLeft / 60);
    var sec = pomoState.timeLeft % 60;
    var icon = pomoState.mode === 'work' ? '🎯' : '☕';
    var label = pomoState.mode === 'work' ? 'کار' : 'استراحت';
    el.style.background = pomoState.mode === 'work' ? '#dc2626' : '#10b981';
    el.innerHTML = icon + ' ' + label + ' · ' + String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0') +
      ' · جلسه: ' + pomoState.cycles +
      ' <button onclick="__v11_stopPomo()" style="background:rgba(0,0,0,0.3);color:#fff;border:none;padding:2px 8px;border-radius:20px;cursor:pointer;font-family:Vazirmatn;font-size:0.7rem;">✕</button>';
  }

  window.__v11_stopPomo = function () {
    pomoState.active = false;
    clearInterval(pomoState.timer);
    var el = document.getElementById('v11-pomo-display');
    if (el) el.remove();
    if (window.showToast) window.showToast('⏱️ پومودورو متوقف شد');
  };

  function openPomodoroSettings() {
    var html = '<h3>⏱️ تنظیمات پومودورو</h3>';
    html += '<p style="font-size:0.75rem;color:var(--text-muted);margin-bottom:14px;">' +
      'در حال اجرا: ' + pomoState.mode + ' · جلسات انجام‌شده: ' + pomoState.cycles + '</p>';
    html += '<label>مدت کار (دقیقه):</label>';
    html += '<input type="number" id="v11-pomo-work" value="' + Math.floor(pomoState.workDuration / 60) + '" min="5" max="60" />';
    html += '<label>مدت استراحت (دقیقه):</label>';
    html += '<input type="number" id="v11-pomo-break" value="' + Math.floor(pomoState.breakDuration / 60) + '" min="1" max="30" />';
    html += '<div class="modal-actions" style="margin-top:14px;">';
    html += '<button class="btn-cancel" onclick="__v11_stopPomo();closeV11Modal()">توقف پومودورو</button>';
    html += '<button class="btn-confirm" onclick="__v11_savePomo()">💾 ذخیره</button>';
    html += '</div>';
    showModal(html, '420px');
  }

  window.__v11_savePomo = function () {
    var w = parseInt(document.getElementById('v11-pomo-work').value) || 25;
    var b = parseInt(document.getElementById('v11-pomo-break').value) || 5;
    pomoState.workDuration = w * 60;
    pomoState.breakDuration = b * 60;
    pomoState.timeLeft = pomoState.mode === 'work' ? pomoState.workDuration : pomoState.breakDuration;
    try { localStorage.setItem('v11_pomo', JSON.stringify({ workDuration: pomoState.workDuration, breakDuration: pomoState.breakDuration })); } catch (e) {}
    closeModal();
    if (window.showToast) window.showToast('✅ ذخیره شد');
  };

  function loadPomoSettings() {
    try {
      var s = localStorage.getItem('v11_pomo');
      if (s) {
        var d = JSON.parse(s);
        if (d.workDuration) pomoState.workDuration = d.workDuration;
        if (d.breakDuration) pomoState.breakDuration = d.breakDuration;
      }
    } catch (e) {}
  }

  // ============================================================
  // ۷. هدف کلمات روزانه
  // ============================================================
  var goalState = { goal: 500, today: 0, lastDate: null, sessionStart: 0 };

  function loadWordGoal() {
    try {
      var s = localStorage.getItem('v11_wordgoal');
      if (s) {
        var d = JSON.parse(s);
        goalState.goal = d.goal || 500;
        goalState.today = d.today || 0;
        goalState.lastDate = d.lastDate;
      }
    } catch (e) {}
    // ریست روزانه
    var today = new Date().toDateString();
    if (goalState.lastDate !== today) {
      goalState.today = 0;
      goalState.lastDate = today;
      saveWordGoal();
    }
    // شمارش اولیه از کل پروژه
    updateWordGoalCount();
  }

  function saveWordGoal() {
    try {
      localStorage.setItem('v11_wordgoal', JSON.stringify({
        goal: goalState.goal, today: goalState.today, lastDate: goalState.lastDate
      }));
    } catch (e) {}
  }

  function updateWordGoalCount() {
    var total = 0;
    (window.pages || []).forEach(function (page) {
      if (!window.traverseTree) return;
      window.traverseTree(page.tree, function (node) {
        if (node.type === 'chapter') return;
        var txt = (node.content || '').replace(/<[^>]*>/g, ' ').trim();
        if (txt) total += txt.split(/\s+/).filter(function (w) { return w.length > 0; }).length;
      });
    });
    goalState.totalWords = total;
    updateWordGoalBadge();
  }
  window.__v11_updateGoal = updateWordGoalCount;

  function updateWordGoalBadge() {
    var el = document.getElementById('v11-goal-badge');
    if (!el) return;
    var pct = goalState.goal > 0 ? Math.min(100, Math.round((goalState.today / goalState.goal) * 100)) : 0;
    el.style.background = pct >= 100 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#dc2626';
    el.querySelector('.v11-goal-num').textContent = goalState.today + '/' + goalState.goal;
    el.querySelector('.v11-goal-bar-inner').style.width = pct + '%';
  }

  function openWordGoalModal() {
    var pct = goalState.goal > 0 ? Math.min(100, Math.round((goalState.today / goalState.goal) * 100)) : 0;
    var html = '<h3>🎯 هدف کلمهٔ روزانه</h3>';
    html += '<div style="text-align:center;padding:20px 0;background:var(--bg-main);border-radius:14px;margin-bottom:14px;">';
    html += '<div style="font-size:3rem;font-weight:900;color:' + (pct >= 100 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#dc2626') + ';">' + pct + '%</div>';
    html += '<div style="font-size:0.85rem;color:var(--text-muted);margin-top:8px;">' + goalState.today + ' از ' + goalState.goal + ' کلمه</div>';
    html += '<div style="width:80%;height:8px;background:var(--bg-card);border-radius:30px;margin:14px auto 0;overflow:hidden;">';
    html += '<div style="width:' + pct + '%;height:100%;background:linear-gradient(90deg,#10b981,#34d399);transition:width 0.3s;"></div>';
    html += '</div>';
    html += '</div>';

    html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:14px;">';
    html += '<div style="background:var(--bg-main);padding:10px;border-radius:10px;text-align:center;"><div style="font-size:1.2rem;font-weight:900;color:var(--primary);">' + (goalState.totalWords || 0).toLocaleString('fa-IR') + '</div><div style="font-size:0.65rem;color:var(--text-muted);">کلمات کل پروژه</div></div>';
    html += '<div style="background:var(--bg-main);padding:10px;border-radius:10px;text-align:center;"><div style="font-size:1.2rem;font-weight:900;color:#10b981;">' + goalState.today.toLocaleString('fa-IR') + '</div><div style="font-size:0.65rem;color:var(--text-muted);">امروز</div></div>';
    html += '</div>';

    html += '<label>هدف روزانه (کلمه):</label>';
    html += '<input type="number" id="v11-goal-input" value="' + goalState.goal + '" min="50" max="10000" step="50" />';

    html += '<div class="modal-actions" style="margin-top:14px;">';
    html += '<button class="btn-cancel" onclick="__v11_resetToday()">ریست امروز</button>';
    html += '<button class="btn-confirm" onclick="__v11_saveGoal()">💾 ذخیره</button>';
    html += '</div>';
    showModal(html, '420px');
  }

  window.__v11_saveGoal = function () {
    var g = parseInt(document.getElementById('v11-goal-input').value) || 500;
    goalState.goal = g;
    saveWordGoal();
    updateWordGoalBadge();
    closeModal();
    if (window.showToast) window.showToast('🎯 هدف: ' + g + ' کلمه در روز');
  };

  window.__v11_resetToday = function () {
    if (!confirm('شمارش امروز صفر شود؟')) return;
    goalState.today = 0;
    saveWordGoal();
    updateWordGoalBadge();
    closeModal();
  };

  // ردیابی کلمات اضافه‌شده
  function hookWordTracking() {
    var lastTotal = goalState.totalWords || 0;
    setInterval(function () {
      var total = 0;
      (window.pages || []).forEach(function (page) {
        if (!window.traverseTree) return;
        window.traverseTree(page.tree, function (node) {
          if (node.type === 'chapter') return;
          var txt = (node.content || '').replace(/<[^>]*>/g, ' ').trim();
          if (txt) total += txt.split(/\s+/).filter(function (w) { return w.length > 0; }).length;
        });
      });
      var diff = total - lastTotal;
      if (diff > 0) {
        goalState.today += diff;
        goalState.totalWords = total;
        saveWordGoal();
        updateWordGoalBadge();
      } else if (diff < 0) {
        goalState.totalWords = total;
      }
      lastTotal = total;
    }, 5000);
  }

  function injectGoalBadge() {
    if (document.getElementById('v11-goal-badge')) return;
    var titleArea = document.querySelector('.panel-toolbar .title-area');
    if (!titleArea) return;
    var el = document.createElement('div');
    el.id = 'v11-goal-badge';
    el.style.cssText = 'display:flex;align-items:center;gap:6px;padding:3px 10px;border-radius:20px;color:#fff;font-family:Vazirmatn;font-size:0.65rem;font-weight:700;cursor:pointer;';
    el.title = 'هدف کلمهٔ روزانه — کلیک برای تنظیم';
    el.onclick = openWordGoalModal;
    el.innerHTML = '🎯 <span class="v11-goal-num">0/500</span>' +
      '<div style="width:40px;height:4px;background:rgba(0,0,0,0.2);border-radius:10px;overflow:hidden;"><div class="v11-goal-bar-inner" style="width:0;height:100%;background:#fff;transition:width 0.3s;"></div></div>';
    titleArea.appendChild(el);
    updateWordGoalBadge();
  }

  // ============================================================
  // ۸. تخلیه ذهن (Scratchpad)
  // ============================================================
  function openScratchpad() {
    var saved = '';
    try { saved = localStorage.getItem('v11_scratchpad') || ''; } catch (e) {}
    var html = '<h3>📝 تخلیه ذهن</h3>';
    html += '<p style="font-size:0.72rem;color:var(--text-muted);margin-bottom:12px;">افکار، ایده‌ها و نکات موقت. خودکار ذخیره می‌شود.</p>';
    html += '<textarea id="v11-scratch-text" rows="15" placeholder="هر چیزی که توی ذهنت هست رو اینجا بنویس..." style="width:100%;padding:12px 14px;border-radius:12px;border:1px solid var(--border-light);background:var(--bg-main);font-family:Vazirmatn;font-size:0.85rem;line-height:2;resize:vertical;min-height:300px;">' + escapeHtml(saved) + '</textarea>';
    html += '<div class="modal-actions" style="margin-top:14px;">';
    html += '<button class="btn-cancel" onclick="__v11_clearScratch()">پاک کردن</button>';
    html += '<button class="btn-cancel" onclick="__v11_copyScratch()">📋 کپی</button>';
    html += '<button class="btn-cancel" onclick="__v11_scratchToCard()">📇 تبدیل به فیش</button>';
    html += '<button class="btn-confirm" onclick="__v11_saveScratch();closeV11Modal()">💾 ذخیره و بستن</button>';
    html += '</div>';
    showModal(html, '640px');
    setTimeout(function () {
      var t = document.getElementById('v11-scratch-text');
      if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); }
    }, 200);
    // ذخیره خودکار
    setInterval(function () {
      var t = document.getElementById('v11-scratch-text');
      if (t) { try { localStorage.setItem('v11_scratchpad', t.value); } catch (e) {} }
    }, 2000);
  }

  window.__v11_saveScratch = function () {
    var t = document.getElementById('v11-scratch-text');
    if (t) {
      try { localStorage.setItem('v11_scratchpad', t.value); } catch (e) {}
      if (window.showToast) window.showToast('💾 ذخیره شد');
    }
  };

  window.__v11_clearScratch = function () {
    if (!confirm('متن پاک شود؟')) return;
    var t = document.getElementById('v11-scratch-text');
    if (t) t.value = '';
    try { localStorage.setItem('v11_scratchpad', ''); } catch (e) {}
  };

  window.__v11_copyScratch = function () {
    var t = document.getElementById('v11-scratch-text');
    if (!t || !t.value) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(t.value).then(function () {
        if (window.showToast) window.showToast('📋 کپی شد');
      });
    }
  };

  window.__v11_scratchToCard = function () {
    var t = document.getElementById('v11-scratch-text');
    if (!t || !t.value.trim()) return;
    if (typeof window.openCardModal === 'function') {
      closeModal();
      window.openCardModal(null, null);
      setTimeout(function () {
        var cardText = document.getElementById('cardText');
        if (cardText) cardText.value = t.value;
      }, 300);
    }
  };

  // ============================================================
  // ۹. حذف دکمهٔ فیش از بخش‌ها
  // ============================================================
  function hideCardButtonFromSections() {
    // حذف دکمهٔ فیش از ابزار هر بخش
    var observer = new MutationObserver(function () {
      document.querySelectorAll('.tree-header .node-tools').forEach(function (toolbar) {
        toolbar.querySelectorAll('button').forEach(function (btn) {
          if (btn.textContent.trim() === '📇' && btn.title && btn.title.indexOf('فیش') !== -1) {
            btn.style.display = 'none';
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ============================================================
  // ۱۰. ذخیره‌سازی اسنپ‌شات در تغییرات مهم
  // ============================================================
  function hookNodeOperations() {
    ['addNewPage', 'confirmAddNode', 'deleteNode', 'deletePage', 'confirmCard', 'deleteCard'].forEach(function (fnName) {
      var orig = window[fnName];
      if (typeof orig !== 'function') return;
      window[fnName] = function () {
        captureSnapshot(fnName);
        var r = orig.apply(this, arguments);
        return r;
      };
    });
  }

  // ============================================================
  // Boot
  // ============================================================
  function boot() {
    loadPomoSettings();
    loadWordGoal();
    reorganizeToolbar();
    injectGoalBadge();
    hookSaveData();
    hookNodeOperations();
    hookWordTracking();
    hideCardButtonFromSection();
    setupHashtagSearch();

    // اولین اسنپ‌شات
    setTimeout(function () { captureSnapshot('شروع'); }, 2000);

    console.log('✅ v11-pack ready (toolbar · focus · undo · viewer · pomodoro · goal · scratchpad)');
  }

  function hideCardButtonFromSection() {
    var obs = new MutationObserver(function () {
      document.querySelectorAll('.tree-header .node-tools').forEach(function (toolbar) {
        toolbar.querySelectorAll('button').forEach(function (btn) {
          if (btn.textContent.trim() === '📇' && btn.title && btn.title.indexOf('فیش') !== -1) {
            btn.style.display = 'none';
          }
        });
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
    // یه بار هم فوری
    setTimeout(function () {
      document.querySelectorAll('.tree-header .node-tools').forEach(function (toolbar) {
        toolbar.querySelectorAll('button').forEach(function (btn) {
          if (btn.textContent.trim() === '📇' && btn.title && btn.title.indexOf('فیش') !== -1) {
            btn.style.display = 'none';
          }
        });
      });
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 3000); });
  } else {
    setTimeout(boot, 3000);
  }
})();