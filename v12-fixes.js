/* v12-fixes.js — اصلاحات رابط کاربری و ابزارهای نسخه ۱۱ */
(function () {
  'use strict';
  var originalClearPage = window.clearPage;
  var originalExportDocx = window.exportDOCX;
  var originalFocus = window.toggleFocusMode;
  var originalTranslate = window.openTranslate;
  var moved = false;

  function buttons() { return Array.prototype.slice.call(document.querySelectorAll('button')); }
  function textOf(b) { return ((b.textContent || '') + ' ' + (b.title || '')).replace(/\s+/g, ' ').trim(); }
  function hideMatching(pattern) {
    buttons().forEach(function (b) { if (pattern.test(textOf(b))) b.style.display = 'none'; });
  }
  function toast(s) { if (window.showToast) window.showToast(s); }

  function removeRedundantControls() {
    var seenTranslate = false;
    buttons().forEach(function (b) {
      var t = textOf(b);
      if (/وضعیت/.test(t) || /نسخه/.test(t) || /افزودن بخش/.test(t) || /هدف کلمات/.test(t)) b.style.display = 'none';
      if (/ترجمه/.test(t)) { if (seenTranslate) b.style.display = 'none'; else seenTranslate = true; }
      if (/DOCX/i.test(t)) b.style.display = 'none';
    });
  }

  function ensureDock() {
    if (document.getElementById('v12-focus-dock')) return;
    var dock = document.createElement('div');
    dock.id = 'v12-focus-dock';
    dock.innerHTML = '<div class="v12-dock-title">ابزارهای تمرکز</div>' +
      '<button type="button" data-v12-action="focus">🎯 تمرکز</button>' +
      '<button type="button" data-v12-action="pomo">⏱️ پومودورو</button>' +
      '<button type="button" data-v12-action="toolbar">🎨 نوار ابزار</button>' +
      '<button type="button" data-v12-action="undo">↶ واگرد</button>' +
      '<button type="button" data-v12-action="redo">↷ بازگشت</button>';
    document.body.appendChild(dock);
    dock.querySelector('[data-v12-action="focus"]').onclick = function () { if (originalFocus) originalFocus(); else if (window.__v11_toggleFocus) window.__v11_toggleFocus(); };
    dock.querySelector('[data-v12-action="pomo"]').onclick = function () { var b = document.querySelector('[data-v11="pomodoro"]'); if (b) b.click(); };
    dock.querySelector('[data-v12-action="toolbar"]').onclick = function () { if (window.showRichToolbar) window.showRichToolbar(); };
    dock.querySelector('[data-v12-action="undo"]').onclick = function () { if (window.__v11_undo) window.__v11_undo(); };
    dock.querySelector('[data-v12-action="redo"]').onclick = function () { if (window.__v12_redo) window.__v12_redo(); };
    makeDraggable(dock);
    var topFocus = document.querySelector('[data-v11="focus"]');
    var topPomo = document.querySelector('[data-v11="pomodoro"]');
    if (topFocus) topFocus.style.display = 'none';
    if (topPomo) topPomo.style.display = 'none';
  }

  function makeDraggable(el) {
    var sx, sy, ox, oy, dragging = false;
    el.addEventListener('pointerdown', function (e) { if (e.target.tagName === 'BUTTON') return; dragging = true; sx = e.clientX; sy = e.clientY; var r = el.getBoundingClientRect(); ox = r.left; oy = r.top; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', function (e) { if (!dragging) return; el.style.left = Math.max(4, ox + e.clientX - sx) + 'px'; el.style.top = Math.max(4, oy + e.clientY - sy) + 'px'; el.style.right = 'auto'; });
    el.addEventListener('pointerup', function () { dragging = false; });
  }

  function addCardsTab() {
    var old = window.openUniversalViewer;
    if (!old || old.__v12Wrapped) return;
    function wrapped() { old.apply(this, arguments); setTimeout(function () {
      var tabs = document.querySelectorAll('#v11Modal button');
      var exists = Array.prototype.some.call(tabs, function (b) { return /فیش/.test(b.textContent); });
      if (exists) return;
      var anchor = Array.prototype.find.call(tabs, function (b) { return /هشتگ/.test(b.textContent); });
      if (!anchor) return;
      var b = document.createElement('button'); b.textContent = '📇 فیش‌ها'; b.style.cssText = anchor.style.cssText; b.onclick = function () { renderCardsTab(); }; anchor.parentNode.insertBefore(b, anchor);
    }, 30); }
    wrapped.__v12Wrapped = true; window.openUniversalViewer = wrapped;
    function renderCardsTab() {
      var c = document.getElementById('v11-viewer-content'); if (!c) return;
      var html = '', count = 0;
      (window.pages || []).forEach(function (p, pi) { (p.cards || []).forEach(function (card) { count++; html += '<div style="background:var(--bg-main);border-radius:10px;padding:10px 14px;margin-bottom:8px;border-right:3px solid #f59e0b;"><div style="font-size:.7rem;color:var(--text-muted);">📄 ' + esc(p.title || 'بدون عنوان') + '</div><b>' + esc(card.title || 'بدون عنوان') + '</b><div style="white-space:pre-wrap;line-height:1.9;">' + esc(card.text || card.body || '') + '</div></div>'; }); });
      c.innerHTML = count ? '<div style="font-size:.72rem;color:var(--text-muted);margin-bottom:8px;">' + count + ' فیش</div>' + html : '<div style="text-align:center;padding:30px;color:var(--text-muted);">هیچ فیشی نیست</div>';
    }
    function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  }

  function fixClearPage() {
    if (typeof originalClearPage !== 'function') return;
    window.clearPage = function () {
      if (!window.pages || !window.pages.length) return toast('صفحه‌ای برای پاک کردن نیست');
      if (!confirm('کل فصل و تمام بخش‌های آن پاک شود؟')) return;
      window.pages.splice(window.currentPageIndex || 0, 1);
      window.currentPageIndex = Math.max(0, Math.min(window.currentPageIndex || 0, window.pages.length - 1));
      if (window.saveData) window.saveData();
      if (window.renderAll) window.renderAll();
      toast('کل فصل پاک شد');
    };
  }

  function fixDocx() {
    window.exportDOCX = function () {
      toast('خروجی DOCX در این نسخه غیرفعال است؛ از Word یا PDF استفاده کنید');
      if (typeof originalExportDocx === 'function') { try { originalExportDocx(); } catch (e) {} }
    };
  }

  function styleAndBoot() {
    removeRedundantControls(); ensureDock(); addCardsTab(); fixClearPage(); fixDocx();
    document.body.classList.add('v12-ready');
    var actions = document.querySelector('.panel-toolbar .actions');
    if (actions) actions.setAttribute('aria-label', 'ابزارهای اصلی پژوهش');
  }
  var css = document.createElement('style');
  css.textContent = '#v12-focus-dock{position:fixed;z-index:4900;right:18px;bottom:22px;width:145px;padding:8px;background:rgba(15,23,42,.94);border:1px solid rgba(250,204,21,.35);border-radius:16px;box-shadow:0 12px 35px rgba(0,0,0,.24);display:flex;flex-direction:column;gap:5px;direction:rtl;cursor:move}#v12-focus-dock .v12-dock-title{color:#facc15;font-size:.65rem;font-weight:700;text-align:center;padding-bottom:4px;border-bottom:1px solid #334155}#v12-focus-dock button{border:0;border-radius:9px;padding:6px 8px;background:#1e3a5f;color:#fff;font:600 .65rem Vazirmatn;cursor:pointer}#v12-focus-dock button:hover{background:#334155;transform:translateY(-1px)}.v12-ready .panel-toolbar .actions{gap:5px;padding:4px 0}.v12-ready .panel-toolbar .actions button{box-shadow:0 2px 7px rgba(15,23,42,.08);transition:transform .15s,box-shadow .15s}.v12-ready .panel-toolbar .actions button:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(15,23,42,.16)}';
  document.head.appendChild(css);
  setTimeout(styleAndBoot, 3500); setTimeout(styleAndBoot, 6000);
})();
