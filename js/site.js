/* TidyAway home page. No libraries, no network calls.
   Motion is transform/opacity only and is switched off under prefers-reduced-motion,
   where every demo jumps straight to its end state. */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var M = window.TIDY_MOMENTS || { base: '', widths: [800], items: [] };
  var src = function (m, w) { return M.base + m.file + '-' + (w || M.widths[0]) + '.jpg'; };
  var srcset = function (m) { return M.widths.map(function (w) { return src(m, w) + ' ' + w + 'w'; }).join(', '); };
  var bg = function (el, m) { el.style.backgroundImage = 'url("' + src(m) + '")'; };
  var CHECK = '<svg class="ico" aria-hidden="true"><use href="#i-check"/></svg>';
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var flights = [];

  /* Animated number. fmt turns the current value into text. */
  function countTo(el, from, to, ms, fmt) {
    if (!el) return;
    if (RM || !ms) { el.textContent = fmt(to); return; }
    var t0 = performance.now();
    (function tick(now) {
      var p = clamp((now - t0) / ms, 0, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* A thumbnail that flies from one element to another. */
  function fly(fromEl, toEl, m, done) {
    if (RM || !fromEl || !toEl || !fromEl.animate) { if (done) done(); return; }
    var a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
    var f = document.createElement('div');
    f.className = 'flyer';
    f.style.width = a.width + 'px'; f.style.height = a.height + 'px';
    bg(f, m);
    document.body.appendChild(f);
    var s = Math.max(b.width / a.width, .3);
    var x0 = a.left, y0 = a.top, x1 = b.left + (b.width - a.width) / 2, y1 = b.top + (b.height - a.height) / 2;
    var lift = Math.min(90, Math.abs(x1 - x0) * .25 + 30);
    var an = f.animate([
      { transform: 'translate3d(' + x0 + 'px,' + y0 + 'px,0) scale(1)', opacity: 1 },
      { transform: 'translate3d(' + (x0 + x1) / 2 + 'px,' + (Math.min(y0, y1) - lift) + 'px,0) scale(1.25)', opacity: 1, offset: .45 },
      { transform: 'translate3d(' + x1 + 'px,' + y1 + 'px,0) scale(' + s + ')', opacity: .9 }
    ], { duration: 850, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    flights.push(an);
    an.onfinish = an.oncancel = function () { f.remove(); flights.splice(flights.indexOf(an), 1); if (done) done(); };
  }

  /* ---------- official App Store badge, once the files are self-hosted ---------- */
  (function badge() {
    if (document.documentElement.getAttribute('data-badge') !== 'official') return;
    $$('.store').forEach(function (a) {
      a.className = 'store store--badge';
      a.innerHTML = '<img class="store__black" src="assets/badges/app-store-black.svg" alt="Download on the App Store" height="52">' +
        '<img class="store__white" src="assets/badges/app-store-white.svg" alt="" aria-hidden="true" height="52">';
    });
  })();

  /* ---------- mobile menu ---------- */
  (function menu() {
    var nav = $('#nav'), t = $('#navToggle'), links = $('#navLinks'); if (!t) return;
    function set(open) { nav.classList.toggle('is-open', open); t.setAttribute('aria-expanded', open); }
    t.addEventListener('click', function () { set(!nav.classList.contains('is-open')); });
    links.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('is-open')) { set(false); t.focus(); } });
    document.addEventListener('pointerdown', function (e) { if (nav.classList.contains('is-open') && !nav.contains(e.target)) set(false); });
  })();

  /* ---------- staggered reveals ---------- */
  (function reveals() {
    var groups = ['.hero__copy > *', '.hero__side > *', '.stage__grid > .panel', '.stage__cap', '.three li',
      '.sec__head > *', '.sec__head--split > div > *', '.viewer', '.thumbs', '.aside', '.split__copy > *', '.split__demo > *',
      '.proof', '.duo > *', '.rules li', '.askbox', '.quad li', '.band__note', '.soon li', '.poster'];
    var els = [];
    groups.forEach(function (g) {
      $$(g).forEach(function (el) {
        if (el.hasAttribute('data-reveal') || el.classList.contains('sr')) return;
        var i = Array.prototype.indexOf.call(el.parentNode.children, el);
        el.setAttribute('data-reveal', '');
        el.style.setProperty('--i', Math.min(i, 6));
        els.push(el);
      });
    });
    if (RM || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in'); io.unobserve(e.target);
        $$('[data-count]', e.target).forEach(function (n) {
          countTo(n, 0, +n.getAttribute('data-count'), 1100, function (v) { return Math.round(v); });
        });
      });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (e) { io.observe(e); });
  })();

  /* ---------- scroll indicator (CSS scroll timeline where supported) ---------- */
  (function meter() {
    var bar = $('#meter'); if (!bar) return;
    if (window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()')) return;
    var ticking = false;
    function update() {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? clamp(window.scrollY / max, 0, 1) : 0).toFixed(4) + ')';
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();

  /* ---------- cursor parallax, desktop only ---------- */
  function parallax(area) {
    if (!FINE || RM || !area) return;
    var raf = 0, mx = 0, my = 0;
    area.addEventListener('pointermove', function (e) {
      var r = area.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - .5) * 2; my = ((e.clientY - r.top) / r.height - .5) * 2;
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; area.style.setProperty('--mx', mx.toFixed(3)); area.style.setProperty('--my', my.toFixed(3)); });
    });
    area.addEventListener('pointerleave', function () { area.style.setProperty('--mx', 0); area.style.setProperty('--my', 0); });
  }
  parallax($('.stage__grid')); parallax($('#viewer')); parallax($('#poster'));

  /* final poster photograph (path comes from moments.js, like every other photo) */
  (function poster() {
    var holder = $('#posterImg'), m = M.items[4]; if (!holder || !m) return;
    var img = new Image(); img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
    img.sizes = '(min-width: 1312px) 1272px, 100vw'; img.srcset = srcset(m); img.src = src(m, 1600);
    holder.appendChild(img);
  })();

  /* ---------- hero: the iPhone and the iPad run the same copy ----------
     One timeline, one control: Pause while it runs, Play while paused, Play it again at the end. */
  (function hero() {
    var stage = $('#stage'); if (!stage) return;
    var vids = [M.items[0], M.items[1], M.items[2], M.items[4]].filter(Boolean);
    var rows = [];                                                // rows[i] = [phone row, pad card]
    $$('[data-h="files"]', stage).forEach(function (ul) {
      var pad = ul.getAttribute('data-kind') === 'pad';
      vids.forEach(function (m, i) {
        var li = document.createElement('li');
        li.className = pad ? 'pcard' : 'file';
        li.innerHTML = pad
          ? '<div class="pcard__img"></div><div class="pcard__t"><span>' + m.name + '<small>' + m.size + ', video</small></span><span class="ring">' + CHECK + '</span></div>'
          : '<span class="thumb"></span><span>' + m.name + '<small>' + m.size + ', video</small></span><span class="ring">' + CHECK + '</span>';
        bg($(pad ? '.pcard__img' : '.thumb', li), m);
        ul.appendChild(li);
        (rows[i] = rows[i] || []).push(li);
      });
    });
    var bars = $$('[data-h="bar"]', stage), frees = $$('[data-h="free"]', stage), btns = $$('[data-h="btn"]', stage);
    var logCopy = $('[data-h="log-copy"]', stage), logCheck = $('[data-h="log-check"]', stage), logOk = $('[data-h="log-ok"]', stage);
    var dialog = $('#heroDialog'), slip = $('#heroSlip'), slots = $$('#heroDest .dest__slots i'), destN = $('#heroDestN');
    var steps = $$('#heroSteps li'), line = $('#heroLine'), ctl = $('#heroReplay');
    var each = function (list, fn) { list.forEach(fn); };
    var rowCls = function (i, add, rem) { each(rows[i], function (r) { if (rem) r.classList.remove(rem); if (add) r.classList.add(add); }); };
    var btn = function (text, cls) {
      each(btns, function (b) {
        b.className = 'app__btn' + (cls ? ' ' + cls : '');
        b.textContent = b.closest('.shot--pad') ? text.replace('iPhone', 'iPad') : text;
      });
    };
    var step = function (n, text) {
      steps.forEach(function (s, i) { s.classList.toggle('is-done', i < n); s.classList.toggle('is-on', i === n); });
      if (text) line.textContent = text;
    };
    var gb = function (v) { return v.toFixed(1) + ' GB'; };

    /* timeline with pause */
    var tl = [], idx = 0, base = 0, t0 = 0, timer = 0, state = 'idle';
    function show() {
      var icon = state === 'running' ? 'pause' : state === 'paused' ? 'play' : 'replay';
      var label = state === 'running' ? 'Pause' : state === 'paused' ? 'Play' : 'Play it again';
      $('use', ctl).setAttribute('href', '#i-' + icon); $('span', ctl).textContent = label;
      stage.classList.toggle('is-paused', state === 'paused');
    }
    function next() {
      clearTimeout(timer);
      if (idx >= tl.length) { state = 'done'; show(); return; }
      timer = setTimeout(function () {
        var e = tl[idx++]; base = e[0]; t0 = performance.now(); e[1]();
        if (state === 'running') next();
      }, Math.max(0, tl[idx][0] - (base + performance.now() - t0)));
    }
    function pause() { if (state !== 'running') return; clearTimeout(timer); base += performance.now() - t0; state = 'paused'; flights.forEach(function (a) { a.pause(); }); show(); }
    function resume() { if (state !== 'paused') return; t0 = performance.now(); state = 'running'; flights.forEach(function (a) { a.play(); }); show(); next(); }

    function reset() {
      clearTimeout(timer); flights.slice().forEach(function (a) { a.cancel(); });
      rows.forEach(function (_, i) { each(rows[i], function (r) { r.classList.remove('is-in', 'is-copying', 'is-ok'); }); });
      each(bars, function (b) { b.classList.remove('is-free'); b.style.setProperty('--v', .997); });
      each(frees, function (f) { f.textContent = '0.2 GB free'; f.classList.add('is-low'); });
      slots.forEach(function (s) { s.style.backgroundImage = ''; s.classList.remove('is-in'); });
      destN.textContent = '0'; logCopy.textContent = '0 of 4'; logCheck.textContent = '0 of 4'; logOk.textContent = 'Waiting';
      slip.classList.remove('is-on'); dialog.classList.remove('is-on');
      btn('Copy to my drive'); step(-1, 'Four videos, copied to a drive, checked, then removed with your say-so.');
    }
    function finish(animated) {
      rows.forEach(function (_, i) { rowCls(i, 'is-in'); rowCls(i, 'is-ok', 'is-copying'); });
      slots.forEach(function (s, i) { bg(s, vids[i]); });
      destN.textContent = '4'; logCopy.textContent = '4 of 4'; logCheck.textContent = '4 of 4'; logOk.textContent = 'Given';
      slip.classList.add('is-on');
      each(bars, function (b) { b.classList.add('is-free'); b.style.setProperty('--v', .925); });
      each(frees, function (f) { f.classList.remove('is-low'); countTo(f, .2, 4.8, animated ? 1500 : 0, function (v) { return gb(v) + ' free'; }); });
      each(btns, function (b) { b.className = 'app__btn is-done'; countTo(b, 0, 4.6, animated ? 1500 : 0, function (v) { return gb(v) + ' back'; }); });
      step(4, '4.6 GB comes back once Recently Deleted is emptied.');
    }
    function run() {
      reset();
      if (RM) { finish(false); state = 'done'; show(); return; }
      tl = [];
      var at = function (ms, fn) { tl.push([ms, fn]); };
      rows.forEach(function (_, i) { at(120 + i * 120, function () { rowCls(i, 'is-in'); }); });
      at(1300, function () { each(btns, function (b) { b.classList.add('is-press'); }); });
      at(1500, function () { btn('Copying…', 'is-busy'); step(0, 'Copying four videos to your drive.'); });
      rows.forEach(function (_, i) {
        at(1600 + i * 480, function () {
          rowCls(i, 'is-copying');
          fly($('.thumb', rows[i][0]), slots[i], vids[i], function () {
            if (state === 'idle') return;
            bg(slots[i], vids[i]); slots[i].classList.add('is-in'); destN.textContent = i + 1; logCopy.textContent = (i + 1) + ' of 4';
          });
        });
      });
      at(4200, function () { btn('Reading copies back…', 'is-busy'); step(1, 'Reading each copy back and comparing fingerprints.'); slip.classList.add('is-on'); });
      rows.forEach(function (_, i) { at(4500 + i * 320, function () { rowCls(i, 'is-ok', 'is-copying'); logCheck.textContent = (i + 1) + ' of 4'; }); });
      at(6100, function () { btn('Remove 4 from iPhone…'); step(2, 'You approve. Then Apple asks you too.'); });
      at(6900, function () { each(btns, function (b) { b.classList.add('is-press'); }); });
      at(7150, function () { each(btns, function (b) { b.classList.remove('is-press'); }); logOk.textContent = 'Given'; dialog.classList.add('is-on'); });
      at(8500, function () { $('.ios__go', dialog).classList.add('is-press'); });
      at(8800, function () { $('.ios__go', dialog).classList.remove('is-press'); dialog.classList.remove('is-on'); });
      at(9100, function () { finish(true); });
      tl.sort(function (a, b) { return a[0] - b[0]; });
      idx = 0; base = 0; t0 = performance.now(); state = 'running'; show(); next();
    }
    ctl.addEventListener('click', function () { if (state === 'running') pause(); else if (state === 'paused') resume(); else run(); });
    reset(); state = 'idle'; show();
    if (RM || !('IntersectionObserver' in window)) { run(); return; }
    var target = $('.panel--phone');
    var need = clamp(window.innerHeight * .9 / Math.max(1, target.offsetHeight), .2, .7);   // 70% in view, or as much as fits
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); run(); } }, { threshold: need });
    io.observe(target);
  })();

  /* ---------- moments viewer ---------- */
  (function viewer() {
    var v = $('#viewer'), slidesEl = $('#viewSlides'), thumbsEl = $('#viewThumbs'); if (!v || !M.items.length) return;
    var note = $('#viewNote'), cap = $('.viewer__cap', v), k = $('#viewK'), lineEl = $('#viewLine'), nEl = $('#viewN');
    var n = M.items.length, cur = -1;
    var imgs = [];
    var slides = M.items.map(function (m, i) {
      var d = document.createElement('div'); d.className = 'viewer__slide' + (m.deep ? ' is-deep' : '');
      var pan = document.createElement('div'); pan.className = 'viewer__pan';
      var img = new Image();
      img.alt = m.alt; img.decoding = 'async'; img.draggable = false;
      img.sizes = '(min-width: 1312px) 1272px, 100vw';
      img.style.setProperty('--pos', m.pos); img.style.setProperty('--pos-tall', m.posTall);
      pan.appendChild(img); d.appendChild(pan); slidesEl.appendChild(d); imgs.push(img);
      return d;
    });
    function load(i) {                                           // only the current slide and its neighbors
      var img = imgs[(i + n) % n], m = M.items[(i + n) % n];
      if (img.getAttribute('src')) return;
      img.srcset = srcset(m); img.src = src(m, 1600);
    }
    var thumbs = M.items.map(function (m, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'tthumb';
      b.setAttribute('aria-label', 'Show moment ' + (i + 1) + ': ' + m.name);
      var s = document.createElement('span'); bg(s, m); b.appendChild(s); b.appendChild(document.createTextNode(m.name));
      b.addEventListener('click', function () { go(i); });
      thumbsEl.appendChild(b);
      return b;
    });
    function go(i) {
      i = (i + n) % n; if (i === cur) return; cur = i;
      load(i); load(i + 1); load(i - 1);
      slides.forEach(function (s, j) { s.classList.toggle('is-on', j === i); s.setAttribute('aria-hidden', j !== i); });
      thumbs.forEach(function (t, j) { t.setAttribute('aria-pressed', j === i); });
      var m = M.items[i];
      k.textContent = '0' + (i + 1) + ' / 0' + n + '  ' + m.name; lineEl.textContent = m.line; nEl.textContent = (i + 1) + ' / ' + n;
      if (!RM) {
        note.classList.remove('is-on'); cap.classList.remove('swap');
        void note.offsetWidth;
        note.classList.add('is-on'); cap.classList.add('swap');
      } else note.classList.add('is-on');
    }
    $('#viewPrev').addEventListener('click', function () { go(cur - 1); });
    $('#viewNext').addEventListener('click', function () { go(cur + 1); });
    v.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { go(cur + 1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { go(cur - 1); e.preventDefault(); }
    });
    /* swipe with a finger, drag with a mouse */
    var sx = null;
    v.addEventListener('pointerdown', function (e) { sx = e.clientX; if (e.pointerType === 'mouse') { try { v.setPointerCapture(e.pointerId); } catch (_) {} v.classList.add('is-drag'); } });
    function end(e) { if (sx !== null && Math.abs(e.clientX - sx) > 44) go(cur + (e.clientX < sx ? 1 : -1)); sx = null; v.classList.remove('is-drag'); }
    v.addEventListener('pointerup', end);
    v.addEventListener('pointercancel', function () { sx = null; v.classList.remove('is-drag'); });
    v.addEventListener('dragstart', function (e) { e.preventDefault(); });
    go(0);
  })();

  /* ---------- deleted 44, still full ---------- */
  (function stillFull() {
    var roll = $('#roll'); if (!roll) return;
    var status = $('#fullStatus'), bin = $('#bin'), binN = $('#binN'), all = $('#fullAll'), resetB = $('#fullReset'), bar = $('#fullDemo .bar');
    var N = 44, del = 0, tiles = [], timers = [];
    var ORDER = [0, 2, 4, 1, 5, 3, 2, 0, 3, 5, 1, 4, 5, 1, 0, 4, 2, 3, 1, 3, 5, 0, 4, 2, 4, 0, 2, 5, 3, 1, 3, 4, 1, 2, 0, 5, 2, 5, 3, 0, 1, 4, 0, 3];
    var ZOOM = [150, 260, 190, 340, 220, 420, 170, 300];
    for (var i = 0; i < N; i++) {
      var b = document.createElement('button'); b.type = 'button'; b.tabIndex = -1;
      var m = M.items[ORDER[i] % Math.max(1, M.items.length)];
      if (m) { bg(b, m); b.style.backgroundSize = ZOOM[(i * 3 + ORDER[i]) % ZOOM.length] + '%'; b.style.backgroundPosition = ((i * 41 + 13) % 101) + '% ' + ((i * 67 + 29) % 101) + '%'; }
      b.addEventListener('click', (function (el) { return function () { remove(el); }; })(b));
      roll.appendChild(b); tiles.push(b);
    }
    function say() {
      var active = document.activeElement;
      binN.textContent = del; bin.hidden = del === 0;
      if (del === 0) status.textContent = 'Deleted 0 of 44. Storage: full.';
      else if (del < N) status.innerHTML = 'Deleted ' + del + ' of 44. <b>The bar has not moved.</b>';
      else status.innerHTML = '<b>Deleted 44. Still full.</b> Nothing comes back until Recently Deleted is emptied, and none of it was copied first.';
      all.hidden = del === N; resetB.hidden = del === 0;
      /* keep keyboard focus if the focused button has just been hidden */
      if (active === all && all.hidden) resetB.focus();
      if (active === resetB && resetB.hidden) all.focus();
      if (!RM && del) { bar.classList.remove('nudge'); void bar.offsetWidth; bar.classList.add('nudge'); }
    }
    function remove(el) { if (el.classList.contains('is-gone')) return; el.classList.add('is-gone'); del++; say(); }
    function stop() { timers.forEach(clearTimeout); timers = []; all.disabled = false; }
    all.addEventListener('click', function () {
      stop();
      var left = tiles.filter(function (t) { return !t.classList.contains('is-gone'); });
      if (RM) { left.forEach(function (t) { t.classList.add('is-gone'); }); del = N; say(); return; }
      all.disabled = true;
      left.forEach(function (t, i) { timers.push(setTimeout(function () { remove(t); if (i === left.length - 1) stop(); }, i * 34)); });
    });
    resetB.addEventListener('click', function () { stop(); tiles.forEach(function (t) { t.classList.remove('is-gone'); }); del = 0; say(); });
  })();

  /* ---------- the proof ---------- */
  (function proof() {
    var box = $('#proofDemo'); if (!box) return;
    var run = $('#proofRun'), ok = $('#proofOk'), pipe = $('#pipe'), pct = $('#pipePct'), A = $('#printA'), B = $('#printB'), status = $('#proofStatus');
    var checks = $$('#checks li'), nodes = $$('.node__ic', box), timers = [], m = M.items[0];
    var at = function (ms, fn) { timers.push(setTimeout(fn, RM ? 0 : ms)); };
    function hash() {
      var a = new Uint8Array(32), out = [];
      if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a); else for (var i = 0; i < 32; i++) a[i] = Math.random() * 256;
      for (var j = 0; j < 8; j++) { var s = ''; for (var q = 0; q < 4; q++) s += ('0' + a[j * 4 + q].toString(16)).slice(-2); out.push(s); }
      return out;
    }
    function paint(el, groups, dim) { el.innerHTML = groups.map(function (g) { return '<span' + (dim ? ' class="is-dim"' : '') + '>' + g + '</span>'; }).join(''); }
    var blank = ['--------', '--------', '--------', '--------', '--------', '--------', '--------', '--------'];
    paint(A, blank, true); paint(B, blank, true);

    run.addEventListener('click', function () {
      timers.forEach(clearTimeout); timers = [];
      var H = hash();
      box.setAttribute('data-state', 'running'); box.classList.remove('glow');
      checks.forEach(function (c) { c.classList.remove('is-on', 'is-wait'); });
      ok.disabled = true; run.disabled = true;
      paint(A, H, false); paint(B, blank, true);
      status.textContent = 'Copying IMG_2041.MOV to OneDrive.';
      pipe.style.transition = 'none'; pipe.style.transform = 'scaleX(0)';
      if (!RM) requestAnimationFrame(function () { requestAnimationFrame(function () { pipe.style.transition = 'transform 1.9s cubic-bezier(.4,0,.2,1)'; pipe.style.transform = 'scaleX(1)'; }); });
      else pipe.style.transform = 'scaleX(1)';
      countTo(pct, 0, 100, 1900, function (v) { return Math.round(v) + '%'; });
      if (m) [0, 380, 760].forEach(function (d) { at(d, function () { fly(nodes[0], nodes[1], m, function () { nodes[1].classList.remove('is-hit'); void nodes[1].offsetWidth; nodes[1].classList.add('is-hit'); }); }); });
      at(2000, function () { status.textContent = 'Reading the copy back from OneDrive.'; });
      H.forEach(function (g, i) {
        at(2300 + i * 170, function () {
          var bs = $$('span', B), as = $$('span', A);
          bs[i].textContent = g; bs[i].className = 'is-ok is-pop'; as[i].className = 'is-ok is-pop';
        });
      });
      at(3800, function () { status.innerHTML = '<span class="good">The fingerprints match.</span> The copy matches the original, byte for byte.'; checks[0].classList.add('is-on'); });
      at(4500, function () { checks[1].classList.add('is-on'); });
      at(5200, function () { checks[2].classList.add('is-on'); });
      at(5700, function () { checks[3].classList.add('is-wait'); ok.disabled = false; status.textContent = 'Three checks passed. The fourth one is yours.'; run.disabled = false; run.textContent = 'Run it again'; });
    });
    ok.addEventListener('click', function () {
      checks[3].classList.remove('is-wait'); checks[3].classList.add('is-on'); ok.disabled = true;
      box.setAttribute('data-state', 'safe');
      if (!RM) { box.classList.remove('glow'); void box.offsetWidth; box.classList.add('glow'); }
      status.innerHTML = '<span class="good">All four checks passed.</span> Only now can the original be removed, and Apple will ask you first.';
      run.focus();
    });
  })();

  /* ---------- guardrails ---------- */
  (function guard() {
    var favs = $('#favs'), fs = $('#favStatus'), favReset = $('#favReset'); if (!favs) return;
    var cards = [];
    [{ m: M.items[1], fav: true }, { m: M.items[4], fav: true }, { m: M.items[5], fav: false }].forEach(function (o) {
      if (!o.m) return;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'fav'; bg(b, o.m);
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-label', 'Delete “' + o.m.name + '”' + (o.fav ? ', a favorite' : ', not a favorite'));
      b.innerHTML = (o.fav ? '<svg class="fav__h" aria-hidden="true"><use href="#i-heart"/></svg>' : '') + '<span class="fav__x" aria-hidden="true">Delete</span>';
      b.addEventListener('click', function () {
        var x = $('.fav__x', b);
        favReset.hidden = false;
        if (o.fav) {
          b.classList.add('is-kept'); x.textContent = 'Kept';
          if (!RM) { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); }
          fs.innerHTML = '<b>“' + o.m.name + '” is a favorite, so it stays.</b> Favorites are never deleted.';
        } else {
          var on = b.getAttribute('aria-pressed') !== 'true';
          b.setAttribute('aria-pressed', on); b.classList.toggle('is-picked', on); x.textContent = on ? 'Picked' : 'Delete';
          fs.innerHTML = on
            ? '<b>“' + o.m.name + '” is not a favorite, so you can pick it.</b> It is still copied and checked first, and nothing goes without your OK.'
            : '“' + o.m.name + '” is no longer picked.';
        }
      });
      favs.appendChild(b); cards.push(b);
    });
    favReset.addEventListener('click', function () {
      cards.forEach(function (b) { b.classList.remove('is-kept', 'is-picked', 'shake'); b.setAttribute('aria-pressed', 'false'); $('.fav__x', b).textContent = 'Delete'; });
      fs.textContent = 'Nothing picked yet.'; favReset.hidden = true; if (cards[0]) cards[0].focus();
    });

    /* mock Apple dialog: a real dialog for assistive tech, trapped between its two buttons */
    var open = $('#appleOpen'), dlg = $('#appleDialog'), as = $('#appleStatus'), no = $('#appleNo'), yes = $('#appleYes');
    var NOTHING = '<b>Nothing was deleted.</b> Without your yes, nothing goes.';
    function isOpen() { return !dlg.hidden; }
    function close(msg, refocus) { if (!isOpen()) return; dlg.hidden = true; as.innerHTML = msg; if (refocus !== false) open.focus(); }
    open.addEventListener('click', function () { dlg.hidden = false; no.focus(); });
    no.addEventListener('click', function () { close(NOTHING); });
    yes.addEventListener('click', function () { close('<b>That question came from Apple, not from TidyAway.</b> In the app, these would now move to Recently Deleted, where they’re kept for up to 30 days.'); });
    document.addEventListener('keydown', function (e) {
      if (!isOpen()) return;
      if (e.key === 'Escape') { e.preventDefault(); close(NOTHING); }
      else if (e.key === 'Tab') { e.preventDefault(); (document.activeElement === no ? yes : no).focus(); }
    });
    document.addEventListener('pointerdown', function (e) { if (isOpen() && !$('.ios__card', dlg).contains(e.target) && e.target !== open) close(NOTHING, false); });
  })();

  /* ---------- where copies go ---------- */
  (function places() {
    var set = $('#placesSet'), to = $('#placeTo'), lineEl = $('#placeLine'); if (!set) return;
    var text = { drive: 'A drive plugged into it', files: 'A folder in Files', google: 'Your Google Drive', onedrive: 'Your OneDrive', dropbox: 'Your Dropbox' };
    set.addEventListener('change', function (e) {
      to.textContent = text[e.target.value] || '';
      if (!RM) { lineEl.classList.remove('swap'); void lineEl.offsetWidth; lineEl.classList.add('swap'); }
    });
  })();

  /* ---------- Common questions: written answers, matched in the browser ----------
     Nothing typed here leaves the page. Every answer restates a fact from the page;
     if nothing matches, it says so instead of guessing. */
  (function ask() {
    var form = $('#askForm'), q = $('#askQ'), thread = $('#thread'), sugg = $('#sugg'); if (!form) return;
    var KB = [
      [/recently deleted|still full|not free|didn.?t free|no space|\b44\b/i, 'Deleted photos move to Recently Deleted. They stay there for up to 30 days and keep using space, which is why a phone can still be full after you delete things.'],
      [/favou?rite|heart/i, 'Favorites are never deleted. TidyAway leaves them where they are.'],
      [/duplicate|same photo|copies of the same/i, 'One copy of every duplicate is always kept.'],
      [/live photo|edited|\bedits\b/i, 'Archiving for Live Photos and edited photos is coming soon. It is not in version 1.0.'],
      [/check.?in|remind|calendar|schedule/i, 'Check-ins are coming soon: storage reminders on a schedule, and reminders before events in your calendar. They are not in version 1.0.'],
      [/smart pro|best shot|screenshot/i, 'Smart Pro is coming soon: the best shot with the reason it was chosen, and screenshots read on the device. It is not in version 1.0.'],
      [/\bipad\b/i, 'Yes, TidyAway runs on iPhone and iPad.'],
      [/price|cost|is it free|for free|free to|\bpay|\bpro\b|subscription|purchase|how much/i, 'TidyAway is free to download. TidyAway Pro is an in-app purchase. The App Store shows the current prices.'],
      [/\bsha(-?256)?\b|hash|fingerprint|verif|\bbyte|prove|proof|how.*(check|know)|checked/i, 'Every copy is read back and its SHA-256 fingerprint is compared with the original, byte for byte. Copying to OneDrive, the app shows four checks: Copied, byte for byte. Where they are. One brought back and checked. Your OK.'],
      [/bring.*back|get.*back|restore|undo|recover/i, 'Anything TidyAway copied can be brought back.'],
      [/privacy|private|track|analytics|\bads?\b|account|sign.?up|log.?in|see my|your server|developer|upload to you/i, 'No account, no ads and no analytics. Your photos never go to the developer, and scanning happens on the device.'],
      [/where|google|onedrive|dropbox|icloud drive|\bcloud\b|\bdrive\b|usb|ssd|\bfiles\b|server|\bnas\b|destination/i, 'You choose where copies go: a drive plugged into your iPhone or iPad, a folder in Files (iCloud Drive or a home server), Google Drive, OneDrive or Dropbox.'],
      [/delete|remove|lose|\bsafe\b|trust|approve|confirm|apple/i, 'TidyAway deletes only what you approve, and then Apple asks you to confirm too. Every copy is checked byte for byte before that.'],
      [/iphone|android|\bmac\b|windows|which phone|which device/i, 'TidyAway is an app for iPhone and iPad. Version 1.0 is on the App Store.'],
      [/what (does|is) (it|tidyaway|this)|how does (it|tidyaway|this)/i, 'TidyAway scans your photo library on the device, copies photos and videos to a place you choose, checks every copy byte for byte, and deletes only what you approve.'],
      [/download|install|get it|app store|version/i, 'Version 1.0 is on the App Store. The Download button on this page takes you there.'],
      [/sent anywhere|typed|this box|who wrote|are you a/i, 'These answers are written by us and built into this page. Nothing you type is sent anywhere.']
    ];
    var NONE = 'There is no written answer for that, and we would rather not guess. Try asking about deleting, favorites, where copies go, or privacy.';
    function add(text, who) {
      var p = document.createElement('p'); p.className = 'msg msg--' + who; p.textContent = text; thread.appendChild(p);
      while (thread.children.length > 5) thread.removeChild(thread.firstChild);
    }
    function answer(t) {
      t = t.trim(); if (!t) return;
      var hit = KB.filter(function (r) { return r[0].test(t); })[0];
      add(t, 'q'); add(hit ? hit[1] : NONE, 'a');
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); answer(q.value); q.value = ''; });
    ['Will it delete my favorites?', 'Why is my phone still full?', 'How is a copy checked?', 'Where do copies go?', 'Do you see my photos?'].forEach(function (s) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = s;
      b.addEventListener('click', function () { answer(s); });
      sugg.appendChild(b);
    });
  })();
})();
