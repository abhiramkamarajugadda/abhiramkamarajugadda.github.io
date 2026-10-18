/* Windows XP-style desktop: window manager, taskbar, start menu, clock. Vanilla JS, no dependencies. */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');

  var desktop = document.getElementById('desktop');
  var tasks = document.getElementById('tasks');
  var startBtn = document.getElementById('start-btn');
  var startMenu = document.getElementById('start-menu');
  var mq = window.matchMedia('(max-width: 760px), (max-height: 520px)');
  var zTop = 100;
  var cascade = 0;
  var wins = {};

  // Default positions (fractions of desktop size) so windows don't stack on top of each other.
  var defaults = {
    about:      { x: 0.16, y: 0.06 },
    projects:   { x: 0.30, y: 0.04 },
    skills:     { x: 0.42, y: 0.10 },
    experience: { x: 0.24, y: 0.08 },
    resume:     { x: 0.36, y: 0.02 },
    contact:    { x: 0.52, y: 0.16 }
  };

  Array.prototype.forEach.call(document.querySelectorAll('.window.app'), function (el) {
    var id = el.getAttribute('data-win');
    wins[id] = { el: el, task: null, placed: false };
    var bar = el.querySelector('.title-bar');
    var ctrls = el.querySelectorAll('.title-bar-controls button');
    ctrls[0].addEventListener('click', function (e) { e.stopPropagation(); minimize(id); });
    ctrls[1].addEventListener('click', function (e) { e.stopPropagation(); toggleMax(id); });
    ctrls[2].addEventListener('click', function (e) { e.stopPropagation(); close(id); });
    el.addEventListener('pointerdown', function () { focus(id); });
    bar.addEventListener('dblclick', function (e) {
      if (e.target.closest('.title-bar-controls')) return;
      toggleMax(id);
    });
    makeDraggable(el, bar);
    Array.prototype.forEach.call(bar.querySelectorAll('img'), function (i) { i.draggable = false; });
  });

  // ---------- Window manager ----------
  function place(id) {
    var w = wins[id], el = w.el;
    if (w.placed || mq.matches) return;
    var dw = desktop.clientWidth, dh = desktop.clientHeight;
    var ew = Math.min(el.offsetWidth, dw - 16), eh = Math.min(el.offsetHeight, dh - 16);
    var d = defaults[id] || { x: 0.2, y: 0.08 };
    var x = Math.round(Math.max(100, d.x * dw) + cascade * 0);
    var y = Math.round(d.y * dh);
    if (x + ew > dw - 8) x = Math.max(8, dw - ew - 8);
    if (y + eh > dh - 8) y = Math.max(8, dh - eh - 8);
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    w.placed = true;
  }

  function open(id) {
    var w = wins[id];
    if (!w) return;
    closeStart();
    var el = w.el;
    if (!el.classList.contains('open')) {
      el.classList.add('open');
      place(id);
      addTask(id);
      if (id === 'resume') loadPdf(el);
    }
    el.hidden = false;
    el.style.display = '';
    focus(id);
    selectIcon(id);
  }

  function close(id) {
    var w = wins[id];
    w.el.classList.remove('open', 'maximized');
    syncMaxButton(w.el);
    if (w.task) { w.task.remove(); w.task = null; }
    focusTopmost();
  }

  function minimize(id) {
    var w = wins[id];
    w.el.style.display = 'none';
    if (w.task) w.task.classList.remove('is-active');
    w.el.classList.add('inactive');
    focusTopmost();
  }

  function toggleMax(id) {
    if (mq.matches) return;
    var el = wins[id].el;
    el.classList.toggle('maximized');
    syncMaxButton(el);
    focus(id);
  }

  function syncMaxButton(el) {
    var b = el.querySelectorAll('.title-bar-controls button')[1];
    b.setAttribute('aria-label', el.classList.contains('maximized') ? 'Restore' : 'Maximize');
  }

  function isVisible(w) { return w.el.classList.contains('open') && w.el.style.display !== 'none'; }

  function focus(id) {
    Object.keys(wins).forEach(function (k) {
      var w = wins[k];
      var on = k === id;
      w.el.classList.toggle('inactive', !on);
      if (w.task) {
        w.task.classList.toggle('is-active', on && isVisible(w));
        w.task.setAttribute('aria-pressed', on && isVisible(w) ? 'true' : 'false');
      }
    });
    wins[id].el.style.zIndex = ++zTop;
  }

  function focusTopmost() {
    var best = null, bz = -1;
    Object.keys(wins).forEach(function (k) {
      var w = wins[k];
      if (isVisible(w)) {
        var z = parseInt(w.el.style.zIndex || 0, 10);
        if (z > bz) { bz = z; best = k; }
      }
    });
    if (best) focus(best);
    else Object.keys(wins).forEach(function (k) { if (wins[k].task) wins[k].task.classList.remove('is-active'); });
  }

  function addTask(id) {
    var w = wins[id];
    if (w.task) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'task';
    b.title = w.el.getAttribute('data-title');
    var img = document.createElement('img');
    img.src = w.el.getAttribute('data-icon'); img.alt = '';
    var s = document.createElement('span');
    s.textContent = w.el.getAttribute('data-title');
    b.appendChild(img); b.appendChild(s);
    b.addEventListener('click', function () {
      if (!isVisible(w)) { w.el.style.display = ''; focus(id); }
      else if (b.classList.contains('is-active')) minimize(id);
      else focus(id);
    });
    tasks.appendChild(b);
    w.task = b;
  }

  function loadPdf(el) {
    var f = el.querySelector('.pdf-frame');
    if (f && !f.src && f.getAttribute('data-src') && !mq.matches) f.src = f.getAttribute('data-src');
  }

  // ---------- Dragging (pointer events: mouse, pen, touch) ----------
  function makeDraggable(el, handle) {
    var sx, sy, ox, oy, dragging = false;
    handle.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || mq.matches || el.classList.contains('maximized')) return;
      if (e.target.closest('.title-bar-controls')) return;
      e.preventDefault();
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      ox = el.offsetLeft; oy = el.offsetTop;
      handle.setPointerCapture(e.pointerId);
      document.body.style.userSelect = 'none';
      var f = el.querySelector('iframe'); if (f) f.style.pointerEvents = 'none';
    });
    handle.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dw = desktop.clientWidth, dh = desktop.clientHeight;
      var nx = ox + e.clientX - sx, ny = oy + e.clientY - sy;
      nx = Math.min(Math.max(nx, 60 - el.offsetWidth), dw - 60);
      ny = Math.min(Math.max(ny, 0), dh - 28);
      el.style.left = nx + 'px';
      el.style.top = ny + 'px';
    });
    function end() {
      if (!dragging) return;
      dragging = false;
      document.body.style.userSelect = '';
      var f = el.querySelector('iframe'); if (f) f.style.pointerEvents = '';
    }
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }

  // ---------- Desktop icons & openers ----------
  function selectIcon(id) {
    Array.prototype.forEach.call(document.querySelectorAll('.desktop .icon'), function (i) {
      i.classList.toggle('selected', i.getAttribute('data-open') === id);
    });
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-open]');
    if (t) { e.preventDefault(); open(t.getAttribute('data-open')); return; }
    if (!e.target.closest('.start-menu') && !e.target.closest('#start-btn')) closeStart();
    if (e.target === desktop || e.target.classList.contains('icons')) selectIcon(null);
  });

  // ---------- Start menu ----------
  function closeStart() { startMenu.hidden = true; startBtn.setAttribute('aria-expanded', 'false'); }
  startBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var show = startMenu.hidden;
    startMenu.hidden = !show;
    startBtn.setAttribute('aria-expanded', String(show));
    if (show) { var first = startMenu.querySelector('button, a'); if (first) first.focus(); }
  });
  document.getElementById('close-all').addEventListener('click', function () {
    Object.keys(wins).forEach(function (k) { if (wins[k].el.classList.contains('open')) close(k); });
    closeStart();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (!startMenu.hidden) { closeStart(); startBtn.focus(); return; }
    }
  });

  // ---------- Tabs (Experience & Education) ----------
  Array.prototype.forEach.call(document.querySelectorAll('menu[role=tablist]'), function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role=tab]'));
    function show(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(t); });
      t.addEventListener('keydown', function (e) {
        var n = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!n) return;
        var next = tabs[(i + n + tabs.length) % tabs.length];
        show(next); next.focus();
      });
    });
    show(tabs[0]);
  });

  // ---------- Copy email ----------
  Array.prototype.forEach.call(document.querySelectorAll('.copy-email'), function (b) {
    b.addEventListener('click', function () {
      var email = b.getAttribute('data-email');
      var done = function () { var t = b.textContent; b.textContent = 'Copied!'; setTimeout(function () { b.textContent = t; }, 1500); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(email).then(done, function () { window.prompt('Copy email:', email); });
      else window.prompt('Copy email:', email);
    });
  });

  // ---------- PDF preview fallback (browsers without inline PDF viewer) ----------
  if (navigator.pdfViewerEnabled === false) {
    var rf = document.querySelector('.pdf-frame'); if (rf) rf.remove();
    var fb = document.querySelector('.pdf-fallback'); if (fb) fb.style.display = 'block';
  }

  // ---------- Clock ----------
  var clock = document.getElementById('clock');
  function tick() {
    var d = new Date();
    clock.textContent = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    clock.setAttribute('datetime', d.toISOString());
    clock.title = d.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  tick();
  setInterval(tick, 10000);

  // ---------- Welcome balloon ----------
  var balloon = document.getElementById('balloon');
  balloon.querySelector('.balloon-close').addEventListener('click', function () { balloon.hidden = true; });
  setTimeout(function () { balloon.hidden = false; }, 700);
  setTimeout(function () { balloon.hidden = true; }, 9000);

  // Keep windows on-screen when the viewport is resized.
  window.addEventListener('resize', function () {
    if (mq.matches) return;
    var dw = desktop.clientWidth, dh = desktop.clientHeight;
    Object.keys(wins).forEach(function (k) {
      var el = wins[k].el;
      if (!el.classList.contains('open')) return;
      if (el.offsetLeft > dw - 60) el.style.left = Math.max(8, dw - el.offsetWidth - 8) + 'px';
      if (el.offsetTop > dh - 28) el.style.top = Math.max(0, dh - el.offsetHeight - 8) + 'px';
    });
  });

  // Open About on load (or a section from the URL hash, e.g. #projects).
  var hash = (location.hash || '').replace('#', '').replace('win-', '');
  open(wins[hash] ? hash : 'about');
})();
