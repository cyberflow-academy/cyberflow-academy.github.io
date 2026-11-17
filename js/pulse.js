/* CyberFlow Pulse: anonymous visit tracking for the academy site.
 *
 * What it records: where the visit came from, which buttons get clicked, how far
 * people scroll, how long they actually spend here, and what they play with.
 * What it never records: names, emails, IP addresses, cookies, or anything typed
 * into the decoder. The visit id lives in sessionStorage and dies with the tab.
 *
 * Owner tools (add to the address once):
 *   ?pulse=off   stop counting this browser (your own visits)
 *   ?pulse=on    start counting it again
 *   ?pulse=test  mark this tab's visit as a test, hidden from the real numbers
 */
(function () {
  'use strict';
  var me = document.currentScript;
  var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var ENDPOINT = local ? 'http://127.0.0.1:8787/e' : (me && me.getAttribute('data-endpoint')) || '';
  if (!ENDPOINT) return;

  var ls = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; };
  var ss = function (k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) {} return null; };

  var params = new URLSearchParams(location.search);
  var flag = params.get('pulse');
  if (flag === 'off') ls('cf-pulse-off', '1');
  if (flag === 'on') ls('cf-pulse-off', null);
  if (flag === 'test') ss('cf-pulse-test', '1');
  var test = ss('cf-pulse-test') === '1';
  if (ls('cf-pulse-off') === '1') { window.pulse = function () {}; return; }
  if (navigator.webdriver && !test) { window.pulse = function () {}; return; }

  // ---- one visit = one tab session ----
  var sid = ss('cf-pulse-sid');
  if (!sid) { sid = (Math.random().toString(36).slice(2) + Date.now().toString(36)).slice(0, 16); ss('cf-pulse-sid', sid); }

  // ---- where did they come from? ----
  var slug = function (s) { return String(s || '').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 36); };
  var refHost = '';
  try { if (document.referrer) { var r = new URL(document.referrer); if (r.hostname !== location.hostname) refHost = r.hostname.replace(/^www\.|^m\./, ''); } } catch (e) {}
  function channel(host) {
    if (!host) return 'direct';
    var map = [[/youtube\.com|youtu\.be/, 'youtube'], [/^(x|twitter)\.com|t\.co$/, 'x'], [/discord/, 'discord'], [/google\./, 'google'],
      [/bing\.com/, 'bing'], [/duckduckgo/, 'duckduckgo'], [/reddit/, 'reddit'], [/instagram/, 'instagram'], [/tiktok/, 'tiktok'],
      [/facebook|fb\.com/, 'facebook'], [/whop\.com/, 'whop'], [/github/, 'github'], [/linkedin|lnkd\.in/, 'linkedin']];
    for (var i = 0; i < map.length; i++) if (map[i][0].test(host)) return map[i][1];
    return 'other';
  }
  var src = ss('cf-pulse-src');
  if (!src) {
    var tag = slug(params.get('v') || params.get('utm_campaign'));
    var via = slug(params.get('s') || params.get('utm_source'));
    src = tag ? 'v:' + tag : via ? via : channel(refHost);
    ss('cf-pulse-src', src);
  }
  // keep shared links clean: drop the tracking bits from the address bar
  if (params.has('v') || params.has('s') || params.has('pulse') || params.has('utm_source') || params.has('utm_campaign')) {
    ['v', 's', 'pulse', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(function (k) { params.delete(k); });
    var q = params.toString();
    try { history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash); } catch (e) {}
  }
  var w = window.innerWidth;
  var coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  var dev = w < 768 ? 'mobile' : (coarse && w < 1200 ? 'tablet' : 'desktop');

  // ---- sending ----
  var queue = [];
  function send(beacon) {
    if (!queue.length) return;
    var body = JSON.stringify({ sid: sid, src: src, ref: refHost, dev: dev, test: test ? 1 : 0, ev: queue.splice(0, 60) });
    var sent = false;
    if (beacon && navigator.sendBeacon) { try { sent = navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' })); } catch (e) {} }
    if (!sent) { try { fetch(ENDPOINT, { method: 'POST', body: body, keepalive: true, mode: 'cors', headers: { 'Content-Type': 'text/plain' } }).catch(function () {}); } catch (e) {} }
    if (queue.length) send(beacon);
  }
  function track(type, name, val) {
    queue.push(val == null ? [type, String(name || '')] : [type, String(name || ''), Math.round(val * 10) / 10]);
    if (queue.length >= 20) send(false);
  }
  window.pulse = track;
  setInterval(function () { send(false); }, 8000);

  track('view', location.pathname === '/' || location.pathname === '/index.html' ? '/' : location.pathname, w);

  // ---- clicks ----
  var once = {};
  var first = function (k) { if (once[k]) return false; once[k] = 1; return true; };
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('a, button, summary');
    if (!el) return;
    var t = el.getAttribute('data-t');
    var leaving = el.tagName === 'A' && el.hostname && el.hostname !== location.hostname;
    if (t) track('click', t);
    else if (el.matches('.top nav a')) track('click', 'nav_' + (el.getAttribute('href') || '').replace('#', ''));
    else if (el.matches('a.thumb')) { var m = /v=([\w-]+)/.exec(el.href); track('click', 'yt_video'); if (m) track('click', 'yt:' + m[1]); }
    else if (el.matches('[data-copy]')) track('click', 'copy_code');
    else if (el.matches('.stop')) track('step', 'step' + (+el.getAttribute('data-step') + 1), +el.getAttribute('data-step') + 1);
    else if (el.matches('#step-panel [data-go]')) track('step', 'step' + (+el.getAttribute('data-go') + 1), +el.getAttribute('data-go') + 1);
    else if (el.matches('.filters button')) track('radar', 'filter_' + el.getAttribute('data-list'));
    else if (el.matches('.prog > button')) track('radar', 'program_open');
    else if (el.matches('.samples button')) track('dec', 'sample');
    else if (el.matches('#hintBtn')) track('lab', 'hint');
    else if (el.matches('#chips button')) labCmd(el.getAttribute('data-cmd'));
    else if (leaving) track('click', 'out:' + el.hostname.replace(/^www\./, ''));
    if (leaving) send(true);
  }, true);

  // ---- the practice lab ----
  var cmds = 0;
  function labCmd(c) {
    c = String(c || '').trim().toLowerCase();
    if (!c) return;
    if (first('lab_start')) track('lab', 'start');
    if (++cmds > 25) return;
    var word = c.split(/\s+/)[0];
    var known = ['ls', 'cat', 'chmod', './deploy.sh', 'bash', 'hack', 'matrix', 'sudo', 'help', 'whoami', 'clear', 'rm', 'id', 'pwd', 'echo', 'exit', 'hostname'];
    track('lab', 'cmd_' + (known.indexOf(word) >= 0 ? word : 'other'));
  }
  document.addEventListener('submit', function (e) {
    if (e.target && e.target.id === 'termForm') { var i = document.getElementById('termIn'); if (i) labCmd(i.value); }
  }, true);
  var won = document.getElementById('won');
  if (won && window.MutationObserver) {
    new MutationObserver(function () { if (!won.hidden && first('lab_solved')) track('lab', 'solved'); }).observe(won, { attributes: true, attributeFilter: ['hidden'] });
  }

  // ---- decoder: only that it was used, never what was pasted ----
  var decIn = document.getElementById('decIn');
  if (decIn) decIn.addEventListener('input', function (e) { if (e.isTrusted && first('dec_paste')) track('dec', 'paste'); });

  // ---- FAQ: which doubts people open ----
  document.addEventListener('toggle', function (e) {
    var d = e.target;
    if (!d || d.tagName !== 'DETAILS' || !d.open) return;
    var s = d.querySelector('summary');
    var key = 'faq_' + slug(s ? s.textContent : '').slice(0, 40);
    if (first(key)) track('faq', key.slice(4));
  }, true);

  // ---- easter eggs ----
  if (typeof window.cfEgg === 'function') {
    var egg = window.cfEgg;
    window.cfEgg = function (id) { if (first('egg_' + id)) track('egg', id); return egg.apply(this, arguments); };
  }

  // ---- how far down the page they got ----
  var SECTIONS = [['.hero', 'hero'], ['.known', 'videos'], ['#path', 'path'], ['#try', 'try_it'], ['.community', 'community'],
    ['#reviews', 'reviews'], ['#pricing', 'pricing'], ['.promise', 'promise'], ['#faq', 'faq'], ['#final', 'final']];
  if (window.IntersectionObserver) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var k = en.target.getAttribute('data-pulse-sec');
        if (first('sec_' + k)) track('sec', k, +en.target.getAttribute('data-pulse-i'));
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -45% 0px' });
    SECTIONS.forEach(function (s, i) {
      var el = document.querySelector(s[0]);
      if (el) { el.setAttribute('data-pulse-sec', s[1]); el.setAttribute('data-pulse-i', i + 1); io.observe(el); }
    });
  }
  var maxScroll = 0;
  function scrollPct() {
    var h = document.documentElement.scrollHeight - innerHeight;
    var p = h > 0 ? Math.min(100, Math.round((scrollY / h) * 100)) : 100;
    if (p > maxScroll) maxScroll = p;
  }
  addEventListener('scroll', scrollPct, { passive: true });

  // ---- real time on page: only while the tab is visible and someone is there ----
  var active = 0, lastAct = Date.now();
  ['scroll', 'pointermove', 'pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    addEventListener(ev, function () { lastAct = Date.now(); }, { passive: true });
  });
  setInterval(function () {
    if (document.visibilityState === 'visible' && Date.now() - lastAct < 30000) active++;
  }, 1000);

  // ---- the tour video: how long they listen with sound on ----
  var yt = document.getElementById('ytPlayer');
  var vid = { soundSecs: 0, maxPos: 0, lastT: null, state: -1, muted: true };
  if (yt) {
    var hello = function () { try { yt.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 'pulse', channel: 'widget' }), '*'); } catch (e) {} };
    yt.addEventListener('load', hello); setTimeout(hello, 1500);
    addEventListener('message', function (e) {
      if (!/youtube(-nocookie)?\.com$/.test((e.origin || '').replace(/^https?:\/\//, ''))) return;
      var d; try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (x) { return; }
      var info = d && d.info; if (!info) return;
      if (typeof info.muted === 'boolean') vid.muted = info.muted;
      if (typeof info.playerState === 'number') vid.state = info.playerState;
      if (typeof info.currentTime === 'number') {
        var t = info.currentTime;
        if (vid.lastT != null && vid.state === 1 && !vid.muted && t > vid.lastT && t - vid.lastT < 3) vid.soundSecs += t - vid.lastT;
        vid.lastT = t;
        if (!vid.muted && t > vid.maxPos) vid.maxPos = t;
      }
    });
  }

  // ---- wrap-up numbers, sent whenever the tab is hidden or closed ----
  function leave() {
    scrollPct();
    track('time', 'active', active);
    track('time', 'scroll', maxScroll);
    if (vid.soundSecs >= 1) { track('video', 'sound_secs', vid.soundSecs); track('video', 'sound_reach', vid.maxPos); }
    send(true);
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') leave(); });
  addEventListener('pagehide', leave);
})();
