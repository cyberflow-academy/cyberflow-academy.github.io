/* Cyberflow's Academy v3: interactive bits. Everything degrades to plain content. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ---------- toast + copy code ---------- */
  var toast = $('#toast'), toastT;
  function say(msg) { toast.textContent = msg; toast.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove('show'); }, 2200); }
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-copy');
      var done = function () { say('Copied ' + v + '. The buttons apply it for you anyway 😉'); };
      if (navigator.clipboard) navigator.clipboard.writeText(v).then(done, function () { say('Code: ' + v); });
      else say('Code: ' + v);
    });
  });

  /* ---------- walkthrough video (self-hosted MP4): muted autoplay, one tap for sound from the start ---------- */
  var tv = $('#tourVideo'), sound = $('#sound');
  if (tv && reduce) { tv.autoplay = false; tv.pause(); }
  function withSound(scroll) {
    if (scroll) $('#tour').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    if (!tv) return;
    tv.currentTime = 0; tv.muted = false; tv.volume = 1; tv.loop = false; tv.controls = true;
    var pl = tv.play(); if (pl && pl.catch) pl.catch(function () {});
    if (sound) sound.hidden = true;
  }
  if (sound) sound.addEventListener('click', function () { withSound(false); });
  var playTour = $('#playTour'); if (playTour) playTour.addEventListener('click', function () { withSound(true); });

  /* ---------- the six steps (exactly as laid out in Whop) ---------- */
  var STEPS = [
    { t: 'Start here', why: 'Watch the welcome video, then join the Discord. Five minutes, and you know exactly where everything is.', items: [['Step 0: the welcome video', 'watch this first'], ['The Discord', 'say hi'], ['Daily Intel Drops', '5 videos · 28m']] },
    { t: 'Ethical hacking core', why: 'The main course. Recon, scanning, exploitation and post-exploitation, all on a lab you build yourself.', items: [['Full Ethical Hacking 3.0', '61 lessons · 4h 30m', 1], ['Advanced Ethical Hacking', '53 lessons · 2h 42m']] },
    { t: 'Core foundations', why: 'How systems actually work underneath, then writing your own tools: a port scanner in C++, automation scripts in Python.', items: [['Networking+', '93 lessons · 6h 41m'], ['Python For Hackers', '30 lessons · 2h 19m'], ['C++ For Hackers', '19 lessons · 54m']] },
    { t: 'Security mindset and OPSEC', flag: 'Do this early', why: 'How professionals protect themselves. Most courses skip this part completely.', items: [['Staying Safe 101', '12 lessons · 1h 15m'], ['Windows 10/11 hardening scripts', 'scripts'], ['Linux hardening scripts', 'scripts'], ['Firefox privacy setup', 'guide'], ['Linux privacy setup toolkit', 'toolkit']] },
    { t: 'Web hacking and bug bounty', why: 'Real targets and real bounty programs, plus the plan for getting your first payout.', items: [['The $1,000 Hacker Playbook', '20 lessons · 34m'], ['Website Hacking', '46 lessons · 1h 46m'], ['Bug Bounty', '45 lessons · 3h 44m'], ['Hacking Labs: Practice', '5 lessons · 30m'], ['Hacking PRACTICAL Labs', 'labs'], ['Complete Recon Automation Framework', 'download']] },
    { t: 'Specializations', flag: 'Optional', why: 'Once the core clicks, pick a direction and go deep. From bugs to binaries.', items: [['Reverse Engineering', '32 lessons · 2h 44m'], ['OSINT', '31 lessons · 1h 52m'], ['Android Hacking', '19 lessons · 1h 03m'], ['AI For Ethical Hacking', '16 lessons · 49m'], ['IoT Security', 'in progress']] }
  ];
  var stops = $$('.stop'), panel = $('#step-panel'), road = $('.road');
  function showStep(i, focus) {
    stops.forEach(function (s, k) {
      var on = k === i;
      s.setAttribute('aria-selected', on ? 'true' : 'false'); s.tabIndex = on ? 0 : -1;
      s.classList.toggle('done', k < i);
    });
    if (road) road.style.setProperty('--prog', (i / 5 * 84) + '%');
    var s = STEPS[i];
    panel.innerHTML =
      '<div class="sp-head"><h3>Step ' + (i + 1) + ': ' + esc(s.t) + '</h3>' + (s.flag ? '<span class="sp-flag">' + esc(s.flag) + '</span>' : '') + '</div>' +
      '<p class="sp-why">' + esc(s.why) + '</p>' +
      '<ul class="sp-list">' + s.items.map(function (it) {
        var chips = it[1].split(' · ').map(function (m) {
          var ico = /lessons|videos/.test(m) ? '📚 ' : /^\d+h|^\d+m/.test(m) ? '⏱️ ' : '';
          return '<span class="sp-chip' + (ico ? '' : ' sp-chip-plain') + '">' + ico + esc(m) + '</span>';
        }).join('');
        return '<li><div class="sp-name">' + esc(it[0]) + (it[2] ? '<span class="new">New</span>' : '') + '</div><div class="sp-meta">' + chips + '</div></li>';
      }).join('') + '</ul>' +
      '<div class="sp-nav"><button type="button" data-go="' + (i - 1) + '"' + (i === 0 ? ' disabled' : '') + '>← Step ' + i + '</button><button type="button" data-go="' + (i + 1) + '"' + (i === 5 ? ' disabled' : '') + '>Step ' + (i + 2) + ' →</button></div>';
    $$('[data-go]', panel).forEach(function (b) { b.addEventListener('click', function () { stopAuto(); showStep(+b.getAttribute('data-go'), true); }); });
    markSeen(i);
    if (focus) stops[i].focus({ preventScroll: true });
  }
  var touched = false, seen = {}, autoT = null;
  function markSeen(i) { seen[i] = 1; stops.forEach(function (s, k) { s.classList.toggle('hint', !touched && !seen[k] && k === i + 1); }); }
  function stopAuto() { touched = true; clearInterval(autoT); stops.forEach(function (s) { s.classList.remove('hint'); }); }
  stops.forEach(function (s, i) {
    s.addEventListener('click', function () { stopAuto(); showStep(i); });
    s.addEventListener('keydown', function (e) {
      var n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: 5 }[e.key];
      if (n !== undefined && n >= 0 && n <= 5) { e.preventDefault(); stopAuto(); showStep(n, true); }
    });
  });
  if (panel) {
    showStep(0);
    // flip through the steps on its own while the path is on screen, so scrollers see it changes
    if (!reduce && 'IntersectionObserver' in window) {
      var cur = 0;
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          clearInterval(autoT);
          if (e.isIntersecting && !touched) autoT = setInterval(function () { cur = (cur + 1) % 6; showStep(cur); }, 3200);
        });
      }, { threshold: .35 }).observe($('.road'));
    }
  }

  /* ---------- HackGrid lab: Permission Denied ---------- */
  var out = $('#termOut'), form = $('#termForm'), inp = $('#termIn'), body = $('#termBody');
  if (out && form) {
    var execBit = false, solved = false, hintN = 0;
    var NOTES = 'TODO before Friday:\n- run deploy.sh\n- fix the backup cron\n- ask admin about sudo rights';
    var SCRIPT = '#!/bin/bash\n# club site deployer\necho "[*] pulling latest build..."\necho "[*] running deploy checklist..."\necho "[+] deployment finished successfully"';
    var HINTS = ['Run ls -l and look at the first column next to deploy.sh.', 'Those letters are read, write and execute (rwx). See an x anywhere for deploy.sh? Nope.', 'chmod +x deploy.sh adds the execute bit. Then run ./deploy.sh again.'];
    var line = function (txt, cls) { var d = document.createElement('div'); d.className = cls || 'c'; d.textContent = txt; out.appendChild(d); body.scrollTop = body.scrollHeight; };
    var mode = function () { return execBit ? '-rwxr-xr-x' : '-rw-r--r--'; };
    function win() {
      line('[*] pulling latest build...'); line('[*] running deploy checklist...'); line('[+] deployment finished successfully', 'ok'); line('');
      line('deploy daemon: integrity token HG{execute_bit}', 'tok');
      if (!solved) { solved = true; $('#won').hidden = false; say('🎉 Lab solved. 86 to go.'); }
    }
    function run(cmd) {
      var c = cmd.trim(); line('student@deploy-01:~$ ' + c, 'p');
      if (!c) return;
      var a = c.split(/\s+/), w = a[0];
      if (c === 'clear') { out.innerHTML = ''; return; }
      if (w === 'help') { line('try: ls, ls -l, cat <file>, ./deploy.sh, chmod, whoami, pwd, clear', 'dim'); return; }
      if (w === 'ls' || w === 'll') {
        var all = /-\w*a/.test(c) || w === 'll';
        if (/-\w*l/.test(c) || w === 'll') {
          line('total ' + (all ? 16 : 8));
          if (all) { line('drwxr-xr-x 2 student student 4096 Nov  3 18:41 .'); line('drwxr-xr-x 3 root    root    4096 Oct 29 09:12 ..'); line('-rw------- 1 student student  131 Nov  3 18:39 .bash_history'); line('-rw-r--r-- 1 student student   97 Nov  3 18:38 .secret'); }
          line(mode() + ' 1 student student 160 Nov  3 18:40 deploy.sh'); line('-rw-r--r-- 1 student student  76 Nov  3 18:41 notes.txt');
        }
        else line(all ? '.  ..  .bash_history  .secret  deploy.sh  notes.txt' : 'deploy.sh  notes.txt');
        return;
      }
      if (w === 'cat') {
        var f = (a[1] || '').replace(/^\.\//, '').replace(/^~\//, '');
        if (f === 'notes.txt') line(NOTES);
        else if (f === 'deploy.sh') line(SCRIPT);
        else if (f === '.secret') { line('you found the hidden file. real hackers always run ls -a. 👀', 'tok'); line('screenshot this and flex on the Discord.', 'tok'); if (window.cfEgg) window.cfEgg('secret', 'egg found: the hidden file. ls -a gang.'); }
        else if (f === '.bash_history') { line('sudo apt install hacker-skills'); line('E: Unable to locate package hacker-skills', 'err'); line('google "how to become a hacker fast"'); line('watch 47 random tutorials'); line('# ok fine. joining the academy.', 'dim'); if (window.cfEgg) window.cfEgg('history', 'egg found: someone\'s embarrassing bash history.'); }
        else if (f === '/etc/passwd') { line('root:x:0:0:root:/root:/bin/bash'); line('student:x:1001:1001::/home/student:/bin/bash'); line('(look at you, already doing recon)', 'dim'); }
        else line('cat: ' + (a[1] || '') + ': No such file or directory', 'err');
        return;
      }
      if (w === 'hack' || c === 'hack the mainframe' || c === 'hack the planet') {
        line('[*] hacking the mainframe...'); line('[*] bypassing the firewall with a hoodie...'); line('[*] typing really fast...');
        line('[!] error: that is not how any of this works', 'err'); line('(that\'s literally why the course exists 😉)', 'dim');
        if (window.cfEgg) window.cfEgg('hack', 'egg found: you tried to "hack the mainframe". we\'ve all been there.');
        return;
      }
      if (w === 'matrix' || c === 'wake up neo') { line('wake up, neo...', 'ok'); if (window.cfMatrix) window.cfMatrix('follow the white rabbit 🐇'); if (window.cfEgg) window.cfEgg('matrix', 'egg found: the matrix. there is no spoon.'); return; }
      if (w === 'chmod') {
        var m = a[1] || '', f2 = (a[2] || '').replace(/^\.\//, '');
        if (f2 !== 'deploy.sh') { line("chmod: cannot access '" + (a[2] || '') + "': No such file or directory", 'err'); return; }
        if (/^(\+x|[ugoa]*\+[rw]*x[rw]*|[0-7]?[1357][0-7]{2})$/.test(m)) { execBit = true; if (m === '777') line('(works, but 777 lets everyone edit it. 755 is the grown-up version)', 'dim'); }
        else line('chmod: that mode does not add execute. try +x', 'dim');
        return;
      }
      if (c === './deploy.sh' || c === '~/deploy.sh' || c === '/home/student/deploy.sh') { if (execBit) win(); else line('-bash: ./deploy.sh: Permission denied', 'err'); return; }
      if (/^(bash|sh) (\.\/)?deploy\.sh$/.test(c)) { line('(that works too: you handed the file to bash yourself. the lab wanted chmod, but fine, hacker)', 'dim'); win(); return; }
      if (w === 'whoami') { line('student'); return; }
      if (w === 'pwd') { line('/home/student'); return; }
      if (w === 'id') { line('uid=1001(student) gid=1001(student) groups=1001(student)'); return; }
      if (w === 'hostname') { line('deploy-01'); return; }
      if (w === 'sudo') { line('student is not in the sudoers file. This incident will be reported.', 'err'); return; }
      if (/^rm\b/.test(c)) { line("nope. we don't do that here 🙃", 'dim'); return; }
      if (w === 'exit') { line("you can't leave yet, the deploy isn't done", 'dim'); return; }
      if (w === 'echo') { line(a.slice(1).join(' ')); return; }
      line('-bash: ' + w + ': command not found', 'err');
    }
    ['Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-91-generic x86_64)', '', 'Last login: Mon Nov  3 18:42:11 2026 from 192.168.1.20', 'Type a command, or tap one below. "help" lists what works.', ''].forEach(function (t, i) { line(t, i === 3 ? 'dim' : 'c'); });
    var termEl = $('#term'); termEl.classList.add('idle');
    var wake = function () { termEl.classList.remove('idle'); };
    form.addEventListener('submit', function (e) { e.preventDefault(); wake(); run(inp.value); inp.value = ''; });
    inp.addEventListener('focus', wake);
    $('#term').addEventListener('click', function (e) { if (!e.target.closest('button')) inp.focus({ preventScroll: true }); });
    $$('#chips button').forEach(function (b) { b.addEventListener('click', function () { wake(); run(b.getAttribute('data-cmd')); }); });
    $('#hintBtn').addEventListener('click', function () {
      if (hintN >= HINTS.length) return;
      var li = document.createElement('li'); li.textContent = HINTS[hintN++]; $('#hintList').appendChild(li);
      if (hintN === HINTS.length) { $('#hintBtn').hidden = true; var chip = document.createElement('button'); chip.type = 'button'; chip.textContent = 'chmod +x deploy.sh'; chip.addEventListener('click', function () { run('chmod +x deploy.sh'); }); $('#chips').appendChild(chip); }
    });
  }

  /* ---------- BountyFlow snapshot ---------- */
  var progs = $('#progs'), DATA = null;
  var money = function (n) { return n >= 1000000 ? '$' + (n / 1e6).toFixed(n % 1e6 ? 1 : 0) + 'M' : n >= 1000 ? '$' + Math.round(n / 1000) + 'k' : '$' + n; };
  var plat = { hackerone: 'HackerOne', bugcrowd: 'Bugcrowd', intigriti: 'Intigriti', yeswehack: 'YesWeHack' };
  function renderList(key) {
    var list = (DATA && DATA[key]) || [];
    if (!list.length) { progs.innerHTML = '<li class="progs-empty">Nothing here right now.</li>'; return; }
    progs.innerHTML = list.slice(0, 6).map(function (p, i) {
      return '<li class="prog"><button type="button" aria-expanded="false" aria-controls="pm' + i + '">' +
        '<span class="prog-name">' + esc(p.n) + '</span>' +
        '<span class="prog-pay">' + (p.max ? 'up to ' + money(p.max) : 'VDP') + '</span>' +
        '<span class="prog-meta">' + esc(plat[p.pl] || p.pl) + ' · ' + p.assets + ' targets<span class="lvl lvl-' + esc(p.lvl) + '">' + esc(p.lvl) + '</span></span></button>' +
        '<div class="prog-more" id="pm' + i + '" hidden>' +
        (p.hunt && p.hunt.length ? '<span><b>Hunt for:</b> ' + esc(p.hunt.join(', ')) + '</span>' : '') +
        (p.why && p.why[0] ? '<span><b>Why:</b> ' + esc(p.why[0]) + '</span>' : '') + '</div></li>';
    }).join('');
    $$('.prog > button', progs).forEach(function (b) {
      b.addEventListener('click', function () { var m = b.nextElementSibling, open = m.hidden; m.hidden = !open; b.setAttribute('aria-expanded', open ? 'true' : 'false'); });
    });
  }
  var fbtns = $$('.filters button');
  fbtns.forEach(function (b) {
    b.addEventListener('click', function () {
      fbtns.forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); x.tabIndex = x === b ? 0 : -1; });
      renderList(b.getAttribute('data-list'));
    });
  });
  if (progs) {
    fetch('data/bounty-snapshot.json').then(function (r) { return r.json(); }).then(function (d) {
      DATA = d; renderList('beginner');
      $('#radarFoot').textContent = 'Snapshot from ' + d.total + ' programs, ' + d.paying + ' paying cash. Inside, it updates on its own.';
    }).catch(function () { progs.innerHTML = '<li class="progs-empty">Couldn\'t load the snapshot. Inside, it\'s live.</li>'; });
  }

  /* ---------- SecLab mini decoder ---------- */
  var decIn = $('#decIn'), layers = $('#layers');
  function b64(s) { try { var t = s.replace(/-/g, '+').replace(/_/g, '/'); while (t.length % 4) t += '='; var r = atob(t); return decodeURIComponent(Array.prototype.map.call(r, function (c) { return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2); }).join('')); } catch (e) { try { return atob(s); } catch (e2) { return null; } } }
  var printable = function (s) { return s && /^[\x09\x0a\x0d\x20-\x7e -￿]+$/.test(s) && !/�/.test(s); };
  function peel(s) {
    var steps = [], cur = s.trim(), guard = 0;
    while (cur && guard++ < 6) {
      var jwt = cur.match(/^([\w-]+)\.([\w-]+)\.([\w-]*)$/);
      if (jwt) {
        var h = b64(jwt[1]), p = b64(jwt[2]);
        if (h && p && h.charAt(0) === '{') {
          steps.push(['JWT header', h]); steps.push(['JWT payload', p]);
          if (/"alg"\s*:\s*"none"/i.test(h)) steps.push(['🚩 Red flag', 'alg is "none", so this token has no signature. If a server accepts it, anyone can make themselves admin.', 1]);
          return steps;
        }
      }
      if (/%[0-9a-f]{2}/i.test(cur)) { try { var u = decodeURIComponent(cur); if (u !== cur) { steps.push(['URL decoded', u]); cur = u; continue; } } catch (e) {} }
      if (/^(?:[0-9a-f]{2})+$/i.test(cur) && cur.length >= 8) { var hx = cur.replace(/../g, function (x) { return String.fromCharCode(parseInt(x, 16)); }); if (printable(hx)) { steps.push(['Hex decoded', hx]); cur = hx; continue; } }
      if (/^[A-Za-z0-9+/_-]+={0,2}$/.test(cur) && cur.length >= 8 && cur.length % 4 !== 1) { var d = b64(cur); if (printable(d) && d !== cur) { steps.push(['Base64 decoded', d]); cur = d; continue; } }
      if (/&(#\d+|#x[0-9a-f]+|[a-z]+);/i.test(cur)) { var ta = document.createElement('textarea'); ta.innerHTML = cur; if (ta.value !== cur) { steps.push(['HTML entities decoded', ta.value]); cur = ta.value; continue; } }
      break;
    }
    if (/<script|onerror\s*=|javascript:/i.test(cur)) steps.push(['🚩 What it is', 'Cross-site scripting (XSS). If a page prints this unescaped, it runs in the victim\'s browser. This one tries to steal cookies.', 1]);
    else if (/\/etc\/passwd|\/etc\/shadow/.test(cur)) steps.push(['🚩 What it is', 'Someone trying to read the user list on a Linux server. Classic path traversal or command injection test.', 1]);
    else if (/union\s+select|'\s*or\s*'?1'?\s*=\s*'?1/i.test(cur)) steps.push(['🚩 What it is', 'SQL injection. It tries to bend the database query.', 1]);
    if (!steps.length) steps.push(['Nothing to peel', 'That looks like plain text already. Try one of the samples above.']);
    return steps;
  }
  function decode() {
    var v = decIn.value;
    if (!v.trim()) { layers.innerHTML = ''; return; }
    layers.innerHTML = peel(v).map(function (s, i) { return '<li' + (s[2] ? ' class="warn"' : '') + '><div class="lt">' + (s[2] ? '' : 'Layer ' + (i + 1) + ' · ') + esc(s[0]) + '</div><div class="lv">' + esc(s[1]) + '</div></li>'; }).join('');
  }
  if (decIn) {
    decIn.addEventListener('input', decode);
    $$('.samples button').forEach(function (b) { b.addEventListener('click', function () { decIn.value = b.getAttribute('data-sample'); decode(); }); });
    decIn.value = $('.samples button').getAttribute('data-sample'); decode();
  }

  /* ---------- final terminal types itself once ---------- */
  var ft = $('#finalTerm');
  function greenLast() { var L = ft.textContent.split('\n'); var last = L.pop(); ft.innerHTML = esc(L.join('\n')) + '\n<span class="ok">' + esc(last) + '</span>'; }
  if (ft && (reduce || !('IntersectionObserver' in window))) greenLast();
  if (ft && !reduce && 'IntersectionObserver' in window) {
    var full = ft.textContent; ft.textContent = '';
    var io2 = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; io2.disconnect();
      var i = 0; (function tick() { ft.textContent = full.slice(0, ++i) + (i < full.length ? '▌' : ''); if (i < full.length) setTimeout(tick, full[i - 1] === '\n' ? 420 : 32); else greenLast(); })();
    }, { threshold: .5 });
    io2.observe(ft);
  }

  /* ---------- header + dock ---------- */
  var top = $('#top'), dock = $('#dock'), hero = $('.hero'), pricing = $('#pricing'), fin = $('#final'), ticking = false;
  function update() {
    top.classList.toggle('scrolled', window.scrollY > 60);
    if (dock) {
      var vh = window.innerHeight, p = pricing.getBoundingClientRect();
      var show = hero.getBoundingClientRect().bottom < 60 && !((p.top < vh && p.bottom > 0) || fin.getBoundingClientRect().top < vh);
      dock.classList.toggle('show', show); dock.querySelector('a').tabIndex = show ? 0 : -1;
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update); update();

  /* ---------- reveal ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -6% 0px', threshold: .05 });
    $$('.center-head, .split-head, .thumb, .road, .demo, .story, .rev, .plan, .letter, .qa details').forEach(function (el, i) {
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      el.classList.add('rv'); el.style.transitionDelay = ((i % 3) * 70) + 'ms'; io.observe(el);
    });
  }
})();
