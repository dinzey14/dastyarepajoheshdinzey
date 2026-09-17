/**
 * custom-alerts.js — دیالوگ بومی Electron
 * جایگزین alert و confirm با دیالوگ‌های ویندوز
 */
(function () {
  'use strict';

  if (typeof window.__alert === 'function') {
    window.alert = function (msg) {
      window.__alert(msg);
    };
  }

  if (typeof window.__confirm === 'function') {
    window.confirm = function (msg) {
      return window.__confirm(msg);
    };
  }

  console.log('✅ custom-alerts ready (native dialogs)');
})();