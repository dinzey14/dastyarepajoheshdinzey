/**
 * debug-panel.js — نمایش وضعیت ذخیره روی صفحه
 */
(function () {
  'use strict';

  function getPid() { return window.projectId || 'default'; }
  function getLSKey() { return 'research_app_v8_' + getPid(); }

  function countAllContent(pages) {
    var chars = 0, sections = 0, cards = 0;
    (pages || []).forEach(function (p) {
      cards += (p.cards || []).length;
      if (p.tree) {
        (function walk(n) {
          if (!n) return;
          if (n.type !== 'chapter') {
            sections++;
            chars += (n.content || '').replace(/<[^>]*>/g, '').length;
          }
          if (n.children) n.children.forEach(walk);
        })(p.tree);
      }
    });
    return { chars: chars, sections: sections, cards: cards };
  }

  function buildPanel() {
    if (document.getElementById('dbgPanel')) return;
    var panel = document.createElement('div');
    panel.id = 'dbgPanel';
    panel.style.cssText = 'position:fixed;bottom:12px;right:12px;background:rgba(15,23,42,0.95);color:#e2e8f0;' +
      'padding:10px 14px;border-radius:12px;font-family:monospace;font-size:11px;z-index:9999998;' +
      'box-shadow:0 8px 24px rgba(0,0,0,0.4);border:1px solid #334155;min-width:220px;direction:ltr;line-height:1.7;display:none;';
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
        '<b style="color:#facc15;">📊 Debug</b>' +
        '<button id="dbgClose" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:14px;">✕</button>' +
      '</div>' +
      '<div id="dbgBody"></div>' +
      '<div style="margin-top:8px;display:flex;gap:6px;">' +
        '<button id="dbgSave" style="background:#16a34a;color:#fff;border:none;padding:4px 10px;border-radius:6px;cursor:pointer;font-family:monospace;font-size:10px;">💾 ذخیره</button>' +
        '<button id="dbgLoad" style="background:#0891b2;color:#fff;border:none;padding:4px 10px;border-radius:6px;cursor:pointer;font-family:monospace;font-size:10px;">📂 بارگذاری</button>' +
        '<button id="dbgTest" style="background:#7c3aed;color:#fff;border:none;padding:4px 10px;border-radius:6px;cursor:pointer;font-family:monospace;font-size:10px;">🧪 تست</button>' +
      '</div>';
    document.body.appendChild(panel);

    document.getElementById('dbgClose').onclick = function () { panel.style.display = 'none'; };
    document.getElementById('dbgSave').onclick = async function () {
      if (window.__saveNow) {
        var r = await window.__saveNow('debug');
        update();
        alert('save result: ' + JSON.stringify(r));
      } else if (window.saveData) {
        window.saveData();
        setTimeout(update, 500);
      }
    };
    document.getElementById('dbgLoad').onclick = async function () {
      if (window.loadFromFolder) {
        var ok = await window.loadFromFolder();
        if (window.renderAll) window.renderAll();
        update();
        alert('load result: ' + ok);
      }
    };
    document.getElementById('dbgTest').onclick = function () {
      // تست: یک صفحه بساز و ذخیره کن و بلافاصله بخون
      try {
        var before = (window.pages || []).length;
        // ذخیره
        if (window.__saveNow) {
          window.__saveNow('test');
        }
        // خوندن
        setTimeout(function () {
          var key = getLSKey();
          var stored = localStorage.getItem(key);
          var data = stored ? JSON.parse(stored) : null;
          var after = data && data.pages ? data.pages.length : -1;
          var msg = 'before=' + before + '\nafter(LS)=' + after;
          if (window.projectFolderHandle) {
            msg += '\nfolder connected ✓';
          } else {
            msg += '\nfolder NOT connected ✗';
          }
          alert(msg);
        }, 800);
      } catch (e) { alert('Error: ' + e.message); }
    };
  }

  function update() {
    var panel = document.getElementById('dbgPanel');
    if (!panel) return;
    var body = document.getElementById('dbgBody');
    if (!body) return;

    var pgs = window.pages || [];
    var info = countAllContent(pgs);
    var lsKey = getLSKey();
    var lsSize = 0, lsPages = -1;
    try {
      var raw = localStorage.getItem(lsKey);
      if (raw) {
        lsSize = Math.round(raw.length / 1024);
        var d = JSON.parse(raw);
        lsPages = d && d.pages ? d.pages.length : 0;
      }
    } catch (e) {}

    var folder = window.projectFolderHandle ? '✅' : '❌';
    var lsIndicator = lsPages >= 0 ? '✅' : '❌';

    body.innerHTML =
      '<div>project: <b style="color:#facc15;">' + getPid() + '</b></div>' +
      '<div>pages(mem): <b>' + pgs.length + '</b></div>' +
      '<div>pages(LS): <b style="color:' + (lsPages === pgs.length ? '#10b981' : '#f59e0b') + ';">' + lsPages + '</b></div>' +
      '<div>sections: ' + info.sections + ' | chars: ' + info.chars + '</div>' +
      '<div>cards: ' + info.cards + '</div>' +
      '<div>LS size: ' + lsSize + 'KB ' + lsIndicator + '</div>' +
      '<div>folder: ' + folder + '</div>' +
      '<div>tabId: ' + (window.tabId || '?').slice(-6) + '</div>';
  }

  function boot() {
    buildPanel();
    // نمایش پنل با Ctrl+Shift+D
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd' || e.key === 'ی')) {
        e.preventDefault();
        var p = document.getElementById('dbgPanel');
        if (p) p.style.display = p.style.display === 'none' ? 'block' : 'none';
        update();
      }
    });
    // آپدیت هر ۳ ثانیه (اگه نمایش داده شده)
    setInterval(function () {
      var p = document.getElementById('dbgPanel');
      if (p && p.style.display !== 'none') update();
    }, 3000);
    console.log('🔍 debug-panel ready — Ctrl+Shift+D برای نمایش');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 500); });
  } else {
    setTimeout(boot, 500);
  }
})();