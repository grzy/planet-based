// HeroLogo: the hero mark as an instrument. Three states on one dial, s in [0, 2] (shared/pose.js):
//   0 THE LOGO (two bars)   1 the barcode   2 planetbased.io
// After the entrance it is playable: hover (or tap, or drag sideways on touch) opens it like an accordion into the
// barcode and the word; it folds back when you leave. With sound on, every bar sounds as you sweep across it.
// The static .pb-logo svg (the page's own logo) is what rests; the animated layer maps onto it exactly every frame.
//
// HeroLogo.word(svg)        build letters + bars into any svg in word units (the loader's word uses this too)
// HeroLogo.mount()          the hero's layer      HeroLogo.render(s)   draw the hero mark at s (the story drives this)
// HeroLogo.enable(opts)     hand it to the visitor ({ askOnOpen: true } asks "Sound?" the first time it opens)
// HeroLogo.screenBars(s, w) screen rects of every bar at s (w: a word instance; default the hero's)
(function () {
  const NS = 'http://www.w3.org/2000/svg', VB = '0 -1000 5600 1300';
  const X = window.HLPose, D = window.HL_DATA, M = X.make(D);
  const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };
  const fx = v => +v.toFixed(3);
  const rectD = r => { r = r.map(fx); return `M${r[0]} ${r[1]}H${r[2]}V${r[3]}H${r[0]}Z`; };

  // ---------- a word instance: letters and bars in one svg ----------
  function word(svg) {
    svg.setAttribute('viewBox', VB);
    let gL = svg.querySelector('.hl-letters');
    if (!gL) { gL = el('g', { class: 'hl-letters' }, svg); D.forEach(g => el('path', { d: g.d }, gL)); }
    const gB = el('g', { class: 'hl-bars' }, svg);
    const els = new Map(M.bars.map(b => [b, el('path', {}, gB)]));
    const w = { svg, gL, gB, rects: null, unit: 1, logo: null };
    // draw at s; logo = [P_LOGO, B_LOGO] in this svg's units (the bars' rest when folded); fadePx: bars thinner fade out
    w.draw = (s, logo, opts = {}) => {
      const r = svg.getBoundingClientRect(); w.unit = r.width / 5600 || w.unit;
      const L = logo || w.logo || [M.P.s, M.B.s];
      const A = M.at(s, L[0], L[1]); w.rects = A.rects;
      for (const [b, p] of els) {
        const rr = A.rects.get(b), wd = rr ? rr[2] - rr[0] : 0, show = rr && wd > .3;
        p.style.display = show ? '' : 'none';
        if (!show) continue;
        const d = rectD(rr); if (p.getAttribute('d') !== d) p.setAttribute('d', d);
        const o = b === M.P || b === M.B ? 1 : X.smooth(wd * w.unit / 6);
        p.style.opacity = o >= 1 ? '' : o.toFixed(4);
      }
      const lo = opts.letters != null ? opts.letters : A.letters;
      gL.style.display = lo <= 0 ? 'none' : ''; gL.style.opacity = lo >= 1 ? '' : lo.toFixed(4);
      w.s = s;
    };
    // screen rects of every bar at s (px, viewport), in reading order
    w.screen = (s, logo) => {
      const r = svg.getBoundingClientRect(), k = r.width / 5600, L = logo || w.logo || [M.P.s, M.B.s], A = M.at(s, L[0], L[1]);
      return M.bars.map(b => { const q = A.rects.get(b); return q ? [r.left + q[0] * k, r.top + (q[1] + 1000) * k, r.left + q[2] * k, r.top + (q[3] + 1000) * k] : null; });
    };
    w.box = () => { const r = svg.getBoundingClientRect(), k = r.width / 5600; const b = D.reduce((a, g) => [Math.min(a[0], g.bb[0]), Math.min(a[1], g.bb[1]), Math.max(a[2], g.bb[2]), Math.max(a[3], g.bb[3])], [1e9, 1e9, -1e9, -1e9]); return [r.left + b[0] * k, r.top + (b[1] + 1000) * k, r.left + b[2] * k, r.top + (b[3] + 1000) * k]; };
    return w;
  }

  // ---------- the hero's mark ----------
  let mark = null, logoSvg = null, hw = null, s = 0, target = 0, raf = 0, last = 0, live = false, opts = {}, openedOnce = false;
  function logoRects() {
    const a = logoSvg.getBoundingClientRect(), l = hw.svg.getBoundingClientRect(), k = l.width / 5600, bw = a.width / 3;
    if (!k || !bw) return hw.logo;
    const map = r => [(a.left + r[0] * bw - l.left) / k, (a.top + r[1] * bw - l.top) / k - 1000, (a.left + r[2] * bw - l.left) / k, (a.top + r[3] * bw - l.top) / k - 1000];
    return (hw.logo = [map([0, 1, 1, 5.95]), map([2, 0, 3, 4.95])]);
  }
  function mount() {
    if (hw) return hw;
    mark = document.querySelector('.hero .mark');
    logoSvg = mark && mark.querySelector('.pb-logo, .mono-pb');
    if (!mark || !logoSvg) return null;
    logoSvg.classList.add('hl-rest');
    const svg = el('svg', { class: 'hl-layer', 'aria-hidden': 'true', focusable: 'false' }, mark);
    hw = word(svg);
    return hw;
  }
  // 11-14 (Ivy): the sound is locked to the motion. Each beat of the pose sounds on the very frame the mark passes it,
  // opening or folding (so folding plays the same notes, falling): the p bar setting (.15), the bars between opening
  // (.25), the bars after the b opening (.55), the b landing on its stem (.7), the barcode whole (1); then the letters
  // half grown (1.5) and the word whole (2). Bars play the balafon run, letters the word's gender
  const BEATS = [[.15, 'f', 0], [.25, 'f', 1], [.55, 'f', 2], [.7, 'f', 3], [.995, 'f', 4], [1.5, 'b', 7], [1.99, 'b', 9]];
  function beats(a, b) {
    if (!live || a === b || !window.HeroSound) return;
    const up = b > a, list = up ? BEATS : BEATS.slice().reverse();
    list.forEach(([th, v, k]) => { if (up ? (a < th && b >= th) : (a >= th && b < th)) HeroSound.play(v, k, v === 'f' ? { single: k, pan: (k - 2) * .18, amp: nudging ? .5 : 1 } : { amp: nudging ? .45 : .8 }); });
  }
  function render(v) {
    if (!mount()) return;
    const was = s;
    s = Math.max(0, Math.min(2, v));
    beats(was, s);
    logoRects();
    hw.draw(s, hw.logo);
    mark.classList.toggle('hl-open', s > .0005);
  }
  // the visitor's dial: s moves toward the target at one steady pace (0 to 2 in 1.1 s); the pose eases within it
  function tick(now) {
    const dt = Math.min(48, now - (last || now)); last = now;
    const d = target - s, step = dt / 550;
    render(Math.abs(d) <= step ? target : s + Math.sign(d) * step);
    raf = s !== target ? requestAnimationFrame(tick) : 0;
    if (!raf) last = 0;
  }
  // opening plays a short rising flourish, folding a falling one (once per gesture)
  let lastFlour = 0;
  function flourish(dir) { const now = performance.now(); if (now - lastFlour < 1500 || !window.HeroSound) return; lastFlour = now; HeroSound.play('f', 0, { dir }); }
  function go(t) { target = Math.max(0, Math.min(2, t)); if (!raf && target !== s) raf = requestAnimationFrame(tick); if (target > 0) firstOpen(); }
  function firstOpen() {
    if (openedOnce) return; openedOnce = true;
    if (opts.askOnOpen && window.HeroSound) HeroSound.ask(mark.closest('.hero'), { onAnswer: () => {} });
  }
  // the zone: the logo (closed) or the open word, with room to spare, so opening never makes it close
  function zone(pad) {
    const a = logoSvg.getBoundingClientRect(), r = [a.left, a.top, a.right, a.bottom];
    if (s > .02) { const b = hw.box(); r[0] = Math.min(r[0], b[0]); r[1] = Math.min(r[1], b[1]); r[2] = Math.max(r[2], b[2]); r[3] = Math.max(r[3], b[3]); }
    return [r[0] - pad, r[1] - pad, r[2] + pad, r[3] + pad];
  }
  const inside = (e, z) => e.clientX >= z[0] && e.clientX <= z[2] && e.clientY >= z[1] && e.clientY <= z[3];
  let over = null, lastNote = new Map(), drag = null;
  function sound(e) {
    if (!window.HeroSound || !HeroSound.on() || !hw.rects) return;
    const sr = hw.screen(s, hw.logo);
    let found = -1, best = 1e9;
    sr.forEach((r, i) => { if (!r) return; const cx = (r[0] + r[2]) / 2, dx = Math.abs(e.clientX - cx), reach = Math.max(10, (r[2] - r[0]) / 2 + 6); if (dx < reach && dx < best && e.clientY > r[1] - 40 && e.clientY < r[3] + 40) { best = dx; found = i; } });
    if (found >= 0 && found !== over) {
      const now = performance.now(), b = M.bars[found];
      if (!lastNote.get(found) || now - lastNote.get(found) > 90) {
        HeroSound.play('b', found, { down: b.s[3] > 100, pan: (e.clientX / innerWidth) * 1.6 - .8 });   // the word: each bar a vibraphone note
        lastNote.set(found, now);
        if (window.HeroStory && HeroStory.ripple) HeroStory.ripple(found);
      }
    }
    over = found;
  }
  function enable(o = {}) {
    if (!mount() || live) return; live = true; opts = o;
    const hero = mark.closest('.hero');
    let scrolledAt = 0; addEventListener('scroll', () => { scrolledAt = performance.now(); }, { passive: true });
    hero.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      if ((window.HeroAtRest && !HeroAtRest()) || performance.now() - scrolledAt < 250 || (e.movementX === 0 && e.movementY === 0)) return;   // a scroll's moves never play the word
      const open = target > 0, z = zone(open ? 28 : 10);
      if (inside(e, z)) { touch(); if (!open) go(2); sound(e); } else if (open && !replaying && !nudging) go(0);
    });
    hero.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch' && !replaying && !nudging) go(0); });
    // touch: tap toggles, a sideways drag scrubs (vertical drags still scroll the page: touch-action pan-y on the mark)
    mark.addEventListener('pointerdown', e => {
      touch();
      if (e.pointerType === 'mouse') return;
      drag = { x: e.clientX, s0: s, moved: false, id: e.pointerId };
    });
    addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 8) drag.moved = true;
      if (drag.moved) { const span = Math.max(120, (hw.box()[2] - hw.box()[0]) * .5); cancelAnimationFrame(raf); raf = 0; target = Math.max(0, Math.min(2, drag.s0 + dx / span)); render(target); firstOpen(); sound(e); }
    });
    addEventListener('pointerup', e => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved) go(target > 0 || s > .5 ? 0 : 2); else go(Math.round(s));
      drag = null;
    });
    addEventListener('pointercancel', e => { if (drag && e.pointerId === drag.id) { go(Math.round(s)); drag = null; } });
    // a tap anywhere else folds a tapped-open mark
    addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' && target > 0 && !mark.contains(e.target) && !(e.target.closest && e.target.closest('.hs-ask'))) go(0); }, { capture: true });
    mark.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); touch(); go(s > .5 ? 0 : 2); } });
    mark.tabIndex = 0; mark.setAttribute('aria-label', 'planetbased.io: open the logo into its barcode and name');
    scheduleNudge();
  }
  // ---------- the roll-out (11-14, Ivy): the logo opens into planetbased.io on its own and folds back, as the hint that it
  // opens: first ~7 s after the hero settles, then every 45-60 s while the logo is on screen, until the visitor plays with
  // it. Silent until sound is on, then its own notes, softly. Never during interaction; reduced motion skips it. The first
  // one finishing tells the hint under the slider to arrive (hs:logo-rolled, shared/song.js) ----------
  let touched = false, nudging = false, nudgeT = 0, rolledOnce = false, queueRoll = null;
  function touch() {
    if (nudging) { nudging = false; clearTimeout(nudgeT); }
    if (!touched) { touched = true; dispatchEvent(new CustomEvent('hs:logo-touched')); }
  }
  function rolled() { if (rolledOnce) return; rolledOnce = true; dispatchEvent(new CustomEvent('hs:logo-rolled')); }
  // the first time a visitor turns sound on (their first touch), the logo plays its open and fold once with its notes on
  // the beat, so the sound the preloader could not play is heard (11-14, Ivy). Not if they are touching the logo
  let replayed = false, replaying = false;
  function replayOnce() {
    if (replayed || touched || !live) return; replayed = true;
    const t0 = performance.now();
    const wait = () => {
      if (touched) return;
      if (window.HeroSound && HeroSound.on()) { nudging = false; clearTimeout(nudgeT); replaying = true; go(2); setTimeout(() => { if (!touched) go(0); setTimeout(() => { replaying = false; rolled(); if (queueRoll && !touched) queueRoll(45000 + Math.random() * 15000); }, 1200); }, 1100 + 700); }   // (it counts as a roll-out)
      else if (performance.now() - t0 < 3000) setTimeout(wait, 60);   // (iOS: the audio starts as the finger lifts)
    };
    setTimeout(wait, 120);
  }
  function scheduleNudge() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setTimeout(rolled, 1800); return; }
    let quietSince = performance.now();   // a click, a key or a scroll holds it back a moment (pointer moves don't)
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(t => addEventListener(t, () => { quietSince = performance.now(); }, { passive: true, capture: true }));
    const onScreen = () => { const r = logoSvg.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; };
    const tryRoll = () => {
      if (touched) return;
      if (nudging || replaying || target > 0 || !onScreen() || performance.now() - quietSince < 900 || document.hidden) { nudgeT = setTimeout(tryRoll, 1500); return; }
      nudging = true; go(2);                                      // opens all the way (~1.1 s), holds, folds (~1.1 s)
      nudgeT = setTimeout(() => {
        if (!nudging) return;
        go(0);
        nudgeT = setTimeout(() => { nudging = false; rolled(); queueRoll(45000 + Math.random() * 15000); }, 1150);
      }, 1100 + 1400);
    };
    queueRoll = d => { clearTimeout(nudgeT); nudgeT = setTimeout(tryRoll, d); };
    nudgeT = setTimeout(tryRoll, 7000);
  }
  window.HeroLogo = { word, mount, render, enable, go, flourish, replayOnce, screenBars: (v, w) => (w || mount()).screen(v, (w || hw).logo || (w ? null : logoRects())), get s() { return s; }, bars: M.bars, M, logoRects: () => (mount(), logoRects()) };
})();
