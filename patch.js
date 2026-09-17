/**
 * patch.js — Desktop Edition v22
 * جایگزین prompt() با مودال زیبا
 * منطق درست: انصراف (null) → بی‌صدا | خالی ("") → alert
 */
(function () {
  'use strict';
  function init() {
    addPromptModal();
    addPromptFunctions();
    patchAllFunctions();
    patchFolderOverlay();
    document.title = 'دستیار پژوهش دینزی';
    console.log('[patch] Desktop Edition v22 applied ✅');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // ============ 1. مودال ورودی ============
  function addPromptModal() {
    if (document.getElementById('customPromptOverlay')) return;
    var m = document.createElement('div');
    m.className = 'modal-overlay';
    m.id = 'customPromptOverlay';
    m.style.zIndex = '5000';
    m.innerHTML =
      '<div class="modal-box" style="max-width:520px;">' +
        '<h3 id="cpTitle" style="margin-bottom:14px;">✏️ ورودی</h3>' +
        '<label id="cpLabel" style="font-weight:600;color:#334155;font-size:0.82rem;">متن را وارد کنید:</label>' +
        '<textarea id="cpInput" rows="3" style="min-height:80px;font-family:Vazirmatn,sans-serif;line-height:1.9;font-size:0.9rem;padding:12px 16px;border-radius:12px;"></textarea>' +
        '<div class="modal-actions" style="margin-top:12px;">' +
          '<button class="btn-cancel" onclick="cpCancel()">انصراف (Esc)</button>' +
          '<button class="btn-confirm" onclick="cpConfirm()">تأیید (Enter)</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(m);
    m.addEventListener('click', function (e) { if (e.target === this) window.cpCancel(); });
    document.addEventListener('keydown', function (e) {
      var ov = document.getElementById('customPromptOverlay');
      if (!ov || !ov.classList.contains('show')) return;
      if (e.key === 'Enter' && !e.shiftKey && document.activeElement && document.activeElement.id === 'cpInput') {
        e.preventDefault(); window.cpConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault(); window.cpCancel();
      }
    });
  }

  // ============ 2. توابع prompt ============
  function addPromptFunctions() {
    window._cpResolve = null;
    window.customPrompt = function (message, defaultValue) {
      return new Promise(function (resolve) {
        window._cpResolve = resolve;
        document.getElementById('cpLabel').textContent = message || 'متن را وارد کنید:';
        var inp = document.getElementById('cpInput');
        inp.value = defaultValue || '';
        document.getElementById('customPromptOverlay').classList.add('show');
        setTimeout(function () { inp.focus(); inp.select(); }, 100);
      });
    };
    window.cpConfirm = function () {
      var v = document.getElementById('cpInput').value;
      document.getElementById('customPromptOverlay').classList.remove('show');
      if (window._cpResolve) { window._cpResolve(v); window._cpResolve = null; }
    };
    window.cpCancel = function () {
      document.getElementById('customPromptOverlay').classList.remove('show');
      if (window._cpResolve) { window._cpResolve(null); window._cpResolve = null; }
    };
  }

  // ============ 3. patch توابع ============
  function patchAllFunctions() {

    // ---------- برچسب ----------
    window.openTagModal = async function (id) {
      var p = pages[currentPageIndex]; if (!p) return;
      var n = findNode(p.tree, id); if (!n) return;
      var t = await window.customPrompt('برچسب‌ها (با کاما جدا کنید):', n.tags ? n.tags.join(', ') : '');
      if (t === null) return;   // انصراف → بی‌صدا
      n.tags = t.split(',').map(function (x) { return x.trim(); }).filter(function (x) { return x; });
      saveData(); renderAll();
    };

    // ---------- وضعیت ----------
    window.openStatusModal = async function (id) {
      var p = pages[currentPageIndex]; if (!p) return;
      var n = findNode(p.tree, id); if (!n) return;
      var lbs = { draft: '📝 پیش‌نویس', review: '🔍 بررسی', approved: '✅ تأیید' };
      var msg = 'وضعیت فعلی: ' + (lbs[n.status] || '—') + '\n\nیک شماره وارد کنید:\n۱ = پیش‌نویس\n۲ = بررسی\n۳ = تأیید';
      var c = await window.customPrompt(msg, '');
      if (c === null) return;   // انصراف → بی‌صدا
      if (!c.trim()) return;    // خالی → بی‌صدا (کاربر خودش می‌دونه)
      var i = parseInt(c) - 1;
      var sts = ['draft', 'review', 'approved'];
      if (i >= 0 && i < 3) { n.status = sts[i]; saveData(); renderAll(); }
    };

    // ---------- ویرایش عنوان ----------
    window.editNodeTitle = async function (id) {
      var p = pages[currentPageIndex]; if (!p) return;
      var n = findNode(p.tree, id); if (!n) return;
      var t = await window.customPrompt('عنوان:', n.title);
      if (t === null) return;   // انصراف → بی‌صدا
      if (!t.trim()) {
        setTimeout(function () { window.alert('⚠️ عنوان نمی‌تواند خالی باشد.'); }, 100);
        return;
      }
      n.title = t.trim();
      if (p.tree.id === id) p.title = n.title;
      computeNumbers(p.tree); saveData(); renderAll();
    };

    // ---------- افزودن بخش (sibling) ----------
    window.addNodeAfter = async function (id) {
      var p = pages[currentPageIndex]; if (!p) return;
      var par = findParentNode(p.tree, id);
      if (!par) { window.addNewPageAfterCurrent(); return; }
      var i = par.children.findIndex(function (c) { return c.id === id; });
      if (i === -1) return;
      var t = await window.customPrompt('عنوان بخش جدید:', '');
      if (t === null) return;   // انصراف
      if (!t.trim()) {
        setTimeout(function () { window.alert('⚠️ عنوان بخش را وارد کنید.'); }, 100);
        return;
      }
      par.children.splice(i + 1, 0, createNode(t.trim(), 'section'));
      computeNumbers(p.tree); saveData(); renderAll();
    };

    // ---------- فصل جدید بعد از جاری ----------
    window.addNewPageAfterCurrent = async function () {
      var t = await window.customPrompt('عنوان فصل جدید:', 'فصل جدید');
      if (t === null) return;
      if (!t.trim()) {
        setTimeout(function () { window.alert('⚠️ عنوان فصل را وارد کنید.'); }, 100);
        return;
      }
      var np = { id: 'page-' + (nextId++), title: t.trim(), tree: createNode(t.trim(), 'chapter'), cards: [] };
      pages.splice(currentPageIndex + 1, 0, np);
      expandedChapters[np.id] = true;
      currentPageIndex++;
      computeNumbers(np.tree); saveData(); renderAll();
    };

    // ---------- فصل جدید ----------
    window.addNewPage = async function () {
      var t = await window.customPrompt('عنوان فصل جدید:', '');
      if (t === null) return;
      if (!t.trim()) {
        setTimeout(function () { window.alert('⚠️ عنوان فصل را وارد کنید.'); }, 100);
        return;
      }
      var np = { id: 'page-' + (nextId++), title: t.trim(), tree: createNode(t.trim(), 'chapter'), cards: [] };
      pages.push(np);
      expandedChapters[np.id] = true;
      currentPageIndex = pages.length - 1;
      computeNumbers(np.tree); saveData(); renderAll();
    };

    // ---------- پروژهٔ جدید ----------
    window.createNewProject = async function () {
      var name = await window.customPrompt('نام پروژه جدید (فارسی/انگلیسی):', '');
      if (name === null) return;
      if (!name.trim()) {
        setTimeout(function () { window.alert('⚠️ نام پروژه را وارد کنید.'); }, 100);
        return;
      }
      var clean = name.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\u0600-\u06FF\-_]/g, '');
      if (!clean) { alert('نام نامعتبر است.'); return; }
      saveData();
      if (clean === 'default') window.location.href = window.location.href.split('#')[0];
      else { window.location.hash = encodeURIComponent(clean); window.location.reload(); }
    };

    // ---------- تاریخچهٔ نسخه‌ها ----------
    window.showVersionHistory = async function () {
      if (versionHistory.length === 0) { alert('نسخه‌ای ذخیره نشده.'); return; }
      var m = '📜 تاریخچه نسخه‌ها:\n\n';
      versionHistory.forEach(function (v, i) {
        m += (i + 1) + '. ' + new Date(v.timestamp).toLocaleString('fa-IR') +
             ' (' + (v.pages ? v.pages.length : 0) + ' صفحه)\n';
      });
      m += '\nشمارهٔ نسخه را وارد کنید:';
      var c = await window.customPrompt(m, '');
      if (c === null) return;
      if (!c.trim()) return;
      var i = parseInt(c) - 1;
      if (i >= 0 && i < versionHistory.length) {
        if (!confirm('بازگشت به این نسخه؟ (نسخهٔ فعلی جایگزین می‌شود)')) return;
        pages = JSON.parse(JSON.stringify(versionHistory[i].pages));
        pages.forEach(function (p) { ensurePageCards(p); });
        currentPageIndex = 0;
        pages.forEach(function (p) { computeNumbers(p.tree); });
        syncNextId(); saveData(); renderAll();
      }
    };
  }

  // ============ 4. بازطراحی صفحهٔ خوش‌آمد ============
  function patchFolderOverlay() {
    var ov = document.getElementById('forceFolderOverlay');
    if (!ov) return;
    ov.innerHTML =
      '<div style="background:#fff;border-radius:24px;padding:48px 44px;max-width:580px;width:100%;box-shadow:0 40px 80px rgba(0,0,0,0.5);text-align:center;">' +
        '<div style="font-size:3.5rem;margin-bottom:16px;">📂</div>' +
        '<h2 style="font-size:1.5rem;font-weight:900;color:#0f172a;margin-bottom:10px;">به دستیار پژوهش دینزی خوش آمدید</h2>' +
        '<p style="font-size:0.92rem;color:#64748b;line-height:2;margin-bottom:24px;">' +
          'برای شروع، پوشه‌ای را برای ذخیرهٔ تحقیقات انتخاب کنید.' +
        '</p>' +
        '<div style="background:#f8fafc;border-radius:14px;padding:18px 22px;margin-bottom:24px;text-align:right;">' +
          '<div style="display:flex;gap:10px;margin-bottom:12px;font-size:0.85rem;color:#334155;line-height:1.8;"><span style="color:#10b981;font-weight:900;">✓</span><span>ذخیرهٔ خودکار روی دیسک شما</span></div>' +
          '<div style="display:flex;gap:10px;margin-bottom:12px;font-size:0.85rem;color:#334155;line-height:1.8;"><span style="color:#10b981;font-weight:900;">✓</span><span>بکاپ‌گیری آسان — فقط یک پوشه را کپی کنید</span></div>' +
          '<div style="display:flex;gap:10px;margin-bottom:12px;font-size:0.85rem;color:#334155;line-height:1.8;"><span style="color:#10b981;font-weight:900;">✓</span><span>بدون محدودیت حجم</span></div>' +
          '<div style="display:flex;gap:10px;font-size:0.85rem;color:#334155;line-height:1.8;"><span style="color:#10b981;font-weight:900;">✓</span><span>همگام‌سازی با Google Drive / OneDrive</span></div>' +
        '</div>' +
        '<button id="ffConnectBtn" onclick="forceConnectFolder()" ' +
          'style="background:linear-gradient(135deg,#1e3a5f,#0f172a);color:#fff;border:none;padding:16px 44px;' +
          'border-radius:30px;font-family:Vazirmatn,sans-serif;font-size:1rem;font-weight:700;cursor:pointer;width:100%;' +
          'box-shadow:0 8px 24px rgba(30,58,95,0.3);">' +
          '📁 انتخاب پوشه و شروع' +
        '</button>' +
        '<div style="font-size:0.7rem;color:#94a3b8;margin-top:20px;line-height:1.9;">' +
          'پیشنهاد: پوشه‌ای به نام «تحقیق من» بسازید<br>' +
          'داده‌ها در قالب فایل JSON ذخیره می‌شوند' +
        '</div>' +
      '</div>';
  }
})();