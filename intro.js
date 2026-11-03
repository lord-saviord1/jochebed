/* Jochebed's Touch — ASCII intro. The brand word is sampled into a grid of characters
   that scatter away from the cursor (or ripple on touch). Plays once per visit (session). */
(function () {
  'use strict';
  var doc = document.documentElement, root = document.getElementById('intro');
  if (!root || !doc.classList.contains('intro')) return;
  var cv = root.querySelector('canvas'), ctx = cv.getContext('2d');
  var pctEl = root.querySelector('.intro__pct'), barEl = root.querySelector('.intro__bar'), labelEl = root.querySelector('.intro__label'), hint = root.querySelector('.intro__hint');
  var skip = root.querySelector('.intro__skip');
  var WORD = "JOCHEBED'S", CH = "JOCHEBED'S", FILL = '·:+*';
  var coarse = matchMedia('(hover: none)').matches;
  var W = 0, H = 0, dpr = 1, cell = 12, parts = [], dust = [];
  var ptr = { x: -999, y: -999, on: false, last: 0 };
  var t0 = performance.now(), loaded = false, finished = false, pct = 0, fullAt = 0;
  var PUR = [96, 14, 78], GRN = [88, 139, 34], COR = [227, 127, 101], SUN = [220, 190, 20];

  function build() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = root.clientWidth; H = root.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cell = W < 640 ? 9 : (W < 1100 ? 11 : 13);
    var cols = Math.floor(W / cell), rows = Math.floor(H / cell);
    var off = document.createElement('canvas'); off.width = cols; off.height = rows;
    var o = off.getContext('2d');
    var fam = '"Baloo 2","Arial Black",Impact,sans-serif';
    o.font = '800 100px ' + fam; var m = o.measureText(WORD).width || 600;
    var fs = Math.min(100 * (cols * .88) / m, rows * .56);
    o.font = '800 ' + fs + 'px ' + fam; o.textAlign = 'center'; o.textBaseline = 'middle'; o.fillStyle = '#000';
    o.fillText(WORD, cols / 2, rows * .47);
    var d = o.getImageData(0, 0, cols, rows).data; parts = []; dust = [];
    for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
      var a = d[(y * cols + x) * 4 + 3];
      if (a > 120) parts.push({ hx: x * cell + cell / 2, hy: y * cell + cell / 2, ox: (Math.random() - .5) * W * .5, oy: (Math.random() - .5) * H * .5, vx: 0, vy: 0, x: 0, y: 0, c: CH.charAt((x * 7 + y * 3) % CH.length), ph: Math.random() * 6.28 });
      else if (Math.random() < .018) dust.push({ x: x * cell + cell / 2, y: y * cell + cell / 2, c: FILL.charAt((Math.random() * FILL.length) | 0), ph: Math.random() * 6.28 });
    }
  }
  function mix(a, b, t) { return 'rgb(' + ((a[0] + (b[0] - a[0]) * t) | 0) + ',' + ((a[1] + (b[1] - a[1]) * t) | 0) + ',' + ((a[2] + (b[2] - a[2]) * t) | 0) + ')'; }

  function move(e) { var r = root.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.on = true; ptr.last = performance.now(); }
  root.addEventListener('pointermove', move); root.addEventListener('pointerdown', function (e) { move(e); });

  var last = performance.now();
  function frame(now) {
    if (finished) return;
    var dt = Math.min(.05, (now - last) / 1000); last = now; var t = (now - t0) / 1000;
    // progress: eased to ~92% by time, completes when the page has loaded
    var target = loaded ? 1 : Math.min(.92, t / 2.6);
    pct += (target - pct) * Math.min(1, dt * 4); if (loaded && pct > .995) pct = 1;
    barEl.style.setProperty('--pc', pct.toFixed(3)); pctEl.textContent = Math.round(pct * 100) + '%';
    if (pct >= 1) { if (!fullAt) { fullAt = now; labelEl.textContent = 'Table is set'; } if (now - fullAt > (coarse ? 1300 : 1500)) return finish(); }
    // touch / idle: an auto-wave sweeps the word so it never looks static
    var idle = !ptr.on || now - ptr.last > 1600, px = ptr.x, py = ptr.y;
    if (idle) { px = W * (.5 + .46 * Math.sin(t * .9)); py = H * (.47 + .12 * Math.sin(t * 1.7)); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 ' + (cell * 1.1) + 'px "Courier New",ui-monospace,monospace';
    ctx.globalAlpha = .28; ctx.fillStyle = '#A0B043';
    for (var i = 0; i < dust.length; i++) { var q = dust[i]; ctx.fillText(q.c, q.x, q.y + Math.sin(t + q.ph) * 2); }
    var R = idle ? 110 : 140, rdt = Math.min(.3, (now - (frame.prev || now)) / 1000); frame.prev = now;
    var steps = Math.max(1, Math.ceil(rdt / .02)), sdt = rdt / steps;
    for (var s2 = 0; s2 < steps; s2++) {
      var fr = Math.exp(-sdt * 15);
      for (var j = 0; j < parts.length; j++) {
        var p = parts[j], x = p.hx + p.ox, y = p.hy + p.oy, dx = x - px, dy = y - py, d2 = dx * dx + dy * dy;
        if (d2 < R * R) { var dd = Math.sqrt(d2) || 1, nr = 1 - dd / R, f = nr * nr * 2600 * sdt; p.vx += dx / dd * f + (Math.random() - .5) * 60 * nr * sdt * 20; p.vy += dy / dd * f + (Math.random() - .5) * 60 * nr * sdt * 20; }
        p.vx += -p.ox * 70 * sdt; p.vy += -p.oy * 70 * sdt; p.vx *= fr; p.vy *= fr; p.ox += p.vx * sdt; p.oy += p.vy * sdt;
      }
    }
    for (var j2 = 0; j2 < parts.length; j2++) {
      var q2 = parts[j2], x2 = q2.hx + q2.ox, y2 = q2.hy + q2.oy, ddx = x2 - px, ddy = y2 - py, dist2 = ddx * ddx + ddy * ddy, near = dist2 < R * R ? 1 - Math.sqrt(dist2) / R : 0;
      var shift = (Math.sin(t * .8 + q2.hx * .006 + q2.ph * .1) + 1) / 2;
      ctx.fillStyle = near > .05 ? mix(GRN, near > .55 ? SUN : COR, Math.min(1, near * 1.6)) : mix(PUR, GRN, shift * .85);
      var a2 = Math.min(1, t * 1.4 - q2.hx / W * .8); if (a2 <= 0) continue; ctx.globalAlpha = a2;
      ctx.fillText(near > .2 && ((now / 90 + j2) | 0) % 3 === 0 ? FILL.charAt(j2 % FILL.length) : q2.c, x2, y2);
    }
    ctx.globalAlpha = 1; requestAnimationFrame(frame);
  }
  function finish() {
    if (finished) return; finished = true;
    try { sessionStorage.setItem('jt-intro', '1'); } catch (e) {}
    doc.classList.add('intro-out'); window.__introDone = true;
    window.dispatchEvent(new Event('jt:intro-done'));
    setTimeout(function () { doc.classList.remove('intro', 'intro-out'); }, 1100);
  }
  function ready() { loaded = true; }
  if (document.readyState === 'complete') ready(); else addEventListener('load', ready);
  if (document.fonts && document.fonts.load) {
    Promise.race([document.fonts.load('800 100px "Baloo 2"'), new Promise(function (r) { setTimeout(r, 900); })]).then(function () { build(); requestAnimationFrame(frame); });
  } else { build(); requestAnimationFrame(frame); }
  var rz; addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (!finished) build(); }, 200); });
  skip.addEventListener('click', function (e) { e.stopPropagation(); finish(); });
  root.addEventListener('click', function () { if (pct > .5) finish(); });
  addEventListener('keydown', function (e) { if (!finished && (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape')) { e.preventDefault(); finish(); } });
  setTimeout(function () { if (!finished) finish(); }, 9000); // never trap a visitor
  if (coarse && hint) hint.textContent = 'touch the word';
})();
