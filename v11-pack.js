/**
 * v11-pack.js — نسخهٔ ۱.۱ اصلاحی
 * - اصلاح سازمان‌دهی نوار ابزار
 * - هدف کلمات در بج (بدون دکمهٔ جدا)
 * - پومودورو و تمرکز قابل جابجایی
 * - حذف دکمه‌های تکراری
 * - باکس نوار ابزار گرافیکی‌تر
 * - پومودورو قابل تنظیم
 * - حاشیه‌ها (نمایش همه + فیش‌ها)
 * - فلش بک/فوروارد
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
  window.closeV11Modal = closeModal;

  // ============================================================
  // ۱. سازمان‌دهی نوار ابزار (تمیز و گروه‌بندی‌شده)
  // ============================================================
  function reorganizeToolbar() {
    var actions = document.querySelector('.panel-toolbar .actions');
    if (!actions) return;

    // ─── حذف دکمه‌های اضافی ───
    var removeByTextOrTitle = [
      '🔄', 'ریست', 'reset-btn',
      '🎯 تایپیست', '🎯',
      '🎯 تمرکز',
      '🎯 هدف کلمات',
      '⏱️ پومودورو',
      '📝 تخلیه ذهن',
      '🗂️ نمایش همه',
      '📇 فیش‌ها',
      'افزودن فیش', 'افزودن بخش', '➕ زیربخش', '📎 پاورقی', '📖 ارجاع', '🔧', 'تعمیر',
      '📘 DOCX', 'DOCX',
      'MD', 'Markdown',
      '📊 تحلیل',
      '✏️ ویرایش',
      '🗑️ پاک‌کردن', 'پاک‌کردن',
      '🖨️',
      '📈', 'نمودار',
      '📚 منبع',
      '⏳ نسخه‌ها'
    ];

    actions.querySelectorAll('button').forEach(function (btn) {
      var txt = (btn.textContent || '').trim();
      var title = btn.getAttribute('title') || '';
      var cls = btn.className || '';

      for (var i = 0; i < removeByTextOrTitle.length; i++) {
        var k = removeByTextOrTitle[i];
        if (txt === k || txt.indexOf(k) !== -1 || title.indexOf(k) !== -1 || cls.indexOf(k) !== -1) {
          // استثنا: تمرکز و پومودورو و هدف و تخلیه ذهن و حاشیه‌ها رو نگه‌دار (اگه قبلاً ساختی)
          if (btn.getAttribute('data-v11')) return;
          btn.style.display = 'none';
          return;
        }
      }
    });

    if (actions.querySelector('[data-v11]')) {
      // قبلاً اعمال شده
      rebuildToolbarButtons(actions);
      return;
    }

    rebuildToolbarButtons(actions);
  }

  function rebuildToolbarButtons(actions) {
    if (actions.querySelector('.v11-toolbar-group')) return;

    // ─── پاک کردن دکمه‌های قدیمی داخل actions ───
    Array.from(actions.children).forEach(function (child) {
      if (child.tagName === 'BUTTON') {
        // اگه دکمهٔ قبلاً فعال (خروجی، ذخیره، پشتیبان) هست، نگه‌دار
        var txt = (child.textContent || '').trim();
        if (txt.indexOf('پشتیبان') !== -1 || txt.indexOf('درون‌بری') !== -1 ||
            txt.indexOf('خروجی') !== -1 || txt.indexOf('PDF') !== -1 ||
            txt.indexOf('Word') !== -1 || txt.indexOf('پوشه') !== -1 ||
            txt.indexOf('اشتراک') !== -1) {
          return; // نگه‌دار
        }
        child.remove();
      }
    });

    // ─── گروه‌بندی دکمه‌ها با ظاهر گرافیکی ───
    var groups = [
      {
        name: 'data',
        label: 'مدیریت',
        icon: '📁',
        color: '#0891b2',
        buttons: [
          { icon: '📄', label: 'فصل جدید', title: 'افزودن فصل جدید', action: function () { if (window.addNewPage) window.addNewPage(); } }
        ]
      },
      {
        name: 'content',
        label: 'فیش و پاورقی',
        icon: '📝',
        color: '#f59e0b',
        buttons: [
          { icon: '📇', label: 'فیش', title: 'افزودن فیش (Ctrl+Shift+M)', action: function () { if (window.openCardModal) window.openCardModal(null, null); } },
          { icon: '📎', label: 'پاورقی', title: 'پاورقی از انتخاب (Ctrl+Shift+P)', action: function () { if (window.addFootnoteToSelected) window.addFootnoteToSelected(); } },
          { icon: '📖', label: 'ارجاع', title: 'درج ارجاع (Ctrl+Shift+C)', action: function () { if (window.insertCitation) window.insertCitation(); } },
          { icon: '📚', label: 'منابع', title: 'کتابخانهٔ منابع', action: function () { if (window.showBibliographyManager) window.showBibliographyManager(); } }
        ]
      },
      {
        name: 'search',
        label: 'جستجو',
        icon: '🔍',
        color: '#0ea5e9',
        buttons: [
          { icon: '🔍', label: 'جستجو', title: 'جستجوی متن (Ctrl+Shift+F)', action: function () { if (window.openTextSearch) window.openTextSearch(); } },
          { icon: '🔁', label: 'جایگزینی', title: 'یافتن و جایگزینی (Ctrl+H)', action: function () { if (window.openFindReplace) window.openFindReplace(); } },
          { icon: '🔎', label: 'فازی', title: 'جستجوی فازی (Ctrl+Alt+F)', action: function () { if (window.__p3_runFuzzy) { openFuzzySearchV11(); } else if (typeof openFuzzySearch === 'function') openFuzzySearch(); } }
        ]
      },
      {
        name: 'ai',
        label: 'هوش',
        icon: '🤖',
        color: '#8b5cf6',
        buttons: [
          { icon: '📝', label: 'خلاصه', title: 'خلاصه‌سازی (Ctrl+Alt+S)', action: function () { if (window.__p3_reSummarize !== undefined && typeof openSummarizerModal === 'function') openSummarizerModal(); else if (typeof openSummarizerModal === 'function') openSummarizerModal(); } },
          { icon: '🎙️', label: 'دیکته', title: 'دیکته صوتی (Ctrl+Alt+D)', action: function () { var b = document.querySelector('[data-pack3="dictate"]'); if (b) b.click(); } },
          { icon: '🌐', label: 'ترجمه', title: 'ترجمه', action: function () { if (window.openTranslate) window.openTranslate(null); } },
          { icon: '📊', label: 'تحلیل', title: 'تحلیل متن (Ctrl+Alt+A)', action: function () { if (window.openTextAnalysis) openTextAnalysis(); } }
        ]
      },
      {
        name: 'tools',
        label: 'ابزارها',
        icon: '⚙️',
        color: '#10b981',
        buttons: [
          { icon: '⏱️', label: 'پومودورو', title: 'تایمر پومودورو', action: function () { togglePomodoro(); } },
          { icon: '📝', label: 'تخلیه ذهن', title: 'تخلیه ذهن', action: function () { openScratchpad(); } },
          { icon: '🗂️', label: 'حاشیه‌ها', title: 'نمایش همه (یادداشت، چک‌لیست، کامنت، هشتگ، فیش)', action: function () { openUniversalViewer(); } },
          { icon: '🎯', label: 'تمرکز', title: 'تمرکز هوشمند (تایپیست)', action: function () { toggleSmartFocus(); } }
        ]
      },
      {
        name: 'output',
        label: 'خروجی',
        icon: '📤',
        color: '#dc2626',
        buttons: [
          { icon: '📄', label: 'PDF', title: 'خروجی PDF', action: function () { if (window.exportPDF) window.exportPDF(); } },
          { icon: '📝', label: 'Word', title: 'خروجی Word', action: function () { if (window.exportWord) window.exportWord(); } },
          { icon: '⬇️', label: 'JSON', title: 'پشتیبان', action: function () { if (window.exportData) window.exportData(); } },
          { icon: '⬆️', label: 'درون‌بری', title: 'درون‌بری', action: function () { if (window.importData) window.importData(); } }
        ]
      },
      {
        name: 'view',
        label: 'نمایش',
        icon: '🎨',
        color: '#64748b',
        buttons: [
          { icon: '🎨', label: 'پوسته', title: 'پوسته‌ها', action: function () { if (window.openThemeModal) window.openThemeModal(); } },
          { icon: '🌙', label: 'شب/روز', title: 'شب/روز', action: function () { if (window.toggleDarkMode) window.toggleDarkMode(); } },
          { icon: '📖', label: 'پیش‌نمایش', title: 'پیش‌نمایش A4', action: function () { if (window.openBookPreview) window.openBookPreview(); } }
        ]
      }
    ];

    // ─── ساخت گرافیکی نوار ابزار ───
    actions.style.cssText = 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:4px 0;';
    actions.innerHTML = '';

    groups.forEach(function (grp) {
      var wrapper = document.createElement('div');
      wrapper.className = 'v11-toolbar-group';
      wrapper.setAttribute('data-group', grp.name);
      wrapper.style.cssText = 'display:flex;align-items:center;gap:2px;background:' + hexToRgba(grp.color, 0.08) + ';border-radius:12px;padding:3px 6px 3px 8px;border:1px solid ' + hexToRgba(grp.color, 0.18) + ';';

      // آیکون گروه
      var gi = document.createElement('span');
      gi.textContent = grp.icon;
      gi.title = grp.label;
      gi.style.cssText = 'font-size:0.85rem;margin-left:2px;opacity:0.7;';
      wrapper.appendChild(gi);

      // دکمه‌ها
      grp.buttons.forEach(function (b) {
        var btn = document.createElement('button');
        btn.setAttribute('data-v11-btn', '1');
        btn.title = b.title || b.label;
        btn.style.cssText = 'background:transparent;border:none;padding:4px 8px;border-radius:8px;font-family:Vazirmatn,sans-serif;font-size:0.72rem;font-weight:600;color:' + grp.color + ';cursor:pointer;display:flex;align-items:center;gap:4px;transition:all 0.15s;';
        btn.innerHTML = '<span style="font-size:0.9rem;">' + b.icon + '</span><span>' + b.label + '</span>';
        btn.onmouseover = function () { this.style.background = hexToRgba(grp.color, 0.15); };
        btn.onmouseout = function () { this.style.background = 'transparent'; };
        btn.onclick = b.action;
        wrapper.appendChild(btn);
      });

      actions.appendChild(wrapper);
    });

    // ─── فلش بک/فوروارد ───
    var navGroup = document.createElement('div');
    navGroup.style.cssText = 'display:flex;align-items:center;gap:2px;background:rgba(15,23,42,0.08);border-radius:12px;padding:3px 6px;border:1px solid rgba(15,23,42,0.15);margin-right:auto;';
    var backBtn = document.createElement('button');
    backBtn.title = 'بازگشت (Ctrl+Z)';
    backBtn.style.cssText = 'background:transparent;border:none;padding:4px 8px;border-radius:8px;cursor:pointer;font-size:1rem;color:#0f172a;';
    backBtn.textContent = '◀';
    backBtn.onclick = function () { undoLast(); };
    backBtn.onmouseover = function () { this.style.background = 'rgba(15,23,42,0.1)'; };
    backBtn.onmouseout = function () { this.style.background = 'transparent'; };

    var forwardBtn = document.createElement('button');
    forwardBtn.title = 'جلو (Ctrl+Y)';
    forwardBtn.style.cssText = 'background:transparent;border:none;padding:4px 8px;border-radius:8px;cursor:pointer;font-size:1rem;color:#0f172a;';
    forwardBtn.textContent = '▶';
    forwardBtn.onclick = function () { redoNext(); };
    forwardBtn.onmouseover = function () { this.style.background = 'rgba(15,23,42,0.1)'; };
    forwardBtn.onmouseout = function () { this.style.background = 'transparent'; };

    navGroup.appendChild(backBtn);
    navGroup.appendChild(forwardBtn);
    actions.appendChild(navGroup);
  }

  function hexToRgba(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  // ============================================================
  // ۲. تمرکز هوشمند + پنل‌های قابل نمایش
  // ============================================================
  var smartFocusActive = false;
  var hiddenPanels = { notes: true, checklist: true, comments: true, tools: true };

  function toggleSmartFocus() {
    smartFocusActive = !smartFocusActive;
    var container = document.getElementById('pageContainer');

    if (smartFocusActive) {
      container.classList.add('focus-mode');

      // تایپیست
      if (typeof window.toggleTypist === 'function' && !document.body.classList.contains('p2-typist')) {
        var typistBtn = document.querySelector('[data-pack2="typist"]');
        if (typistBtn) typistBtn.click();
      }

      // پنهان کردن پنل‌ها
      applyHiddenPanels();

      // ستون فیش‌ها
      var cardsCol = document.querySelector('.page-cards-column');
      if (cardsCol) cardsCol.style.display = 'none';

      // نشانگر
      showFocusIndicator();
      if (window.showToast) window.showToast('🎯 تمرکز هوشمند فعال');
    } else {
      container.classList.remove('focus-mode');

      // خاموش تایپیست
      if (document.body.classList.contains('p2-typist')) {
        var typistBtn = document.querySelector('[data-pack2="typist"]');
        if (typistBtn) typistBtn.click();
      }

      // نمایش مجدد پنل‌ها
      container.querySelectorAll('.tree-notes-area, .tree-checklist, .tree-comments-area').forEach(function (el) {
        el.style.display = el.dataset.v11PrevDisplay || '';
        delete el.dataset.v11PrevDisplay;
      });
      // ابزارهای داخل ویرایشگر
      container.querySelectorAll('.rich-toolbar').forEach(function (el) {
        el.style.display = '';
      });
      var cardsCol = document.querySelector('.page-cards-column');
      if (cardsCol) cardsCol.style.display = '';

      var ind = document.getElementById('v11-focus-ind');
      if (ind) ind.remove();

      if (window.showToast) window.showToast('تمرکز خاموش');
    }
  }
  window.__v11_toggleFocus = toggleSmartFocus;

  function applyHiddenPanels() {
    var container = document.getElementById('pageContainer');
    if (!container) return;
    container.querySelectorAll('.tree-notes-area').forEach(function (el) {
      if (!el.dataset.v11PrevDisplay) el.dataset.v11PrevDisplay = el.style.display || '';
      el.style.display = hiddenPanels.notes ? 'none' : 'block';
    });
    container.querySelectorAll('.tree-checklist').forEach(function (el) {
      if (!el.dataset.v11PrevDisplay) el.dataset.v11PrevDisplay = el.style.display || '';
      el.style.display = hiddenPanels.checklist ? 'none' : 'block';
    });
    container.querySelectorAll('.tree-comments-area').forEach(function (el) {
      if (!el.dataset.v11PrevDisplay) el.dataset.v11PrevDisplay = el.style.display || '';
      el.style.display = hiddenPanels.comments ? 'none' : 'block';
    });
    // ابزار داخل ویرایشگر (نوار ابزار متن)
    container.querySelectorAll('.rich-toolbar').forEach(function (el) {
      if (!el.dataset.v11PrevDisplay) el.dataset.v11PrevDisplay = el.style.display || '';
      el.style.display = hiddenPanels.tools ? 'none' : 'block';
    });
  }

  function showFocusIndicator() {
    var ind = document.getElementById('v11-focus-ind');
    if (!ind) {
      ind = document.createElement('div');
      ind.id = 'v11-focus-ind';
      ind.style.cssText = 'position:fixed;top:50px;left:50%;transform:translateX(-50%);background:#facc15;color:#0f172a;padding:6px 14px;border-radius:30px;font-family:Vazirmatn,sans-serif;font-size:0.72rem;font-weight:700;z-index:99999;box-shadow:0 6px 20px rgba(0,0,0,0.3);display:flex;align-items:center;gap:6px;flex-wrap:wrap;cursor:move;user-select:none;';
      document.body.appendChild(ind);
      makeDraggable(ind);
    }
    ind.innerHTML =
      '🎯 <span>تمرکز ·</span>' +
      '<button onclick="__v11_togglePanel(\'notes\')" data-panel="notes" style="background:' + (hiddenPanels.notes ? '#dc2626' : '#10b981') + ';color:#fff;border:none;padding:2px 8px;border-radius:20px;font-family:Vazirmatn;font-size:0.65rem;cursor:pointer;font-weight:600;">📝 یادداشت</button>' +
      '<button onclick="__v11_togglePanel(\'checklist\')" data-panel="checklist" style="background:' + (hiddenPanels.checklist ? '#dc2626' : '#10b981') + ';color:#fff;border:none;padding:2px 8px;border-radius:20px;font-family:Vazirmatn;font-size:0.65rem;cursor:pointer;font-weight:600;">✅ چک‌لیست</button>' +
      '<button onclick="__v11_togglePanel(\'comments\')" data-panel="comments" style="background:' + (hiddenPanels.comments ? '#dc2626' : '#10b981') + ';color:#fff;border:none;padding:2px 8px;border-radius:20px;font-family:Vazirmatn;font-size:0.65rem;cursor:pointer;font-weight:600;">💬 کامنت</button>' +
      '<button onclick="__v11_togglePanel(\'tools\')" data-panel="tools" style="background:' + (hiddenPanels.tools ? '#dc2626' : '#10b981') + ';color:#fff;border:none;padding:2px 8px;border-radius:20px;font-family:Vazirmatn;font-size:0.65rem;cursor:pointer;font-weight:600;">🎨 ابزار متن</button>' +
      '<button onclick="__v11_toggleFocus()" style="background:#0f172a;color:#fff;border:none;padding:2px 10px;border-radius:20px;font-family:Vazirmatn;font-size:0.65rem;font-weight:700;cursor:pointer;">✕ خروج</button>';
  }

  window.__v11_togglePanel = function (panel) {
    hiddenPanels[panel] = !hiddenPanels[panel];
    applyHiddenPanels();
    // آپدیت رنگ دکمه
    var ind = document.getElementById('v11-focus-ind');
    if (ind) {
      var b = ind.querySelector('[data-panel="' + panel + '"]');
      if (b) b.style.background = hiddenPanels[panel] ? '#dc2626' : '#10b981';
    }
  };

  // ============================================================
  // ۳. درگ کردن پاپ‌آپ‌ها
  // ============================================================
  function makeDraggable(el) {
    var posX = 0, posY = 0, startX = 0, startY = 0;

    el.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      // اگه روی دکمه کلیک کرد، درگ نکن
      if (e.target.tagName === 'BUTTON') return;
      e.preventDefault();
      startX = e.clientX;
      startY = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }
    function elementDrag(e) {
      e.preventDefault();
      posX = startX - e.clientX;
      posY = startY - e.clientY;
      startX = e.clientX;
      startY = e.clientY;
      var curTop = el.offsetTop - posY;
      var curLeft = el.offsetLeft - posX;
      // محدود کردن به صفحه
      curTop = Math.max(5, Math.min(window.innerHeight - el.offsetHeight - 5, curTop));
      curLeft = Math.max(5, Math.min(window.innerWidth - el.offsetWidth - 5, curLeft));
      el.style.top = curTop + 'px';
      el.style.left = curLeft + 'px';
      el.style.transform = 'none';
    }
    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }
  window.__v11_makeDraggable = makeDraggable;

  // ============================================================
  // ۴. Undo / Redo (۱۰ مرحله)
  // ============================================================
  var undoStack = [];
  var redoStack = [];
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
      if (undoStack.length > 0) {
        var last = undoStack[undoStack.length - 1];
        if (JSON.stringify(last.pages) === JSON.stringify(snap.pages)) return;
      }
      undoStack.push(snap);
      if (undoStack.length > MAX_UNDO) undoStack.shift();
      // خالی کردن redo
      redoStack = [];
      updateUndoBadge();
    } catch (e) { console.error('[v11 undo]', e); }
  }

  function undoLast() {
    if (undoStack.length < 2) {
      if (window.showToast) window.showToast('چیزی برای بازگشت نیست');
      return;
    }
    isUndoing = true;
    try {
      var current = undoStack.pop();
      redoStack.push(current);
      if (redoStack.length > MAX_UNDO) redoStack.shift();
      var target = undoStack[undoStack.length - 1];
      window.pages = JSON.parse(JSON.stringify(target.pages));
      window.researchInfo = JSON.parse(JSON.stringify(target.info));
      window.projectBibliography = JSON.parse(JSON.stringify(target.bib));
      if (window.syncNextId) window.syncNextId();
      if (window.saveData) window.saveData();
      if (window.renderAll) window.renderAll();
      if (window.showToast) window.showToast('◀ بازگشت: ' + target.label);
    } finally {
      setTimeout(function () { isUndoing = false; }, 100);
    }
  }

  function redoNext() {
    if (redoStack.length === 0) {
      if (window.showToast) window.showToast('چیزی برای جلو رفتن نیست');
      return;
    }
    isUndoing = true;
    try {
      var target = redoStack.pop();
      undoStack.push(target);
      window.pages = JSON.parse(JSON.stringify(target.pages));
      window.researchInfo = JSON.parse(JSON.stringify(target.info));
      window.projectBibliography = JSON.parse(JSON.stringify(target.bib));
      if (window.syncNextId) window.syncNextId();
      if (window.saveData) window.saveData();
      if (window.renderAll) window.renderAll();
      if (window.showToast) window.showToast('▶ جلو: ' + target.label);
    } finally {
      setTimeout(function () { isUndoing = false; }, 100);
    }
  }

  window.__v11_undo = undoLast;
  window.__v11_redo = redoNext;

  function updateUndoBadge() {}

  function hookSaveData() {
    var orig = window.saveData;
    if (typeof orig !== 'function') return;
    window.saveData = function () {
      captureSnapshot('ذخیره');
      return orig.apply(this, arguments);
    };
  }

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && !e.shiftKey && (e.key === 'z' || e.key === 'Z' || e.key === 'ظ')) {
      var ae = document.activeElement;
      if (ae && (ae.classList.contains('tree-content-editor') || ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) return;
      e.preventDefault();
      undoLast();
    }
    if (e.ctrlKey && (e.key === 'y' || e.key === 'Y' || e.key === 'غ')) {
      e.preventDefault();
      redoNext();
    }
  });

  // ============================================================
  // ۵. Universal Viewer (حاشیه‌ها)
  // ============================================================
  function openUniversalViewer() {
    var tab = window.__v11_viewerTab || 'notes';

    var html = '';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">';
    html += '<h3 style="margin:0;">🗂️ حاشیه‌ها — همهٔ محتوا</h3>';
    html += '<button onclick="closeV11Modal()" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--text-muted);">✕</button>';
    html += '</div>';

    html += '<div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:2px solid var(--border-light);flex-wrap:wrap;">';
    html += tabBtn('notes', '📝 یادداشت‌ها', tab);
    html += tabBtn('checklist', '✅ چک‌لیست‌ها', tab);
    html += tabBtn('comments', '💬 کامنت‌ها', tab);
    html += tabBtn('tags', '🏷️ هشتگ‌ها', tab);
    html += tabBtn('cards', '📇 فیش‌ها', tab);
    html += '</div>';

    html += '<div style="margin-bottom:12px;">';
    html += '<input type="text" id="v11-viewer-search" placeholder="جستجو..." oninput="__v11_filterViewer(this.value)" style="width:100%;padding:8px 14px;border-radius:10px;border:1px solid var(--border-light);background:var(--bg-main);font-family:Vazirmatn;font-size:0.85rem;" />';
    html += '</div>';

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
          html += viewerItem('📄 ' + (page.title || 'بدون عنوان'), (node.number ? node.number + ' · ' : '') + (node.title || ''), node.notes, pIdx, node.id);
        });
      });
    } else if (tab === 'checklist') {
      (window.pages || []).forEach(function (page, pIdx) {
        if (!window.traverseTree) return;
        window.traverseTree(page.tree, function (node) {
          if (node.type === 'chapter' || !node.checklist || node.checklist.length === 0) return;
          node.checklist.forEach(function (item) {
            if (filter && (item.text || '').toLowerCase().indexOf(filter) === -1) return;
            count++;
            html += viewerItem('📄 ' + (page.title || 'بدون عنوان'), (node.number ? node.number + ' · ' : '') + (node.title || ''), (item.done ? '✅ ' : '⬜ ') + (item.text || '(بدون متن)'), pIdx, node.id);
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
            html += viewerItem('📄 ' + (page.title || 'بدون عنوان'), (node.number ? node.number + ' · ' : '') + (node.title || ''), '👤 ' + (cm.author || 'ناشناس') + ': ' + cm.text, pIdx, node.id);
          });
        });
      });
    } else if (tab === 'tags') {
      var tagMap = {};
      (window.pages || []).forEach(function (page, pIdx) {
        if (!window.traverseTree) return;
        window.traverseTree(page.tree, function (node) {
          if (node.type === 'chapter' || !node.tags) return;
          node.tags.forEach(function (t) {
            if (!tagMap[t]) tagMap[t] = [];
            tagMap[t].push({ page: page.title, node: node, pageIdx: pIdx });
          });
        });
        (page.cards || []).forEach(function (card) {
          (card.tags || []).forEach(function (t) {
            if (!tagMap[t]) tagMap[t] = [];
            tagMap[t].push({ page: page.title, pageIdx: pIdx, card: card, isCard: true });
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
          var cid = it.isCard ? it.card.id : '';
          html += '<div style="padding:4px 8px;font-size:0.75rem;cursor:pointer;" onclick="__v11_jumpTo(' + it.pageIdx + ',\'' + (it.node ? it.node.id : '') + '\')">';
          html += '<span style="color:var(--text-muted);">' + escapeHtml(it.page || '') + '</span> · ';
          if (it.isCard) html += '📇 ' + escapeHtml(it.card.title || 'بدون عنوان');
          else html += escapeHtml((it.node.number ? it.node.number + ' ' : '') + (it.node.title || ''));
          html += '</div>';
        });
        html += '</div>';
      });
    } else if (tab === 'cards') {
      (window.pages || []).forEach(function (page, pIdx) {
        (page.cards || []).forEach(function (card) {
          var hay = (card.title || '') + ' ' + (card.text || '') + ' ' + (card.source || '') + ' ' + (card.tags || []).join(' ');
          if (filter && hay.toLowerCase().indexOf(filter) === -1) return;
          count++;
          var content = (card.source ? '📖 ' + card.source + '\n' : '') + (card.text || '');
          html += '<div style="background:' + (card.color === 'color-blue' ? '#dbeafe' : card.color === 'color-green' ? '#dcfce7' : card.color === 'color-pink' ? '#fce7f3' : card.color === 'color-purple' ? '#ede9fe' : card.color === 'color-orange' ? '#ffedd5' : '#fef9c3') + ';border-radius:10px;padding:10px 14px;margin-bottom:8px;border-right:3px solid #f59e0b;">';
          html += '<div style="display:flex;justify-content:space-between;align-items:center;font-size:0.7rem;color:var(--text-muted);margin-bottom:6px;">';
          html += '<span>📄 ' + escapeHtml(page.title || 'بدون عنوان') + '</span>';
          html += '<button onclick="__v11_jumpTo(' + pIdx + ',\'\')" style="background:none;border:1px solid var(--border-light);color:var(--text-muted);padding:2px 8px;border-radius:6px;cursor:pointer;font-family:Vazirmatn;font-size:0.65rem;">↗ رفتن</button>';
          html += '</div>';
          html += '<div style="font-weight:700;font-size:0.82rem;margin-bottom:6px;">' + escapeHtml(card.title || 'بدون عنوان') + '</div>';
          html += '<div style="font-size:0.78rem;line-height:1.9;white-space:pre-wrap;">' + escapeHtml(content) + '</div>';
          if (card.tags && card.tags.length) {
            html += '<div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap;">';
            card.tags.forEach(function (t) { html += '<span style="background:rgba(0,0,0,0.08);padding:2px 8px;border-radius:20px;font-size:0.6rem;">#' + escapeHtml(t) + '</span>'; });
            html += '</div>';
          }
          html += '</div>';
        });
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
    if (!nId) return;
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

  // ============================================================
  // ۶. پومودورو (قابل جابجایی + قابل تنظیم)
  // ============================================================
  var pomoState = {
    active: false, mode: 'work', timeLeft: 25 * 60,
    cycles: 0, timer: null,
    workDuration: 25 * 60, breakDuration: 5 * 60
  };

  function togglePomodoro() {
    if (pomoState.active) {
      openPomodoroSettings();
    } else {
      pomoState.active = true;
      pomoState.mode = 'work';
      pomoState.timeLeft = pomoState.workDuration;
      runPomodoro();
    }
  }
  window.__v11_togglePomodoro = togglePomodoro;

  function runPomodoro() {
    clearInterval(pomoState.timer);
    pomoState.timer = setInterval(function () {
      pomoState.timeLeft--;
      updatePomodoroDisplay();
      if (pomoState.timeLeft <= 0) {
        if (pomoState.mode === 'work') {
          pomoState.cycles++;
          pomoState.mode = 'break';
          pomoState.timeLeft = pomoState.breakDuration;
          if (window.showToast) window.showToast('✅ جلسه ' + pomoState.cycles + ' تمام شد — استراحت');
        } else {
          pomoState.mode = 'work';
          pomoState.timeLeft = pomoState.workDuration;
          if (window.showToast) window.showToast('🎯 وقت کار');
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
      el.style.cssText = 'position:fixed;top:100px;left:20px;background:#dc2626;color:#fff;padding:10px 18px;border-radius:20px;font-family:Vazirmatn,sans-serif;font-size:0.85rem;font-weight:700;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,0.35);display:flex;align-items:center;gap:10px;cursor:move;user-select:none;flex-wrap:wrap;max-width:90vw;';
      document.body.appendChild(el);
      makeDraggable(el);
    }
    var min = Math.floor(pomoState.timeLeft / 60);
    var sec = pomoState.timeLeft % 60;
    var icon = pomoState.mode === 'work' ? '🎯' : '☕';
    var label = pomoState.mode === 'work' ? 'کار' : 'استراحت';
    el.style.background = pomoState.mode === 'work' ? '#dc2626' : '#10b981';
    el.innerHTML = icon + ' ' + label + ' · ' + String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0') +
      ' · جلسه: ' + pomoState.cycles +
      ' <button onclick="event.stopPropagation();openPomodoroSettings()" style="background:rgba(255,255,255,0.25);color:#fff;border:none;padding:2px 8px;border-radius:20px;cursor:pointer;font-family:Vazirmatn;font-size:0.7rem;">⚙️</button>' +
      ' <button onclick="event.stopPropagation();__v11_stopPomo()" style="background:rgba(0,0,0,0.3);color:#fff;border:none;padding:2px 8px;border-radius:20px;cursor:pointer;font-family:Vazirmatn;font-size:0.7rem;">✕</button>';
  }

  window.__v11_stopPomo = function () {
    pomoState.active = false;
    clearInterval(pomoState.timer);
    var el = document.getElementById('v11-pomo-display');
    if (el) el.remove();
    if (window.showToast) window.showToast('⏱️ پومودورو متوقف شد');
  };

  function openPomodoroSettings() {
    var workMin = Math.round(pomoState.workDuration / 60);
    var breakMin = Math.round(pomoState.breakDuration / 60);
    var html = '<h3>⚙️ تنظیمات پومودورو</h3>';
    html += '<div style="background:var(--bg-main);padding:12px;border-radius:10px;margin-bottom:14px;font-size:0.8rem;">';
    html += 'وضعیت فعلی: <strong>' + (pomoState.mode === 'work' ? 'کار' : 'استراحت') + '</strong> · ';
    html += 'جلسات انجام‌شده: <strong>' + pomoState.cycles + '</strong>';
    html += '</div>';

    html += '<label>مدت کار (دقیقه):</label>';
    html += '<input type="number" id="v11-pomo-work" value="' + workMin + '" min="1" max="180" />';

    html += '<label>مدت استراحت (دقیقه):</label>';
    html += '<input type="number" id="v11-pomo-break" value="' + breakMin + '" min="1" max="60" />';

    html += '<div style="background:#fef3c7;padding:10px 14px;border-radius:10px;margin:10px 0;font-size:0.72rem;color:#78350f;line-height:1.9;">';
    html += '💡 تنظیمات پیش‌فرض پومودورو: ۲۵ دقیقه کار / ۵ دقیقه استراحت';
    html += '</div>';

    html += '<div class="modal-actions" style="margin-top:14px;flex-wrap:wrap;">';
    html += '<button class="btn-cancel" onclick="__v11_resetPomo()">پیش‌فرض (۲۵/۵)</button>';
    if (pomoState.active) {
      html += '<button class="btn-cancel" onclick="__v11_stopPomo();closeV11Modal()" style="color:#dc2626;">⏹ توقف</button>';
    } else {
      html += '<button class="btn-cancel" onclick="__v11_startPomo()" style="background:#10b981;color:#fff;">▶ شروع</button>';
    }
    html += '<button class="btn-confirm" onclick="__v11_savePomo()">💾 ذخیره</button>';
    html += '</div>';
    showModal(html, '440px');
  }
  window.openPomodoroSettings = openPomodoroSettings;

  window.__v11_savePomo = function () {
    var w = parseInt(document.getElementById('v11-pomo-work').value) || 25;
    var b = parseInt(document.getElementById('v11-pomo-break').value) || 5;
    pomoState.workDuration = w * 60;
    pomoState.breakDuration = b * 60;
    try { localStorage.setItem('v11_pomo', JSON.stringify({ w: w, b: b })); } catch (e) {}
    if (pomoState.active) {
      if (pomoState.mode === 'work') pomoState.timeLeft = pomoState.workDuration;
      else pomoState.timeLeft = pomoState.breakDuration;
      updatePomodoroDisplay();
    }
    closeModal();
    if (window.showToast) window.showToast('✅ ' + w + '/' + b + ' دقیقه');
  };

  window.__v11_resetPomo = function () {
    document.getElementById('v11-pomo-work').value = 25;
    document.getElementById('v11-pomo-break').value = 5;
  };

  window.__v11_startPomo = function () {
    pomoState.active = true;
    pomoState.mode = 'work';
    pomoState.timeLeft = pomoState.workDuration;
    runPomodoro();
    closeModal();
  };

  function loadPomoSettings() {
    try {
      var s = localStorage.getItem('v11_pomo');
      if (s) {
        var d = JSON.parse(s);
        if (d.w) pomoState.workDuration = d.w * 60;
        if (d.b) pomoState.breakDuration = d.b * 60;
      }
    } catch (e) {}
  }

  // ============================================================
  // ۷. هدف کلمات
  // ============================================================
  var goalState = { goal: 500, today: 0, lastDate: null, totalWords: 0 };

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
    var today = new Date().toDateString();
    if (goalState.lastDate !== today) {
      goalState.today = 0;
      goalState.lastDate = today;
      saveWordGoal();
    }
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
    var num = el.querySelector('.v11-goal-num');
    if (num) num.textContent = goalState.today + '/' + goalState.goal;
    var bar = el.querySelector('.v11-goal-bar-inner');
    if (bar) bar.style.width = pct + '%';
  }

  function openWordGoalModal() {
    var pct = goalState.goal > 0 ? Math.min(100, Math.round((goalState.today / goalState.goal) * 100)) : 0;
    var html = '<h3>🎯 هدف کلمهٔ روزانه</h3>';
    html += '<div style="text-align:center;padding:20px 0;background:var(--bg-main);border-radius:14px;margin-bottom:14px;">';
    html += '<div style="font-size:3rem;font-weight:900;color:' + (pct >= 100 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#dc2626') + ';">' + pct + '%</div>';
    html += '<div style="font-size:0.85rem;color:var(--text-muted);margin-top:8px;">' + goalState.today + ' از ' + goalState.goal + ' کلمه</div>';
    html += '<div style="width:80%;height:8px;background:var(--bg-card);border-radius:30px;margin:14px auto 0;overflow:hidden;">';
    html += '<div style="width:' + pct + '%;height:100%;background:linear-gradient(90deg,#10b981,#34d399);transition:width 0.3s;"></div>';
    html += '</div></div>';

    html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:14px;">';
    html += '<div style="background:var(--bg-main);padding:10px;border-radius:10px;text-align:center;"><div style="font-size:1.2rem;font-weight:900;color:var(--primary);">' + (goalState.totalWords || 0).toLocaleString('fa-IR') + '</div><div style="font-size:0.65rem;color:var(--text-muted);">کل پروژه</div></div>';
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
  // ۸. تخلیه ذهن
  // ============================================================
  function openScratchpad() {
    var saved = '';
    try { saved = localStorage.getItem('v11_scratchpad') || ''; } catch (e) {}
    var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">';
    html += '<h3 style="margin:0;">📝 تخلیه ذهن</h3>';
    html += '<button onclick="closeV11Modal()" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--text-muted);">✕</button>';
    html += '</div>';
    html += '<p style="font-size:0.72rem;color:var(--text-muted);margin-bottom:12px;">افکار، ایده‌ها و نکات موقت. خودکار ذخیره می‌شود.</p>';
    html += '<textarea id="v11-scratch-text" rows="15" placeholder="هر چیزی که توی ذهنت هست رو اینجا بنویس..." style="width:100%;padding:12px 14px;border-radius:12px;border:1px solid var(--border-light);background:var(--bg-main);font-family:Vazirmatn;font-size:0.85rem;line-height:2;resize:vertical;min-height:300px;">' + escapeHtml(saved) + '</textarea>';
    html += '<div class="modal-actions" style="margin-top:14px;flex-wrap:wrap;">';
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
    var autoSave = setInterval(function () {
      var t = document.getElementById('v11-scratch-text');
      if (!t) { clearInterval(autoSave); return; }
      try { localStorage.setItem('v11_scratchpad', t.value); } catch (e) {}
    }, 2000);
  }
  window.openScratchpad = openScratchpad;

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
  // ۹. helper برای fuzzy
  // ============================================================
  function openFuzzySearchV11() {
    if (typeof window.openFuzzySearch === 'function') window.openFuzzySearch();
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
    hookWordTracking();
    hideCardButtonFromSections();
    hideStatusButtons();
    hideVersionsButton();

    setTimeout(function () { captureSnapshot('شروع'); }, 2000);

    console.log('✅ v11.1 ready (regrouped toolbar · undo/redo · pomodoro · goal badge · hatāli)');
  }

  function hideCardButtonFromSections() {
    var obs = new MutationObserver(applyHide);
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(applyHide, 500);
    setTimeout(applyHide, 2000);
  }

  function hideStatusButtons() {
    // حذف دکمهٔ وضعیت از node-tools
    var obs = new MutationObserver(function () {
      document.querySelectorAll('.tree-header .node-tools').forEach(function (toolbar) {
        toolbar.querySelectorAll('button').forEach(function (btn) {
          var t = btn.title || '';
          if (t.indexOf('وضعیت') !== -1) btn.style.display = 'none';
        });
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function hideVersionsButton() {
    // حذف دکمه نسخه‌ها از پایین صفحه
    var obs = new MutationObserver(function () {
      document.querySelectorAll('.add-child-btn').forEach(function (btn) {
        if ((btn.textContent || '').indexOf('نسخه') !== -1) btn.style.display = 'none';
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () {
      document.querySelectorAll('.add-child-btn').forEach(function (btn) {
        if ((btn.textContent || '').indexOf('نسخه') !== -1) btn.style.display = 'none';
      });
    }, 1500);
  }

  function applyHide() {
    // حذف دکمهٔ فیش از ابزار هر بخش
    document.querySelectorAll('.tree-header .node-tools').forEach(function (toolbar) {
      toolbar.querySelectorAll('button').forEach(function (btn) {
        var t = btn.textContent.trim();
        var title = btn.title || '';
        // دکمهٔ فیش (📇 با title فیش)
        if (t === '📇' && title.indexOf('فیش') !== -1) btn.style.display = 'none';
        // دکمهٔ وضعیت (📌)
        if (t === '📌' || title.indexOf('وضعیت') !== -1) btn.style.display = 'none';
        // آیکون 📎 که به پاورقی مرتبطه
        if (t === '📎' && title.indexOf('زیربخش') !== -1) btn.style.display = 'none';
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 3000); });
  } else {
    setTimeout(boot, 3000);
  }
})();