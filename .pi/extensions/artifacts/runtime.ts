// The browser half of the artifact contract: a script the shell inlines into
// every published page. It reads the data island and the page meta, exposes
// `window.artifact`, renders a questions form when the island declares
// `questions/v1`, wires hand-written `[data-question]`/`[data-option]` markup,
// keeps the page current over SSE, and sends the island back with a republish.
// Plain ES2020, no dependencies, no requests beyond the page's own origin.

export const RUNTIME_STYLES = String.raw`
:root{--af-bg:#fff;--af-fg:#1b1f24;--af-muted:#5b6470;--af-line:#e3e6ea;--af-card:#f6f8fa;--af-accent:#3b5bdb;--af-accent-fg:#fff;--af-ok:#2b8a3e;--af-warn:#b8860b;--af-danger:#c92a2a;--af-radius:8px;--af-font:system-ui,-apple-system,"Segoe UI",Roboto,Inter,sans-serif;--af-mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
@media (prefers-color-scheme:dark){:root{--af-bg:#0f1115;--af-fg:#e6e8eb;--af-muted:#9aa4b2;--af-line:#2a2f37;--af-card:#171a20;--af-accent:#7b93ff;--af-accent-fg:#0f1115}}
.af-base{margin:0;background:var(--af-bg);color:var(--af-fg);font:16px/1.55 var(--af-font)}
.af-base main.af-md,.af-base .af-wrap{max-width:860px;margin:0 auto;padding:40px 24px 120px}
.af-base h1{font-size:2rem;line-height:1.2;margin:0 0 .6em}.af-base h2{font-size:1.4rem;margin:1.6em 0 .5em}.af-base h3{font-size:1.15rem;margin:1.4em 0 .4em}
.af-base p,.af-base ul,.af-base ol{margin:0 0 1em}.af-base a{color:var(--af-accent)}
.af-base code{font-family:var(--af-mono);font-size:.9em;background:var(--af-card);padding:.1em .35em;border-radius:4px}
.af-base pre{background:var(--af-card);border:1px solid var(--af-line);border-radius:var(--af-radius);padding:14px 16px;overflow:auto}
.af-base pre code{background:none;padding:0;font-size:.85em}
.af-base blockquote{margin:0 0 1em;padding:.2em 1em;border-left:3px solid var(--af-line);color:var(--af-muted)}
.af-base table{border-collapse:collapse;margin:0 0 1em;width:100%}.af-base th,.af-base td{border:1px solid var(--af-line);padding:6px 10px;text-align:left}.af-base th{background:var(--af-card)}
.af-base hr{border:0;border-top:1px solid var(--af-line);margin:2em 0}
.af-base li.task{list-style:none;margin-left:-1.2em}
.af-questions{font-family:var(--af-font);color:var(--af-fg)}
.af-intro{color:var(--af-muted);margin:0 0 1.5em}
.af-q{border:1px solid var(--af-line);border-radius:var(--af-radius);padding:18px 20px;margin:0 0 18px;background:var(--af-bg)}
.af-q[hidden]{display:none}
.af-q-head{display:flex;gap:10px;align-items:center;margin:0 0 6px}
.af-chip{font:600 11px/1 var(--af-font);letter-spacing:.04em;text-transform:uppercase;color:var(--af-muted);border:1px solid var(--af-line);border-radius:999px;padding:5px 8px}
.af-req{color:var(--af-danger);font-size:12px}
.af-q-title{font-weight:600;font-size:1.05rem;margin:0 0 4px}
.af-why{color:var(--af-muted);font-size:.9rem;margin:0 0 12px}
.af-options{display:grid;gap:8px;margin:8px 0}
.af-option{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:start;border:1px solid var(--af-line);border-radius:var(--af-radius);padding:10px 12px;cursor:pointer;background:var(--af-card)}
.af-option:hover{border-color:var(--af-accent)}
.af-option.af-selected,[data-option].af-selected{border-color:var(--af-accent);box-shadow:inset 0 0 0 1px var(--af-accent)}
.af-option input{margin-top:4px}
.af-option-label{font-weight:600}.af-rec{font-size:11px;color:var(--af-accent);margin-left:6px;font-weight:600}
.af-option-desc{color:var(--af-muted);font-size:.92rem}
.af-preview{grid-column:1/-1;margin:6px 0 0;font-family:var(--af-mono);font-size:.8rem;background:var(--af-bg);border:1px solid var(--af-line);border-radius:6px;padding:10px;white-space:pre-wrap;overflow:auto;max-height:280px}
.af-text{width:100%;box-sizing:border-box;font:inherit;color:inherit;background:var(--af-bg);border:1px solid var(--af-line);border-radius:6px;padding:8px 10px;margin-top:6px;resize:vertical;min-height:38px}
.af-assume{display:flex;gap:10px;align-items:center;border-top:1px solid var(--af-line);padding:10px 0}
.af-assume:first-of-type{border-top:0}
.af-assume span{flex:1}
.af-btn{font:600 14px var(--af-font);border:1px solid var(--af-line);background:var(--af-card);color:var(--af-fg);border-radius:6px;padding:7px 12px;cursor:pointer}
.af-btn.af-on{border-color:var(--af-accent);background:var(--af-accent);color:var(--af-accent-fg)}
.af-btn.af-primary{background:var(--af-accent);color:var(--af-accent-fg);border-color:var(--af-accent);padding:9px 18px;font-size:15px}
.af-btn:disabled{opacity:.5;cursor:not-allowed}
.af-bar{position:fixed;left:0;right:0;bottom:0;display:flex;gap:14px;align-items:center;justify-content:space-between;padding:12px 20px;background:var(--af-bg);border-top:1px solid var(--af-line);font:14px var(--af-font);color:var(--af-muted);z-index:50}
.af-bar .af-status{flex:1}
.af-bar .af-ok{color:var(--af-ok)}.af-bar .af-err{color:var(--af-danger)}
.af-banner{position:fixed;top:12px;left:50%;transform:translateX(-50%);background:var(--af-fg);color:var(--af-bg);padding:10px 14px;border-radius:8px;font:14px var(--af-font);display:flex;gap:12px;align-items:center;z-index:60;box-shadow:0 6px 24px rgba(0,0,0,.2)}
.af-banner button{font:600 13px var(--af-font);background:transparent;color:inherit;border:1px solid currentColor;border-radius:6px;padding:4px 8px;cursor:pointer}
.af-fab{position:fixed;right:18px;bottom:70px;width:44px;height:44px;border-radius:50%;border:1px solid var(--af-line);background:var(--af-bg);color:var(--af-fg);font-size:20px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.15);z-index:55}
.af-fab .af-count{position:absolute;top:-4px;right:-4px;background:var(--af-accent);color:var(--af-accent-fg);font:600 11px var(--af-font);border-radius:999px;padding:2px 6px}
.af-panel{position:fixed;right:18px;bottom:124px;width:min(380px,calc(100vw - 36px));max-height:min(70vh,560px);overflow:auto;background:var(--af-bg);color:var(--af-fg);border:1px solid var(--af-line);border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.25);font:14px var(--af-font);z-index:56;padding:14px}
.af-panel[hidden]{display:none}
.af-panel h4{margin:0 0 10px;font-size:14px}
.af-thread{border-top:1px solid var(--af-line);padding:10px 0}
.af-thread .af-anchor{font-size:12px;color:var(--af-muted)}
.af-msg{margin:6px 0}.af-msg .af-who{font-weight:600;font-size:12px;color:var(--af-muted)}
.af-msg.af-agent .af-who{color:var(--af-accent)}
.af-row{display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap}
.af-row label{font-size:12px;color:var(--af-muted);display:flex;gap:4px;align-items:center}
`;

export const RUNTIME_SCRIPT = String.raw`
(function () {
  'use strict';
  var metaEl = document.getElementById('artifact-meta');
  var dataEl = document.getElementById('artifact-data');
  var meta = {};
  try { meta = metaEl && metaEl.textContent ? JSON.parse(metaEl.textContent) : {}; } catch (e) { meta = {}; }
  var island = null;
  try { island = dataEl && dataEl.textContent && dataEl.textContent.trim() ? JSON.parse(dataEl.textContent) : null; } catch (e) { island = null; }
  var version = typeof meta.version === 'number' ? meta.version : 0;
  var endpoint = typeof meta.endpoint === 'string' ? meta.endpoint : '';
  var dirty = false;
  var sending = false;
  var listeners = { change: [], sent: [], update: [] };
  var ui = { bar: null, status: null, sendBtn: null, banner: null, panel: null, fab: null };
  var threads = [];
  var sentAt = null;

  function on(name, fn) { if (listeners[name]) listeners[name].push(fn); return function () { off(name, fn); }; }
  function off(name, fn) { var l = listeners[name] || []; var k = l.indexOf(fn); if (k >= 0) l.splice(k, 1); }
  function emit(name, arg) { (listeners[name] || []).slice().forEach(function (fn) { try { fn(arg); } catch (e) { console.error(e); } }); }
  function cookie(name) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] === true) n.setAttribute(k, '');
      else if (attrs[k] !== false && attrs[k] != null) n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function request(method, path, body) {
    var headers = { 'x-artifact-token': cookie('artifact_token') };
    if (body !== undefined) headers['content-type'] = 'application/json';
    return fetch(endpoint + path, { method: method, headers: headers, body: body === undefined ? undefined : JSON.stringify(body), credentials: 'same-origin' })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, body: j }; }); });
  }

  // ---- island access -------------------------------------------------------
  function answers() {
    if (!island) island = {};
    if (!island.answers || typeof island.answers !== 'object') island.answers = {};
    return island.answers;
  }
  function setDirty() { dirty = true; emit('change', island); refreshBar(); }
  var api = {
    get version() { return version; },
    get slug() { return meta.slug; },
    get dirty() { return dirty; },
    data: {
      get: function () { return island; },
      set: function (patch) { island = Object.assign({}, island || {}, patch || {}); setDirty(); return island; },
      replace: function (next) { island = next; setDirty(); return island; }
    },
    answer: function (id, value) {
      var a = answers();
      var cur = a[id] || {};
      if (typeof value === 'string') cur = Object.assign({}, cur, { text: value });
      else if (Array.isArray(value)) cur = Object.assign({}, cur, { selected: value });
      else if (value && typeof value === 'object') cur = Object.assign({}, cur, value);
      a[id] = cur;
      setDirty();
      return cur;
    },
    select: function (id, label, multi) {
      var a = answers();
      var cur = a[id] || {};
      var sel = Array.isArray(cur.selected) ? cur.selected.slice() : [];
      var k = sel.indexOf(label);
      if (multi) { if (k >= 0) sel.splice(k, 1); else sel.push(label); }
      else sel = k >= 0 && sel.length === 1 ? [] : [label];
      a[id] = Object.assign({}, cur, { selected: sel });
      setDirty();
      syncBindings();
      return sel;
    },
    send: function (extra) { return send(extra); },
    comment: function (text, opts) {
      opts = opts || {};
      return request('POST', '/comments', { text: text, toAgent: opts.toAgent !== false, anchor: opts.anchor, threadId: opts.threadId })
        .then(function (r) { if (r.status !== 200) throw new Error(r.body && r.body.error || 'comment failed'); loadThreads(); return r.body; });
    },
    threads: function () { return threads.slice(); },
    on: on,
    off: off,
    reload: function () { location.reload(); }
  };
  window.artifact = api;

  // ---- send ----------------------------------------------------------------
  function send(extra) {
    if (sending) return Promise.resolve({ ok: false, error: 'already sending' });
    if (extra && typeof extra === 'object') island = Object.assign({}, island || {}, extra);
    sending = true;
    setStatus('Sending…');
    return request('POST', '/publish', { base_version: version, data: island })
      .then(function (r) {
        sending = false;
        if (r.status === 200 && r.body && r.body.ok) {
          version = r.body.version;
          dirty = false;
          sentAt = new Date();
          setStatus('Sent as v' + version + ' — the agent is continuing.', 'ok');
          emit('sent', { version: version });
          refreshBar();
          return { ok: true, version: version };
        }
        if (r.status === 409) {
          showBanner('This page changed underneath you (now v' + (r.body.current || '?') + '). Reload to see it; your unsent choices will be lost.', 'Reload', function () { location.reload(); });
          setStatus('Not sent — the page is out of date.', 'err');
          return { ok: false, error: 'stale', current: r.body.current };
        }
        var msg = (r.body && r.body.error) || ('HTTP ' + r.status);
        var detail = r.body && r.body.errors && r.body.errors.length ? ' ' + r.body.errors.join('; ') : '';
        setStatus('Not sent: ' + msg + detail, 'err');
        return { ok: false, error: msg, errors: r.body && r.body.errors };
      })
      .catch(function (e) { sending = false; setStatus('Not sent: ' + (e && e.message || e), 'err'); return { ok: false, error: String(e) }; });
  }

  // ---- questions/v1 --------------------------------------------------------
  function isQuestions() { return island && island.schema === 'questions/v1' && Array.isArray(island.questions); }
  function visibleQ(q) {
    if (!q.dependsOn) return true;
    var a = answers();
    return Object.keys(q.dependsOn).every(function (parent) {
      var wanted = q.dependsOn[parent];
      var labels = Array.isArray(wanted) ? wanted : [wanted];
      var sel = (a[parent] && a[parent].selected) || [];
      return labels.some(function (l) { return sel.indexOf(l) >= 0; });
    });
  }
  function progress() {
    if (!isQuestions()) return null;
    var a = answers();
    var total = 0, done = 0, missing = [];
    island.questions.forEach(function (q) {
      if (!visibleQ(q)) return;
      total += 1;
      var v = a[q.id] || {};
      var has = (Array.isArray(v.selected) && v.selected.length) || (typeof v.text === 'string' && v.text.trim());
      if (has) done += 1; else if (q.required !== false) missing.push(q.id);
    });
    return { total: total, done: done, missing: missing };
  }
  function renderQuestions(root) {
    root.classList.add('af-questions');
    root.innerHTML = '';
    if (island.intro) root.appendChild(el('p', { class: 'af-intro', text: island.intro }));
    island.questions.forEach(function (q) {
      var a = answers();
      var card = el('section', { class: 'af-q', 'data-q': q.id });
      var head = el('div', { class: 'af-q-head' });
      if (q.header) head.appendChild(el('span', { class: 'af-chip', text: q.header }));
      if (q.required !== false) head.appendChild(el('span', { class: 'af-req', text: 'required' }));
      card.appendChild(head);
      card.appendChild(el('p', { class: 'af-q-title', text: q.question }));
      if (q.whyItMatters) card.appendChild(el('p', { class: 'af-why', text: q.whyItMatters }));
      if (Array.isArray(q.options) && q.options.length) {
        var list = el('div', { class: 'af-options', role: q.multiSelect ? 'group' : 'radiogroup' });
        q.options.forEach(function (o, k) {
          var sel = ((a[q.id] && a[q.id].selected) || []).indexOf(o.label) >= 0;
          var input = el('input', { type: q.multiSelect ? 'checkbox' : 'radio', name: 'af-' + q.id, value: o.label });
          input.checked = sel;
          var label = el('label', { class: 'af-option' + (sel ? ' af-selected' : ''), 'data-option': o.label }, [
            input,
            el('div', {}, [
              el('div', { class: 'af-option-label' }, [o.label, q.recommended === k ? el('span', { class: 'af-rec', text: 'recommended' }) : null]),
              o.description ? el('div', { class: 'af-option-desc', text: o.description }) : null
            ]),
            o.preview ? el('pre', { class: 'af-preview', text: o.preview }) : null
          ]);
          label.addEventListener('click', function (ev) {
            if (ev.target && ev.target.tagName === 'INPUT') return;
            ev.preventDefault();
            api.select(q.id, o.label, !!q.multiSelect);
            renderQuestions(root);
          });
          input.addEventListener('change', function () { api.select(q.id, o.label, !!q.multiSelect); renderQuestions(root); });
          list.appendChild(label);
        });
        card.appendChild(list);
      }
      if (q.allowText !== false) {
        var ta = el('textarea', { class: 'af-text', placeholder: q.options && q.options.length ? 'Something else, or a note…' : 'Type your answer…', rows: 1 });
        ta.value = (a[q.id] && a[q.id].text) || '';
        ta.addEventListener('input', function () { api.answer(q.id, ta.value); });
        card.appendChild(ta);
      }
      if (!visibleQ(q)) card.hidden = true;
      root.appendChild(card);
    });
    if (Array.isArray(island.assumptions) && island.assumptions.length) {
      var box = el('section', { class: 'af-q' }, [el('p', { class: 'af-q-title', text: 'Assumptions the agent will make unless you change them' })]);
      island.assumptions.forEach(function (s) {
        var a = answers();
        var cur = ((a[s.id] && a[s.id].selected) || [s.default || 'confirm'])[0];
        var row = el('div', { class: 'af-assume' }, [el('span', { text: s.text })]);
        ['confirm', 'override'].forEach(function (v) {
          row.appendChild(el('button', { type: 'button', class: 'af-btn' + (cur === v ? ' af-on' : ''), text: v === 'confirm' ? 'Keep' : 'Change', onclick: function () { api.answer(s.id, { selected: [v] }); renderQuestions(root); } }));
        });
        var note = el('input', { class: 'af-text', type: 'text', placeholder: 'note (optional)' });
        note.value = (a[s.id] && a[s.id].text) || '';
        note.addEventListener('input', function () { api.answer(s.id, note.value); });
        if (cur === 'override') row.appendChild(note);
        box.appendChild(row);
      });
      root.appendChild(box);
    }
  }

  // ---- hand-written bindings ----------------------------------------------
  function syncBindings() {
    var a = answers();
    document.querySelectorAll('[data-question] [data-option]').forEach(function (opt) {
      var holder = opt.closest('[data-question]');
      var id = holder && holder.getAttribute('data-question');
      var sel = (id && a[id] && a[id].selected) || [];
      opt.classList.toggle('af-selected', sel.indexOf(opt.getAttribute('data-option')) >= 0);
    });
  }
  function wireBindings() {
    document.querySelectorAll('[data-question]').forEach(function (holder) {
      if (holder.classList.contains('af-q') || holder.getAttribute('data-af-wired')) return;
      holder.setAttribute('data-af-wired', '1');
      var id = holder.getAttribute('data-question');
      var multi = holder.hasAttribute('data-multi');
      holder.querySelectorAll('[data-option]').forEach(function (opt) {
        opt.addEventListener('click', function () { api.select(id, opt.getAttribute('data-option'), multi); });
      });
      if (holder.matches('input,textarea,select')) {
        holder.addEventListener('input', function () { api.answer(id, holder.value); });
      } else {
        holder.querySelectorAll('input[data-text],textarea[data-text]').forEach(function (t) {
          t.addEventListener('input', function () { api.answer(id, t.value); });
        });
      }
    });
    document.querySelectorAll('[data-artifact-send]').forEach(function (b) {
      if (b.getAttribute('data-af-wired')) return;
      b.setAttribute('data-af-wired', '1');
      b.addEventListener('click', function (ev) {
        ev.preventDefault();
        var action = b.getAttribute('data-artifact-send');
        send(action ? { action: action } : undefined);
      });
    });
    syncBindings();
  }

  // ---- chrome: bar, banner, comments --------------------------------------
  function setStatus(text, kind) {
    if (!ui.status) return;
    ui.status.textContent = text;
    ui.status.className = 'af-status' + (kind ? ' af-' + kind : '');
  }
  function refreshBar() {
    if (!ui.bar) return;
    var p = progress();
    if (p) {
      if (ui.sendBtn) ui.sendBtn.disabled = p.missing.length > 0 || sending;
      if (!sending && !(sentAt && !dirty)) {
        setStatus(p.missing.length ? (p.done + ' of ' + p.total + ' answered · ' + p.missing.length + ' required left') : (p.done + ' of ' + p.total + ' answered · ready to send'));
      }
    } else if (ui.sendBtn) {
      ui.sendBtn.disabled = sending || !dirty;
      if (!sending && !(sentAt && !dirty)) setStatus(dirty ? 'Unsent changes' : 'v' + version);
    }
  }
  function mountBar() {
    if (ui.bar || !endpoint) return;
    var hasCustomSend = document.querySelector('[data-artifact-send]');
    if (!island && !hasCustomSend) return;
    if (hasCustomSend && !isQuestions()) return;
    ui.status = el('span', { class: 'af-status', text: '' });
    ui.sendBtn = el('button', { type: 'button', class: 'af-btn af-primary', text: 'Send to agent', onclick: function () { send(); } });
    ui.bar = el('div', { class: 'af-bar' }, [ui.status, el('span', { class: 'af-muted', text: 'v' + version }), ui.sendBtn]);
    document.body.appendChild(ui.bar);
    refreshBar();
  }
  function showBanner(text, actionLabel, action) {
    hideBanner();
    ui.banner = el('div', { class: 'af-banner' }, [
      el('span', { text: text }),
      actionLabel ? el('button', { type: 'button', text: actionLabel, onclick: function () { hideBanner(); if (action) action(); } }) : null,
      el('button', { type: 'button', text: '✕', onclick: hideBanner })
    ]);
    document.body.appendChild(ui.banner);
  }
  function hideBanner() { if (ui.banner && ui.banner.parentNode) ui.banner.parentNode.removeChild(ui.banner); ui.banner = null; }

  function loadThreads() {
    if (!endpoint) return Promise.resolve([]);
    return request('GET', '/comments').then(function (r) {
      threads = (r.status === 200 && r.body && Array.isArray(r.body.threads)) ? r.body.threads : [];
      renderThreads();
      return threads;
    }).catch(function () { return threads; });
  }
  function renderThreads() {
    if (!ui.panel) return;
    var list = ui.panel.querySelector('.af-threads');
    if (!list) return;
    list.innerHTML = '';
    if (!threads.length) list.appendChild(el('p', { class: 'af-anchor', text: 'No comments yet.' }));
    threads.forEach(function (t) {
      var box = el('div', { class: 'af-thread' });
      box.appendChild(el('div', { class: 'af-anchor', text: (t.anchor ? t.anchor + ' · ' : '') + (t.toAgent ? 'sent to agent' : 'note') + (t.resolved ? ' · resolved' : '') }));
      (t.messages || []).forEach(function (m) {
        box.appendChild(el('div', { class: 'af-msg' + (m.author === 'agent' ? ' af-agent' : '') }, [el('div', { class: 'af-who', text: m.author === 'agent' ? 'agent' : 'you' }), el('div', { text: m.text })]));
      });
      var reply = el('input', { class: 'af-text', type: 'text', placeholder: 'Reply…' });
      reply.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' && reply.value.trim()) { api.comment(reply.value.trim(), { threadId: t.id, toAgent: true }); reply.value = ''; }
      });
      box.appendChild(reply);
      list.appendChild(box);
    });
    if (ui.fab) {
      var c = ui.fab.querySelector('.af-count');
      var n = threads.filter(function (t) { return !t.resolved; }).length;
      if (c) { c.textContent = String(n); c.hidden = n === 0; }
    }
  }
  function mountComments() {
    if (ui.fab || !endpoint || !document.body) return;
    ui.fab = el('button', { type: 'button', class: 'af-fab', title: 'Comments', onclick: function () { ui.panel.hidden = !ui.panel.hidden; if (!ui.panel.hidden) loadThreads(); } }, ['💬', el('span', { class: 'af-count', hidden: true, text: '0' })]);
    var text = el('textarea', { class: 'af-text', placeholder: 'Leave a comment for the agent…', rows: 2 });
    var anchor = el('input', { class: 'af-text', type: 'text', placeholder: 'About (optional): a heading, a question id…' });
    var toAgent = el('input', { type: 'checkbox' });
    toAgent.checked = true;
    var post = el('button', { type: 'button', class: 'af-btn af-primary', text: 'Post', onclick: function () {
      if (!text.value.trim()) return;
      api.comment(text.value.trim(), { toAgent: toAgent.checked, anchor: anchor.value.trim() || undefined }).then(function () { text.value = ''; anchor.value = ''; });
    } });
    ui.panel = el('div', { class: 'af-panel', hidden: true }, [
      el('h4', { text: 'Comments' }),
      el('div', { class: 'af-threads' }),
      el('div', { class: 'af-thread' }, [text, anchor, el('div', { class: 'af-row' }, [el('label', {}, [toAgent, 'send to agent (wakes the session)']), post])])
    ]);
    document.body.appendChild(ui.fab);
    document.body.appendChild(ui.panel);
  }

  // ---- live updates --------------------------------------------------------
  function subscribe() {
    if (!endpoint || typeof EventSource === 'undefined') return;
    var es;
    try { es = new EventSource(endpoint + '/events'); } catch (e) { return; }
    es.onmessage = function (e) {
      var ev; try { ev = JSON.parse(e.data); } catch (err) { return; }
      if (ev.type === 'version' && typeof ev.version === 'number' && ev.version > version) {
        if (sending) return; // our own send; the response carries the new version
        emit('update', ev);
        if (dirty) showBanner('The agent published v' + ev.version + '. Reload to see it; your unsent choices will be lost.', 'Reload', function () { location.reload(); });
        else location.reload();
      } else if (ev.type === 'comment') {
        loadThreads();
      }
    };
  }

  function boot() {
    if (isQuestions()) {
      var root = document.querySelector('[data-artifact-questions]');
      if (!root) { root = el('div', { class: 'af-wrap' }); document.body.appendChild(root); }
      renderQuestions(root);
    }
    wireBindings();
    mountBar();
    mountComments();
    subscribe();
    if (island && island.answers && Object.keys(island.answers).length) refreshBar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
`;
