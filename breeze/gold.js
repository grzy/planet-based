// The gold moment (11-18, Ivy picked gold-r2: look c1, moment m4, no shimmer; the type goes gold with it). Ordinary plucks stay plain. A strum right
// across the hero (at least 80% of the strings, one direction, within 700 ms) turns the strings to light gold leaf, with
// the light travelling through it: it blooms out from the string under the sun to the rest, holds while the chord
// rings, fades back over 2 s, then rests 8 s so it stays special. Reduced motion: a gentle fade, all at once.
// It follows shared/strings.js: the shivering strings are read from its .hs-strum paths each frame and drawn on a canvas
// in the strings' own layer; the plain strings step aside only while the gold is up. No glow, blur or filters.
(() => {
  const doc = document.documentElement;
  // 11-18 (Ivy: the light flashed a bright lemon): the band only ever lightens the SAME gold a touch (hue ~40), no pale yellow
  const OCHRE = '#7a4d0e', GOLD = '#c9952e', PALE = '#dfb255', MID = '#d6a645';
  const LEAF = { a: .55, v: .3, hi: .93, mid: .62, edge: .3 };        // light leaf
  const WIN = 700, NEED = .8, RISE = 120, HOLD = 1200, FADE = 600, COOL = 8000, BLOOM = 320;   // 11-18 (Ivy): back quickly, 0.6 s
  const TYPE = '.hero .mark, .hero .dateline b, .hero .thesis';   // the logo (closed or open), the studio line, the thesis (the hint is gold already)
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cv = null, g = null, layer = null, dpr = 1, raf = 0, moment = null, lastMoment = -1e9;
  let hits = [], lastX = null, dirSign = 0, sweepId = null;
  ['pointerup', 'pointercancel'].forEach(t => addEventListener(t, e => { if (e.pointerId === sweepId) { sweepId = null; lastX = null; } }, { passive: true }));

  function mount() {
    layer = document.querySelector('.hero .hs-strings'); if (!layer) return false;
    cv = document.createElement('canvas'); cv.className = 'hs-gold'; cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
    layer.appendChild(cv); g = cv.getContext('2d'); size(); return true;
  }
  function size() { if (!cv) return; dpr = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(layer.clientWidth * dpr); cv.height = Math.round(layer.clientHeight * dpr); }
  const parse = d => { const v = d.match(/-?\d+(\.\d+)?/g); if (!v) return []; const out = []; for (let i = 0; i + 1 < v.length; i += 2) out.push([+v[i], +v[i + 1]]); return out; };
  const line = (x, H) => Array.from({ length: 24 }, (_, j) => [x, H * j / 23]);   // a still string, in the shiver's own steps
  const strings = () => [...layer.querySelectorAll(':scope > i')].map(e => parseFloat(e.style.left)).filter(x => !isNaN(x));

  // the sweep: every string the pointer crosses in one direction within 700 ms
  addEventListener('pointermove', e => {
    if (!layer || (window.HeroAtRest && !HeroAtRest())) { lastX = null; return; }
    if (e.pointerType === 'touch' && !e.isPrimary) return;                 // one finger, as the strings (strings.js)
    if (e.pointerId !== sweepId) { sweepId = e.pointerId; lastX = null; hits = []; }
    const hr = layer.getBoundingClientRect();
    if (e.clientY < hr.top || e.clientY > hr.bottom) { lastX = null; return; }
    const x = e.clientX - hr.left, now = performance.now();
    if (lastX != null && x !== lastX) {
      const d = Math.sign(x - lastX), xs = strings();
      if (d !== dirSign) { hits = []; dirSign = d; }
      xs.forEach((sx, i) => { if ((lastX - sx) * (x - sx) < 0) hits.push([i, now]); });
      hits = hits.filter(h => now - h[1] < WIN);
      if (!moment && xs.length && now - lastMoment > COOL && new Set(hits.map(h => h[0])).size >= Math.ceil(xs.length * NEED)) start(xs);
    }
    lastX = x;
  }, { passive: true });

  function start(xs) {
    const now = performance.now(), W = layer.clientWidth, rm = reduce();
    lastMoment = now; hits = [];
    // the bloom: each string's turn grows with its distance from the string under the sun
    const sun = document.querySelector('.objs .sun'), sr = sun && sun.getBoundingClientRect(), lr = layer.getBoundingClientRect();
    const cx = sr && sr.width ? sr.left + sr.width / 2 - lr.left : W / 2, far = Math.max(cx, W - cx, 1);
    // 11-18 (Ivy): the type turns gold with the strings, on the same curve, each piece when the bloom reaches it
    const type = [...document.querySelectorAll(TYPE)].map(el => { const r = el.getBoundingClientRect(); const ex = r.left + r.width / 2 - lr.left; return r.width ? { el, d: Math.abs(ex - cx), at: rm ? 0 : BLOOM * Math.abs(ex - cx) / far } : null; }).filter(Boolean);
    moment = { t0: now, xs, rm, far, type, at: xs.map(x => rm ? 0 : BLOOM * Math.abs(x - cx) / far) };
    doc.classList.add('hs-goldm');
    if (!raf) raf = requestAnimationFrame(frame);
  }
  // 11-18 (Ivy: the type went white, gold, bright yellow, gold, white): ONE smooth fade from the type's own colour to the
  // one gold (--gold-ink: Deep gold, or the strings' gold on oat), a hold, and ONE smooth fade back. A colour animation
  // between two solid inks is exactly a gold layer crossfaded over the text: straight, no overshoot, no flash
  const IN = 350;
  function tint(el, gold) {
    const ms = reduce() ? 1 : gold ? IN : FADE;
    if (gold) {
      const c0 = getComputedStyle(el).color, gi = getComputedStyle(doc).getPropertyValue('--gold-ink').trim() || '#F0A81C';
      el.__g = { c0, gi, a: [el.animate([{ color: c0 }, { color: gi }], { duration: ms, easing: 'cubic-bezier(.33,0,.2,1)', fill: 'forwards' })] };
    } else if (el.__g) {
      const G = el.__g; G.a.push(el.animate([{ color: G.gi }, { color: G.c0 }], { duration: ms, easing: 'cubic-bezier(.45,0,.25,1)', fill: 'forwards' }));
    }
  }
  const untint = el => { if (el.__g) { el.__g.a.forEach(a => a.cancel()); el.__g = null; } };
  function level(i, now, at) {
    const m = moment, t = now - m.t0 - (at != null ? at : m.at[i]), rise = m.rm ? 500 : RISE;
    if (t < 0) return 0;
    if (t < rise) return t / rise;
    if (t < HOLD) return 1;
    return Math.max(0, 1 - Math.pow((t - HOLD) / FADE, 1.2));
  }
  // light gold leaf: a ribbon of small flakes, a soft ochre edge, the light running through it
  function leaf(pts, s, now, ph) {
    g.lineCap = 'round';
    for (let i = 1; i < pts.length; i++) for (let q = 0; q < 4; q++) {
      const f0 = q / 4, f1 = (q + 1) / 4, [a0, b0] = pts[i - 1], [a1, b1] = pts[i];
      const x0 = a0 + (a1 - a0) * f0, y0 = b0 + (b1 - b0) * f0, x1 = a0 + (a1 - a0) * f1, y1 = b0 + (b1 - b0) * f1;
      const n = (Math.sin(y0 * .37 + ph) + Math.sin(y0 * .11 - ph * .6)) * .5, w = 1.9 + n * .9 * LEAF.v;
      const lit = (Math.sin(y0 * .05 - now / 180 + ph) * .7 + Math.sin(y0 * .31 + ph * 2) * .3 + 1) / 2;
      g.globalAlpha = s * LEAF.a; g.strokeStyle = lit > LEAF.hi ? PALE : lit > LEAF.mid ? MID : GOLD; g.lineWidth = w;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.globalAlpha = s * LEAF.a * LEAF.edge; g.strokeStyle = OCHRE; g.lineWidth = .55;
      g.beginPath(); g.moveTo(x0 + w / 2, y0); g.lineTo(x1 + w / 2, y1); g.stroke();
    }
  }
  function frame(now) {
    raf = 0; if (!g || !moment) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, cv.width / dpr, cv.height / dpr);
    const m = moment, H = layer.clientHeight, shiver = new Map(), paths = layer.querySelectorAll('.hs-strum path');
    for (let i = 0; i < paths.length; i += 2) {            // the shiver's paths come in pairs (the line, a ghost): the line
      const pts = parse(paths[i].getAttribute('d') || ''); if (pts.length < 2) continue;
      let best = -1, bd = 14; m.xs.forEach((x, k) => { const dd = Math.abs(x - pts[0][0]); if (dd < bd) { bd = dd; best = k; } });
      if (best >= 0) shiver.set(best, pts);
    }
    let alive = false;
    m.xs.forEach((x, i) => {
      const s = level(i, now); if (s > 0 || now - m.t0 < m.at[i]) alive = true;
      if (s > 0) leaf(shiver.get(i) || line(x, H), s, now, i * .9);
    });
    // the type: gold as the bloom reaches each piece (one fade in), back after the hold (one fade out); no travelling light
    m.type.forEach(o => {
      const t = now - m.t0 - o.at;
      if (!o.on && t >= 0) { o.on = true; tint(o.el, true); }
      if (o.on && !o.off && t >= HOLD) { o.off = true; tint(o.el, false); }
      if (!o.off || t < HOLD + FADE + 60) alive = true;
    });
    g.globalAlpha = 1;
    if (alive) raf = requestAnimationFrame(frame);
    else { m.type.forEach(o => untint(o.el)); moment = null; doc.classList.remove('hs-goldm'); g.clearRect(0, 0, cv.width, cv.height); }
  }
  const css = document.createElement('style');
  css.textContent = 'html.hs-goldm .hero .hs-strum{stroke:transparent}html.hs-goldm .hero .hs-strings > i{visibility:hidden}';
  document.head.appendChild(css);
  addEventListener('resize', size, { passive: true });
  const go = () => { if (!mount()) setTimeout(go, 400); };
  setInterval(() => { if (cv && !cv.isConnected) { cv = null; go(); } }, 1000);   // strings.js remounts its layer on resize
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  window.__gold = { get moment() { return moment; } };   // review
})();
