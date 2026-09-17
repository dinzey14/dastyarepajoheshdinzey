/**
 * safe-create.js — رفع باگ دکمهٔ ایجاد پروژه
 * - بدون alert بومی (که باعث هنگ می‌شه)
 * - نمایش خطا با تغییر رنگ input + toast
 * - مکانیزم نجات برای هر مودال گیرکرده
 */
(function () {
  'use strict';

  // ============================================================
  // ★ دکمهٔ ایجاد پروژه — بدون alert
  // ============================================================
  window.createProjectFromModal = async function () {
    var inp = document.getElementById('newProjectNameInput');
    if (!inp) return;

    var name = String(inp.value || '').trim();

    // ─── اگه خالی بود: قرمز کن و فوکوس بده ───
    if (!name) {
      inp.focus();
      inp.style.borderColor = '#dc2626';
      inp.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.15)';
      inp.style.transition = 'all 0.2s';
      setTimeout(function () {
        inp.style.borderColor = '';
        inp.style.boxShadow = '';
      }, 2000);

      if (window.showToast) window.showToast('⚠️ نام پروژه را وارد کنید');
      return;
    }

    var clean = name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\u0600-\u06FF\-_]/g, '');
    if (!clean) {
      inp.focus();
      inp.style.borderColor = '#dc2626';
      inp.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.15)';
      setTimeout(function () {
        inp.style.borderColor = '';
        inp.style.boxShadow = '';
      }, 2000);
      if (window.showToast) window.showToast('⚠️ نام نامعتبر — فقط حروف و اعداد');
      return;
    }

    // ─── دکمه رو غیرفعال کن که دوبار کلیک نشه ───
    var btns = document.querySelectorAll('#projectsOverlay .btn-confirm');
    btns.forEach(function (b) { b.disabled = true; b.style.opacity = '0.6'; });

    try {
      if (window.saveData) window.saveData();
    } catch (e) { console.warn('saveData error', e); }

    // ─── مودال رو ببند و پروژه جدید باز کن ───
    var overlay = document.getElementById('projectsOverlay');
    if (overlay) overlay.classList.remove('show');

    setTimeout(function () {
      if (clean === 'default') {
        window.location.href = window.location.href.split('#')[0];
      } else {
        window.location.hash = encodeURIComponent(clean);
        window.location.reload();
      }
    }, 150);
  };

  // ============================================================
  // ★ مکانیزم نجات — اگر هر مودالی گیر کرد
  // ============================================================
  function rescueUI() {
    // ۱. بستن همهٔ مودال‌های باز
    document.querySelectorAll('.modal-overlay.show').forEach(function (m) {
      // به‌جز مودال‌های ضروری مثل forceFolder در اولین بار
      if (m.id === 'forceFolderOverlay') return;
      m.classList.remove('show');
    });

    // ۲. ریست pointer-events و cursor
    document.body.style.pointerEvents = '';
    document.body.style.cursor = '';
    document.documentElement.style.pointerEvents = '';
    document.documentElement.style.cursor = '';

    // ۳. غیرفعال کردن هر disabled گیرکرده
    document.querySelectorAll('button:disabled').forEach(function (b) {
      b.disabled = false;
      b.style.opacity = '';
    });

    // ۴. آزادسازی فوکوس
    try { document.activeElement && document.activeElement.blur(); } catch (e) {}

    // ۵. برداشتن overlay اضافی
    document.querySelectorAll('[data-temp-overlay]').forEach(function (o) { o.remove(); });

    console.log('[safe-create] UI rescued');
  }

  // با Ctrl+Alt+R یا کلید Escape در مواقع اضطراری
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      rescueUI();
    }
    // Ctrl+Alt+R — نجات اضطراری
    if (e.ctrlKey && e.altKey && (e.key === 'R' || e.key === 'r' || e.key === 'ق')) {
      e.preventDefault();
      rescueUI();
      if (window.showToast) window.showToast('🔓 برنامه آزاد شد');
    }
  });

  // ============================================================
  // ★ دکمهٔ ایجاد در Enter کار کنه
  // ============================================================
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var inp = document.getElementById('newProjectNameInput');
    if (!inp || document.activeElement !== inp) return;
    e.preventDefault();
    window.createProjectFromModal();
  });

  // ============================================================
  // ★ گوش دادن به هر بسته شدن مودال — ریست خودکار
  // ============================================================
  var observer = new MutationObserver(function (muts) {
    muts.forEach(function (m) {
      if (m.type === 'attributes' && m.attributeName === 'class') {
        var el = m.target;
        if (el.classList && el.classList.contains('modal-overlay') && !el.classList.contains('show')) {
          // مودال بسته شد — مطمئن شو حالت آزاده
          setTimeout(function () {
            if (!document.querySelector('.modal-overlay.show')) {
              document.body.style.pointerEvents = '';
              document.body.style.cursor = '';
            }
          }, 50);
        }
      }
    });
  });

  setTimeout(function () {
    document.querySelectorAll('.modal-overlay').forEach(function (m) {
      observer.observe(m, { attributes: true, attributeFilter: ['class'] });
    });
  }, 2000);

  console.log('✅ safe-create ready');
})();