/**
 * ux-pack.js — UX Pack v1
 * شامل: Splash Screen, Recent Projects, Templates,
 *        Command Palette, Context Menu, Clipboard Manager
 */
(function () {
  'use strict';

  // ============================================================
  // 0. ابزارها
  // ============================================================
  var RECENT_KEY = 'ux_recent_projects';
  var CLIP_KEY = 'ux_clipboard_history';
  var MAX_CLIP = 20;

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }
  function escape(str) {
    if (str == null) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function notify(msg) {
    if (typeof window.showToast === 'function') window.showToast(msg);
    else {
      var t = el('div', { style: 'position:fixed;bottom:60px;left:50%;transform:translateX(-50%);background:#0f172a;color:#fff;padding:10px 22px;border-radius:30px;font-family:Vazirmatn;font-size:0.8rem;z-index:999999;' }, msg);
      document.body.appendChild(t);
      setTimeout(function () { t.remove(); }, 2200);
    }
  }

  // ============================================================
  // 1. CSS
  // ============================================================
  function injectCSS() {
    var css = ''
      // Splash
      + '#uxSplash{position:fixed;inset:0;background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);z-index:999999;display:flex;align-items:center;justify-content:center;flex-direction:column;direction:rtl;transition:opacity 0.5s ease, visibility 0.5s;font-family:Vazirmatn,sans-serif;}'
      + '#uxSplash.hide{opacity:0;visibility:hidden;}'
      + '#uxSplash .logo{font-size:5rem;margin-bottom:20px;animation:uxFloat 2.5s ease-in-out infinite;}'
      + '#uxSplash h1{color:#fff;font-size:1.8rem;font-weight:900;margin-bottom:10px;letter-spacing:1px;}'
      + '#uxSplash p{color:#94a3b8;font-size:0.85rem;margin-bottom:36px;}'
      + '#uxSplash .loader{width:220px;height:4px;background:rgba(255,255,255,0.1);border-radius:10px;overflow:hidden;}'
      + '#uxSplash .loader-bar{height:100%;background:linear-gradient(90deg,#facc15,#f59e0b);width:0;border-radius:10px;transition:width 0.3s ease;}'
      + '#uxSplash .hint{position:absolute;bottom:30px;color:#475569;font-size:0.7rem;}'
      + '@keyframes uxFloat{0%,100%{transform:translateY(0);}50%{transform:translateY(-12px);}}'

      // Command Palette
      + '#uxCmdOverlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);display:none;align-items:flex-start;justify-content:center;padding-top:12vh;z-index:999998;direction:rtl;font-family:Vazirmatn,sans-serif;}'
      + '#uxCmdOverlay.show{display:flex;}'
      + '#uxCmdBox{background:#fff;border-radius:18px;width:100%;max-width:600px;box-shadow:0 40px 80px rgba(0,0,0,0.5);overflow:hidden;animation:uxSlideDown 0.2s ease;}'
      + '@keyframes uxSlideDown{from{transform:translateY(-20px);opacity:0;}to{transform:translateY(0);opacity:1;}}'
      + '#uxCmdInput{width:100%;padding:18px 22px;border:none;outline:none;font-family:Vazirmatn,sans-serif;font-size:1rem;background:transparent;color:#0f172a;border-bottom:1px solid #e2e8f0;direction:rtl;}'
      + '#uxCmdInput::placeholder{color:#94a3b8;}'
      + '#uxCmdList{max-height:420px;overflow-y:auto;padding:6px;}'
      + '#uxCmdList::-webkit-scrollbar{width:6px;}'
      + '#uxCmdList::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:10px;}'
      + '.ux-cmd-item{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:10px;cursor:pointer;transition:background 0.1s;}'
      + '.ux-cmd-item:hover,.ux-cmd-item.active{background:#f1f5f9;}'
      + '.ux-cmd-item .ux-icon{font-size:1.1rem;width:26px;text-align:center;flex-shrink:0;}'
      + '.ux-cmd-item .ux-label{flex:1;font-size:0.85rem;color:#0f172a;font-weight:500;}'
      + '.ux-cmd-item .ux-key{font-size:0.65rem;color:#94a3b8;background:#f1f5f9;padding:3px 8px;border-radius:6px;font-family:monospace;}'
      + '.ux-cmd-item.active .ux-key{background:#e0e7ff;}'
      + '.ux-cmd-empty{padding:30px;text-align:center;color:#94a3b8;font-size:0.85rem;}'
      + '.ux-cmd-footer{padding:10px 16px;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:0.65rem;color:#94a3b8;}'
      + '.ux-cmd-footer .kbd{background:#fff;border:1px solid #e2e8f0;padding:2px 6px;border-radius:5px;font-family:monospace;margin:0 3px;}'

      // Context Menu
      + '#uxCtxMenu{position:fixed;background:#fff;border-radius:12px;box-shadow:0 20px 50px rgba(0,0,0,0.25);padding:6px;z-index:999997;display:none;min-width:220px;direction:rtl;font-family:Vazirmatn,sans-serif;border:1px solid #e2e8f0;}'
      + '#uxCtxMenu.show{display:block;animation:uxCtxIn 0.1s ease;}'
      + '@keyframes uxCtxIn{from{transform:scale(0.95);opacity:0;}to{transform:scale(1);opacity:1;}}'
      + '.ux-ctx-item{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;cursor:pointer;font-size:0.82rem;color:#0f172a;transition:background 0.1s;}'
      + '.ux-ctx-item:hover{background:#f1f5f9;}'
      + '.ux-ctx-item.danger{color:#dc2626;}'
      + '.ux-ctx-item.danger:hover{background:#fee2e2;}'
      + '.ux-ctx-item .ux-icon{width:20px;text-align:center;font-size:0.95rem;}'
      + '.ux-ctx-item .ux-key{margin-right:auto;font-size:0.62rem;color:#94a3b8;font-family:monospace;}'
      + '.ux-ctx-sep{height:1px;background:#e2e8f0;margin:4px 8px;}'

      // Clipboard Manager
      + '#uxClipOverlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);display:none;align-items:center;justify-content:center;z-index:999998;padding:20px;direction:rtl;font-family:Vazirmatn,sans-serif;}'
      + '#uxClipOverlay.show{display:flex;}'
      + '#uxClipBox{background:#fff;border-radius:20px;width:100%;max-width:620px;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 30px 70px rgba(0,0,0,0.4);overflow:hidden;}'
      + '#uxClipHeader{padding:16px 22px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;}'
      + '#uxClipHeader h3{margin:0;font-size:1rem;font-weight:800;color:#0f172a;}'
      + '#uxClipHeader button{background:#fee2e2;color:#dc2626;border:none;padding:6px 14px;border-radius:20px;font-family:Vazirmatn;font-size:0.72rem;font-weight:600;cursor:pointer;}'
      + '#uxClipList{flex:1;overflow-y:auto;padding:8px;}'
      + '.ux-clip-item{padding:12px 14px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:6px;cursor:pointer;transition:all 0.1s;background:#fff;}'
      + '.ux-clip-item:hover{background:#f0f9ff;border-color:#7dd3fc;}'
      + '.ux-clip-item .ux-clip-text{font-size:0.82rem;color:#0f172a;line-height:1.8;word-break:break-word;max-height:80px;overflow:hidden;position:relative;}'
      + '.ux-clip-item .ux-clip-meta{font-size:0.65rem;color:#94a3b8;margin-top:6px;display:flex;gap:12px;align-items:center;}'
      + '.ux-clip-item .ux-clip-del{margin-right:auto;background:none;border:none;color:#dc2626;cursor:pointer;font-size:0.75rem;padding:2px 6px;border-radius:6px;}'
      + '.ux-clip-item .ux-clip-del:hover{background:#fee2e2;}'
      + '.ux-clip-empty{padding:40px 20px;text-align:center;color:#94a3b8;font-size:0.85rem;}'

      // Templates
      + '#uxTplOverlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);display:none;align-items:center;justify-content:center;z-index:999998;padding:20px;direction:rtl;font-family:Vazirmatn,sans-serif;}'
      + '#uxTplOverlay.show{display:flex;}'
      + '#uxTplBox{background:#fff;border-radius:22px;width:100%;max-width:820px;max-height:88vh;overflow-y:auto;padding:28px 32px;box-shadow:0 40px 80px rgba(0,0,0,0.4);}'
      + '#uxTplBox h3{margin:0 0 6px;font-size:1.3rem;font-weight:900;color:#0f172a;}'
      + '#uxTplBox .ux-tpl-sub{color:#64748b;font-size:0.8rem;margin-bottom:22px;line-height:1.9;}'
      + '.ux-tpl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;}'
      + '.ux-tpl-card{background:#fff;border:2px solid #e2e8f0;border-radius:14px;padding:18px;cursor:pointer;transition:all 0.2s;}'
      + '.ux-tpl-card:hover{border-color:#1e3a5f;transform:translateY(-2px);box-shadow:0 12px 24px rgba(0,0,0,0.08);}'
      + '.ux-tpl-card .ux-tpl-icon{font-size:2rem;margin-bottom:10px;}'
      + '.ux-tpl-card .ux-tpl-name{font-size:0.95rem;font-weight:800;color:#0f172a;margin-bottom:5px;}'
      + '.ux-tpl-card .ux-tpl-desc{font-size:0.72rem;color:#64748b;line-height:1.8;margin-bottom:10px;}'
      + '.ux-tpl-card .ux-tpl-meta{font-size:0.65rem;color:#94a3b8;}'
      + '#uxTplClose{position:absolute;top:16px;left:16px;background:none;border:none;font-size:1.3rem;cursor:pointer;color:#94a3b8;}'

      // Recent Projects
      + '.ux-recent-section{margin-top:24px;padding:20px;background:#f8fafc;border-radius:16px;border:1px solid #e2e8f0;}'
      + '.ux-recent-section h4{margin:0 0 12px;font-size:0.85rem;color:#64748b;display:flex;align-items:center;gap:6px;}'
      + '.ux-recent-list{display:flex;flex-direction:column;gap:6px;}'
      + '.ux-recent-item{display:flex;align-items:center;gap:10px;padding:10px 14px;background:#fff;border-radius:10px;cursor:pointer;border:1px solid #e2e8f0;transition:all 0.1s;}'
      + '.ux-recent-item:hover{border-color:#1e3a5f;background:#f0f9ff;}'
      + '.ux-recent-item .ux-rec-icon{font-size:1.1rem;}'
      + '.ux-recent-item .ux-rec-info{flex:1;min-width:0;}'
      + '.ux-recent-item .ux-rec-title{font-size:0.82rem;font-weight:700;color:#0f172a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}'
      + '.ux-recent-item .ux-rec-time{font-size:0.65rem;color:#94a3b8;margin-top:2px;}'
      + '.ux-recent-item .ux-rec-action{background:var(--primary,#1e3a5f);color:#fff;border:none;padding:5px 12px;border-radius:20px;font-size:0.7rem;font-family:Vazirmatn;cursor:pointer;font-weight:600;}'
    ;
    var s = el('style');
    s.textContent = css;
    document.head.appendChild(s);
  }

  // ============================================================
  // 2. Splash Screen
  // ============================================================
  function buildSplash() {
    if ($('#uxSplash')) return;
    var sp = el('div', { id: 'uxSplash' },
      '<div class="logo">📚</div>' +
'<h1>دستیار پژوهش دینزی</h1>' +
'<p style="font-size:0.75rem;opacity:0.7;letter-spacing:1px;direction:ltr;">Dastyare Pajohesh Dinzey</p>' +
'<p style="margin-top:-20px;">در حال آماده‌سازی فضای کاری شما...</p>' +
'<div class="loader"><div class="loader-bar" id="uxSplashBar"></div></div>' +
'<div class="hint">نسخهٔ دسکتاپ ۱.۰ · مرکز نوآوری دینزی</div>'
    );
    document.body.appendChild(sp);

    // Progress animation
    var bar = $('#uxSplashBar');
    var p = 0;
    var it = setInterval(function () {
      p += Math.random() * 22 + 8;
      if (p >= 100) { p = 100; clearInterval(it); }
      if (bar) bar.style.width = p + '%';
    }, 180);

    // Hide after ready
    var hideDelay = 1400;
    setTimeout(function () {
      if (bar) bar.style.width = '100%';
      setTimeout(function () {
        sp.classList.add('hide');
        setTimeout(function () { sp.remove(); }, 600);
      }, 350);
    }, hideDelay);
  }

  // ============================================================
  // 3. Recent Projects
  // ============================================================
  function getRecentProjects() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function recordCurrentProject() {
    var pid = (typeof window.projectId !== 'undefined') ? window.projectId : 'default';
    var title = (typeof window.researchInfo !== 'undefined' && window.researchInfo.title) || pid;
    var list = getRecentProjects();
    list = list.filter(function (p) { return p.id !== pid; });
    list.unshift({ id: pid, title: title, at: Date.now() });
    if (list.length > 10) list = list.slice(0, 10);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function buildRecentSection() {
    var list = getRecentProjects();
    if (list.length === 0) return '';
    var html = '<div class="ux-recent-section"><h4>🕐 <span>آخرین پروژه‌ها</span></h4><div class="ux-recent-list">';
    list.slice(0, 5).forEach(function (p) {
      var diff = Math.floor((Date.now() - p.at) / 1000);
      var when = diff < 60 ? 'لحظاتی پیش'
        : diff < 3600 ? Math.floor(diff / 60) + ' دقیقه پیش'
        : diff < 86400 ? Math.floor(diff / 3600) + ' ساعت پیش'
        : Math.floor(diff / 86400) + ' روز پیش';
      var isCurrent = (p.id === (window.projectId || 'default'));
      html += '<div class="ux-recent-item" data-pid="' + escape(p.id) + '">' +
        '<span class="ux-rec-icon">📄</span>' +
        '<div class="ux-rec-info">' +
          '<div class="ux-rec-title">' + escape(p.title) + '</div>' +
          '<div class="ux-rec-time">' + when + '</div>' +
        '</div>' +
        (isCurrent
          ? '<span style="font-size:0.65rem;color:#10b981;font-weight:700;">فعلی</span>'
          : '<button class="ux-rec-action">باز کردن</button>') +
      '</div>';
    });
    html += '</div></div>';
    return html;
  }
  function injectRecentIntoEmptyState() {
    var empty = $('.empty-state');
    if (!empty) return;
    if (empty.querySelector('.ux-recent-section')) return;
    var html = buildRecentSection();
    if (!html) return;
    empty.insertAdjacentHTML('beforeend', html);
    empty.querySelectorAll('.ux-recent-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var pid = this.dataset.pid;
        if (!pid || pid === (window.projectId || 'default')) return;
        if (!confirm('پروژهٔ «' + pid + '» باز شود؟ (تغییرات فعلی ذخیره می‌شود)')) return;
        if (window.saveData) window.saveData();
        if (pid === 'default') window.location.href = window.location.href.split('#')[0];
        else { window.location.hash = encodeURIComponent(pid); window.location.reload(); }
      });
    });
  }

  // ============================================================
  // 4. Templates
  // ============================================================
  var TEMPLATES = [
    {
      id: 'thesis',
      icon: '🎓',
      name: 'پایان‌نامه',
      desc: 'ساختار کامل پایان‌نامهٔ کارشناسی ارشد / دکتری',
      meta: '۵ فصل · ۲۰+ بخش',
      chapters: [
        { title: 'فصل اول: مقدمه', sections: ['۱-۱ بیان مسئله', '۱-۲ اهمیت و ضرورت تحقیق', '۱-۳ اهداف تحقیق', '۱-۴ سؤالات تحقیق', '۱-۵ فرضیه‌ها', '۱-۶ تعریف واژگان'] },
        { title: 'فصل دوم: ادبیات و پیشینه', sections: ['۲-۱ مبانی نظری', '۲-۲ پژوهش‌های داخلی', '۲-۳ پژوهش‌های خارجی', '۲-۴ جمع‌بندی'] },
        { title: 'فصل سوم: روش تحقیق', sections: ['۳-۱ نوع تحقیق', '۳-۲ جامعه و نمونه', '۳-۳ ابزار گردآوری داده‌ها', '۳-۴ روش تجزیه و تحلیل'] },
        { title: 'فصل چهارم: یافته‌ها', sections: ['۴-۱ توصیف داده‌ها', '۴-۲ تحلیل داده‌ها', '۴-۳ بررسی فرضیه‌ها'] },
        { title: 'فصل پنجم: نتیجه‌گیری', sections: ['۵-۱ خلاصهٔ پژوهش', '۵-۲ نتیجه‌گیری', '۵-۳ پیشنهادها', '۵-۴ محدودیت‌ها'] }
      ]
    },
    {
      id: 'article',
      icon: '📄',
      name: 'مقاله علمی',
      desc: 'ساختار استاندارد مقالات علمی-پژوهشی',
      meta: '۱ صفحه · ۷ بخش',
      chapters: [
        { title: 'مقاله', sections: ['چکیده', 'مقدمه', 'مبانی نظری', 'روش‌شناسی', 'یافته‌ها', 'بحث و نتیجه‌گیری', 'منابع'] }
      ]
    },
    {
      id: 'book',
      icon: '📚',
      name: 'کتاب / جزوه',
      desc: 'ساختار کتاب با فصول و زیرفصل‌های دلخواه',
      meta: '۳ فصل · ۱۲ بخش',
      chapters: [
        { title: 'فصل اول', sections: ['۱-۱ مقدمه', '۱-۲ کلیات', '۱-۳ تعاریف', '۱-۴ جمع‌بندی'] },
        { title: 'فصل دوم', sections: ['۲-۱ مرور مطالب قبلی', '۲-۲ مباحث اصلی', '۲-۳ کاربردها', '۲-۴ جمع‌بندی'] },
        { title: 'فصل سوم', sections: ['۳-۱ مقدمه', '۳-۲ مباحث تکمیلی', '۳-۳ مثال‌ها', '۳-۴ جمع‌بندی'] }
      ]
    },
    {
      id: 'report',
      icon: '📊',
      name: 'گزارش پژوهشی',
      desc: 'قالب گزارش‌های کوتاه و طرح‌های پژوهشی',
      meta: '۳ بخش · ۸ زیربخش',
      chapters: [
        { title: 'خلاصهٔ اجرایی', sections: ['هدف گزارش', 'یافته‌های کلیدی', 'توصیه‌ها'] },
        { title: 'بدنهٔ گزارش', sections: ['مقدمه', 'روش', 'نتایج'] },
        { title: 'پیوست‌ها', sections: ['جداول', 'نمودارها'] }
      ]
    }
  ];
  function buildTemplatesModal() {
    if ($('#uxTplOverlay')) return;
    var overlay = el('div', { id: 'uxTplOverlay' });
    var box = el('div', { id: 'uxTplBox' });
    box.style.position = 'relative';
    box.innerHTML =
      '<button id="uxTplClose" onclick="window.__uxCloseTemplates()">✕</button>' +
      '<h3>🎨 قالب‌های آماده</h3>' +
      '<p class="ux-tpl-sub">یک قالب انتخاب کنید تا ساختار آن روی پروژه اعمال شود. محتوای فعلی حفظ می‌شود.</p>' +
      '<div class="ux-tpl-grid" id="uxTplGrid"></div>';
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeTemplates(); });
  }
  function renderTemplatesGrid() {
    var grid = $('#uxTplGrid');
    if (!grid) return;
    grid.innerHTML = TEMPLATES.map(function (t) {
      return '<div class="ux-tpl-card" data-tpl="' + t.id + '">' +
        '<div class="ux-tpl-icon">' + t.icon + '</div>' +
        '<div class="ux-tpl-name">' + escape(t.name) + '</div>' +
        '<div class="ux-tpl-desc">' + escape(t.desc) + '</div>' +
        '<div class="ux-tpl-meta">' + escape(t.meta) + '</div>' +
      '</div>';
    }).join('');
    grid.querySelectorAll('.ux-tpl-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var id = this.dataset.tpl;
        applyTemplate(id);
      });
    });
  }
  function openTemplates() { buildTemplatesModal(); renderTemplatesGrid(); $('#uxTplOverlay').classList.add('show'); }
  function closeTemplates() { $('#uxTplOverlay').classList.remove('show'); }
  window.__uxCloseTemplates = closeTemplates;

  function applyTemplate(id) {
    var tpl = TEMPLATES.find(function (t) { return t.id === id; });
    if (!tpl) return;
    var hasContent = (window.pages || []).length > 0;
    if (hasContent) {
      if (!confirm('قالب «' + tpl.name + '» به پروژه اضافه شود؟\n\n' +
        '• ساختار فعلی حفظ می‌شود\n' +
        '• فصل‌های جدید به انتهای پروژه اضافه می‌شوند')) return;
    } else {
      if (!confirm('قالب «' + tpl.name + '» روی پروژه اعمال شود؟')) return;
    }
    // Build pages from template
    tpl.chapters.forEach(function (ch) {
      var pageTitle = ch.title;
      var pageNode = window.createNode(pageTitle, 'chapter');
      var page = { id: 'page-' + (window.nextId++), title: pageTitle, tree: pageNode, cards: [] };
      ch.sections.forEach(function (secTitle) {
        var secNode = window.createNode(secTitle, 'section');
        secNode.content = '<p>متن «' + secTitle + '» را اینجا بنویسید...</p>';
        pageNode.children.push(secNode);
      });
      window.pages.push(page);
      if (window.expandedChapters) window.expandedChapters[page.id] = true;
    });
    window.currentPageIndex = window.pages.length - tpl.chapters.length;
    window.pages.forEach(function (p) { if (window.computeNumbers) window.computeNumbers(p.tree); });
    if (window.syncNextId) window.syncNextId();
    if (window.saveData) window.saveData();
    if (window.renderAll) window.renderAll();
    closeTemplates();
    notify('✅ قالب «' + tpl.name + '» اعمال شد');
  }

  // ============================================================
  // 5. Command Palette
  // ============================================================
  var COMMANDS = [
    { icon: '📄', label: 'افزودن فصل جدید', key: 'Ctrl+Shift+N', run: function () { if (window.addNewPage) window.addNewPage(); } },
    { icon: '➕', label: 'افزودن زیربخش به فصل جاری', key: '', run: function () { if (window.addChildToCurrent) window.addChildToCurrent(); } },
    { icon: '💾', label: 'ذخیره', key: 'Ctrl+S', run: function () { if (window.saveData) window.saveData(); notify('💾 ذخیره شد'); } },
    { icon: '🎨', label: 'تغییر پوسته', key: '', run: function () { if (window.openThemeModal) window.openThemeModal(); } },
    { icon: '📄', label: 'خروجی PDF', key: '', run: function () { if (window.exportPDF) window.exportPDF(); } },
    { icon: '📘', label: 'خروجی DOCX', key: '', run: function () { if (window.exportDOCX) window.exportDOCX(); } },
    { icon: '📝', label: 'خروجی Word', key: '', run: function () { if (window.exportWord) window.exportWord(); } },
    { icon: '📋', label: 'خروجی Markdown', key: '', run: function () { if (window.exportMarkdown) window.exportMarkdown(); } },
    { icon: '📖', label: 'پیش‌نمایش A4', key: '', run: function () { if (window.openBookPreview) window.openBookPreview(); } },
    { icon: '🖨️', label: 'تنظیمات چاپ', key: '', run: function () { if (window.openPrintSettings) window.openPrintSettings(); } },
    { icon: '📚', label: 'کتابخانهٔ منابع', key: '', run: function () { if (window.showBibliographyManager) window.showBibliographyManager(); } },
    { icon: '📊', label: 'نمودار پیشرفت', key: '', run: function () { if (window.showProgressChart) window.showProgressChart(); } },
    { icon: '🔍', label: 'جستجوی متن', key: 'Ctrl+Shift+F', run: function () { if (window.openTextSearch) window.openTextSearch(); } },
    { icon: '🔁', label: 'یافتن و جایگزینی', key: 'Ctrl+H', run: function () { if (window.openFindReplace) window.openFindReplace(); } },
    { icon: '📇', label: 'افزودن فیش از انتخاب', key: 'Ctrl+Shift+M', run: function () { if (window.addCardFromSelection) window.addCardFromSelection(); } },
    { icon: '📎', label: 'افزودن پاورقی', key: '', run: function () { if (window.addFootnoteToSelected) window.addFootnoteToSelected(); } },
    { icon: '🌐', label: 'ترجمه', key: '', run: function () { if (window.openTranslate) window.openTranslate(null); } },
    { icon: '📂', label: 'پروژه‌ها', key: '', run: function () { if (window.showProjectsModal) window.showProjectsModal(); } },
    { icon: '⏳', label: 'تاریخچهٔ نسخه‌ها', key: '', run: function () { if (window.showVersionHistory) window.showVersionHistory(); } },
    { icon: '🎯', label: 'حالت تمرکز', key: '', run: function () { if (window.toggleFocusMode) window.toggleFocusMode(); } },
    { icon: '🎨', label: 'قالب‌های آماده', key: '', run: openTemplates },
    { icon: '📋', label: 'کلیپ‌بورد', key: 'Ctrl+Shift+V', run: openClipboard },
    { icon: '🌙', label: 'تغییر حالت شب/روز', key: '', run: function () { if (window.toggleDarkMode) window.toggleDarkMode(); } }
  ];
  var cmdFiltered = [];
  var cmdActiveIdx = 0;

  function buildCommandPalette() {
    if ($('#uxCmdOverlay')) return;
    var overlay = el('div', { id: 'uxCmdOverlay' });
    overlay.innerHTML =
      '<div id="uxCmdBox">' +
        '<input id="uxCmdInput" placeholder="دستوری تایپ کنید یا با ↑↓ انتخاب کنید..." autocomplete="off" />' +
        '<div id="uxCmdList"></div>' +
        '<div class="ux-cmd-footer">' +
          '<span><span class="kbd">↑</span><span class="kbd">↓</span> انتخاب · <span class="kbd">Enter</span> اجرا</span>' +
          '<span><span class="kbd">Esc</span> بستن</span>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeCommandPalette(); });
    var inp = $('#uxCmdInput');
    inp.addEventListener('input', function () { renderCommandList(this.value); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); cmdActiveIdx = Math.min(cmdActiveIdx + 1, cmdFiltered.length - 1); highlightCmd(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); cmdActiveIdx = Math.max(cmdActiveIdx - 1, 0); highlightCmd(); }
      else if (e.key === 'Enter') { e.preventDefault(); runActiveCmd(); }
      else if (e.key === 'Escape') { e.preventDefault(); closeCommandPalette(); }
    });
  }
  function openCommandPalette() {
    buildCommandPalette();
    var overlay = $('#uxCmdOverlay');
    var inp = $('#uxCmdInput');
    inp.value = '';
    renderCommandList('');
    overlay.classList.add('show');
    setTimeout(function () { inp.focus(); }, 50);
  }
  function closeCommandPalette() {
    var o = $('#uxCmdOverlay');
    if (o) o.classList.remove('show');
  }
  function renderCommandList(q) {
    var list = $('#uxCmdList');
    if (!list) return;
    q = (q || '').toLowerCase().trim();
    cmdFiltered = COMMANDS.filter(function (c) {
      if (!q) return true;
      return c.label.toLowerCase().indexOf(q) !== -1;
    });
    cmdActiveIdx = 0;
    if (cmdFiltered.length === 0) {
      list.innerHTML = '<div class="ux-cmd-empty">دستوری یافت نشد</div>';
      return;
    }
    list.innerHTML = cmdFiltered.map(function (c, i) {
      return '<div class="ux-cmd-item' + (i === 0 ? ' active' : '') + '" data-idx="' + i + '">' +
        '<span class="ux-icon">' + c.icon + '</span>' +
        '<span class="ux-label">' + escape(c.label) + '</span>' +
        (c.key ? '<span class="ux-key">' + c.key + '</span>' : '') +
      '</div>';
    }).join('');
    list.querySelectorAll('.ux-cmd-item').forEach(function (item) {
      item.addEventListener('click', function () {
        cmdActiveIdx = parseInt(this.dataset.idx);
        runActiveCmd();
      });
      item.addEventListener('mouseenter', function () {
        cmdActiveIdx = parseInt(this.dataset.idx);
        highlightCmd();
      });
    });
  }
  function highlightCmd() {
    var items = $$('#uxCmdList .ux-cmd-item');
    items.forEach(function (it, i) {
      if (i === cmdActiveIdx) { it.classList.add('active'); it.scrollIntoView({ block: 'nearest' }); }
      else it.classList.remove('active');
    });
  }
  function runActiveCmd() {
    var c = cmdFiltered[cmdActiveIdx];
    if (!c) return;
    closeCommandPalette();
    setTimeout(function () { try { c.run(); } catch (e) { console.error(e); } }, 100);
  }

  // ============================================================
  // 6. Context Menu (Right-click on editor)
  // ============================================================
  function buildContextMenu() {
    if ($('#uxCtxMenu')) return;
    var menu = el('div', { id: 'uxCtxMenu' });
    document.body.appendChild(menu);
    document.addEventListener('click', function (e) {
      if (!menu.contains(e.target)) menu.classList.remove('show');
    });
    document.addEventListener('scroll', function () { menu.classList.remove('show'); }, true);
    // Right click handler
    document.addEventListener('contextmenu', function (e) {
      var editor = e.target.closest && e.target.closest('.tree-content-editor');
      if (!editor) return;
      e.preventDefault();
      showContextMenu(e.pageX, e.pageY, editor);
    });
  }
  function showContextMenu(x, y, editor) {
    var menu = $('#uxCtxMenu');
    if (!menu) return;
    var hasSel = window.getSelection && !window.getSelection().isCollapsed;
    var selText = hasSel ? window.getSelection().toString().trim() : '';
    var items = [
      { icon: '✂️', label: 'برش', key: 'Ctrl+X', action: function () { document.execCommand('cut'); }, disabled: !hasSel },
      { icon: '📋', label: 'کپی', key: 'Ctrl+C', action: function () { document.execCommand('copy'); }, disabled: !hasSel },
      { icon: '📥', label: 'چسباندن', key: 'Ctrl+V', action: async function () {
        try {
          var text = await navigator.clipboard.readText();
          document.execCommand('insertText', false, text);
        } catch (e) { notify('⚠️ دسترسی به کلیپ‌بورد داده نشد'); }
      }, disabled: false },
      { sep: true },
      { icon: 'B', label: 'ضخیم', key: 'Ctrl+B', action: function () { document.execCommand('bold'); } },
      { icon: 'I', label: 'مورب', key: 'Ctrl+I', action: function () { document.execCommand('italic'); } },
      { icon: 'U', label: 'زیرخط', key: 'Ctrl+U', action: function () { document.execCommand('underline'); } },
      { sep: true },
      { icon: '📎', label: 'افزودن پاورقی', key: 'Ctrl+Shift+P', action: function () {
        var nEl = editor.closest('.tree-node');
        if (nEl) {
          window.savedSelectionRange = null;
          var sel = window.getSelection();
          if (sel && sel.rangeCount && !sel.isCollapsed) window.savedSelectionRange = sel.getRangeAt(0).cloneRange();
          if (window.addFootnoteToSelected) window.addFootnoteToSelected();
        }
      }, disabled: !hasSel },
      { icon: '📇', label: 'افزودن فیش از انتخاب', key: 'Ctrl+Shift+M', action: function () {
        if (window.addCardFromSelection) window.addCardFromSelection();
      }, disabled: !hasSel },
      { icon: '📖', label: 'درج ارجاع', key: 'Ctrl+Shift+C', action: function () {
        if (window.insertCitation) window.insertCitation();
      }, disabled: false },
      { icon: '🌐', label: 'ترجمه', action: function () {
        var nEl = editor.closest('.tree-node');
        if (nEl && window.openTranslate) window.openTranslate(nEl.dataset.nodeId);
      }, disabled: false },
      { icon: '💬', label: 'افزودن کامنت', action: function () {
        var nEl = editor.closest('.tree-node');
        if (nEl && window.openCommentModal) window.openCommentModal(nEl.dataset.nodeId);
      }, disabled: false },
      { sep: true },
      { icon: '📋', label: 'کلیپ‌بورد', key: 'Ctrl+Shift+V', action: openClipboard },
      { icon: '🔍', label: 'جستجو در متن', key: 'Ctrl+Shift+F', action: function () { if (window.openTextSearch) window.openTextSearch(); } },
      { sep: true },
      { icon: '🧹', label: 'پاک کردن فرمت', action: function () { document.execCommand('removeFormat'); }, disabled: !hasSel },
      { icon: '📌', label: 'انتخاب همه', key: 'Ctrl+A', action: function () { document.execCommand('selectAll'); } }
    ];
    var html = items.map(function (it) {
      if (it.sep) return '<div class="ux-ctx-sep"></div>';
      var dis = it.disabled ? ' style="opacity:0.4;pointer-events:none;"' : '';
      return '<div class="ux-ctx-item" data-label="' + escape(it.label) + '"' + dis + '>' +
        '<span class="ux-icon">' + it.icon + '</span>' +
        '<span>' + escape(it.label) + '</span>' +
        (it.key ? '<span class="ux-key">' + it.key + '</span>' : '') +
      '</div>';
    }).join('');
    menu.innerHTML = html;
    // Attach handlers
    var nonSepItems = items.filter(function (it) { return !it.sep; });
    var idx = 0;
    menu.querySelectorAll('.ux-ctx-item').forEach(function (el) {
      var it = nonSepItems[idx++];
      el.addEventListener('click', function () {
        menu.classList.remove('show');
        try { it.action(); } catch (e) { console.error(e); }
        // Trigger save
        var nEl = editor.closest('.tree-node');
        if (nEl && window.updateNodeContent) {
          window.updateNodeContent(nEl.dataset.nodeId, editor.innerHTML);
        }
      });
    });
    // Position
    menu.classList.add('show');
    var mw = menu.offsetWidth;
    var mh = menu.offsetHeight;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var nx = x, ny = y;
    if (x + mw > vw - 10) nx = vw - mw - 10;
    if (y + mh > vh - 10) ny = vh - mh - 10;
    menu.style.left = nx + 'px';
    menu.style.top = ny + 'px';
  }

  // ============================================================
  // 7. Clipboard Manager
  // ============================================================
  function getClipHistory() {
    try { return JSON.parse(localStorage.getItem(CLIP_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function saveClipHistory(list) {
    try { localStorage.setItem(CLIP_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function addClip(text) {
    if (!text || !text.trim()) return;
    text = text.trim();
    if (text.length > 5000) text = text.slice(0, 5000) + '...';
    var list = getClipHistory();
    // Remove duplicate
    list = list.filter(function (c) { return c.text !== text; });
    list.unshift({ text: text, at: Date.now() });
    if (list.length > MAX_CLIP) list = list.slice(0, MAX_CLIP);
    saveClipHistory(list);
  }
  function buildClipboardModal() {
    if ($('#uxClipOverlay')) return;
    var overlay = el('div', { id: 'uxClipOverlay' });
    overlay.innerHTML =
      '<div id="uxClipBox">' +
        '<div id="uxClipHeader">' +
          '<h3>📋 کلیپ‌بورد</h3>' +
          '<div>' +
            '<button onclick="window.__uxClipClear()" style="background:#fee2e2;color:#dc2626;">پاک کردن همه</button>' +
            '<button onclick="window.__uxClipClose()" style="background:#f1f5f9;color:#475569;margin-right:6px;">بستن</button>' +
          '</div>' +
        '</div>' +
        '<div id="uxClipList"></div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeClipboard(); });
  }
  function renderClipboardList() {
    var list = $('#uxClipList');
    if (!list) return;
    var items = getClipHistory();
    if (items.length === 0) {
      list.innerHTML = '<div class="ux-clip-empty">هنوز چیزی کپی نکرده‌اید<br><span style="font-size:0.72rem;">هر متنی را که کپی کنید، اینجا ذخیره می‌شود</span></div>';
      return;
    }
    list.innerHTML = items.map(function (c, i) {
      var diff = Math.floor((Date.now() - c.at) / 1000);
      var when = diff < 60 ? 'لحظاتی پیش'
        : diff < 3600 ? Math.floor(diff / 60) + ' دقیقه پیش'
        : Math.floor(diff / 3600) + ' ساعت پیش';
      var preview = c.text.length > 220 ? c.text.slice(0, 220) + '…' : c.text;
      return '<div class="ux-clip-item" data-idx="' + i + '">' +
        '<div class="ux-clip-text">' + escape(preview) + '</div>' +
        '<div class="ux-clip-meta">' +
          '<span>⏱ ' + when + '</span>' +
          '<span>📏 ' + c.text.length + ' کاراکتر</span>' +
          '<button class="ux-clip-del" data-del="' + i + '">حذف</button>' +
        '</div>' +
      '</div>';
    }).join('');
    list.querySelectorAll('.ux-clip-item').forEach(function (item) {
      item.addEventListener('click', function (e) {
        if (e.target.classList.contains('ux-clip-del')) return;
        var i = parseInt(this.dataset.idx);
        var c = getClipHistory()[i];
        if (!c) return;
        copyToActiveEditor(c.text);
        closeClipboard();
      });
    });
    list.querySelectorAll('.ux-clip-del').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var i = parseInt(this.dataset.del);
        var arr = getClipHistory();
        arr.splice(i, 1);
        saveClipHistory(arr);
        renderClipboardList();
      });
    });
  }
  function copyToActiveEditor(text) {
    // Try active editor
    var active = document.activeElement;
    if (active && active.classList && active.classList.contains('tree-content-editor')) {
      active.focus();
      document.execCommand('insertText', false, text);
      notify('✅ درج شد');
      return;
    }
    // Else: try last clicked editor
    var editors = $$('.tree-content-editor');
    if (editors.length > 0) {
      var lastEditor = editors[editors.length - 1];
      lastEditor.focus();
      document.execCommand('insertText', false, text);
      notify('✅ درج شد');
      return;
    }
    // Fallback: copy to system clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () {
        notify('📋 در کلیپ‌بورد کپی شد');
      });
    }
  }
  function openClipboard() {
    buildClipboardModal();
    renderClipboardList();
    $('#uxClipOverlay').classList.add('show');
  }
  function closeClipboard() {
    var o = $('#uxClipOverlay');
    if (o) o.classList.remove('show');
  }
  window.__uxClipClose = closeClipboard;
  window.__uxClipClear = function () {
    if (!confirm('همهٔ موارد کلیپ‌بورد پاک شوند؟')) return;
    saveClipHistory([]);
    renderClipboardList();
  };

  // Track copy events
  function setupClipboardTracking() {
    document.addEventListener('copy', function (e) {
      var sel = window.getSelection ? window.getSelection().toString() : '';
      if (sel && sel.trim()) addClip(sel);
    });
    document.addEventListener('cut', function (e) {
      var sel = window.getSelection ? window.getSelection().toString() : '';
      if (sel && sel.trim()) addClip(sel);
    });
  }

  // ============================================================
  // 8. Global keyboard shortcuts
  // ============================================================
  function setupShortcuts() {
    document.addEventListener('keydown', function (e) {
      // Ctrl+K — Command Palette
      if (e.ctrlKey && !e.shiftKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        openCommandPalette();
        return;
      }
      // Ctrl+Shift+V — Clipboard Manager
      if (e.ctrlKey && e.shiftKey && (e.key === 'V' || e.key === 'v' || e.key === 'ظ')) {
        e.preventDefault();
        openClipboard();
        return;
      }
      // Ctrl+Shift+N — New Page
      if (e.ctrlKey && e.shiftKey && (e.key === 'N' || e.key === 'n' || e.key === 'ن')) {
        e.preventDefault();
        if (window.addNewPage) window.addNewPage();
        return;
      }
      // Ctrl+Shift+T — Templates
      if (e.ctrlKey && e.shiftKey && (e.key === 'T' || e.key === 't' || e.key === 'ط')) {
        e.preventDefault();
        openTemplates();
        return;
      }
    });
  }

  // ============================================================
  // 9. Add toolbar buttons (Templates + Command hint)
  // ============================================================
  function addToolbarButtons() {
    var actions = document.querySelector('.panel-toolbar .actions');
    if (!actions) return;
    if (actions.querySelector('[data-ux-btn]')) return;

    var tplBtn = el('button', { 'data-ux-btn': 'tpl', 'class': 'gold', title: 'قالب‌های آماده (Ctrl+Shift+T)' });
    tplBtn.textContent = '🎨 قالب';
    tplBtn.addEventListener('click', openTemplates);
    actions.insertBefore(tplBtn, actions.firstChild);

    var cmdBtn = el('button', { 'data-ux-btn': 'cmd', title: 'پالت دستورات (Ctrl+K)' });
    cmdBtn.style.cssText = 'background:#0f172a;color:#fff;';
    cmdBtn.textContent = '⌘ دستورات';
    cmdBtn.addEventListener('click', openCommandPalette);
    actions.insertBefore(cmdBtn, tplBtn);
  }

  // ============================================================
  // 10. Hook into existing functions
  // ============================================================
  function hookRenderAll() {
    var orig = window.renderAll;
    if (typeof orig !== 'function') return;
    window.renderAll = function () {
      var r = orig.apply(this, arguments);
      setTimeout(function () {
        try { injectRecentIntoEmptyState(); } catch (e) {}
      }, 50);
      return r;
    };
  }
  function hookSaveData() {
    var orig = window.saveData;
    if (typeof orig !== 'function') return;
    window.saveData = function () {
      var r = orig.apply(this, arguments);
      try { recordCurrentProject(); } catch (e) {}
      return r;
    };
  }

  // ============================================================
  // 11. Boot
  // ============================================================
  function boot() {
    injectCSS();
    buildSplash();
    buildContextMenu();
    buildCommandPalette();
    buildClipboardModal();
    setupClipboardTracking();
    setupShortcuts();
    // Wait for main app to be ready
    setTimeout(function () {
      addToolbarButtons();
      hookRenderAll();
      hookSaveData();
      try { recordCurrentProject(); } catch (e) {}
      setTimeout(function () { try { injectRecentIntoEmptyState(); } catch (e) {} }, 800);
    }, 500);
    console.log('✅ UX Pack v1 ready (Splash · Templates · Command Palette · Context Menu · Clipboard · Recent)');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else setTimeout(boot, 0);
})();