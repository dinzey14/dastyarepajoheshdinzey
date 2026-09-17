/**
 * speed-only.js — فقط بهبود سرعت
 * هیچ دست‌کاری روی alert / confirm / focus ندارد.
 */
(function () {
  'use strict';

  // ============================================================
  // ذخیرهٔ هوشمند — فقط بعد از ۳ ثانیه سکون
  // ============================================================
  if (window.__saveNow) {
    var _origSaveNow = window.__saveNow;
    var debounceTimer = null;
    var lastHash = '';

    function hash() {
      try {
        var p = window.pages || [];
        var h = p.length + ':';
        for (var i = 0; i < p.length; i++) {
          var pg = p[i];
          if (pg.tree) {
            (function walk(n) {
              if (!n) return;
              if (n.type !== 'chapter') h += (n.content || '').length + ',';
              if (n.children) n.children.forEach(walk);
            })(pg.tree);
          }
        }
        return h;
      } catch (e) { return 'e' + Date.now(); }
    }

    window.__saveNow = function (reason) {
      // رویدادهای فوری — بدون تأخیر
      if (reason === 'button' || reason === 'ctrl-s' || reason === 'hidden' ||
          reason === 'beforeunload' || reason === 'switch-old' || reason === 'switch-new') {
        return _origSaveNow.call(window, reason);
      }

      var h = hash();
      if (h === lastHash && reason !== 'init-folder') {
        return Promise.resolve({ skipped: true });
      }
      lastHash = h;

      clearTimeout(debounceTimer);
      return new Promise(function (resolve) {
        debounceTimer = setTimeout(function () {
          Promise.resolve(_origSaveNow.call(window, reason))
            .then(resolve)
            .catch(function () { resolve({}); });
        }, 2500);
      });
    };
  }

  // ============================================================
  // تایپ — بدون render اضافی
  // ============================================================
  if (typeof window.updateNodeContent === 'function') {
    var typingTimer = null;
    window.updateNodeContent = function (id, html) {
      var p = window.pages && window.pages[window.currentPageIndex];
      if (!p) return;
      var n = window.findNode ? window.findNode(p.tree, id) : null;
      if (!n) return;
      n.content = html;
      n.updatedAt = new Date().toISOString();

      var el = document.getElementById('saveIndicator');
      if (el) el.textContent = '💾';

      clearTimeout(typingTimer);
      typingTimer = setTimeout(function () {
        if (window.saveData) window.saveData();
      }, 3000);
    };
  }

  console.log('✅ speed-only ready');
})();