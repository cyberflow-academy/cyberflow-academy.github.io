/* /courses (picture grid + lesson search) and /courses/<course>/ (chapters) */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var track = function (name) { if (window.pulse) window.pulse('click', name); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ---------- header border on scroll ---------- */
  var top = $('#top');
  var onScroll = function () { top.classList.toggle('scrolled', window.scrollY > 40); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- course page: chapters ---------- */
  var all = $('.chap-all');
  if (all) {
    var ds = $$('.chapters details');
    var label = function () { all.textContent = ds.every(function (d) { return d.open; }) ? 'Close every chapter' : 'Open every chapter'; };
    all.addEventListener('click', function () {
      var open = !ds.every(function (d) { return d.open; });
      ds.forEach(function (d) { d.open = open; }); label();
    });
    ds.forEach(function (d) { d.addEventListener('toggle', label); });
    var openHash = function () {
      var m = /^#ch-(\d+)$/.exec(location.hash); if (!m) return;
      var li = document.getElementById('ch-' + m[1]); if (!li) return;
      $('details', li).open = true;
      li.classList.add('flash'); setTimeout(function () { li.classList.remove('flash'); }, 1600);
      li.scrollIntoView({ block: 'start' });
    };
    addEventListener('hashchange', openHash); openHash();
  }

  /* ---------- grid page: old #c-slug links go to the course page ---------- */
  var m0 = /^#c-([a-z0-9-]+)$/.exec(location.hash);
  if (m0 && $('.cc-grid')) { location.replace(m0[1] + '/'); return; }

  /* ---------- grid page: search every lesson ---------- */
  var input = $('#cSearch'), dataEl = $('#cData');
  if (!input || !dataEl) return;
  var D = JSON.parse(dataEl.textContent);
  var rows = D.l.map(function (r) {
    var name = D.n[r[0]], chap = D.c[r[0]][r[1] - 1];
    return { slug: r[0], ch: r[1], t: r[2], k: r[3], name: name, chap: chap, hay: (r[2] + ' ' + chap + ' ' + name).toLowerCase() };
  });
  var count = $('#cCount'), empty = $('#cEmpty'), list = $('#cResults'), grid = $('#cGrid');
  var logT, logged = {}, timer;
  var KIND = function (k) { return k === 'pdf' ? '📄 PDF' : k === 'quiz' ? '✅ Quiz' : '▶ ' + k; };

  function run() {
    var q = input.value.trim().toLowerCase();
    if (q.length < 2) { list.hidden = true; empty.hidden = true; grid.hidden = false; count.textContent = ''; return; }
    var words = q.split(/\s+/);
    var hits = rows.filter(function (r) { return words.every(function (w) { return r.hay.indexOf(w) >= 0; }); });
    var re = new RegExp('(' + words.map(function (w) { return w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')', 'ig');
    var shown = hits.slice(0, 60);
    list.innerHTML = shown.map(function (r) {
      return '<li><a href="' + r.slug + '/#ch-' + r.ch + '"><span class="r-t">' + esc(r.t).replace(re, '<mark>$1</mark>') + '</span><span class="r-k">' + esc(KIND(r.k)) + '</span><span class="r-w">' + esc(r.name) + ' · Chapter ' + r.ch + ': ' + esc(r.chap) + '</span></a></li>';
    }).join('') + (hits.length > shown.length ? '<li class="r-more">+' + (hits.length - shown.length) + ' more, type a bit more to narrow it down</li>' : '');
    list.hidden = !hits.length; empty.hidden = !!hits.length; grid.hidden = true;
    count.textContent = hits.length ? hits.length + (hits.length === 1 ? ' lesson' : ' lessons') : '';
    clearTimeout(logT);
    if (q.length >= 3) logT = setTimeout(function () { if (!logged[q]) { logged[q] = 1; track('search:' + q.slice(0, 24)); } }, 1500);
  }
  input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 80); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { input.value = ''; run(); }
    if (e.key === 'Enter') { var a = $('a', list); if (a && !list.hidden) a.click(); }
  });
})();
