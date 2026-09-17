/**
 * pack3.js — نسخهٔ نهایی با پشتیبانی از همهٔ فیلدها
 * - دیکته در ویرایشگر بخش + یادداشت + فیش + جستجو + هر input/textarea
 * - AudioWorklet + Adaptive VAD + Preprocessing
 * - خلاصه‌ساز، جستجوی فازی، تحلیل متن
 */
(function () {
  'use strict';

  // ============================================================
  // ═══════════ ابزارهای پایه ═══════════
  // ============================================================

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function esc(s) { return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
  function plainText(html) {
    return (html || '').replace(/<br\s*\/?>/gi, ' ').replace(/<\/p>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function splitSentences(text) {
    if (!text) return [];
    var t = text.replace(/([.؟!؛])\s*/g, '$1\n');
    var lines = t.split('\n');
    var out = [];
    lines.forEach(function (l) { l = l.trim(); if (l.length > 15) out.push(l); });
    return out;
  }

  var STOPWORDS = ['از','به','در','با','که','را','این','آن','است','هست','نیست','بود','شد','می','نمی','بر','برای','تا','یا','و','اما','اگر','چون','زیرا','هر','هیچ','همه','هم','نیز','فقط','بله','خیر','آری','نه','بلی','خود','خویش','وی','آنها','اینها','همان','همین','چنین','چنان','هرگز','همیشه','دیگر','دیگری','هریک','چند','چندین','بسیار','خیلی','کم','زیاد','بیش','کمتر','بیشتر','اول','آخر','قبل','بعد','پیش','پس','حال','اکنون','امروز','فردا','دیروز','سال','ماه','هفته','روز','ساعت','دقیقه','ثانیه','لحظه','زمان','وقت','موقع','ممکن','احتمال','شاید','حتماً','قطعاً','باید','نباید','تواند','توانم','توانی','توانیم','توانید','توانند','کند','کنم','کنی','کنیم','کنید','کنند','کرد','کردم','کردی','کردیم','کردید','کردند','دارد','دارم','داری','داریم','دارید','دارند','داشت','داشتم','داشتی','داشتیم','داشتید','داشتند','بودم','بودی','بودیم','بودید','بودند','شدم','شدی','شدیم','شدید','شدند','یکی','دوتا','سه‌تا'];
  var stopSet = {};
  STOPWORDS.forEach(function (w) { stopSet[w] = 1; });

  function tokenize(text) {
    return text.split(/[\s\u200c،؛.,؟!()«»\[\]{}:؛"'\/\\\-ـ_]+/)
      .map(function (w) { return w.trim(); })
      .filter(function (w) { return w.length >= 3 && !stopSet[w] && !/^\d+$/.test(w); });
  }

  // ============================================================
  // ═══════════ ۱. خلاصه‌سازی هوشمند (TextRank) ═══════════
  // ============================================================

  function textRank(sentences, numSentences) {
    if (sentences.length <= numSentences) return sentences.slice();
    var tokens = sentences.map(function (s) { return { sent: s, toks: tokenize(s) }; });
    function similarity(a, b) {
      var common = 0;
      var aSet = {}, bSet = {};
      a.toks.forEach(function (t) { aSet[t] = (aSet[t] || 0) + 1; });
      b.toks.forEach(function (t) { bSet[t] = (bSet[t] || 0) + 1; });
      Object.keys(aSet).forEach(function (t) { if (bSet[t]) common += Math.min(aSet[t], bSet[t]); });
      if (common === 0) return 0;
      var denom = Math.log(a.toks.length + 1) + Math.log(b.toks.length + 1);
      return denom > 0 ? common / denom : 0;
    }
    var n = tokens.length, sim = [];
    for (var i = 0; i < n; i++) {
      sim[i] = [];
      for (var j = 0; j < n; j++) sim[i][j] = (i === j) ? 0 : similarity(tokens[i], tokens[j]);
    }
    var scores = new Array(n).fill(1), damping = 0.85;
    for (var iter = 0; iter < 20; iter++) {
      var ns = new Array(n).fill(1 - damping);
      for (var i2 = 0; i2 < n; i2++) {
        var sum = 0;
        for (var j2 = 0; j2 < n; j2++) {
          if (i2 === j2) continue;
          var outSum = 0;
          for (var k = 0; k < n; k++) { if (k !== j2) outSum += sim[j2][k]; }
          if (outSum > 0) sum += (sim[j2][i2] / outSum) * scores[j2];
        }
        ns[i2] += damping * sum;
      }
      scores = ns;
    }
    var indexed = scores.map(function (s, i) { return { score: s, idx: i }; });
    indexed.sort(function (a, b) { return b.score - a.score; });
    var top = indexed.slice(0, numSentences).sort(function (a, b) { return a.idx - b.idx; });
    return top.map(function (t) { return sentences[t.idx]; });
  }

  function summarizeNode(node, count) {
    var text = plainText(node.content);
    if (!text || text.length < 50) return { node: node, summary: text || '', empty: true };
    var sents = splitSentences(text);
    if (sents.length <= count) return { node: node, summary: sents.join(' '), short: true };
    return { node: node, summary: textRank(sents, count).join(' ') };
  }

  var currentSummaries = [];

  function openSummarizerModal() {
    var p = window.pages && window.pages[window.currentPageIndex];
    if (!p) { alert('هیچ صفحه‌ای نیست.'); return; }
    var nodes = [];
    (function walk(n) {
      if (n.type !== 'chapter' && plainText(n.content).length > 100) nodes.push(n);
      if (n.children) n.children.forEach(walk);
    })(p.tree);
    if (nodes.length === 0) { alert('هیچ بخشی با متن کافی وجود نداره.'); return; }
    currentSummaries = nodes.map(function (n) { return summarizeNode(n, 3); });
    var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">';
    html += '<h3 style="margin:0;">📝 خلاصه‌سازی هوشمند</h3>';
    html += '<div style="display:flex;gap:6px;align-items:center;">';
    html += '<label style="font-size:0.72rem;color:var(--text-muted);">تعداد جمله:</label>';
    html += '<select id="p3-sum-count" onchange="__p3_reSummarize(this.value)" style="padding:3px 8px;border-radius:6px;border:1px solid var(--border-light);background:var(--bg-main);font-family:Vazirmatn;font-size:0.72rem;">';
    html += '<option value="2">۲</option><option value="3" selected>۳</option><option value="5">۵</option><option value="7">۷</option></select></div></div>';
    html += '<p style="font-size:0.72rem;color:var(--text-muted);margin-bottom:14px;line-height:1.9;">مهم‌ترین جملات هر بخش با الگوریتم TextRank استخراج می‌شوند.</p>';
    html += '<div id="p3-sum-content" style="max-height:60vh;overflow-y:auto;">' + renderSummaries(currentSummaries) + '</div>';
    html += '<div class="modal-actions" style="margin-top:14px;">';
    html += '<button class="btn-confirm" onclick="__p3_saveAllSummaries()" style="background:#10b981;">💾 ذخیرهٔ همه</button>';
    html += '<button class="btn-cancel" onclick="__p3_close()">بستن</button></div>';
    showPack3Modal(html, 'max-width:700px;');
  }

  function renderSummaries(results) {
    var html = '';
    results.forEach(function (r, i) {
      html += '<div style="margin-bottom:12px;padding:12px 14px;background:var(--bg-main);border-radius:10px;border-right:3px solid #8b5cf6;">';
      html += '<div style="font-size:0.75rem;color:var(--primary);font-weight:700;margin-bottom:8px;">📄 ' + escapeHtml(r.node.number ? r.node.number + ' · ' : '') + escapeHtml(r.node.title || 'بدون عنوان') + '</div>';
      if (r.empty) { html += '<div style="font-size:0.75rem;color:var(--text-muted);font-style:italic;">متن کافی برای خلاصه‌سازی وجود نداره</div>'; }
      else {
        html += '<div style="font-size:0.82rem;line-height:2;color:var(--text-dark);">' + escapeHtml(r.summary) + '</div>';
        html += '<div style="margin-top:8px;display:flex;gap:6px;justify-content:flex-end;">';
        html += '<button onclick="__p3_copySummary(' + i + ')" style="background:none;border:1px solid var(--border-light);color:var(--text-muted);padding:3px 10px;border-radius:6px;cursor:pointer;font-family:Vazirmatn;font-size:0.68rem;">📋 کپی</button>';
        html += '<button onclick="__p3_saveSummary(' + i + ')" style="background:#10b981;color:#fff;border:none;padding:3px 10px;border-radius:6px;cursor:pointer;font-family:Vazirmatn;font-size:0.68rem;">💾 ذخیره</button></div>';
      }
      html += '</div>';
    });
    return html;
  }

  window.__p3_reSummarize = function (n) {
    var count = parseInt(n) || 3;
    var p = window.pages && window.pages[window.currentPageIndex];
    if (!p) return;
    var nodes = [];
    (function walk(node) { if (node.type !== 'chapter' && plainText(node.content).length > 100) nodes.push(node); if (node.children) node.children.forEach(walk); })(p.tree);
    currentSummaries = nodes.map(function (n) { return summarizeNode(n, count); });
    document.getElementById('p3-sum-content').innerHTML = renderSummaries(currentSummaries);
  };
  window.__p3_copySummary = function (i) {
    var r = currentSummaries[i]; if (!r) return;
    if (navigator.clipboard) navigator.clipboard.writeText(r.summary).then(function () { if (window.showToast) window.showToast('📋 کپی شد'); });
  };
  window.__p3_saveSummary = function (i) {
    var r = currentSummaries[i]; if (!r) return;
    var node = r.node, existing = node.notes || '';
    node.notes = (existing ? existing + '\n\n' : '') + '📝 خلاصه:\n' + r.summary;
    if (window.saveData) window.saveData(); if (window.renderPages) window.renderPages();
    if (window.showToast) window.showToast('✅ خلاصه ذخیره شد');
  };
  window.__p3_saveAllSummaries = function () {
    if (!confirm('خلاصهٔ همهٔ بخش‌ها ذخیره شود؟')) return;
    var count = 0;
    currentSummaries.forEach(function (r) {
      if (!r.summary) return;
      var node = r.node, existing = node.notes || '';
      if (existing.indexOf('📝 خلاصه:') !== -1) return;
      node.notes = (existing ? existing + '\n\n' : '') + '📝 خلاصه:\n' + r.summary; count++;
    });
    if (window.saveData) window.saveData(); if (window.renderAll) window.renderAll();
    if (window.showToast) window.showToast('✅ ' + count + ' خلاصه ذخیره شد');
  };

  // ============================================================
  // ═══════════ ۲. دیکته صوتی — همهٔ فیلدها ═══════════
  // ============================================================

  var voskModel = null;
  var voskRecognizer = null;
  var voskAudioContext = null;
  var voskMediaStream = null;
  var voskSource = null;
  var voskProcessor = null;
  var voskWorkletNode = null;
  var voskPreampNode = null;
  var voskHighpassNode = null;
  var voskLowpassNode = null;
  var voskCompressorNode = null;
  var isDictating = false, isLoadingModel = false;
  var dictationBaseText = '';

  // ★★ هدف دیکته — می‌تونه ویرایشگر بخش یا input/textarea باشه
  var dictationTarget = {
    type: 'none',       // 'node' | 'field' | 'none'
    nodeId: null,       // برای ویرایشگر بخش
    element: null       // برای input/textarea/contenteditable
  };

  var lastSpeechTime = 0;
  var noiseFloor = 0.005;
  var MIN_SPEECH_MS = 100;
  var SPEECH_WINDOW_MS = 3500;
  var WARMUP_MS = 300;
  var MIN_CONFIDENCE = 0.55;
  var startTime = 0;
  var speechStartTime = 0;

  var WORKLET_CODE = `
    class VoskProcessor extends AudioWorkletProcessor {
      constructor() {
        super();
        this._bufferSize = 1200;
        this._buffer = new Float32Array(this._bufferSize);
        this._bytesWritten = 0;
        this.port.onmessage = (event) => { if (event.data.type === 'flush') this._flush(); };
      }
      _flush() {
        if (this._bytesWritten > 0) {
          const out = this._buffer.slice(0, this._bytesWritten);
          this.port.postMessage({ type: 'audio', data: out });
          this._bytesWritten = 0;
        }
      }
      process(inputs) {
        const input = inputs[0];
        if (!input || !input[0]) return true;
        const channel = input[0];
        for (let i = 0; i < channel.length; i++) {
          this._buffer[this._bytesWritten++] = channel[i];
          if (this._bytesWritten >= this._bufferSize) {
            const out = this._buffer.slice(0, this._bufferSize);
            this.port.postMessage({ type: 'audio', data: out });
            this._bytesWritten = 0;
          }
        }
        return true;
      }
    }
    registerProcessor('vosk-processor', VoskProcessor);
  `;

  function createWorkletURL() {
    var blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
    return URL.createObjectURL(blob);
  }

  function resampleBuffer(input, inputRate, outputRate) {
    if (inputRate === outputRate) return input;
    var ratio = inputRate / outputRate;
    var outLen = Math.floor(input.length / ratio);
    var out = new Float32Array(outLen);
    for (var i = 0; i < outLen; i++) {
      var pos = i * ratio, idx = Math.floor(pos), frac = pos - idx;
      var p0 = input[idx - 1] || 0, p1 = input[idx] || 0, p2 = input[idx + 1] || 0, p3 = input[idx + 2] || 0;
      var c0 = p1, c1 = 0.5 * (p2 - p0);
      var c2 = p0 - 2.5 * p1 + 2 * p2 - 0.5 * p3;
      var c3 = 0.5 * (p3 - p0) + 1.5 * (p1 - p2);
      out[i] = c0 + c1 * frac + c2 * frac * frac + c3 * frac * frac * frac;
    }
    return out;
  }

  function isSpeechSupported() { return true; }

  async function loadVoskModel() {
    if (voskModel) return voskModel;
    if (typeof Vosk === 'undefined') throw new Error('کتابخانه Vosk بار نشده.');
    console.log('⏳ بارگذاری مدل Vosk...');
    voskModel = await Vosk.createModel('models/vosk-model-small-fa-0.5.tar.gz');
    console.log('✅ مدل Vosk بار شد');
    return voskModel;
  }

  // ★★ بررسی اینکه یک المان قابل دیکته هست یا نه
  function isDictatableField(el) {
    if (!el || !el.tagName) return false;
    if (el.disabled || el.readOnly) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName === 'INPUT') {
      var t = (el.type || 'text').toLowerCase();
      return (t === 'text' || t === 'search' || t === 'url' || t === 'email' || t === 'tel');
    }
    return false;
  }

  // ★★ تشخیص هدف فعلی از DOM
  function updateDictationTarget(el) {
    // ویرایشگر بخش
    if (el && el.classList && el.classList.contains('tree-content-editor')) {
      var nEl = el.closest('.tree-node');
      if (nEl) {
        dictationTarget = { type: 'node', nodeId: nEl.dataset.nodeId, element: el };
        return true;
      }
    }
    // input/textarea
    if (isDictatableField(el)) {
      dictationTarget = { type: 'field', nodeId: null, element: el };
      return true;
    }
    return false;
  }

  // ★★ درج متن در یک input/textarea در موقعیت مکان‌نما
  function insertIntoField(field, text) {
    if (!field || !text) return;
    try {
      field.focus();
      var start = (typeof field.selectionStart === 'number') ? field.selectionStart : field.value.length;
      var end = (typeof field.selectionEnd === 'number') ? field.selectionEnd : field.value.length;
      var val = field.value || '';
      var before = val.substring(0, start);
      var after = val.substring(end);

      // ★ فاصلهٔ هوشمند
      var addBefore = (before && !/\s$/.test(before)) ? ' ' : '';
      var addAfter = (after && !/^\s/.test(after)) ? ' ' : '';
      var insert = addBefore + text + addAfter;

      field.value = before + insert + after;
      var newPos = start + insert.length;
      try { field.setSelectionRange(newPos, newPos); } catch (e) {}

      // ★ trigger رویداد input برای autosave
      try {
        var ev = new Event('input', { bubbles: true });
        field.dispatchEvent(ev);
      } catch (e) {}
      try {
        var ev2 = new Event('change', { bubbles: true });
        field.dispatchEvent(ev2);
      } catch (e) {}

      // ★ برای فیلدهای خاص مثل عنوان بخش، ذخیره‌سازی دستی
      var id = field.id || '';
      if (id === 'researchTitle' || id === 'researcherName' || id === 'supervisorName') {
        if (window.researchInfo) {
          if (id === 'researchTitle') window.researchInfo.title = field.value;
          if (id === 'researcherName') window.researchInfo.researcher = field.value;
          if (id === 'supervisorName') window.researchInfo.supervisor = field.value;
          try { localStorage.setItem('research_info_v8_' + (window.projectId || 'default'), JSON.stringify(window.researchInfo)); } catch (e) {}
        }
      }
    } catch (e) { console.error('[p3] insertIntoField error:', e); }
  }

  // ★★ ردیابی آخرین المان فوکوس‌شده (برای همهٔ فیلدها)
  document.addEventListener('focusin', function (e) {
    var el = e.target;
    if (!el) return;
    if (updateDictationTarget(el)) {
      if (isDictating) {
        var label = 'فیلد';
        if (dictationTarget.type === 'node') {
          var n = null;
          (window.pages || []).forEach(function (pg) {
            var f = window.findNode ? window.findNode(pg.tree, dictationTarget.nodeId) : null;
            if (f) n = f;
          });
          label = n ? (n.title || 'بدون عنوان') : 'بخش';
        } else {
          var ph = el.placeholder || el.getAttribute('aria-label') || el.id || '';
          label = ph ? '«' + ph + '»' : 'فیلد';
        }
        if (window.showToast) window.showToast('🎯 دیکته در ' + label);
        console.log('[p3] dictation target changed to: ' + dictationTarget.type + (dictationTarget.nodeId ? ' ' + dictationTarget.nodeId : ''));
      }
    }
  }, true);

  // ★★ ردیابی با کلیک هم (بعضی مواقع focusin fire نمی‌شه)
  document.addEventListener('mousedown', function (e) {
    var el = e.target;
    if (!el) return;
    // برای ویرایشگر بخش
    if (el.classList && el.classList.contains('tree-content-editor')) {
      var nEl = el.closest('.tree-node');
      if (nEl) {
        dictationTarget = { type: 'node', nodeId: nEl.dataset.nodeId, element: el };
        return;
      }
    }
    // برای input/textarea
    if (isDictatableField(el)) {
      dictationTarget = { type: 'field', nodeId: null, element: el };
    }
  }, true);

  function startDictation(nodeId) {
    if (isLoadingModel) { if (window.showToast) window.showToast('⏳ مدل در حال بارگذاری...'); return; }
    if (isDictating) { stopDictation(); return; }
    var p = window.pages && window.pages[window.currentPageIndex];
    if (!p) { alert('ابتدا یک صفحه بسازید.'); return; }

    // ★★ اگه هدف فعلی یه فیلد (input/textarea) هست، همون رو نگه‌دار
    if (dictationTarget.type === 'field' && dictationTarget.element && document.body.contains(dictationTarget.element)) {
      // هدف فیلد معتبر
    } else if (nodeId) {
      // هدف بخش مشخص
      dictationTarget = { type: 'node', nodeId: nodeId, element: null };
    } else if (dictationTarget.type === 'node' && dictationTarget.nodeId) {
      // هدف بخش قبلی
    } else {
      // اولین بخش صفحه
      var firstId = null;
      (function walk(n) { if (firstId) return; if (n.type !== 'chapter') { firstId = n.id; return; } if (n.children) n.children.forEach(walk); })(p.tree);
      if (!firstId) { alert('هیچ بخشی پیدا نشد.'); return; }
      dictationTarget = { type: 'node', nodeId: firstId, element: null };
    }

    isLoadingModel = true;
    updateDictationUI('loading');
    startDictationInternal();
  }

  async function startDictationInternal() {
    try {
      if (window.showToast) window.showToast('⏳ بارگذاری مدل...');

      var model = await loadVoskModel();
      var recognizer = new model.KaldiRecognizer(16000);
      recognizer.setWords(true);

            try { recognizer.setOption('beam', 14.0); } catch (e) {}
      try { recognizer.setOption('lattice-beam', 7.0); } catch (e) {}
      try { recognizer.setOption('max-active', 8000); } catch (e) {}
      try { recognizer.setOption('min-active', 300); } catch (e) {}

      voskRecognizer = recognizer;

      // ★ مقدار اولیه dictationBaseText
      if (dictationTarget.type === 'node') {
        var n0 = null;
        (window.pages || []).forEach(function (pg) {
          var f = window.findNode ? window.findNode(pg.tree, dictationTarget.nodeId) : null;
          if (f) n0 = f;
        });
        dictationBaseText = n0 ? (n0.content || '') : '';
      } else if (dictationTarget.type === 'field') {
        dictationBaseText = dictationTarget.element ? (dictationTarget.element.value || '') : '';
      }

      var interimBuffer = '';
      lastSpeechTime = Date.now();
      noiseFloor = 0.005;
      startTime = Date.now();

      recognizer.on('result', function (message) {
        try {
          var text = (message.result && message.result.text) || '';
          var words = (message.result && message.result.result) || [];

          var silenceMs = Date.now() - lastSpeechTime;
          if (silenceMs > SPEECH_WINDOW_MS) {
            if (text.trim()) console.log('🔇 توهم حذف شد:', text);
            return;
          }

          if (words.length > 0) {
            var avgConf = words.reduce(function (s, w) { return s + (w.conf || 0); }, 0) / words.length;
            if (avgConf < MIN_CONFIDENCE) {
              console.log('❓ اطمینان پایین:', text);
              return;
            }
          }

          if (text.trim()) {
            console.log('🎯 نتیجه:', text);

            // ★★ بر اساس نوع هدف، متن رو درج کن
            if (dictationTarget.type === 'node') {
              // ویرایشگر بخش
              var n = null;
              (window.pages || []).forEach(function (pg) {
                var f = window.findNode ? window.findNode(pg.tree, dictationTarget.nodeId) : null;
                if (f) n = f;
              });
              if (n) {
                dictationBaseText = (dictationBaseText ? dictationBaseText + ' ' : '') + text.trim();
                n.content = dictationBaseText;
                if (window.saveData) window.saveData();
                if (window.renderPages) window.renderPages();
              }
            } else if (dictationTarget.type === 'field') {
              // input/textarea
              if (dictationTarget.element && document.body.contains(dictationTarget.element)) {
                insertIntoField(dictationTarget.element, text.trim());
              } else {
                console.warn('[p3] field target lost — possible modal closed');
              }
            }
          }
          updateDictationIndicator(interimBuffer || 'در حال شنیدن...');
        } catch (e) { console.error('[vosk] result error:', e); }
      });

      recognizer.on('partialresult', function (message) {
        try {
          var silenceMs = Date.now() - lastSpeechTime;
          if (silenceMs > SPEECH_WINDOW_MS) {
            interimBuffer = '';
            updateDictationIndicator('در حال شنیدن...');
            return;
          }
          interimBuffer = (message.result && message.result.partial) || '';
          updateDictationIndicator(interimBuffer || 'در حال شنیدن...');
        } catch (e) {}
      });

      console.log('🎤 دریافت دسترسی میکروفن...');
      voskMediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1, sampleRate: { ideal: 16000 } }
      });
      console.log('✅ میکروفن آماده');

      var audioContext;
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        console.log('🎵 AudioContext sampleRate: 16000');
      } catch (e) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('🎵 AudioContext sampleRate:', audioContext.sampleRate);
      }
      voskAudioContext = audioContext;
      if (audioContext.state === 'suspended') await audioContext.resume();

      var actualRate = audioContext.sampleRate;
      var needsResampling = (actualRate !== 16000);

      var source = audioContext.createMediaStreamSource(voskMediaStream);
      voskSource = source;

            // ★ فیلترها با تنظیمات دقیق‌تر
      var highpass = audioContext.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 85;     // کمی بالاتر — حذف صداهای بم محیط
      highpass.Q.value = 0.5;
      voskHighpassNode = highpass;

      var lowpass = audioContext.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 6500;    // کمی پایین‌تر — حذف نویز بالا
      lowpass.Q.value = 0.5;
      voskLowpassNode = lowpass;

      var compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = -30;  // آستانه پایین‌تر → کنترل بهتر
      compressor.knee.value = 40;
      compressor.ratio.value = 8;        // نسبت کمتر → اعوجاج کمتر
      compressor.attack.value = 0.005;
      compressor.release.value = 0.3;
      voskCompressorNode = compressor;

      var preamp = audioContext.createGain();
      preamp.gain.value = 1.4;
      voskPreampNode = preamp;

      source.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(compressor);
      compressor.connect(preamp);

      var useWorklet = false;
      try {
        if (audioContext.audioWorklet) {
          var workletURL = createWorkletURL();
          await audioContext.audioWorklet.addModule(workletURL);
          URL.revokeObjectURL(workletURL);
          useWorklet = true;
        }
      } catch (e) { console.warn('AudioWorklet نشد:', e.message); }

      function processAudioBlock(data) {
        try {
          if (Date.now() - startTime < WARMUP_MS) return;

          var sum = 0;
          for (var i = 0; i < data.length; i++) sum += data[i] * data[i];
          var rms = Math.sqrt(sum / data.length);

          if (rms < noiseFloor) noiseFloor = noiseFloor * 0.995 + rms * 0.005;
          else if (rms > noiseFloor * 2.5 && rms < noiseFloor * 5) noiseFloor = noiseFloor * 0.998 + rms * 0.002;
          noiseFloor = Math.max(0.003, Math.min(0.03, noiseFloor));

          var speechThreshold = noiseFloor * 2.2;
          var isSpeech = rms > speechThreshold;

          if (isSpeech) {
            if (!speechStartTime) speechStartTime = Date.now();
            lastSpeechTime = Date.now();
          } else {
            if (speechStartTime) {
              var dur = Date.now() - speechStartTime;
              if (dur < MIN_SPEECH_MS) { speechStartTime = 0; return; }
              speechStartTime = 0;
            }
          }

          var silenceAfterSpeech = Date.now() - lastSpeechTime;
          if (!isSpeech && silenceAfterSpeech > 30000) return;

          var samples = needsResampling ? resampleBuffer(data, actualRate, 16000) : data;
          var audioBuffer = audioContext.createBuffer(1, samples.length, 16000);
          audioBuffer.copyToChannel(samples, 0);
          recognizer.acceptWaveform(audioBuffer);
        } catch (e) { console.error('[vosk] process error:', e); }
      }

      if (useWorklet) {
        var workletNode = new AudioWorkletNode(audioContext, 'vosk-processor');
        voskWorkletNode = workletNode;
        workletNode.port.onmessage = function (event) {
          if (event.data.type !== 'audio') return;
          processAudioBlock(event.data.data);
        };
        preamp.connect(workletNode);
        console.log('🎵 پردازش: AudioWorklet');
      } else {
        var processor = audioContext.createScriptProcessor(1024, 1, 1);
        voskProcessor = processor;
        processor.onaudioprocess = function (event) {
          processAudioBlock(event.inputBuffer.getChannelData(0));
        };
        preamp.connect(processor);
        processor.connect(audioContext.destination);
        console.log('🎵 پردازش: ScriptProcessor');
      }

      isLoadingModel = false;
      isDictating = true;
      updateDictationUI('active');
      if (window.showToast) window.showToast('🎙️ دیکته فعال — صحبت کن');

    } catch (e) {
      console.error('❌ Dictation error:', e);
      isLoadingModel = false;
      isDictating = false;
      updateDictationUI('inactive');
      alert('❌ خطا: ' + (e.message || e));
    }
  }

  function stopDictation() {
    isDictating = false;
    isLoadingModel = false;
    try { if (voskWorkletNode) { voskWorkletNode.port.postMessage({ type: 'flush' }); voskWorkletNode.disconnect(); } } catch (e) {}
    try { if (voskProcessor) { voskProcessor.onaudioprocess = null; voskProcessor.disconnect(); } } catch (e) {}
    try { if (voskSource) voskSource.disconnect(); } catch (e) {}
    try { if (voskHighpassNode) voskHighpassNode.disconnect(); } catch (e) {}
    try { if (voskLowpassNode) voskLowpassNode.disconnect(); } catch (e) {}
    try { if (voskCompressorNode) voskCompressorNode.disconnect(); } catch (e) {}
    try { if (voskPreampNode) voskPreampNode.disconnect(); } catch (e) {}
    try { if (voskAudioContext && voskAudioContext.state !== 'closed') voskAudioContext.close(); } catch (e) {}
    try { if (voskMediaStream) voskMediaStream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
    voskWorkletNode = null; voskProcessor = null; voskSource = null;
    voskHighpassNode = null; voskLowpassNode = null;
    voskCompressorNode = null; voskPreampNode = null;
    voskAudioContext = null; voskMediaStream = null;
    speechStartTime = 0;
    updateDictationUI('inactive');
    if (window.showToast) window.showToast('🎙️ دیکته متوقف شد');
  }

  function updateDictationUI(state) {
    var btn = document.querySelector('[data-pack3="dictate"]');
    if (btn) {
      if (state === 'active') { btn.style.background = '#dc2626'; btn.textContent = '⏹ توقف دیکته'; }
      else if (state === 'loading') { btn.style.background = '#f59e0b'; btn.textContent = '⏳ بارگذاری...'; }
      else { btn.style.background = '#10b981'; btn.textContent = '🎙️ دیکته'; }
    }
    var ind = document.getElementById('p3-dictation-ind');
    if (state === 'inactive') { if (ind) ind.remove(); return; }
    if (!ind) {
      ind = document.createElement('div');
      ind.id = 'p3-dictation-ind';
      ind.style.cssText = 'position:fixed;bottom:60px;left:50%;transform:translateX(-50%);color:#fff;padding:10px 20px;border-radius:30px;font-family:Vazirmatn,sans-serif;font-size:0.8rem;font-weight:700;z-index:99999;box-shadow:0 10px 30px rgba(0,0,0,0.3);display:flex;align-items:center;gap:10px;max-width:80vw;';
      ind.innerHTML = '<span style="width:10px;height:10px;border-radius:50%;background:#fff;animation:p3-pulse 1s infinite;"></span><span id="p3-dictation-text"></span>';
      document.body.appendChild(ind);
      if (!document.getElementById('p3-pulse-style')) {
        var s = document.createElement('style'); s.id = 'p3-pulse-style';
        s.textContent = '@keyframes p3-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }';
        document.head.appendChild(s);
      }
    }
    ind.style.background = state === 'loading' ? '#f59e0b' : '#dc2626';
    var txt = document.getElementById('p3-dictation-text');
    if (txt) txt.textContent = state === 'loading' ? 'در حال بارگذاری مدل...' : (state === 'active' ? 'در حال شنیدن...' : '');
  }

  function updateDictationIndicator(text) {
    var el = document.getElementById('p3-dictation-text');
    if (el) el.textContent = text || 'در حال شنیدن...';
  }

  // ============================================================
  // ═══════════ ۳. جستجوی فازی ═══════════
  // ============================================================

  function fuzzyMatch(query, text) {
    if (!query) return { match: false, score: 0 };
    var q = query.toLowerCase().trim(), t = text.toLowerCase();
    if (t.indexOf(q) !== -1) return { match: true, score: 1, exact: true };
    var qN = q.replace(/[يى]/g, 'ی').replace(/[ك]/g, 'ک').replace(/[ةۀ]/g, 'ه');
    var tN = t.replace(/[يى]/g, 'ی').replace(/[ك]/g, 'ک').replace(/[ةۀ]/g, 'ه');
    if (tN.indexOf(qN) !== -1) return { match: true, score: 0.95, arabicVariant: true };
    var qS = qN.replace(/[طظ]/g, 'ت').replace(/[ذزضظ]/g, 'ز').replace(/[سصث]/g, 'س').replace(/[حخجچ]/g, 'ح');
    var tS = tN.replace(/[طظ]/g, 'ت').replace(/[ذزضظ]/g, 'ز').replace(/[سصث]/g, 'س').replace(/[حخجچ]/g, 'ح');
    if (tS.indexOf(qS) !== -1) return { match: true, score: 0.8, similar: true };
    var qT = qN.split(/\s+/).filter(function (w) { return w.length >= 3; });
    if (qT.length > 1) {
      var matched = 0;
      qT.forEach(function (tok) { if (tS.indexOf(tok) !== -1) matched++; });
      if (matched >= qT.length * 0.6) return { match: true, score: 0.6 + 0.3 * (matched / qT.length) };
    }
    return { match: false, score: 0 };
  }

  function openFuzzySearch() {
    var html = '<h3>🔍 جستجوی فازی</h3>';
    html += '<p style="font-size:0.72rem;color:var(--text-muted);margin-bottom:14px;line-height:1.9;">جستجوی هوشمند با تشخیص اشتباهات تایپی</p>';
    html += '<div class="search-input-row" style="margin-bottom:14px;">';
    html += '<input type="text" id="p3-fuzzy-input" placeholder="عبارت مورد نظر..." oninput="__p3_runFuzzy()" style="flex:1;padding:10px 16px;border-radius:12px;border:1px solid var(--border-light);background:var(--bg-main);font-family:Vazirmatn;font-size:0.9rem;" /></div>';
    html += '<div id="p3-fuzzy-results" style="max-height:55vh;overflow-y:auto;">';
    html += '<div style="text-align:center;padding:30px;color:var(--text-muted);font-size:0.8rem;">عبارت مورد نظر را تایپ کنید...</div></div>';
    html += '<div class="modal-actions" style="margin-top:14px;"><button class="btn-cancel" onclick="__p3_close()">بستن</button></div>';
    showPack3Modal(html, 'max-width:700px;');
    setTimeout(function () { var inp = document.getElementById('p3-fuzzy-input'); if (inp) inp.focus(); }, 200);
  }

  window.__p3_runFuzzy = function () {
    var q = document.getElementById('p3-fuzzy-input').value.trim();
    var res = document.getElementById('p3-fuzzy-results');
    if (!q) { res.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted);font-size:0.8rem;">عبارت مورد نظر را تایپ کنید...</div>'; return; }
    var found = [];
    (window.pages || []).forEach(function (page, pageIdx) {
      if (!window.traverseTree) return;
      window.traverseTree(page.tree, function (node) {
        if (node.type === 'chapter') return;
        var text = plainText(node.content), title = node.title || '';
        var tm = fuzzyMatch(q, title);
        if (tm.match) { found.push({ pageIdx: pageIdx, pageTitle: page.title, nodeId: node.id, nodeTitle: title, nodeNumber: node.number || '', snippet: title, score: tm.score }); return; }
        if (!text) return;
        var m = fuzzyMatch(q, text);
        if (m.match) {
          var idx = text.toLowerCase().indexOf(q.toLowerCase());
          var start = Math.max(0, idx - 50), end = Math.min(text.length, idx + q.length + 100);
          if (idx === -1) { start = 0; end = 150; }
          var snippet = (start > 0 ? '… ' : '') + text.slice(start, end) + (end < text.length ? ' …' : '');
          found.push({ pageIdx: pageIdx, pageTitle: page.title, nodeId: node.id, nodeTitle: node.title, nodeNumber: node.number || '', snippet: snippet, score: m.score });
        }
      });
    });
    found.sort(function (a, b) { return b.score - a.score; });
    if (found.length === 0) { res.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-muted);font-size:0.8rem;">نتیجه‌ای یافت نشد.</div>'; return; }
    var html = '<div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:10px;">' + found.length + ' نتیجه</div>';
    found.slice(0, 50).forEach(function (f) {
      var sc = f.score > 0.9 ? '#10b981' : f.score > 0.7 ? '#f59e0b' : '#94a3b8';
      html += '<div style="padding:10px 12px;border-radius:10px;border:1px solid var(--border-light);background:var(--bg-main);margin-bottom:6px;cursor:pointer;" onclick="__p3_jumpFuzzy(' + f.pageIdx + ',\'' + esc(f.nodeId) + '\')">';
      html += '<div style="font-size:0.68rem;color:var(--text-muted);margin-bottom:4px;display:flex;gap:8px;align-items:center;">';
      html += '<span>📄 ' + escapeHtml(f.pageTitle || '') + '</span>';
      if (f.nodeNumber) html += '<span>·</span><span>' + escapeHtml(f.nodeNumber) + '</span>';
      html += '<span style="margin-right:auto;color:' + sc + ';font-weight:700;">' + Math.round(f.score * 100) + '%</span></div>';
      html += '<div style="font-size:0.8rem;font-weight:700;color:var(--text-dark);margin-bottom:4px;">' + escapeHtml(f.nodeTitle || '') + '</div>';
      html += '<div style="font-size:0.72rem;color:var(--text-muted);line-height:1.85;">' + escapeHtml(f.snippet) + '</div></div>';
    });
    res.innerHTML = html;
  };

  window.__p3_jumpFuzzy = function (pageIdx, nodeId) {
    window.currentPageIndex = pageIdx;
    if (window.renderAll) window.renderAll();
    closePack3Modal();
    setTimeout(function () {
      var el = document.querySelector('.tree-node[data-node-id="' + nodeId + '"]');
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.style.transition = 'background 0.3s'; el.style.background = '#fef3c7'; setTimeout(function () { el.style.background = ''; }, 2000); }
    }, 200);
  };

  // ============================================================
  // ═══════════ ۴. تحلیل متن ═══════════
  // ============================================================

  function analyzeText(text) {
    var plain = plainText(text), chars = plain.length;
    var words = plain.split(/\s+/).filter(function (w) { return w.length > 0; });
    var wordCount = words.length;
    var sentences = splitSentences(plain), sentenceCount = sentences.length;
    var avgWPS = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    var longS = sentences.filter(function (s) { return s.split(/\s+/).length > 25; });
    var shortS = sentences.filter(function (s) { return s.split(/\s+/).length < 5; });
    var avgWL = wordCount > 0 ? chars / wordCount : 0;
    var freq = {};
    words.forEach(function (w) {
      var w2 = w.replace(/[\u200c،؛.,؟!()«»\[\]{}:؛"'\/\\\-ـ_]/g, '');
      if (w2.length < 3 || stopSet[w2]) return;
      freq[w2] = (freq[w2] || 0) + 1;
    });
    var topRepeated = Object.keys(freq).map(function (w) { return { word: w, count: freq[w] }; })
      .sort(function (a, b) { return b.count - a.count; }).slice(0, 10);
    var flesch = Math.max(0, Math.min(100, 180 - 2.5 * avgWPS - 5 * avgWL));
    var rl = flesch > 70 ? 'خیلی آسان' : flesch > 60 ? 'آسان' : flesch > 50 ? 'متوسط' : flesch > 30 ? 'دشوار' : 'خیلی دشوار';
    return { chars: chars, words: wordCount, sentences: sentenceCount, avgWPS: Math.round(avgWPS * 10) / 10, avgWL: Math.round(avgWL * 10) / 10, longS: longS.length, shortS: shortS.length, topRepeated: topRepeated, flesch: Math.round(flesch), readabilityLabel: rl, readMinutes: Math.ceil(wordCount / 200) };
  }

  function openTextAnalysis() {
    var p = window.pages && window.pages[window.currentPageIndex];
    if (!p) { alert('هیچ صفحه‌ای نیست.'); return; }
    var allText = '';
    (window.pages || []).forEach(function (page) { if (!window.traverseTree) return; window.traverseTree(page.tree, function (n) { if (n.type !== 'chapter') allText += ' ' + plainText(n.content); }); });
    var ps = analyzeText(allText);
    var pageText = '';
    (function walk(n) { if (n.type !== 'chapter') pageText += ' ' + plainText(n.content); if (n.children) n.children.forEach(walk); })(p.tree);
    var pgs = analyzeText(pageText);
    var html = '<h3>📊 تحلیل متن</h3>';
    html += '<p style="font-size:0.72rem;color:var(--text-muted);margin-bottom:14px;line-height:1.9;">آمار خوانایی، طول جملات و کلمات تکراری</p>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-bottom:16px;">';
    html += statBox('کلمات پروژه', ps.words.toLocaleString('fa-IR'), '#1e3a5f');
    html += statBox('جملات', ps.sentences.toLocaleString('fa-IR'), '#8b5cf6');
    html += statBox('میانگین کلمه/جمله', ps.avgWPS, '#0891b2');
    html += statBox('زمان مطالعه', ps.readMinutes + ' دقیقه', '#10b981');
    html += '</div>';
    html += '<div style="background:var(--bg-main);padding:14px;border-radius:12px;margin-bottom:14px;">';
    html += '<div style="font-size:0.78rem;font-weight:700;margin-bottom:10px;">📖 خوانایی پروژه</div>';
    html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">';
    html += '<div style="flex:1;height:16px;background:var(--bg-card);border-radius:30px;overflow:hidden;">';
    var bc = ps.flesch > 60 ? 'linear-gradient(90deg,#10b981,#34d399)' : ps.flesch > 45 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#dc2626,#f87171)';
    html += '<div style="width:' + ps.flesch + '%;height:100%;background:' + bc + ';"></div></div>';
    html += '<strong style="color:var(--text-dark);font-size:0.85rem;">' + ps.flesch + '/100</strong></div>';
    html += '<div style="font-size:0.75rem;color:var(--text-muted);">سطح: <strong style="color:var(--primary);">' + ps.readabilityLabel + '</strong></div></div>';
    html += '<div style="background:var(--bg-main);padding:14px;border-radius:12px;margin-bottom:14px;">';
    html += '<div style="font-size:0.78rem;font-weight:700;margin-bottom:10px;">📄 صفحهٔ جاری</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;font-size:0.75rem;">';
    html += '<div><span style="color:var(--text-muted);">کلمات:</span> <strong>' + pgs.words.toLocaleString('fa-IR') + '</strong></div>';
    html += '<div><span style="color:var(--text-muted);">جملات:</span> <strong>' + pgs.sentences.toLocaleString('fa-IR') + '</strong></div>';
    html += '<div><span style="color:var(--text-muted);">جملات بلند:</span> <strong>' + pgs.longS + '</strong></div>';
    html += '<div><span style="color:var(--text-muted);">جملات کوتاه:</span> <strong>' + pgs.shortS + '</strong></div></div></div>';
    if (ps.topRepeated.length > 0) {
      html += '<div style="background:var(--bg-main);padding:14px;border-radius:12px;margin-bottom:14px;">';
      html += '<div style="font-size:0.78rem;font-weight:700;margin-bottom:10px;">🔁 کلمات پرتکرار</div>';
      html += '<div style="display:flex;flex-wrap:wrap;gap:6px;">';
      ps.topRepeated.forEach(function (r) { html += '<span style="background:var(--bg-card);padding:4px 10px;border-radius:30px;font-size:0.72rem;">' + escapeHtml(r.word) + ' <strong style="color:var(--primary);">' + r.count + '</strong></span>'; });
      html += '</div></div>';
    }
    html += '<div class="modal-actions" style="margin-top:14px;"><button class="btn-cancel" onclick="__p3_close()">بستن</button></div>';
    showPack3Modal(html, 'max-width:640px;');
  }

  function statBox(label, value, color) {
    return '<div style="background:var(--bg-main);padding:12px;border-radius:10px;text-align:center;">' +
      '<div style="font-size:1.3rem;font-weight:900;color:' + color + ';">' + value + '</div>' +
      '<div style="font-size:0.65rem;color:var(--text-muted);margin-top:4px;">' + label + '</div></div>';
  }

  // ============================================================
  // ═══════════ مودال ═══════════
  // ============================================================

  function showPack3Modal(html, style) {
    var ov = document.getElementById('pack3ModalOverlay');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'pack3ModalOverlay';
      ov.className = 'modal-overlay';
      ov.style.zIndex = '5002';
      ov.innerHTML = '<div class="modal-box" id="pack3ModalBox"></div>';
      document.body.appendChild(ov);
      ov.addEventListener('click', function (e) { if (e.target === ov) closePack3Modal(); });
    }
    var box = document.getElementById('pack3ModalBox');
    box.style.cssText = style || 'max-width:640px;';
    box.innerHTML = html;
    ov.classList.add('show');
  }
  function closePack3Modal() {
    var ov = document.getElementById('pack3ModalOverlay');
    if (ov) ov.classList.remove('show');
  }
  window.__p3_close = closePack3Modal;

  // ============================================================
  // ═══════════ دکمه‌ها + کلیدها ═══════════
  // ============================================================

  function addButtons() {
    var actions = document.querySelector('.panel-toolbar .actions');
    if (!actions || actions.querySelector('[data-pack3]')) return;

    var sum = document.createElement('button');
    sum.setAttribute('data-pack3', 'summarize');
    sum.title = 'خلاصه‌سازی هوشمند (Ctrl+Alt+S)';
    sum.style.cssText = 'background:#8b5cf6;color:#fff;font-weight:700;';
    sum.textContent = '📝 خلاصه‌ساز';
    sum.onclick = openSummarizerModal;
    actions.insertBefore(sum, actions.firstChild);

    var dict = document.createElement('button');
    dict.setAttribute('data-pack3', 'dictate');
    dict.title = 'دیکته صوتی (Ctrl+Alt+D)';
    dict.style.cssText = 'background:#10b981;color:#fff;';
    dict.textContent = '🎙️ دیکته';
    dict.onclick = function () {
      // ★★ تغییر: اگه هدف یه فیلد هست، همون رو نگه‌دار
      if (dictationTarget.type === 'field' && dictationTarget.element && document.body.contains(dictationTarget.element)) {
        startDictation(null);
        return;
      }
      // وگرنه از node استفاده کن
      startDictation(dictationTarget.nodeId);
    };
    actions.insertBefore(dict, sum.nextSibling);

    var fuzzy = document.createElement('button');
    fuzzy.setAttribute('data-pack3', 'fuzzy');
    fuzzy.title = 'جستجوی فازی (Ctrl+Alt+F)';
    fuzzy.style.cssText = 'background:#0ea5e9;color:#fff;';
    fuzzy.textContent = '🔍 جستجوی فازی';
    fuzzy.onclick = openFuzzySearch;
    actions.insertBefore(fuzzy, dict.nextSibling);

    var ana = document.createElement('button');
    ana.setAttribute('data-pack3', 'analysis');
    ana.title = 'تحلیل متن (Ctrl+Alt+A)';
    ana.style.cssText = 'background:#f59e0b;color:#fff;';
    ana.textContent = '📊 تحلیل';
    ana.onclick = openTextAnalysis;
    actions.insertBefore(ana, fuzzy.nextSibling);
  }

  function shortcuts() {
    document.addEventListener('keydown', function (e) {
      if (!e.ctrlKey || !e.altKey) return;
      var k = (e.key || '').toLowerCase();
      if (k === 's' || k === 'س') { e.preventDefault(); openSummarizerModal(); }
      else if (k === 'd' || k === 'ی') { e.preventDefault(); var btn = document.querySelector('[data-pack3="dictate"]'); if (btn) btn.click(); }
      else if (k === 'f' || k === 'ب') { e.preventDefault(); openFuzzySearch(); }
      else if (k === 'a' || k === 'ش') { e.preventDefault(); openTextAnalysis(); }
    });
  }

  // ============================================================
  // ═══════════ Boot ═══════════
  // ============================================================

  function boot() {
    addButtons();
    shortcuts();
    console.log('✅ pack3 ready (Universal Dictation: Node + Notes + Cards + Search + All Fields)');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(boot, 900); });
  else setTimeout(boot, 900);
})();