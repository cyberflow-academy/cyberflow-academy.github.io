/* Cyberflow's Academy: easter eggs. If you're reading this, you're already doing recon. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var toast = document.getElementById('toast'), tT;
  var found = {};
  try { found = JSON.parse(localStorage.getItem('cf-eggs') || '{}'); } catch (e) { found = {}; }

  function say(msg, ms) {
    if (!toast) return;
    toast.textContent = msg; toast.classList.add('show');
    clearTimeout(tT); tT = setTimeout(function () { toast.classList.remove('show'); }, ms || 3800);
  }
  // shared with site.js (the lab terminal reports its eggs here too)
  window.cfEgg = function (id, msg) {
    var fresh = !found[id]; found[id] = 1;
    try { localStorage.setItem('cf-eggs', JSON.stringify(found)); } catch (e) {}
    var n = Object.keys(found).length;
    say('🥚 ' + msg + (fresh ? '  (' + n + ' found so far)' : ''));
  };

  /* egg: DevTools console */
  try {
    console.log('%c' + [
      '  ____ _   _ ____  _____ ____  _____ _     _____        __',
      ' / ___\\ \\ / | __ )| ____|  _ \\|  ___| |   / _ \\ \\      / /',
      '| |    \\ V /|  _ \\|  _| | |_) | |_  | |  | | | \\ \\ /\\ / / ',
      '| |___  | | | |_) | |___|  _ <|  _| | |__| |_| |\\ V  V /  ',
      ' \\____| |_| |____/|_____|_| \\_\\_|   |_____\\___/  \\_/\\_/   '
    ].join('\n'), 'color:#e0243a;font-weight:700;font-family:monospace');
    console.log('%cOh, you opened DevTools. You\'re already one of us. 🫡\n%cegg found: the console. Now go type "help" in the lab terminal, or try the old cheat code (↑↑↓↓←→←→BA).\nCode CYBER50 still gets you 50% off, by the way.',
      'color:#fff;font-size:15px;font-weight:700', 'color:#f0b90b;font-size:13px');
  } catch (e) {}

  /* egg: matrix rain (Konami code, or "matrix" in the lab terminal) */
  var raining = false;
  window.cfMatrix = function (label) {
    if (raining) return;
    raining = true;
    var msg = document.createElement('div'); msg.className = 'matrix-msg';
    msg.innerHTML = (label || 'cheat code accepted 😎') + '<br><span style="color:#f0b90b;font-size:.7em">CYBER50 still works though</span>';
    if (reduce) { document.body.appendChild(msg); setTimeout(function () { msg.remove(); raining = false; }, 2600); return; }
    var c = document.createElement('canvas'); c.className = 'matrix';
    document.body.appendChild(c); document.body.appendChild(msg);
    var x = c.getContext('2d'), w = c.width = innerWidth, h = c.height = innerHeight, fs = 16;
    var cols = Math.ceil(w / fs), drops = []; for (var i = 0; i < cols; i++) drops[i] = Math.random() * -40;
    var chars = 'アイウエオカキクケコサシスセソ0123456789CYBERFLOW$#<>/';
    requestAnimationFrame(function () { c.classList.add('on'); });
    var t0 = performance.now();
    (function frame(t) {
      x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(0, 0, w, h);
      x.font = fs + 'px JetBrains Mono, monospace';
      for (var i = 0; i < cols; i++) {
        x.fillStyle = Math.random() < .03 ? '#ffffff' : '#3ddc84';
        x.fillText(chars[Math.floor(Math.random() * chars.length)], i * fs, drops[i] * fs);
        if (drops[i] * fs > h && Math.random() > .975) drops[i] = 0;
        drops[i]++;
      }
      if (t - t0 < 5200) requestAnimationFrame(frame);
      else { c.classList.remove('on'); setTimeout(function () { c.remove(); msg.remove(); raining = false; }, 450); }
    })(t0);
  };

  /* egg: Konami code + typing "sudo" anywhere on the page */
  var K = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'], ki = 0, typed = '';
  document.addEventListener('keydown', function (e) {
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    ki = (k === K[ki]) ? ki + 1 : (k === K[0] ? 1 : 0);
    if (ki === K.length) { ki = 0; window.cfMatrix(); window.cfEgg('konami', 'egg found: the Konami code. old school, I respect it.'); }
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (e.key.length === 1) {
      typed = (typed + e.key.toLowerCase()).slice(-4);
      if (typed === 'sudo') { typed = ''; window.cfEgg('sudo', 'egg found: "you are not in the sudoers file." joining fixes that 😉'); }
    }
  });

  /* egg: click the logo 5 times */
  var brand = document.querySelector('.brand'), clicks = 0, cT;
  if (brand) brand.addEventListener('click', function () {
    clicks++; clearTimeout(cT); cT = setTimeout(function () { clicks = 0; }, 1500);
    if (clicks >= 5) {
      clicks = 0; brand.classList.remove('glitch'); void brand.offsetWidth; brand.classList.add('glitch');
      setTimeout(function () { brand.classList.remove('glitch'); }, 2000);
      window.cfEgg('logo', 'egg found: you broke the logo. jk, it\'s fine. probably.');
    }
  });
})();
