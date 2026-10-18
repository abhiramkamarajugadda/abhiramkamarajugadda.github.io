/* Windows XP startup: boot screen -> Welcome/login -> desktop. Plays on every full page load. */
(function () {
  'use strict';
  var root = document.documentElement;
  var start = document.getElementById('xp-start');
  if (!start || !root.classList.contains('xp-booting')) { root.classList.remove('xp-booting'); return; }

  var boot = document.getElementById('xs-boot');
  var login = document.getElementById('xs-login');
  var tile = document.getElementById('xl-user');
  var off = document.getElementById('xl-off');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var locked = ['desktop', 'start-menu'].map(function (id) { return document.getElementById(id); })
    .concat(Array.prototype.slice.call(document.querySelectorAll('.taskbar, .skip-link')));
  var phase = 'boot', bootTimer;

  // Desktop is not visible or reachable (mouse, keyboard, screen reader) until login.
  locked.forEach(function (el) { if (el) { el.setAttribute('inert', ''); el.setAttribute('aria-hidden', 'true'); } });

  function showLogin() {
    if (phase !== 'boot') return;
    phase = 'login';
    clearTimeout(bootTimer);
    boot.hidden = true;
    login.hidden = false;
    try { tile.focus({ preventScroll: true }); } catch (e) { tile.focus(); }
  }

  function logIn() {
    if (phase !== 'login') return;
    phase = 'loading';
    tile.classList.add('is-busy');
    tile.setAttribute('aria-busy', 'true');
    setTimeout(function () {
      phase = 'welcome';
      login.classList.add('is-welcome');
      setTimeout(reveal, reduce ? 300 : 1300);
    }, reduce ? 300 : 1200);
  }

  function reveal() {
    locked.forEach(function (el) { if (el) { el.removeAttribute('inert'); el.removeAttribute('aria-hidden'); } });
    root.classList.remove('xp-booting');
    start.classList.add('xs-fade');
    phase = 'done';
    var done = function () { if (start.parentNode) start.parentNode.removeChild(start); };
    setTimeout(done, reduce ? 0 : 650);
    try { document.dispatchEvent(new CustomEvent('xp:loggedin')); }
    catch (e) { var ev = document.createEvent('Event'); ev.initEvent('xp:loggedin', true, true); document.dispatchEvent(ev); }
    var w = document.querySelector('.window.app.open .title-bar-controls button');
    if (w) try { w.focus({ preventScroll: true }); } catch (e) {}
  }

  boot.addEventListener('click', showLogin);
  tile.addEventListener('click', logIn);
  off.addEventListener('click', function () {
    var t = document.getElementById('xl-toast');
    t.hidden = false;
    setTimeout(function () { t.hidden = true; }, 2600);
  });
  document.addEventListener('keydown', function (e) {
    if (phase === 'boot' && (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape')) { e.preventDefault(); showLogin(); }
  });

  bootTimer = setTimeout(showLogin, reduce ? 600 : 2000);
  window.__xpBoot = true;
})();
