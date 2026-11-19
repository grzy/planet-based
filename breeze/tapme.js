// The hero's "⟵ tap ♪" (11-18, Ivy; built and placed in protos/tapme-r3, her locked spot "final"). Every load:
//   ~0.3 s after the hero settles the sun pokes its tongue out and "⟵ tap ♪" writes on in her Rising hand (breeze/hand.js)
//   → a tap or click anywhere on the hero turns sound on and the logo opens with its notes (HeroLogo.replayOnce) while
//   the words un-write; the logo opens ONLY after a tap (the silent roll-out is held off) → when it has folded back,
//   hs:tap-logo-done fires (the hint listens for it) → no tap: it holds ~5 s, un-writes, comes back once ~20 s on.
// Phones: mirrored to the sun's left ("tap ♪ ⟶"); the pencil "sound on" note is hidden while it is up. Reduced motion:
// still words, no tongue. No "seen" memory: it plays every time
window.TAPME = window.TAPME || { v: 'final' };
window.TM_LOCK = window.TM_LOCK || 'tap-note-arrow';
(() => {
  const CFG = window.TAPME || {}, V = CFG.v || 'a';
  const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phone = () => innerWidth < 760;
  const HOLD = 5000, AGAIN = 20000;
  // 11-17 (Ivy): tap me first, ~0.3 s after the hero settles, the hint ~1.2 s after it has written; ?order=hint: the hint first
  const WORDS_AT = 300;
  // ← the size rule, one line: 'column' keeps the words between two string lines (small on laptops); 'free' lets them grow
  //   and cross a string. ?big on the URL is the same as 'free'
  const SIZE_RULE = 'column';
  const BIG = SIZE_RULE === 'free' || /[?&]big\b/.test(location.search);
  const PLACE = /[?&]place\b/.test(location.search), KEY = 'tm-place-' + V;
  const saved = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };

  const css = document.createElement('style');
  css.textContent = '.tapme .pb-copied{opacity:1}'
    + 'html.tm-on .hs-note{display:none}';   // the pencil "sound on" note gives way to the words; the footer's Sound: on/off turns it off
  document.head.appendChild(css);

  // ---------- where: clear of the strings (inside one column), the flowers, the bee, the type, the hint, the slider ----------
  function boxes(layer) {
    const L = layer.getBoundingClientRect(), r = el => { if (!el) return null; const q = el.getBoundingClientRect(); return q.width ? { l: q.left - L.left, t: q.top - L.top, r: q.right - L.left, b: q.bottom - L.top } : null; };
    const hero = document.querySelector('.hero');
    return {
      W: L.width, H: Math.min(L.height, hero.getBoundingClientRect().bottom - L.top),
      sun: r(document.querySelector('.objs .sun')),
      avoid: ['.objs .peony', '.objs .dahlia', '.objs .bee-rest', '.hero .thesis', '.hero .pbs', '.hero .hs-hint', '.hero .mark .pb-logo', '.hero .dateline b', '.hero .dl-sub'].map(s => r(document.querySelector(s))).filter(Boolean),
      cols: [...hero.querySelectorAll('.guides span')].filter(s => getComputedStyle(s).display !== 'none').map(r).filter(Boolean)
    };
  }
  const hit = (a, b, pad = 6) => a.l < b.r + pad && a.r > b.l - pad && a.t < b.b + pad && a.b > b.t - pad;
  // the open spans between string lines (columns and gutters), widest first
  const spans = cols => { const s = []; cols.forEach((c, i) => { s.push([c.l + 3, c.r - 3]); if (cols[i + 1]) s.push([c.r + 3, cols[i + 1].l - 3]); }); return s.filter(([a, b]) => b - a > 20); };
  function snap(x, w, B, reach = 60) {
    let best = null;
    spans(B.cols).forEach(([a, b]) => { if (b - a < w) return; const nx = Math.max(a, Math.min(b - w, x)); const d = Math.abs(nx - x); if (d <= reach && (!best || d < best.d)) best = { x: nx, d }; });
    return best ? best.x : null;
  }
  function place(B, w, h, tries, pad = 0, needCol = true) {
    for (const [x0, y] of tries) {
      const x = needCol && !BIG ? snap(x0, w, B) : x0; if (x == null) continue;
      const box = { l: x - pad, t: y - pad, r: x + w + pad, b: y + h + pad };
      if (box.l < 8 || box.r > B.W - 8 || box.t < 8 || box.b > B.H - 8) continue;
      if (B.avoid.some(o => hit(box, o))) continue;
      if (B.sun && hit(box, B.sun, 2)) continue;
      return { x, y };
    }
    return null;
  }

  // ---------- the sun's tongue ----------
  let sunPrev = null;
  function tongue(onIt) {
    const jit = document.querySelector('.objs .sun .jit'); if (!jit) return;
    const imgs = [...jit.querySelectorAll('img')], tg = jit.querySelector('img.tongue'); if (!tg) return;
    if (onIt && tg.decode && !tg.__ok) { tg.decode().then(() => { tg.__ok = true; if (state === 'shown') tongue(true); }).catch(() => {}); return; }
    if (onIt) { window.__sunHold = true; sunPrev = imgs.find(i => i.classList.contains('on') && i !== tg) || sunPrev; imgs.forEach(i => i.classList.toggle('on', i === tg)); }
    else { if (sunPrev && tg.classList.contains('on')) imgs.forEach(i => i.classList.toggle('on', i === sunPrev)); window.__sunHold = false; }
  }

  // ---------- the words ----------
  let layer = null, pen = null, state = 'idle', timers = [], shows = 0, tapped = false;
  const later = (f, ms) => timers.push(setTimeout(f, ms));
  function build() {
    const objs = document.querySelector('.objs'); if (!objs || !window.pbHand || !window.pbPencil) return false;
    layer = document.createElement('div'); layer.className = 'tapme'; layer.setAttribute('aria-hidden', 'true');
    layer.style.cssText = 'position:absolute;inset:0;z-index:8;pointer-events:none';
    objs.appendChild(layer);
    const B = boxes(layer), s = B.sun; if (!s) return false;
    const ph = phone(), sw = s.r - s.l, sh = s.b - s.t, cx = (s.l + s.r) / 2, mouth = s.t + sh * .62, k = sh / 342;   // k: sizes scale with the sun
    const widest = BIG ? 1e9 : Math.max(0, ...spans(B.cols).map(([a, b]) => b - a)) * .96;   // a hair under, so every column of that width takes it
    const WORDS = window.pbHand('tap me').w;
    // one mark = the words + a flicked arrow at the sun. The words sit between two strings; the arrow may cross one.
    // Nothing touches the type, the flowers, the bee, the hint, the slider or the logo, and the whole mark (arrowhead
    // included) stays outside the sun's box, so the head lands on the green, never hidden behind a ray
    // the sun is round: its rays reach a circle about as wide as its box, so the box's corners are open green
    const inSun = (b, mg = 4) => { const R = sw * .5 + mg, nx = Math.max(b.l, Math.min(cx, b.r)), ny = Math.max(b.t, Math.min((s.t + s.b) / 2, b.b)); return Math.hypot(nx - cx, ny - (s.t + s.b) / 2) < R; };
    function fit(text, wordsRight, target, tries, o = {}) {
      const H = window.pbHand(text), ww = o.free ? target : Math.min(target, widest), w = ww * H.w / WORDS, h = w * H.h / H.w;
      const ok = (x, y) => { const all = { l: x, t: y, r: x + w, b: y + h };
        return !(all.l < 8 || all.r > B.W - 8 || all.t < 8 || all.b > B.H - 8 || B.avoid.some(q => hit(all, q)) || inSun(all, o.margin == null ? 4 : o.margin)); };
      let best = null;
      for (const [x0, y] of tries(w, h)) {
        if (BIG || o.free) { if (ok(x0, y)) { if (!o.left) return { H, x: x0, y, w }; if (!best || x0 < best.x - 2) best = { H, x: x0, y, w }; } continue; }
        // the words into the nearest open span between strings that keeps the whole mark clear
        const wx = wordsRight ? x0 + w - ww : x0;
        const cands = spans(B.cols).filter(([a, b]) => b - a >= ww).map(([a, b]) => { const sx = Math.max(a, Math.min(b - ww, wx)); return { x: x0 + (sx - wx), d: Math.abs(sx - wx) }; })
          .filter(c => c.d <= w * 1.2).sort((p, q) => p.d - q.d);
        const good = cands.filter(c => ok(c.x, y));
        if (o.left) { good.forEach(c => { if (!best || c.x < best.x - 2) best = { H, x: c.x, y, w }; }); continue; }   // a, d (11-17, Ivy): as far left as any spot allows
        if (good.length) return { H, x: good[0].x, y, w };
      }
      if (best) return best;
      return null;
    }
    let m = null, rot = 0;
    const cy = (s.t + s.b) / 2;
    if (/^(d[123]|final)$/.test(V)) {
      // the mark's middle at a height set by the option (a share of the sun's height from its centre), then as far left as
      // the rays allow, the arrowhead on the green. A placement Ivy dragged (?place) wins, kept relative to the sun
      const H = window.pbHand('⟵ tap me'), ww0 = Math.min(ph ? 90 : 140, BIG ? 1e9 : widest), w0 = ww0 * H.w / WORDS, h0 = w0 * H.h / H.w;
      // 11-18: Ivy's own placement for D, locked: x, y from the sun's centre and the width, in sun widths and heights
      const LOCK = { x: .4982, y: -.2452, w: .5779 };
      const sv = saved() || (V === 'final' ? LOCK : null);
      if (sv && isFinite(sv.x) && isFinite(sv.y)) {
        const w = sv.w ? sv.w * sw : w0; m = { H, x: cx + sv.x * sw, y: cy + sv.y * sh, w };
        if (V === 'final') m = variant(m, B, s, cx, cy, sw);
      } else {
        const at = { d1: -.04, d2: .2, d3: -.26, final: -.2452 }[V];
        const tr = (w, h) => { const out = []; for (const oy of [0, .02, -.02, .05, -.05]) for (let x = s.r - sw * .2; x < s.r + 120; x += 3) out.push([x, cy + sh * (at + oy) - h / 2]); return out; };
        // the arrowhead close to the rays matters more than a few px of word size: the words shrink (to ~65%) until the
        // mark sits within ~14 px of the sun's edge, else the biggest spot found
        const base = Math.min(ph ? 90 : 140, widest); let first = null;
        for (const f of [1, .92, .85, .78, .72, .65]) { const q = fit('⟵ tap me', true, base * f, tr, { margin: 2, left: true }); if (!q) continue; first = first || q; if (q.x <= s.r + 14) { m = q; break; } }
        m = m || first || fit('⟵ tap me', true, ph ? 90 : 140, (w, h) => { const out = []; for (const oy of [0, .06, -.06, .12, -.12]) for (let x = s.r - sw * .2; x < s.r + 160; x += 3) out.push([x, cy + sh * (at + oy) - h / 2]); return out; }, { margin: 2, left: true, free: true });
        // a narrow phone: the peony and dahlia crowd the sun's side; the nearest height that has room (d3's, then lower)
        if (!m && ph) for (const alt of [-.26, -.32, .3]) { const t2 = (w, h) => { const out = []; for (let x = s.r - sw * .2; x < s.r + 120; x += 3) out.push([x, cy + sh * alt - h / 2]); return out; };
          for (const f of [1, .85, .72, .62]) { m = fit('⟵ tap me', true, base * f, t2, { margin: 2, left: true }); if (m) break; } if (m) break; }
      }
    } else if (V === 'a') {        // beside the sun's mouth, the arrow pointing into it (left of the words, or right if they sit on the left)
      const t = ph ? 56 : 132;   // phones: the words a little smaller, so they and the arrow fit between the sun and the edge
      m = fit('← tap me', true, t, (w, h) => { const out = []; for (const oy of [0, .1, -.1, .2, -.2, .28]) out.push([s.r + 6, mouth + sh * oy - h * .5]); out.push([s.r - w * .25, s.b - h * .8], [s.r - w * .4, s.b - h * .4], [s.r - w * .2, s.b - h * 1.4]); return out; }, { margin: 6, left: true })   // 11-17 (Ivy): in close (6 px off the rays), the whole arrow on the green
        || fit('tap me →', false, t, (w, h) => [[s.l - w - 6, mouth - h * .55], [s.l - w - 6, mouth - h * .1], [s.l - w - 6, s.b - h * 1.2]], { margin: 6 });
    } else if (V === 'b') { // above the sun on a rising line, the arrow flicking down to it
      rot = -7;
      m = fit('tap me ↓', false, ph ? 86 : 138, (w, h) => { const out = []; for (const fx of [.75, .55, .95, .35, 1.1, .2]) for (const dy of [14, 24, 6]) out.push([cx - w * fx + 8 * k, s.t - h - dy]); return out; });   // 11-17: a touch to the right
    } else if (V === 'c') { // under the sun, a tiny arrow flicked up at it (11-17: a little further down, ~10 px at desktop)
      const drop = 32 * k;   // 11-17 (Ivy): down a little more again
      m = fit('↑ tap me', true, ph ? 96 : 150, (w, h) => { const out = []; for (const dy of [2, 10, 20, 32]) for (const fx of [.2, .1, .35, 0, .5, -.15, .65, -.3]) out.push([cx - w * fx, s.b + dy + drop - sh * .04]); return out; });
    } else {                // the lead line is the arrow: it curves from the words back into the sun, its head just outside the rays
      const dTries = (w, h) => { const out = []; for (const oy of [0, .1, .16, .2, .22, .24, .26, .28]) for (const dx of [-40, -24, -10, 2, 14]) out.push([s.r + dx, mouth + sh * oy - h * .5]);   // 11-17 (Ivy): as far left as the rays allow
        if (ph) for (const f of [.25, .4, .55]) for (const dy of [-.6, -.2, .15]) { out.push([s.r - w * f, s.b + h * dy]); out.push([s.r - w * f, s.t + h * (dy + .6)]); }   // phones: the open corners at the sun's right side
        return out; };
      m = fit('⟵ tap me', true, ph ? 90 : 140, dTries, { margin: 2, left: true })
        || (ph && fit('tap me →', false, 56, (w, h) => [[s.l - w - 18, mouth - h * .55], [s.l - w - 18, mouth - h * .1], [s.l - w - 14, s.b - h * 1.2]], { margin: 16 }));   // a narrow phone: no room right of the sun for the curve; a's left-side mark instead
    }
    const p = m && { x: m.x, y: m.y }, w = m && m.w, H = m && m.H;
    window.__tmDebug = { B, w, p, sun: s };   // for the size sweep
    if (!p) { layer.remove(); layer = null; return false; }
    const box = document.createElement('div');
    box.style.cssText = `position:absolute;left:${p.x.toFixed(1)}px;top:${p.y.toFixed(1)}px;width:${w.toFixed(1)}px;transform:rotate(${rot}deg);transform-origin:0 100%`;
    layer.appendChild(box);
    const light = document.documentElement.dataset.type === 'light', th = document.querySelector('.hero .thesis');
    if (PLACE) {
      box.style.pointerEvents = 'auto'; box.style.cursor = 'grab'; box.style.outline = '1px dashed rgba(255,255,255,.5)'; box.style.outlineOffset = '4px';
      box.style.touchAction = 'none';
      let drag = null;
      box.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); drag = { x: e.clientX, y: e.clientY, l: parseFloat(box.style.left), t: parseFloat(box.style.top) }; box.setPointerCapture(e.pointerId); box.style.cursor = 'grabbing'; });
      box.addEventListener('pointermove', e => { if (!drag) return; box.style.left = (drag.l + e.clientX - drag.x).toFixed(1) + 'px'; box.style.top = (drag.t + e.clientY - drag.y).toFixed(1) + 'px'; });
      box.addEventListener('pointerup', () => {
        if (!drag) return; drag = null; box.style.cursor = 'grab';
        const v = { v: V, x: +((parseFloat(box.style.left) - cx) / sw).toFixed(4), y: +((parseFloat(box.style.top) - cy) / sh).toFixed(4), w: +(w / sw).toFixed(4) };
        try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {}
        panelOut(v);
      });
      panel(() => { const v = saved(); return v || { v: V, x: +((p.x - cx) / sw).toFixed(4), y: +((p.y - cy) / sh).toFixed(4), w: +(w / sw).toFixed(4) }; });
    }
    pen = window.pbPencil(box, { vb: H.vb, w: H.w, h: H.h, strokes: H.strokes, T: H.T, U: H.U, hold: Infinity, still: reduce() });
    const ink = th ? getComputedStyle(th).color : (light ? '#ECE3CC' : '#2c2c2f');
    box.querySelectorAll('.pf').forEach(g => { g.style.fill = ink; });
    box.querySelectorAll('.pc').forEach(q => { q.style.stroke = ink; });
    return true;
  }
  // ?place: a small panel with the values and Copy / Reset (relative to the sun: x, y from its centre and w, in sun widths
  // and heights, so the spot scales with every screen)
  let out = null;
  function panelOut(v) { if (out) out.textContent = JSON.stringify(v); }
  function panel(get) {
    if (document.getElementById('tm-panel')) return panelOut(get());
    const d = document.createElement('div'); d.id = 'tm-panel';
    d.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:9999;background:rgba(14,17,18,.86);color:#ECE6D6;font:12px/1.4 var(--mono,monospace);padding:10px 12px;border-radius:10px;display:flex;gap:8px;align-items:center;max-width:calc(100vw - 24px)';
    d.innerHTML = '<span>Drag the words. </span><code style="opacity:.8"></code><button type="button">Copy</button><button type="button">Reset</button>';
    d.querySelectorAll('button').forEach(b => { b.style.cssText = 'font:inherit;border:0;border-radius:999px;padding:5px 10px;background:#ECE6D6;color:#0E1112;cursor:pointer'; });
    out = d.querySelector('code'); panelOut(get());
    const [cp, rs] = d.querySelectorAll('button');
    cp.onclick = () => { const t = out.textContent; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => { cp.textContent = 'Copied'; setTimeout(() => cp.textContent = 'Copy', 1400); }).catch(() => { prompt('Copy this', t); }); };
    rs.onclick = () => { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); };
    document.body.appendChild(d);
  }
  // ---------- final: the words, with or without the arrow (11-18, Ivy). Her locked spot is for "⟵ tap me"; every variant keeps
  // its letters at that size. With the arrow, the arrow stays where she put it. Without it, the word moves in to sit beside
  // the rays with the same open space the arrowhead had (measured by ink), at her height. A spot that would run off the
  // screen (phones) flips to the sun's left, mirrored ----------
  const VARS = { 'tap-note-arrow': '⟵ tap\u2009♪', 'tap-bang-arrow': '⟵ tap!', 'tap-me-arrow': '⟵ tap me', 'tap-arrow': '⟵ tap', 'tap-bang': 'tap!', 'tap-me': 'tap me' };
  // 11-18 (Ivy's pick, the default): "⟵ tap!", the word a touch down and toward the arrow, the arrow where she put it
  const NUDGE = { 'tap-bang-arrow': [-.18, .2], 'tap-note-arrow': [-.18, .2] };
  // 11-18 (Ivy): on "⟵ tap!" the arrow and the "!" stem drawn ~18% smaller; each about the end nearest the word (the "!"
  // about its foot), so the arrow-to-word and word-to-"!" gaps hold; the dot stays its size
  const GSCALE = { 'tap-bang-arrow': { '⟵': [.82, 2.65, .7], '⟶': [.82, .1, .7], '!': [.82, .2, .64] }, 'tap-note-arrow': { '⟵': [.82, 2.65, .7], '⟶': [.82, .1, .7] } };
  const pick = () => { if (window.TM_LOCK) return window.TM_LOCK; const q = location.search.match(/[?&]tm=([a-z-]+)/); let v = q && q[1]; if (!VARS[v]) { try { v = localStorage.getItem('tm-variant-3'); } catch (e) {} } return VARS[v] ? v : 'tap-note-arrow'; };
  function variant(m, B, s, cx, cy, sw) {
    const v = pick(), H0 = window.pbHand('⟵ tap me'), k = m.w / H0.w, pad = 6 * k, R = sw / 2;
    const h0 = H0.h * k, midY = m.y + h0 / 2;
    const edge = (y, side) => cx + side * Math.sqrt(Math.max(0, R * R - (y - cy) * (y - cy)));
    const gap = m.x + pad - edge(midY, 1);                      // the open green between the rays and her arrowhead
    const arrow = /arrow/.test(v);
    const nud = NUDGE[v];
    const opt = (sh) => Object.assign(sh ? { shift: sh } : {}, GSCALE[v] ? { gscale: GSCALE[v] } : {});
    let text = VARS[v], H = window.pbHand(text, opt(nud)), w = H.w * k, h = H.h * k, y = midY - h / 2;
    if (GSCALE[v]) { const Hr = window.pbHand(text, nud ? { shift: nud } : {}); y = midY - Hr.h * k / 2 + (Hr.oy - H.oy) * k; }   // the words stay at the height they had
    // no arrow: a word needs more air than an arrowhead; about the width of its own "a" off the rays (~7% of the sun)
    const air = arrow ? gap : Math.max(gap, sw * .07);
    let x = arrow ? m.x - (GSCALE[v] ? sw * .008 : 0) : edge(midY, 1) + air - pad;   // the smaller arrowhead sits ~3 px further off; brought back in
    if (x + w > B.W - 8) {                                      // off the right edge: the sun's left side, mirrored
      if (arrow) { text = text.replace('⟵ ', '') + ' ⟶'; const ms = nud ? [-nud[0], nud[1]] : null; H = window.pbHand(text, opt(ms)); w = H.w * k; h = H.h * k; y = midY - h / 2;
        if (GSCALE[v]) { const Hr = window.pbHand(text, ms ? { shift: ms } : {}); y = midY - Hr.h * k / 2 + (Hr.oy - H.oy) * k; } }
      const room = edge(midY, -1) - air + pad - 8;
      if (w > room) { const f = room / w; w *= f; h *= f; y = midY - h / 2; }   // a narrow phone: a little smaller, never into the rays
      x = edge(midY, -1) - air + pad - w;
    }
    variantPanel(v);
    return { H, x, y, w };
  }
  function variantPanel(cur) {
    if (window.TM_LOCK) return;   // the hint pages: tap is decided ("⟵ tap!"), no switch
    if (document.getElementById('tm-vars')) return;
    const d = document.createElement('div'); d.id = 'tm-vars';
    d.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:9999;background:rgba(14,17,18,.86);color:#ECE6D6;font:12px/1.4 var(--mono,monospace);padding:8px 10px;border-radius:10px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;max-width:calc(100vw - 24px)';
    const names = { 'tap-note-arrow': '⟵ tap\u2009♪', 'tap-bang-arrow': '⟵ tap!', 'tap-me-arrow': '⟵ tap me', 'tap-arrow': '⟵ tap', 'tap-bang': 'tap!', 'tap-me': 'tap me' };
    d.innerHTML = Object.entries(names).map(([k, n]) => `<button type="button" data-v="${k}">${n}</button>`).join('') + '<button type="button" data-copy>Copy</button>';
    d.querySelectorAll('button').forEach(b => { const on = b.dataset.v === cur; b.style.cssText = 'font:inherit;border:0;border-radius:999px;padding:5px 10px;cursor:pointer;' + (on ? 'background:#ECE6D6;color:#0E1112' : 'background:transparent;color:#ECE6D6;box-shadow:inset 0 0 0 1px rgba(236,230,214,.4)');
      b.onclick = () => { if (b.dataset.copy != null) { const t = JSON.stringify({ variant: cur }); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => { b.textContent = 'Copied'; setTimeout(() => b.textContent = 'Copy', 1400); }).catch(() => {}); return; }
        try { localStorage.setItem('tm-variant-3', b.dataset.v); } catch (e) {} location.reload(); }; });
    document.body.appendChild(d);
  }
  function show() {
    if (state !== 'idle' || tapped) return;
    if (!build()) return;
    state = 'shown'; shows++; document.documentElement.classList.add('tm-on');
    if (!reduce()) tongue(true);
    const end = reduce() ? 0 : (pen && pen.end) || 1.6;
    if (!PLACE) later(() => { if (state === 'shown') gone(false); }, (end + HOLD / 1000) * 1000);
  }
  function gone(byTap) {
    if (state !== 'shown') return; state = 'gone';
    timers.forEach(clearTimeout); timers = [];
    const rm = reduce(), L = layer;
    const out = rm ? L.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' }).finished.catch(() => {}) : pen ? pen.unwrite(0) : Promise.resolve();
    out.then(() => {
      if (L) L.remove(); if (layer === L) layer = null;
      if (byTap) setTimeout(() => tongue(false), 900); else tongue(false);
      dispatchEvent(new CustomEvent('tm:gone', { detail: { byTap, shows } }));   // hint-r1 listens
      state = 'idle'; setTimeout(() => { if (state !== 'shown') document.documentElement.classList.remove('tm-on'); }, byTap ? 2800 : 0);
      if (!byTap && shows < 2) later(show, AGAIN);   // once more, ~20 s on; then never again
    });
  }
  // a tap or click on the hero (anything but a link or a button): sound on (shared/song.js), the logo's moment with sound
  addEventListener('pointerdown', e => {
    if (PLACE || tapped || e.button > 0) return;
    const hero = document.querySelector('.hero'), r = hero && hero.getBoundingClientRect();
    if (!r || e.clientY < r.top || e.clientY > r.bottom) return;
    if (e.target.closest && e.target.closest('a,button,input')) return;
    tapped = true; timers.forEach(clearTimeout); timers = [];
    if (state === 'shown') gone(true);
    if (window.HeroLogo && HeroLogo.replayOnce) HeroLogo.replayOnce();
    let done = false; const fin = () => { if (done) return; done = true; dispatchEvent(new CustomEvent('hs:tap-logo-done')); };
    addEventListener('hs:logo-rolled', () => setTimeout(fin, 0), { once: true });
    setTimeout(fin, 4000);   // the logo did not open (sound blocked, reduced motion): the hint still comes
  }, { capture: true });
  addEventListener('hs:hero-settled', () => {
    // the silent roll-out never runs before a tap (the logo's first roll-out IS the tap's answer)
    const hold = () => { if (window.HeroLogo && HeroLogo.holdRoll) HeroLogo.holdRoll(2e9); };
    hold(); setTimeout(hold, 0);
    if (reduce()) { show(); return; }
    later(show, WORDS_AT);
  }, { once: true });
  window.__tapme = { show, gone: () => gone(false), get state() { return state; } };
})();
