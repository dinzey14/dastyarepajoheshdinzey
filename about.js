/**
 * about.js — بخش درباره برنامه
 * دستیار پژوهش دینزی
 */
(function () {
  'use strict';

  function injectCSS() {
    var css = ''
      + '#abOverlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;z-index:999999;padding:20px;direction:rtl;font-family:Vazirmatn,sans-serif;}'
      + '#abOverlay.show{display:flex;}'
      + '#abBox{background:#fff;border-radius:24px;width:100%;max-width:520px;padding:0;overflow:hidden;box-shadow:0 40px 80px rgba(0,0,0,0.5);}'
      + '#abBox .ab-head{background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:36px 32px 28px;text-align:center;color:#fff;position:relative;}'
      + '#abBox .ab-head .ab-logo{font-size:4rem;margin-bottom:12px;line-height:1;}'
      + '#abBox .ab-head h2{margin:0 0 6px;font-size:1.4rem;font-weight:900;}'
      + '#abBox .ab-head .ab-en{font-size:0.75rem;letter-spacing:2px;opacity:0.7;direction:ltr;margin-bottom:8px;}'
      + '#abBox .ab-head .ab-ver{font-size:0.7rem;opacity:0.6;background:rgba(255,255,255,0.15);display:inline-block;padding:3px 12px;border-radius:20px;margin-top:4px;}'
      + '#abBox .ab-body{padding:28px 32px;}'
      + '#abBox .ab-row{display:flex;align-items:center;gap:14px;padding:14px 16px;background:#f8fafc;border-radius:14px;margin-bottom:10px;border:1px solid #e2e8f0;}'
      + '#abBox .ab-row .ab-icon{font-size:1.5rem;flex-shrink:0;width:36px;text-align:center;}'
      + '#abBox .ab-row .ab-info{flex:1;min-width:0;}'
      + '#abBox .ab-row .ab-info .ab-lbl{font-size:0.68rem;color:#64748b;margin-bottom:3px;}'
      + '#abBox .ab-row .ab-info .ab-val{font-size:0.9rem;font-weight:700;color:#0f172a;direction:ltr;text-align:right;word-break:break-all;}'
      + '#abBox .ab-row .ab-info .ab-val.fa{direction:rtl;text-align:right;}'
      + '#abBox .ab-footer{padding:16px 32px 24px;text-align:center;font-size:0.7rem;color:#94a3b8;line-height:1.9;}'
      + '#abClose{position:absolute;top:16px;left:16px;background:rgba(255,255,255,0.15);color:#fff;border:none;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:0.9rem;line-height:1;transition:background 0.15s;}'
      + '#abClose:hover{background:rgba(255,255,255,0.3);}'
      + '.ab-copy-hint{font-size:0.6rem;color:#94a3b8;margin-right:6px;}'
      + '.ab-copyable{cursor:pointer;}'
      + '.ab-copyable:hover .ab-val{color:#1e3a5f;}'
    ;
    var s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
  }

  function buildAbout() {
    if (document.getElementById('abOverlay')) return;
    var overlay = document.createElement('div');
    overlay.id = 'abOverlay';
    overlay.innerHTML =
      '<div id="abBox">' +
        '<div class="ab-head">' +
          '<button id="abClose" onclick="window.__abClose()" title="بستن">✕</button>' +
          '<div class="ab-logo">📚</div>' +
          '<h2>دستیار پژوهش دینزی</h2>' +
          '<div class="ab-en">Dastyare Pajohesh Dinzey</div>' +
          '<div class="ab-ver">نسخهٔ ۱.۰ · دسکتاپ</div>' +
        '</div>' +
        '<div class="ab-body">' +
          '<div class="ab-row">' +
            '<span class="ab-icon">🏢</span>' +
            '<div class="ab-info">' +
              '<div class="ab-lbl">سازنده</div>' +
              '<div class="ab-val fa">مرکز نوآوری دینزی</div>' +
            '</div>' +
          '</div>' +
          '<div class="ab-row ab-copyable" onclick="window.__abCopy(\'09014136926\')" title="برای کپی کلیک کنید">' +
            '<span class="ab-icon">📞</span>' +
            '<div class="ab-info">' +
              '<div class="ab-lbl">شماره تماس <span class="ab-copy-hint">(کلیک برای کپی)</span></div>' +
              '<div class="ab-val">09014136926</div>' +
            '</div>' +
          '</div>' +
          '<div class="ab-row">' +
            '<span class="ab-icon">📖</span>' +
            '<div class="ab-info">' +
              '<div class="ab-lbl">کاربرد</div>' +
              '<div class="ab-val fa" style="font-size:0.8rem;font-weight:500;line-height:1.8;">ابزار حرفه‌ای نوشتن تحقیق، مقاله، پایان‌نامه و کتاب با فیش‌برداری، پاورقی، منابع و خروجی چند فرمته</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="ab-footer">' +
          '© ۱۴۰۴ مرکز نوآوری دینزی · تمامی حقوق محفوظ است' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeAbout();
    });
  }

  function openAbout() {
    buildAbout();
    setTimeout(function () {
      document.getElementById('abOverlay').classList.add('show');
    }, 20);
  }
  function closeAbout() {
    var ov = document.getElementById('abOverlay');
    if (ov) ov.classList.remove('show');
  }

  window.__abClose = closeAbout;
  window.__abOpen = openAbout;
  window.__abCopy = function (text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:-9999px;';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      if (window.showToast) window.showToast('✅ شماره کپی شد: ' + text);
      else alert('کپی شد: ' + text);
    } catch (e) {
      alert('کد: ' + text);
    }
  };

  // اضافه کردن دکمه به نوار ابزار
  function addAboutButton() {
    var actions = document.querySelector('.panel-toolbar .actions');
    if (!actions || actions.querySelector('[data-about-btn]')) return;
    var btn = document.createElement('button');
    btn.setAttribute('data-about-btn', '1');
    btn.title = 'درباره برنامه · دستیار پژوهش دینزی';
    btn.style.cssText = 'background:linear-gradient(135deg,#0f172a,#1e3a5f);color:#fff;';
    btn.innerHTML = 'ℹ️ درباره';
    btn.addEventListener('click', openAbout);
    actions.appendChild(btn);
  }

  // اضافه کردن به footer sidebar
  function addFooterInfo() {
    var footer = document.querySelector('.sidebar-footer');
    if (!footer) return;
    if (footer.querySelector('.ab-sidebar-info')) return;
    var info = document.createElement('div');
    info.className = 'ab-sidebar-info';
    info.style.cssText = 'margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06);font-size:0.58rem;line-height:1.9;';
    info.innerHTML =
      '<div style="opacity:0.5;margin-bottom:3px;">📚 دستیار پژوهش دینزی</div>' +
      '<div style="opacity:0.35;">مرکز نوآوری دینزی</div>' +
      '<div style="opacity:0.35;">☎ ۰۹۰۱۴۱۳۶۹۲۶</div>';
    footer.appendChild(info);
  }

  function boot() {
    injectCSS();
    addAboutButton();
    addFooterInfo();
    console.log('ℹ️ about v1 ready — دستیار پژوهش دینزی');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 600); });
  } else {
    setTimeout(boot, 600);
  }
})();