/* Jochebed's Touch — page behaviour. No libraries: smooth scroll, pinned
   scroll-stories, page transitions and the WebGL driver all live here. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = matchMedia('(hover: none)').matches;
  var probe = document.createElement('div'); probe.setAttribute('aria-hidden', 'true'); probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:100svh;visibility:hidden;pointer-events:none';
  document.body.appendChild(probe);
  var VH = function () { return probe.offsetHeight || innerHeight; };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var seg = function (t, a, b) { return clamp((t - a) / (b - a), 0, 1); };
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var back = function (t) { var c = 1.70158; return t >= 1 ? 1 : (t <= 0 ? 0 : 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)); };
  if (RM) doc.classList.add('rm');

  /* ---------- WebGL ---------- */
  var canvas = $('#scene'), glOK = false;
  try { glOK = !!(window.JTGL && JTGL.init(canvas, {})); } catch (e) { glOK = false; }
  if (!glOK) { doc.classList.add('no-webgl'); if (canvas) canvas.remove(); }
  else JTGL.state.reduced = RM;
  addEventListener('pointermove', function (e) {
    if (glOK && e.pointerType !== 'touch') { JTGL.state.mx = e.clientX / innerWidth; JTGL.state.my = e.clientY / innerHeight; }
  }, { passive: true });
  // touch: Android cancels pointer events once a scroll starts, so follow the finger via touch events
  var touchRest;
  function touchAt(e) { if (!glOK || !e.touches[0]) return; clearTimeout(touchRest); JTGL.state.mx = e.touches[0].clientX / innerWidth; JTGL.state.my = e.touches[0].clientY / innerHeight; }
  addEventListener('touchstart', touchAt, { passive: true }); addEventListener('touchmove', touchAt, { passive: true });
  addEventListener('touchend', function () { clearTimeout(touchRest); touchRest = setTimeout(function () { if (glOK) { JTGL.state.mx = .5; JTGL.state.my = .5; } }, 900); }, { passive: true });

  /* ---------- smooth wheel scrolling (desktop) ---------- */
  var cur = scrollY, target = scrollY, wheeling = false, smooth = !RM && !coarse;
  var maxScroll = function () { return Math.max(0, doc.scrollHeight - VH()); };
  if (smooth) {
    addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      var d = e.deltaY; if (e.deltaMode === 1) d *= 34; else if (e.deltaMode === 2) d *= innerHeight;
      if (!wheeling) { cur = scrollY; target = scrollY; }
      target = clamp(target + d, 0, maxScroll()); wheeling = true;
    }, { passive: false });
    addEventListener('scroll', function () { var d = Math.abs(scrollY - cur); if ((!wheeling && d > 1.5) || (wheeling && d > 8)) { cur = target = scrollY; wheeling = false; } }, { passive: true }); // keyboard, scrollbar drag or anchor jumps take over cleanly
  }
  function goTo(el) {
    var y = el.getBoundingClientRect().top + scrollY;
    if (el.dataset && el.dataset.pin === 'map') y += (el.offsetHeight - VH()) * .8; // land with the map open
    y = clamp(y, 0, maxScroll());
    if (smooth) { if (!wheeling) cur = scrollY; target = y; wheeling = true; }
    else scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' });
  }
  function goTop() { if (smooth) { if (!wheeling) cur = scrollY; target = 0; wheeling = true; } else scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }); }

  /* ---------- curtain, page transitions, links ---------- */
  var t0 = performance.now(), started = false, lastNow = t0;
  function ready() { if (doc.classList.contains('ready')) return; doc.classList.add('ready'); setTimeout(startReveals, 450); if (location.hash) setTimeout(function () { var el = document.getElementById(location.hash.slice(1)); if (el) goTo(el); }, 900); }
  var intro = doc.classList.contains('intro');
  if (intro) { addEventListener('jt:intro-done', ready); if (window.__introDone) ready(); setTimeout(ready, 11000); }
  else { addEventListener('load', function () { setTimeout(ready, Math.max(0, 1100 - (performance.now() - t0))); }); setTimeout(ready, 4500); }
  addEventListener('pageshow', function (e) { if (e.persisted) { doc.classList.remove('leaving'); doc.classList.add('ready'); } });
  var norm = function (p) { return p.replace(/index\.html$/, ''); };
  function closeMenu() { doc.classList.remove('menu-open'); var b = $('.burger'); if (b) b.setAttribute('aria-expanded', 'false'); }
  var burger = $('.burger');
  if (burger) burger.addEventListener('click', function () { var o = doc.classList.toggle('menu-open'); burger.setAttribute('aria-expanded', String(o)); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a'); if (!a) return;
    var href = a.getAttribute('href'); if (!href || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
    var u; try { u = new URL(a.href, location.href); } catch (er) { return; }
    if (u.origin !== location.origin || u.protocol === 'tel:' || u.protocol === 'mailto:') return;
    e.preventDefault(); closeMenu();
    if (norm(u.pathname) === norm(location.pathname)) {
      if (u.hash) { var el = document.getElementById(u.hash.slice(1)); if (el) goTo(el); } else goTop();
      return;
    }
    doc.classList.remove('ready'); doc.classList.add('leaving');
    setTimeout(function () { location.href = u.href; }, RM ? 0 : 900);
  });

  /* ---------- word-split + reveal ---------- */
  function splitNode(node, c) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
          var wi = document.createElement('span'); wi.className = 'wi'; wi.textContent = p; wi.style.setProperty('--i', c.n++);
          w.appendChild(wi); frag.appendChild(w);
        });
        n.parentNode.replaceChild(frag, n);
      } else if (n.nodeType === 1) splitNode(n, c);
    });
  }
  $$('[data-split]').forEach(function (el) { el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim()); splitNode(el, { n: 0 }); });
  function startReveals() {
    if (started) return; started = true;
    var all = $$('[data-split],[data-reveal],.photo-word');
    if (RM || !('IntersectionObserver' in window)) { all.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }); }, { threshold: .15, rootMargin: '0px 0px -6% 0px' });
    all.forEach(function (el) { io.observe(el); });
  }

  /* ---------- magnetic buttons ---------- */
  if (!coarse && !RM) $$('[data-magnetic]').forEach(function (b) {
    b.addEventListener('pointermove', function (e) { var r = b.getBoundingClientRect(); b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .22) + 'px,' + ((e.clientY - r.top - r.height / 2) * .32) + 'px)'; });
    b.addEventListener('pointerleave', function () { b.style.transform = ''; });
  });

  /* ---------- palettes per chapter ---------- */
  var palEls = $$('[data-palette]'), palNow = -1;
  function updatePalette() {
    if (!glOK) return;
    var vh = innerHeight, idx = palNow < 0 ? 0 : palNow;
    for (var i = 0; i < palEls.length; i++) { var r = palEls[i].getBoundingClientRect(); if (r.top < vh * .5 && r.bottom > vh * .5) idx = +palEls[i].dataset.palette; }
    if (idx !== palNow) { palNow = idx; JTGL.setPalette(idx); }
  }

  /* ---------- pinned progress helper ---------- */
  function pinP(sec) { var r = sec.getBoundingClientRect(), tot = r.height - VH(); return { p: tot > 0 ? clamp(-r.top / tot, 0, 1) : 1, top: r.top, h: r.height }; }
  var updaters = [], frameDy = 0, frameDt = .016;

  /* ---------- the plant: hands nurture a sprout into a bloom ---------- */
  (function () {
    var sec = $('[data-pin="plant"]'); if (!sec) return;
    var svg = $('#plant', sec), stem = $('#stem', svg), NS = 'http://www.w3.org/2000/svg';
    var len = stem.getTotalLength(); stem.style.strokeDasharray = len; stem.style.strokeDashoffset = len;
    var leaves = $$('.leaf', svg).map(function (g) { var f = +g.dataset.f, pt = stem.getPointAtLength(len * f); return { g: g, f: f, x: pt.x, y: pt.y, a: +g.dataset.a, s: +g.dataset.s }; });
    function petals(host, n, fill) { var arr = []; for (var i = 0; i < n; i++) { var u = document.createElementNS(NS, 'use'); u.setAttribute('href', '#petalShape'); u.setAttribute('fill', fill); host.appendChild(u); arr.push(u); } return arr; }
    var po = petals($('#petalsO', svg), 8, 'url(#gPA)'), pi = petals($('#petalsI', svg), 6, 'url(#gPB)');
    var spk = [], sg = $('#sparkles', svg);
    for (var i = 0; i < 14; i++) { var f = .12 + Math.random() * .85, pt = stem.getPointAtLength(len * f), c = document.createElementNS(NS, 'circle'); c.setAttribute('r', (1.6 + Math.random() * 2.6).toFixed(1)); sg.appendChild(c); spk.push({ c: c, f: f, x: pt.x + (Math.random() - .5) * 150, y: pt.y, ph: Math.random() * 60 }); }
    var handL = $('#handL', svg), handR = $('#handR', svg), bud = $('#bud', svg), bloom = $('#bloom', svg), core = $('#core', svg), core2 = $('#core2', svg), glow = $('#glow', svg);
    var caps = $$('.cap', sec), vals = $$('.values li', sec), about = $('.story__about', sec);
    var wins = [[.3, 2.4], [2.4, 4.6], [4.6, 6.6], [6.6, 99]], vt = [2.6, 4.8, 7.0];
    function draw(p, time) {
      var T = p * 10, hh = ease(seg(T, 0, 1.5));
      handL.setAttribute('transform', 'translate(' + (-150 * (1 - hh)) + ' ' + (80 * (1 - hh)) + ')'); handL.style.opacity = hh;
      handR.setAttribute('transform', 'translate(' + (150 * (1 - hh)) + ' ' + (80 * (1 - hh)) + ')'); handR.style.opacity = hh;
      glow.setAttribute('opacity', (.95 * seg(T, 5.8, 8.6)).toFixed(3));
      var s = seg(T, 1.4, 5.6); stem.style.strokeDashoffset = len * (1 - s);
      leaves.forEach(function (L, i) {
        var k = back(seg(s, L.f, L.f + .15)), sw = Math.sin(time * 1.3 + i * 1.7) * 3.5 * k;
        L.g.setAttribute('transform', 'translate(' + L.x.toFixed(1) + ' ' + L.y.toFixed(1) + ') rotate(' + (L.a + sw).toFixed(2) + ') scale(' + Math.max(.0001, L.s * k).toFixed(3) + ')');
      });
      var b = seg(T, 5.4, 6.1) * (1 - ease(seg(T, 6.4, 7.3)));
      bud.setAttribute('transform', 'translate(260 170) scale(' + Math.max(.0001, b).toFixed(3) + ') translate(-260 -170)');
      po.forEach(function (u, i) { var k = back(seg(T, 6.2 + i * .09, 7.6 + i * .09)); u.setAttribute('transform', 'rotate(' + (i * 45 - (1 - k) * 40).toFixed(1) + ') scale(' + Math.max(.0001, k).toFixed(3) + ')'); });
      pi.forEach(function (u, i) { var k = back(seg(T, 7.0 + i * .08, 8.3 + i * .08)); u.setAttribute('transform', 'rotate(' + (i * 60 + 30 + (1 - k) * 30).toFixed(1) + ') scale(' + Math.max(.0001, .62 * k).toFixed(3) + ')'); });
      core.setAttribute('r', (17 * seg(T, 7.4, 8.4)).toFixed(2)); core2.setAttribute('r', (7 * seg(T, 7.7, 8.6)).toFixed(2));
      bloom.setAttribute('transform', 'translate(260 170) rotate(' + (Math.sin(time * .9) * 2.2 * seg(T, 7, 9)).toFixed(2) + ')');
      spk.forEach(function (q) { var d = (time * 16 + q.ph) % 60, v = seg(s, q.f, q.f + .08) * (1 - seg(T, 6.5, 8)); q.c.setAttribute('cx', q.x.toFixed(1)); q.c.setAttribute('cy', (q.y - d).toFixed(1)); q.c.setAttribute('opacity', (v * (1 - d / 60)).toFixed(3)); });
      caps.forEach(function (c, i) {
        var a = wins[i][0], bb = wins[i][1], inn = ease(seg(T, a, a + .55)), out = i < 3 ? ease(seg(T, bb - .1, bb + .45)) : 0;
        c.style.opacity = (inn * (1 - out)).toFixed(3); c.style.transform = 'translateY(' + ((1 - inn) * 26 - out * 26).toFixed(1) + 'px)';
      });
      vals.forEach(function (li, i) { li.style.opacity = (.28 + .72 * ease(seg(T, vt[i], vt[i] + .6))).toFixed(3); });
      if (about) about.style.opacity = ease(seg(T, 7.6, 9)).toFixed(3);
    }
    updaters.push(function (now) {
      if (RM) { draw(1, 3); return; }
      var r = sec.getBoundingClientRect(); if (r.bottom < -innerHeight * .5 && sec._done) return; if (r.top > innerHeight * 1.5) return;
      var q = pinP(sec); draw(q.p, now / 1000); sec._done = q.p >= 1;
    });
    draw(RM ? 1 : 0, 3);
  })();

  /* ---------- horizontal dish strip ---------- */
  (function () {
    var sec = $('[data-pin="hscroll"]'); if (!sec || RM) return;
    var track = $('.hs__track', sec), dist = 0;
    var mob = matchMedia('(max-width:900px)');
    function size() { if (mob.matches) { sec.style.height = ''; dist = 0; track.style.transform = ''; return; } dist = Math.max(0, track.scrollWidth - innerWidth); sec.style.height = (dist + innerHeight * 1.1) + 'px'; }
    size(); addEventListener('resize', size); addEventListener('load', size);
    updaters.push(function () {
      if (mob.matches) return;
      var r = sec.getBoundingClientRect(); if (r.top > innerHeight * 1.2 || r.bottom < -innerHeight * .2) return;
      var tot = r.height - VH(), p = tot > 0 ? clamp(-r.top / tot, 0, 1) : 0;
      track.style.transform = 'translate3d(' + (-p * dist).toFixed(1) + 'px,0,0)';
    });
  })();

  /* ---------- map finale: the story ends on a leaf that opens into the map ---------- */
  (function () {
    var sec = $('[data-pin="map"]'), frame = $('#mapframe'); if (!sec || !frame) return;
    var open = 0;
    updaters.push(function () {
      var q = pinP(sec); open = RM ? 1 : ease(seg(q.p, 0, .72));
      frame.style.setProperty('--p', open.toFixed(4)); frame.classList.toggle('done', open > .98);
    });
    frame.addEventListener('click', function () { if (open > .9) frame.classList.add('live'); });
    frame.addEventListener('mouseleave', function () { frame.classList.remove('live'); });
    document.addEventListener('pointerdown', function (e) { if (!frame.contains(e.target)) frame.classList.remove('live'); });
  })();

  /* ---------- stacked dish cards ---------- */
  (function () {
    var cards = $$('.dish'); if (cards.length < 2 || RM) return;
    updaters.push(function () {
      var vh = innerHeight, r0 = cards[0].getBoundingClientRect(); if (r0.top > vh * 2 && cards.length) { /* far away */ }
      for (var i = 0; i < cards.length - 1; i++) {
        var nt = cards[i + 1].getBoundingClientRect().top, stick = vh * .1 + (i + 1) * 16;
        var p = clamp((vh * .92 - nt) / (vh * .92 - stick), 0, 1);
        cards[i].style.transform = 'scale(' + (1 - .07 * p).toFixed(4) + ')'; cards[i].style.setProperty('--dim', (.55 * p).toFixed(3));
      }
    });
  })();

  /* ---------- gallery: client photos appear automatically when added ---------- */
  (function () {
    var host = $('#galleryGrid'), sec = $('#gallery'); if (!host) return;
    var n = 12, found = new Array(n), left = n;
    for (var i = 1; i <= n; i++) (function (i) {
      var im = new Image(); im.onload = function () { found[i - 1] = im; done(); }; im.onerror = done; im.src = 'images/gallery-' + i + '.jpg';
    })(i);
    function done() {
      if (--left) return;
      var ok = found.filter(Boolean); if (!ok.length) return;
      ok.forEach(function (im, k) {
        var f = document.createElement('figure'); im.alt = 'Jochebed’s Touch, photo ' + (k + 1); im.loading = 'lazy'; f.appendChild(im); host.appendChild(f);
      });
      sec.hidden = false;
      var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }); }, { threshold: .1 });
      $$('figure', host).forEach(function (f) { io.observe(f); });
    }
  })();



  /* ---------- photo bands: your scroll speeds them up, then they ease back down (~2s) ---------- */
  (function () {
    var bands = $$('.band'); if (!bands.length || RM) return;
    doc.classList.add('bands-js');
    var st = bands.map(function (b, i) { var inn = $('.band__in', b); return { b: b, inn: inn, x: 0, dir: b.classList.contains('band--rev') ? 1 : -1, base: i ? 34 : 42, hover: false }; });
    st.forEach(function (o) { o.b.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') o.hover = true; }); o.b.addEventListener('pointerleave', function () { o.hover = false; }); });
    var boost = 0, half = [];
    function measure() { half = st.map(function (o) { return o.inn.scrollWidth / 2; }); }
    measure(); addEventListener('resize', measure); addEventListener('load', measure);
    var lastT = 0;
    updaters.push(function (nowMs) {
      var rdt = lastT ? Math.min(.25, (nowMs - lastT) / 1000) : .016; lastT = nowMs;
      var r = bands[0].parentNode.getBoundingClientRect(); var vis = r.bottom > -100 && r.top < innerHeight + 100;
      boost += Math.min(Math.abs(frameDy), 90) * (coarse ? 2.4 : 3.2) * (vis ? 1 : .2);
      boost = Math.min(boost, 1200);
      boost *= Math.exp(-rdt / .7); if (boost < .5) boost = 0;   // ~2 s to settle
      if (!vis) return;
      for (var i = 0; i < st.length; i++) {
        var o = st[i], w = half[i] || 1, sp = (o.hover ? 0 : o.base) + boost;
        o.x += o.dir * sp * rdt; o.x = ((o.x % w) - w) % w;      // wrap into (-w, 0]
        o.inn.style.transform = 'translate3d(' + o.x.toFixed(1) + 'px,0,0)';
      }
    });
  })();

  /* ---------- chapter pill (phones) ---------- */
  (function () {
    var chs = $$('[data-chapter]'); if (chs.length < 2) return;
    var pill = document.createElement('div'); pill.className = 'chapter'; pill.setAttribute('aria-hidden', 'true');
    pill.innerHTML = '<b></b><span></span><i></i>'; document.body.appendChild(pill);
    var nEl = $('b', pill), tEl = $('span', pill), now = -1, tm;
    updaters.push(function () {
      if (!matchMedia('(max-width:900px)').matches) return;
      var mid = innerHeight * .5, cur = 0, prog = 0;
      for (var i = 0; i < chs.length; i++) { var r = chs[i].getBoundingClientRect(); if (r.top <= mid) { cur = i; prog = clamp((mid - r.top) / Math.max(1, r.height), 0, 1); } }
      pill.style.setProperty('--cp', prog.toFixed(3));
      if (cur !== now) {
        now = cur; pill.classList.add('swap'); clearTimeout(tm);
        tm = setTimeout(function () { nEl.textContent = (cur + 1 < 10 ? '0' : '') + (cur + 1); tEl.textContent = chs[cur].getAttribute('data-chapter'); pill.classList.remove('swap'); }, 160);
      }
    });
  })();

  /* ---------- hero letters: fill with whichever client photos exist ---------- */
  (function () {
    var words = $$('.photo-word'); if (!words.length) return;
    var pool = doc.querySelector('[data-page="story"]') ?
      ['dish-jollof-2', 'dish-suya-1', 'dish-moimoi-1', 'dish-nkwobi', 'dish-noodles-sausage', 'dish-eba-ogbono', 'dish-egusi-2', 'dish-jollof-1', 'dish-suya-2', 'dish-moimoi-2', 'dish-noodles-egg'] :
      ['dish-nkwobi', 'dish-moimoi-1', 'dish-jollof-1', 'dish-suya-1', 'dish-eba-ogbono', 'dish-noodles-sausage', 'dish-egusi-2'];
    var ok = [], left = pool.length;
    pool.forEach(function (n) { var im = new Image(); im.onload = function () { ok.push(n); fin(); }; im.onerror = fin; im.src = 'images/' + n + '.jpg'; });
    function fin() {
      if (--left) return; if (!ok.length) return;
      var order = pool.filter(function (n) { return ok.indexOf(n) > -1; });
      words.forEach(function (w) { $$('.ltr', w).forEach(function (l, i) { l.style.setProperty('--img', 'url("' + new URL('images/' + order[(i * 2 + (i > 4 ? 1 : 0)) % order.length] + '.jpg', location.href).href + '")'); }); });
    }
  })();

  /* ---------- live "open now" status from the real hours ---------- */
  (function () {
    var els = $$('.js-status'); if (!els.length) return;
    function lagos() { var p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date()), o = {}; p.forEach(function (x) { o[x.type] = x.value; }); return { d: o.weekday, m: (+o.hour % 24) * 60 + (+o.minute) }; }
    function fmt(m) { var h = Math.floor(m / 60), ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return h + ' ' + ap; }
    function run() {
      var t; try { t = lagos(); } catch (e) { return; }
      var sun = t.d === 'Sun', open = sun ? 12 * 60 : 7 * 60, close = sun ? 20 * 60 : 22 * 60, isOpen = t.m >= open && t.m < close, txt;
      if (isOpen) txt = 'Open now · closes ' + fmt(close);
      else if (t.m < open) txt = 'Closed · opens today at ' + fmt(open);
      else { var nSun = t.d === 'Sat'; txt = 'Closed · opens ' + (nSun ? 'tomorrow' : 'tomorrow') + ' at ' + fmt(nSun ? 12 * 60 : 7 * 60); }
      els.forEach(function (e) { e.classList.toggle('open', isOpen); e.classList.toggle('closed', !isOpen); e.lastElementChild.textContent = txt; });
    }
    run(); setInterval(run, 60000);
  })();

  /* ---------- doodles drift gently as you scroll ---------- */
  var drift = RM ? [] : $$('.hero,.page-hero,.visit,.order');
  updaters.push(function () {
    for (var i = 0; i < drift.length; i++) { var r = drift[i].getBoundingClientRect(); if (r.bottom < -100 || r.top > innerHeight + 100) continue; drift[i].style.setProperty('--py', (-r.top).toFixed(0) + 'px'); }
  });

  /* ---------- main loop ---------- */
  var lastY = scrollY, dirty = true, lastDir = 0, acc = 0;
  addEventListener('resize', function () { dirty = true; }); addEventListener('scroll', function () { dirty = true; }, { passive: true });
  function tick(now) {
    var dt = Math.min(.05, Math.max(.001, (now - lastNow) / 1000)); lastNow = now;
    if (smooth && wheeling) {
      cur += (target - cur) * (1 - Math.exp(-dt * 8));
      if (Math.abs(target - cur) < .4) { cur = target; wheeling = false; }
      scrollTo(0, cur);
    }
    var y = scrollY, dy = y - lastY; lastY = y;
    if (!RM || dirty) {
      var mx = maxScroll();
      if (glOK) { JTGL.state.progress = mx > 0 ? y / mx : 0; JTGL.state.vel = coarse ? clamp(dy * .2, -8, 8) : dy; }
      updatePalette();
      doc.classList.toggle('scrolled', y > 40);
      acc = (dy * dy < .01) ? acc : (Math.sign(dy) === Math.sign(acc) ? acc + dy : dy);
      if (!doc.classList.contains('menu-open')) { if (y > 240 && acc > 14) doc.classList.add('nav-hidden'); else if (acc < -10 || y < 120) doc.classList.remove('nav-hidden'); }
      frameDy = dy; frameDt = dt;
      for (var i = 0; i < updaters.length; i++) updaters[i](now);
      if (glOK) JTGL.frame(now);
      dirty = false;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
