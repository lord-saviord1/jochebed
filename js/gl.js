/* Jochebed's Touch — dependency-free WebGL scene.
   A fullscreen flowing-gradient shader with real 3D leaves and blooms floating
   in front of it. The camera dollies down the page as you scroll, so near and
   far leaves parallax against each other. */
(function () {
  'use strict';

  // ---- brand palettes: [base, a, b, c] per chapter ----
  var PAL = [
    ['#FBF7EF', '#E4F0D0', '#F1E1EC', '#FFE8C8'], // 0 hero: warm white, herb green, lilac, peach
    ['#F7F6EC', '#D3E8B8', '#E8D5E6', '#DCEEF8'], // 1 story: garden
    ['#FBF3E8', '#FFDCCB', '#FFF1B8', '#E7D9EA'], // 2 kitchen: warm
    ['#F1F6F0', '#C9E4F5', '#E7D9EA', '#D3E8B8'], // 3 map: soft sky
    ['#FBF7EF', '#E7D9EA', '#D3E8B8', '#FFE3D3']  // 4 space
  ];
  function hex(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
  var PALRGB = PAL.map(function (p) { return p.map(hex); });

  // ---- tiny mat4 (column-major) ----
  var M = {
    id: function () { return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); },
    persp: function (fov, a, n, f) { var t = 1 / Math.tan(fov / 2), nf = 1 / (n - f); return new Float32Array([t / a,0,0,0, 0,t,0,0, 0,0,(f + n) * nf,-1, 0,0,2 * f * n * nf,0]); },
    mul: function (a, b) { var o = new Float32Array(16); for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) { var s = 0; for (var k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; },
    T: function (x, y, z) { var m = M.id(); m[12] = x; m[13] = y; m[14] = z; return m; },
    S: function (x, y, z) { var m = M.id(); m[0] = x; m[5] = y; m[10] = z; return m; },
    Rx: function (a) { var c = Math.cos(a), s = Math.sin(a); return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]); },
    Ry: function (a) { var c = Math.cos(a), s = Math.sin(a); return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]); },
    Rz: function (a) { var c = Math.cos(a), s = Math.sin(a); return new Float32Array([c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]); }
  };
  function chain() { var m = arguments[0]; for (var i = 1; i < arguments.length; i++) m = M.mul(m, arguments[i]); return m; }

  // ---- shaders ----
  var VS_BG = 'attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  var FS_BG = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH', 'precision highp float;', '#else', 'precision mediump float;', '#endif',
    'varying vec2 vUv;uniform float uTime;uniform vec2 uRes;uniform vec2 uMouse;uniform float uScroll;',
    'uniform vec3 uBase;uniform vec3 uA;uniform vec3 uB;uniform vec3 uC;',
    'vec3 permute(vec3 x){return mod(((x*34.0)+1.0)*x,289.0);}',
    'float snoise(vec2 v){const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);',
    'vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);',
    'vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod(i,289.0);',
    'vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));',
    'vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);m=m*m;m=m*m;',
    'vec3 x=2.*fract(p*C.www)-1.;vec3 h=abs(x)-0.5;vec3 ox=floor(x+0.5);vec3 a0=x-ox;',
    'm*=1.79284291400159-0.85373472095312*(a0*a0+h*h);vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.*dot(m,g);}',
    'void main(){vec2 uv=vUv;float asp=uRes.x/uRes.y;vec2 p=(uv-.5)*vec2(asp,1.);float t=uTime*.055;',
    'vec2 m=(uMouse-.5)*.25;vec2 q=p*1.15+vec2(0.,uScroll*.9);',
    'float n1=snoise(q+vec2(t,-t*.8)+m);float n2=snoise(q*1.7-vec2(t*1.2,t)+n1*.6);float n3=snoise(q*.8+vec2(n2,n1)*.9+t);',
    'vec3 col=uBase;col=mix(col,uA,smoothstep(-.4,.9,n1)*.9);col=mix(col,uB,smoothstep(-.2,.9,n2)*.6);col=mix(col,uC,smoothstep(.2,1.0,n3)*.5);',
    'float d=length(p-(uMouse-.5)*vec2(asp,1.));col=mix(col,uB,.28*exp(-d*3.2));',
    'col=mix(col,uBase,.35*smoothstep(.35,1.1,length(uv-.5)*1.2));',
    'float g=fract(sin(dot(uv*uRes+uTime,vec2(12.9898,78.233)))*43758.5453);col+=(g-.5)*.022;',
    'gl_FragColor=vec4(col,1.);}'
  ].join('\n');

  var VS_LEAF = 'attribute vec3 aPos;attribute vec3 aNor;attribute vec2 aUv;uniform mat4 uP;uniform mat4 uMV;varying vec3 vN;varying vec3 vPos;varying vec2 vUv;' +
    'void main(){vec4 v=uMV*vec4(aPos,1.);vPos=v.xyz;vN=mat3(uMV)*aNor;vUv=aUv;gl_Position=uP*v;}';
  var FS_LEAF = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH', 'precision highp float;', '#else', 'precision mediump float;', '#endif',
    'varying vec3 vN;varying vec3 vPos;varying vec2 vUv;uniform vec3 uCol;uniform float uRim;',
    'void main(){vec3 N=normalize(vN);if(!gl_FrontFacing)N=-N;',
    'vec3 base=pow(uCol,vec3(2.2));float grad=mix(.62,1.18,vUv.y);',
    'float mid=1.-smoothstep(0.,.06,abs(vUv.x));',
    'float vein=smoothstep(.42,.5,abs(fract(vUv.y*8.+abs(vUv.x)*2.6)-.5))*smoothstep(.1,.5,abs(vUv.x));',
    'vec3 alb=base*grad*(1.-.28*mid-.1*vein);',
    'vec3 L1=normalize(vec3(.45,.75,.55));vec3 L2=normalize(vec3(-.7,-.35,.45));vec3 V=normalize(-vPos);vec3 H=normalize(L1+V);',
    'float d1=max(dot(N,L1),0.);float d2=max(dot(N,L2),0.);float back=max(dot(-N,L1),0.);',
    'float spec=pow(max(dot(N,H),0.),56.);float fres=pow(1.-max(dot(N,V),0.),3.);',
    'vec3 col=alb*(.3+.95*d1*vec3(1.,.93,.86)+.4*d2*vec3(.95,.5,.4)+.3*back)+spec*.38+fres*vec3(.98,.89,.33)*.22*uRim;',
    'col=pow(col,vec3(1./2.2));gl_FragColor=vec4(col,1.);}'
  ].join('\n');

  // ---- leaf geometry: lens-shaped leaf, cupped, with a centre crease ----
  function buildLeaf(NX, NY) {
    var P = [], uv = [], i, j;
    for (j = 0; j <= NY; j++) {
      var v = j / NY, y = v * 2 - 1, w = 0.56 * Math.pow(Math.max(0, 1 - y * y), 0.78);
      for (i = 0; i <= NX; i++) {
        var u = i / NX * 2 - 1, x = u * w;
        var z = 0.62 * x * x - 0.17 * y * y + 0.05 * (1 - Math.abs(u)) * w;
        P.push([x, y, z]); uv.push([u, v]);
      }
    }
    var W = NX + 1, data = [], idx = [];
    function at(jj, ii) { jj = Math.max(0, Math.min(NY, jj)); ii = Math.max(0, Math.min(NX, ii)); return P[jj * W + ii]; }
    for (j = 0; j <= NY; j++) for (i = 0; i <= NX; i++) {
      var a = at(j, i + 1), b = at(j, i - 1), c = at(j + 1, i), d = at(j - 1, i);
      var t1 = [a[0] - b[0], a[1] - b[1], a[2] - b[2]], t2 = [c[0] - d[0], c[1] - d[1], c[2] - d[2]];
      var n = [t1[1] * t2[2] - t1[2] * t2[1], t1[2] * t2[0] - t1[0] * t2[2], t1[0] * t2[1] - t1[1] * t2[0]];
      var l = Math.hypot(n[0], n[1], n[2]);
      if (l < 1e-6) n = [0, 0, 1]; else { n = [n[0] / l, n[1] / l, n[2] / l]; if (n[2] < 0) n = [-n[0], -n[1], -n[2]]; }
      var p = P[j * W + i], q = uv[j * W + i];
      data.push(p[0], p[1], p[2], n[0], n[1], n[2], q[0], q[1]);
    }
    for (j = 0; j < NY; j++) for (i = 0; i < NX; i++) {
      var k = j * W + i; idx.push(k, k + 1, k + W, k + 1, k + W + 1, k + W);
    }
    return { data: new Float32Array(data), idx: new Uint16Array(idx) };
  }

  function rnd(a, b) { return a + Math.random() * (b - a); }

  var GL = {
    ok: false,
    state: { progress: 0, vel: 0, mx: .5, my: .5, reduced: false },
    target: 0
  };
  window.JTGL = GL;

  GL.init = function (canvas, opts) {
    opts = opts || {};
    var gl = canvas.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'high-performance' }) ||
             canvas.getContext('experimental-webgl');
    if (!gl) return false;

    function prog(vs, fs) {
      function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
      var p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      return p;
    }
    var bg, lf;
    try { bg = prog(VS_BG, FS_BG); lf = prog(VS_LEAF, FS_LEAF); } catch (e) { console.warn('WebGL disabled:', e.message); return false; }

    var quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    var U = function (p, n) { return gl.getUniformLocation(p, n); };
    var bgU = { t: U(bg, 'uTime'), res: U(bg, 'uRes'), m: U(bg, 'uMouse'), s: U(bg, 'uScroll'), base: U(bg, 'uBase'), a: U(bg, 'uA'), b: U(bg, 'uB'), c: U(bg, 'uC') };
    var lfU = { P: U(lf, 'uP'), MV: U(lf, 'uMV'), col: U(lf, 'uCol'), rim: U(lf, 'uRim') };
    var bgA = gl.getAttribLocation(bg, 'p');
    var aPos = gl.getAttribLocation(lf, 'aPos'), aNor = gl.getAttribLocation(lf, 'aNor'), aUv = gl.getAttribLocation(lf, 'aUv');

    var small = Math.min(window.innerWidth, window.innerHeight) < 700;
    var geo = buildLeaf(small ? 6 : 9, small ? 14 : 24);
    var vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bufferData(gl.ARRAY_BUFFER, geo.data, gl.STATIC_DRAW);
    var ibo = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geo.idx, gl.STATIC_DRAW);

    // ---- scene ----
    var CAMZ = 12, FOV = 40 * Math.PI / 180, RANGE = opts.range || 34;
    var COLS = { green: [.35,.6,.13], greenL: [.5,.72,.24], pine: [.2,.44,.14], coral: [.89,.5,.4], sun: [.98,.89,.33], sky: [.27,.67,.92], plum: [.62,.2,.5] };
    var leafPool = ['green','green','green','greenL','greenL','greenL','pine','pine','greenL','green','coral','sun','plum'];
    var leaves = [], blooms = [], W = 1, H = 1, asp = 1, proj;
    var palIdx = opts.palette || 0;
    var cur = PALRGB[palIdx].map(function (c) { return c.slice(); });
    var dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75);

    var count = small ? 24 : 48;
    for (var n = 0; n < count; n++) leaves.push({
      t: n / count, jy: rnd(-1, 1), z: rnd(-9, 3.2), side: Math.random() < .5 ? -1 : 1, edge: rnd(.5, 1.05),
      s: rnd(.4, 1.05), rx: rnd(0, 6.28), ry: rnd(0, 6.28), rz: rnd(0, 6.28),
      vx: rnd(-.25, .25), vy: rnd(-.25, .25), vz: rnd(-.2, .2), ph: rnd(0, 6.28),
      col: COLS[leafPool[(Math.random() * leafPool.length) | 0]], x: 0, y: 0
    });
    for (var q = 0; q < (small ? 3 : 6); q++) leaves.push({
      t: (q + .5) / (small ? 3 : 6), jy: rnd(-1, 1), z: rnd(3.4, 5), side: q % 2 ? -1 : 1, edge: rnd(.9, 1.12),
      s: rnd(1.2, 1.7), rx: rnd(0, 6.28), ry: rnd(0, 6.28), rz: rnd(0, 6.28),
      vx: rnd(-.12, .12), vy: rnd(-.12, .12), vz: rnd(-.1, .1), ph: rnd(0, 6.28),
      col: COLS[q % 2 ? 'pine' : 'green'], x: 0, y: 0 });
    var bloomDefs = opts.blooms || [ { t: 0.0, side: 1, z: 1.2 }, { t: .20, side: 1, z: -3, kind: 1 }, { t: .40, side: -1, z: -2.5, kind: 2 }, { t: .60, side: 1, z: -3, kind: 0 }, { t: .80, side: -1, z: -3.5, kind: 1 }, { t: .95, side: 1, z: -2, kind: 2 } ];
    bloomDefs.forEach(function (b, i) { blooms.push({ kind: b.kind || 0, t: b.t, side: b.side, z: b.z, s: i === 0 ? 1.15 : .75, rot: rnd(0, 6), x: 0, y: 0, ph: i * 1.7, hero: i === 0 }); });

    function halfW(z) { return Math.tan(FOV / 2) * (CAMZ - z) * asp; }
    function layout() {
      leaves.forEach(function (l) { l.x = l.side * halfW(l.z) * l.edge; l.y = 1.5 - l.t * (RANGE + 3) + l.jy * 1.2; });
      blooms.forEach(function (b) {
        var hw = halfW(b.z);
        b.x = b.side * hw * (asp < .8 ? .55 : .62);
        b.y = 0.6 - b.t * (RANGE + 2) - (b.hero ? 0 : 0);
        if (b.hero && asp < .8) { b.x = 0; b.y = -1.8; b.s = .85; }
        else if (b.hero) b.s = 1.15;
      });
    }
    function resize() {
      W = Math.max(1, Math.floor(canvas.clientWidth * dpr)); H = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      canvas.width = W; canvas.height = H; gl.viewport(0, 0, W, H);
      asp = W / H; proj = M.persp(FOV, asp, .1, 60); layout();
    }
    resize();
    var touchy = window.matchMedia && matchMedia('(hover: none)').matches, lastCW = canvas.clientWidth, lastCH = canvas.clientHeight;
    window.addEventListener('resize', function () {
      // Android: the URL bar sliding in/out changes the height constantly. Don't rebuild the canvas for that.
      var w = canvas.clientWidth, h = canvas.clientHeight;
      if (touchy && Math.abs(w - lastCW) < 2 && Math.abs(h - lastCH) < lastCH * .3) return;
      lastCW = w; lastCH = h; resize();
    });

    var sp = 0, mx = .5, my = .5, vel = 0, t0 = performance.now(), frames = 0, acc = 0, last = t0, throttled = false;

    function drawLeaf(model, col, rim, view) {
      gl.uniformMatrix4fv(lfU.MV, false, M.mul(view, model));
      gl.uniform3fv(lfU.col, col); gl.uniform1f(lfU.rim, rim);
      gl.drawElements(gl.TRIANGLES, geo.idx.length, gl.UNSIGNED_SHORT, 0);
    }

    GL.setPalette = function (i) { palIdx = Math.max(0, Math.min(PALRGB.length - 1, i)); };
    GL.frame = function (now) {
      var S = GL.state, red = S.reduced;
      var dt = Math.min(.05, (now - last) / 1000); last = now;
      // adaptive quality: if we are slow, drop resolution once
      if (!red && !throttled) { acc += dt; frames++; if (frames === 90) { if (acc / frames > 1 / 34 && dpr > 1) { dpr = 1; resize(); } throttled = true; } }
      var time = red ? 3 : (now - t0) / 1000;
      sp += (S.progress - sp) * (red ? 1 : 1 - Math.exp(-dt * 6));
      var km = 1 - Math.exp(-dt * 3); mx += (S.mx - mx) * km; my += (S.my - my) * km;
      vel += (Math.min(Math.abs(S.vel), 60) - vel) * (1 - Math.exp(-dt * (touchy ? 2.2 : 5)));
      var tgt = PALRGB[palIdx], k = red ? 1 : 1 - Math.exp(-dt * 2.2);
      for (var a = 0; a < 4; a++) for (var c = 0; c < 3; c++) cur[a][c] += (tgt[a][c] - cur[a][c]) * k;

      gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.useProgram(bg); gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.enableVertexAttribArray(bgA); gl.vertexAttribPointer(bgA, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(bgU.t, time); gl.uniform2f(bgU.res, W, H); gl.uniform2f(bgU.m, mx, 1 - my); gl.uniform1f(bgU.s, sp * 3);
      gl.uniform3fv(bgU.base, cur[0]); gl.uniform3fv(bgU.a, cur[1]); gl.uniform3fv(bgU.b, cur[2]); gl.uniform3fv(bgU.c, cur[3]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.disableVertexAttribArray(bgA);

      gl.enable(gl.DEPTH_TEST); gl.useProgram(lf);
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 32, 0);
      gl.enableVertexAttribArray(aNor); gl.vertexAttribPointer(aNor, 3, gl.FLOAT, false, 32, 12);
      gl.enableVertexAttribArray(aUv); gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 32, 24);
      gl.uniformMatrix4fv(lfU.P, false, proj);

      var camY = -sp * RANGE + (my - .5) * -.7, camX = (mx - .5) * 1.1;
      var view = chain(M.Rx((my - .5) * .03), M.Ry((mx - .5) * -.04), M.T(-camX, -camY, -CAMZ));
      var spin = red ? 0 : 1 + vel * .06;

      leaves.forEach(function (l) {
        var depth = (l.z + 9) / 12.5; // 0 far .. 1 near
        var model = chain(
          M.T(l.x + Math.sin(time * .4 + l.ph) * .25 + (mx - .5) * depth * 1.2, l.y + Math.cos(time * .35 + l.ph) * .3, l.z),
          M.Rz(l.rz + time * l.vz * spin), M.Ry(l.ry + time * l.vy * spin), M.Rx(l.rx + time * l.vx * spin),
          M.S(l.s, l.s, l.s));
        drawLeaf(model, l.col, .8, view);
      });

      blooms.forEach(function (b) {
        var sway = Math.sin(time * .5 + b.ph) * .08;
        var base = chain(
          M.T(b.x + (mx - .5) * .8, b.y + Math.sin(time * .4 + b.ph) * .2, b.z),
          M.Rz(b.rot + time * .07), M.Rx(.55 + (my - .5) * -.35 + sway), M.Ry((mx - .5) * .35),
          M.S(b.s, b.s, b.s));
        var SETS = [
          [COLS.coral, [.97,.68,.55], COLS.sun, [.99,.93,.55]],
          [COLS.plum, [.78,.45,.68], COLS.sun, [.99,.93,.55]],
          [COLS.sun, [.99,.95,.6], [1,.7,.4], [1,.97,.8]]
        ][b.kind || 0];
        var rings = [
          { n: 9, col: SETS[0], sx: .5, sy: .95, tilt: -.55, off: 0, rim: 1 },
          { n: 7, col: SETS[1], sx: .42, sy: .78, tilt: -.95, off: .3, rim: 1 },
          { n: 6, col: SETS[2], sx: .34, sy: .55, tilt: -1.3, off: .1, rim: 1.4 },
          { n: 5, col: SETS[3], sx: .22, sy: .28, tilt: -1.6, off: .5, rim: 1.4 }
        ];
        rings.forEach(function (r) {
          for (var i = 0; i < r.n; i++) {
            var ang = i / r.n * Math.PI * 2 + r.off + time * .03;
            var m = chain(base, M.Rz(ang), M.Rx(r.tilt), M.S(r.sx, r.sy, r.sx), M.T(0, 1, 0));
            drawLeaf(m, r.col, r.rim, view);
          }
        });
      });
      gl.disableVertexAttribArray(aPos); gl.disableVertexAttribArray(aNor); gl.disableVertexAttribArray(aUv);
    };

    GL.ok = true;
    return true;
  };
})();
