// HeroStrings (option c): the hero's faint guide lines are strings. Sweep the pointer across them and each one you
// cross is plucked (it shivers, and with sound on it sounds, pitched low on the left to high on the right). The sun and
// the two flowers each hang on a string of their own: grab one and slide it up or down its string, and it plays as it
// travels (higher up, higher note). The logo's bars and the barcode share the same voice: one instrument.
//   HeroStrings.positions()       the strings' x (viewport px): the guides' edges, then the sun's, peony's, dahlia's
//   HeroStrings.mount(opacity)    put the strings into the hero (they replace the drawn guides)
//   HeroStrings.pluck(i, amp)     shiver string i
(function () {
  let hero = null, layer = null, els = [], xs = [], objs = [], live = false;
  const OBJ = ['.sun', '.peony', '.dahlia'];
  // 11-14 (the real dahlia bug): the dahlia and its resting bee are placed from the BOTTOM (and the right) on desktop, and
  // a margin-top never moves a bottom-anchored box. Every move sets both sides, so it works however a thing is anchored
  const setY = (el, m) => { el.style.marginTop = m.toFixed(1) + 'px'; el.style.marginBottom = (-m).toFixed(1) + 'px'; };
  const setX = (el, m) => { el.style.marginLeft = m.toFixed(2) + 'px'; el.style.marginRight = (-m).toFixed(2) + 'px'; };
  let snapOpt = true, baseOp = .1;
  function positions(opts = {}) {
    if (opts.snap != null) snapOpt = opts.snap;
    hero = document.querySelector('.hero');
    const hr = hero.getBoundingClientRect(), out = [];
    hero.querySelectorAll('.guides span').forEach(sp => {
      if (getComputedStyle(sp).display === 'none') return;
      const r = sp.getBoundingClientRect(); out.push(r.left + .5, r.right - .5);
    });
    const g = out.map(x => ({ x, kind: 'guide' }));
    OBJ.forEach(sel => { const o = document.querySelector('.objs ' + sel); if (!o) return; const r = o.getBoundingClientRect(); g.push({ x: r.left + r.width / 2, kind: 'obj', sel, top: r.top, bottom: r.bottom }); });
    // an object that already hangs on a guide (the sun on phones) shares that string instead of doubling it
    // and one within a gutter's width of a guide moves onto that guide (a nudge sideways), so no two lines ever run
    // side by side
    const near = Math.max(16, (hero.clientWidth || innerWidth) * .012);
    // (b: snap false, its object strings are invisible, so nothing moves sideways after the entrance)
    if (snapOpt) for (let k = g.length - 1; k >= 0; k--) if (g[k].kind === 'obj') {
      let on = null, best = near; g.forEach(s => { if (s.kind === 'guide' && Math.abs(s.x - g[k].x) < best) { best = Math.abs(s.x - g[k].x); on = s; } });
      if (on) {
        const o = document.querySelector('.objs ' + g[k].sel), dx = on.x - g[k].x;
        if (o && Math.abs(dx) >= .5) { const mx = (parseFloat(o.style.marginLeft) || 0) + dx; setX(o, mx); if (g[k].sel === '.dahlia') { const r = document.querySelector('.objs .bee-rest'); if (r) setX(r, mx); } }
        Object.assign(on, { kind: 'obj', sel: g[k].sel, top: g[k].top, bottom: g[k].bottom }); g.splice(k, 1);
      }
    }
    // 11-15 (Ivy): B on desktop. The sun's own string has no drawn guide under it (B mounts the strings at 0 over the
    // drawn guides), so it only shows while it shivers: a small surprise she keeps. It hung at the sun's centre, a little
    // left of the even spacing; it moves to the midpoint of its neighbours, as long as that stays under the sun
    if (!snapOpt && innerWidth >= 760) {
      const sun = g.find(t => t.sel === '.sun');
      if (sun) {
        const xsOther = g.filter(t => t !== sun).map(t => t.x), l = Math.max(-1e9, ...xsOther.filter(x => x < sun.x)), r = Math.min(1e9, ...xsOther.filter(x => x > sun.x));
        const o = document.querySelector('.objs .sun'), b = o && o.getBoundingClientRect(), mid = (l + r) / 2;
        if (b && isFinite(mid) && l > -1e9 && r < 1e9 && mid > b.left + b.width * .2 && mid < b.right - b.width * .2) sun.x = mid;
      }
    }
    xs = g.map(s => ({ ...s, x: s.x - hr.left }));
    return g;
  }
  function mount(opacity = .1) {
    baseOp = opacity;
    if (!hero) positions();
    if (layer) layer.remove();
    layer = document.createElement('div'); layer.className = 'hs-strings'; layer.setAttribute('aria-hidden', 'true');
    hero.insertBefore(layer, hero.querySelector('.art'));   // under the type and the logo: a string never crosses the mark
    els = xs.map((s, i) => { const d = document.createElement('i'); d.style.left = s.x.toFixed(2) + 'px'; d.style.opacity = (s.kind === 'obj' ? opacity * 1.6 : opacity).toFixed(3); layer.appendChild(d); return d; });
    pencilLayer();
    if (!live) wire();
    live = true;
  }
  // each string's step in the shared tuning: low on the left, high on the right
  const rankOf = i => xs.map((s, k) => [s.x, k]).sort((a, b) => a[0] - b[0]).findIndex(a => a[1] === i);
  // more strings than notes (the guide edges come in pairs): a string that would repeat its neighbour's note plays it an
  // octave lower and softer, like a thumb on the bass between fingers, so a sweep never flams the same pitch twice
  const stepOf = i => Math.round(rankOf(i) * 13 / Math.max(1, xs.length - 1));
  const thumb = i => { const r = rankOf(i); return r > 0 && Math.round((r - 1) * 13 / Math.max(1, xs.length - 1)) === stepOf(i); };
  const stringFor = step => { let k = 0, best = 1e9; xs.forEach((s, i) => { const d = Math.abs(stepOf(i) - step); if (d < best) { best = d; k = i; } }); return k; };
  const panOf = i => (xs[i].x / hero.clientWidth) * 1.6 - .8;
  // 11-14 (Ivy): Spanish and romantic. A sweep is a soft rolled chord (a gentle rasgueado): every string it crosses
  // sounds the nearest tone of one chord of the Andalusian cadence, Am, G, F, then E major, home; each new sweep moves to
  // the next chord (a long pause starts again from Am). A lone pluck is the string's own note; now and then it blooms into
  // a soft tremolo, or leans on the note a half step above and settles (the Phrygian sigh). Tender, never flashy
  const CHORDS = [[9, 0, 4], [7, 11, 2], [5, 9, 0], [4, 8, 11]];   // Am G F E (pitch classes)
  let chordI = 0, inRow = 0, lastAt = 0, endT = 0, soloT = 0;
  const snap = (m, ch) => { for (const d of [0, -1, 1, -2, 2, -3, 3]) if (ch.includes(((m + d) % 12 + 12) % 12)) return m + d; return m; };
  const note = (i, amp = 1) => {
    if (!window.HeroSound) return;
    const now = performance.now(), gap = now - lastAt; lastAt = now;
    if (gap > 6000) chordI = 0;
    if (gap < 150) inRow++; else { if (inRow >= 3) chordI = (chordI + 1) % 4; inRow = 1; }
    clearTimeout(endT); endT = setTimeout(() => { if (inRow >= 3) { chordI = (chordI + 1) % 4; inRow = 0; } }, 420);
    const th = thumb(i), m0 = HeroSound.midiOf ? HeroSound.midiOf(stepOf(i), th) : null, pan = panOf(i);
    if (gap < 150 || inRow > 1) {                       // in a sweep: a tone of the chord
      clearTimeout(soloT);
      HeroSound.play('g', stepOf(i), { midi: m0 != null ? snap(m0, CHORDS[chordI]) : undefined, amp: (th ? .5 : .72) * amp, down: th, pan, bright: .22 });
      return;
    }
    HeroSound.play('g', stepOf(i), { amp: th ? amp * .6 : amp, down: th, pan, bright: th ? .2 : .3 + .25 * amp });
    // a lone pluck (nothing follows within a beat): sometimes a little more
    clearTimeout(soloT);
    soloT = setTimeout(() => {
      if (performance.now() - lastAt < 170 || m0 == null) return;
      const r = Math.random();
      if (r < .18) [0, 1, 2].forEach(k => setTimeout(() => HeroSound.play('g', stepOf(i), { midi: m0, amp: .32 - k * .07, pan, bright: .18, replay: true }), k * 82));   // tremolo
      else if (r < .32) { HeroSound.play('g', stepOf(i), { midi: m0 + 1, amp: .3, pan, bright: .2, replay: true }); setTimeout(() => HeroSound.play('g', stepOf(i), { midi: m0, amp: .36, pan, bright: .2, replay: true }), 190); }   // the sigh
    }, 180);
  };
  // ---------- the pencil vibration (11-14, Ivy): a plucked, strummed or dragged string shivers as the same loose pencil
  // scribble the strings fell in as, and settles back into its clean line. Drawn in the strings' own layer (under the
  // type and the logo), one loop for every string in motion; a string plucked again takes the larger swing
  const NS = 'http://www.w3.org/2000/svg', DUR = 720, active = new Map();
  let svg = null, loop = 0;
  // one pencil stroke down a string at x: the wobble the falling strings use (c/variant.js draws with this too)
  function scribblePath(x, L, amp, i, q, t, k) {
    let d = '';
    for (let y = 0; y <= L + 1; y += 18) {
      const yy = Math.min(y, L), ph = i * 1.7 + q * 2.1;
      const xx = x + amp * (Math.sin(yy / 41 + ph + t / 260) * .65 + Math.sin(yy / 11 + ph * 1.3) * .35) + (q ? (1 - k) * 1.8 : 0);
      d += (y ? 'L' : 'M') + xx.toFixed(2) + ' ' + yy.toFixed(1);
    }
    return d;
  }
  function pencilLayer() {
    svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'hs-strum'); svg.setAttribute('aria-hidden', 'true');
    layer.appendChild(svg);
  }
  function step(now) {
    loop = 0;
    const H = hero.clientHeight;
    active.forEach((v, i) => {
      const d = els[i], k = Math.min(1, (now - v.t0) / DUR);
      if (k >= 1 || !d) { if (d) d.style.visibility = ''; v.p.forEach(p => p.remove()); active.delete(i); return; }
      d.style.visibility = 'hidden';
      const base = d.style.opacity === '' ? .1 : parseFloat(d.style.opacity), e = Math.pow(1 - k, 1.7), A = v.amp * e;
      v.p.forEach((p, q) => {
        p.setAttribute('d', scribblePath(xs[i].x, H, A, i, q, now, k));
        p.setAttribute('stroke-width', q ? (1.1 * e).toFixed(2) : lerp(1.3, 1, k).toFixed(2));
        p.setAttribute('opacity', (q ? (base + .35 * v.peak) * .6 * e : base + (.35 * v.peak) * e).toFixed(3));
      });
    });
    if (active.size) loop = requestAnimationFrame(step);
  }
  const lerp = (a, b, k) => a + (b - a) * k;
  function pluck(i, amp = 1, sound = true) {
    const d = els[i]; if (!d) return;
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && svg) {
      const now = performance.now(), A = 3 + 3.2 * Math.min(1.4, amp), cur = active.get(i);
      const left = cur ? cur.amp * Math.pow(1 - Math.min(1, (now - cur.t0) / DUR), 1.7) : 0;
      const p = cur ? cur.p : [0, 1].map(() => { const n = document.createElementNS(NS, 'path'); n.setAttribute('fill', 'none'); n.setAttribute('stroke-linecap', 'round'); n.setAttribute('stroke-linejoin', 'round'); svg.appendChild(n); return n; });
      active.set(i, { amp: Math.max(A, left), peak: Math.min(1, amp), t0: now, p });
      if (!loop) loop = requestAnimationFrame(step);
    }
    if (sound) note(i, amp);
  }
  // the flowers' and the sun's voices
  const VOICE = { '.peony': 'p', '.dahlia': 'd', '.sun': 's' };
  const FIG = { p: [0, 2, 1], d: [0, 1] };                 // a tap: a little figure (the peony three notes, the dahlia two)
  const limOf = () => hero.clientHeight * .22;
  const stepAt = m => Math.round(10 - (m / limOf()) * 7);   // higher up the string, higher in the tuning
  function voiceStep(sel, step, pan, o = {}) {
    if (!window.HeroSound) return;
    HeroSound.play(VOICE[sel], step, { pan, ...o });   // the sun: a soft chime per step
  }
  function figure(sel, step, pan) {
    const v = VOICE[sel]; if (!window.HeroSound) return;
    if (v === 's') { HeroSound.play('s', step, { pan, tap: true }); return; }   // a tap on the sun: a short castanet roll
    FIG[v].forEach((k, n) => setTimeout(() => HeroSound.play(v, step + k, { pan }), n * 130));
  }
  // ---------- the strum lock (11-15, Ivy, phones): once a touch has played a string, the page holds still: no scroll, no
  // overscroll or edge-swipe navigation where the browser allows it, so a strum is never lost mid-way. It lets go 2.5 s
  // after the last string, or at once on a touch that starts outside the strings. While it holds, the guides glow faintly.
  // iOS Safari: its left-edge back swipe cannot be blocked by a page; the strings keep 22 px clear of that edge ----------
  let locked = false, lockT = 0;
  const unlock = () => { clearTimeout(lockT); if (!locked) return; locked = false; document.documentElement.classList.remove('hs-lock'); };
  function lock() {
    clearTimeout(lockT); lockT = setTimeout(unlock, 2500);
    if (locked) return; locked = true; document.documentElement.classList.add('hs-lock');
  }
  addEventListener('touchmove', e => { if (locked && e.cancelable) e.preventDefault(); }, { passive: false, capture: true });
  addEventListener('touchstart', e => {
    if (!locked) return;
    const t = e.touches[0], hr = hero && hero.getBoundingClientRect();
    if (!t || !hr || t.clientY < hr.top || t.clientY > hr.bottom || (e.target.closest && e.target.closest('a,button,.pbs,.work,.closing'))) unlock();
  }, { passive: true, capture: true });
  function wire() {
    // sweeping across the strings plucks every one you cross
    // sweeping anywhere across the hero strums: every string you cross sounds (listened for on the window, so the sun
    // and the flowers, which sit above the hero, never swallow the sweep)
    let lastX = null;
    // 11-14 (Ivy, a stuck hum after scrolling): a page scroll moves the hero under a still pointer and the browser sends
    // moves for it; those never strum. Only real pointer movement, over the hero while it is mostly on screen
    let scrolledAt = 0;
    addEventListener('scroll', () => { scrolledAt = performance.now(); lastX = null; }, { passive: true });
    addEventListener('pointermove', e => {
      if (drag) return;
      const hr = hero.getBoundingClientRect();
      if ((window.HeroAtRest && !HeroAtRest()) || performance.now() - scrolledAt < 250 || (e.movementX === 0 && e.movementY === 0) || hr.bottom < innerHeight * .6 || hr.top > innerHeight * .4) { lastX = null; return; }
      if (e.clientY < hr.top || e.clientY > hr.bottom) { lastX = null; return; }
      if (e.target && e.target.closest && e.target.closest('.work, .closing, footer, .foot, a, button, .pbs')) { lastX = null; return; }
      const x = e.clientX - hr.left;
      const touchy = e.pointerType === 'touch', edge = touchy ? 22 - hr.left : -1e9;   // phones: no string within 22 px of the left edge (iOS back swipe)
      if (lastX != null) xs.forEach((s, i) => { if (s.x > edge && (lastX - s.x) * (x - s.x) < 0) { pluck(i, Math.min(1.4, .5 + Math.abs(x - lastX) / 40)); strumUnderSun(e); if (touchy) lock(); } });
      lastX = x;
    }, { passive: true });
    document.addEventListener('pointerleave', () => { lastX = null; });
    // the sun and the flowers slide along their strings
    let drag = null;
    // a flower's (or the sun's) string can be taken anywhere along it, not only at the flower: a press within reach of
    // the string moves its object
    addEventListener('pointerdown', e => {
      if (drag || e.button > 0 || (window.HeroAtRest && !HeroAtRest())) return;
      const hr = hero.getBoundingClientRect(); if (e.clientY < hr.top || e.clientY > hr.bottom) return;
      if (e.target.closest && e.target.closest('a,button,.pbs,.mark,.hs-ask,.hs-grab,.thesis,.dateline,.dl-sub')) return;
      const x = e.clientX - hr.left, reach = e.pointerType === 'mouse' ? 9 : 16;
      let k = -1, best = 1e9;
      // two strings close together (the phone's peony and dahlia): the one whose flower is nearer the press, up or down
      xs.forEach((s, i) => {
        if (s.kind !== 'obj' || Math.abs(s.x - x) >= reach) return;
        const r = document.querySelector('.objs ' + s.sel).getBoundingClientRect(), dy = e.clientY < r.top ? r.top - e.clientY : e.clientY > r.bottom ? e.clientY - r.bottom : 0;
        const score = Math.abs(s.x - x) + dy * .25; if (score < best + 1e3 && (k < 0 || score < best)) { best = score; k = i; }
      });
      if (k < 0) return;
      const o = document.querySelector('.objs ' + xs[k].sel); if (!o) return;
      e.preventDefault();
      begin(o, k, e);
    }, { capture: true });
    function begin(o, i, e) {
      try { o.setPointerCapture(e.pointerId); } catch (er) {}
      const m = parseFloat(o.style.marginTop) || 0;
      o.style.transition = ''; const br = document.querySelector('.objs .bee-rest'); if (br) br.style.transition = '';
      drag = { o, i, y0: e.clientY, m0: m, last: e.clientY, step: stepAt(m), moved: false, sel: xs[i].sel };
      o.classList.add('hs-held');

    }
    xs.forEach((s, i) => {
      if (s.kind !== 'obj') return;
      const o = document.querySelector('.objs ' + s.sel); if (!o) return;
      o.classList.add('hs-grab'); objs.push(o);
      o.addEventListener('pointerdown', e => {
        if (window.HeroAtRest && !HeroAtRest()) return;   // only while the hero is at rest
        e.preventDefault(); e.stopPropagation();
        begin(o, i, e);
      });
      o.addEventListener('pointermove', e => {
        if (!drag || drag.o !== o) return;
        const hr = hero.getBoundingClientRect(), orr = o.getBoundingClientRect(), m0 = parseFloat(o.style.marginTop) || 0, lim = hero.clientHeight * .22;
        // up only as far as clears the top line, down only as far as stays inside the hero
        const top = Math.min(lim, Math.max(0, orr.top - m0 - hr.top - hero.clientHeight * .14)), bot = Math.min(lim, Math.max(0, hr.bottom - (orr.top - m0 + orr.height * .55)));   // down until about half of it has slipped under the hero's edge
        const m = Math.max(-top, Math.min(bot, drag.m0 + e.clientY - drag.y0));   // up only as far as clears the top line
        setY(o, m);
        // the resting bee rides its flower: it moves with the dahlia, so it is never left on empty air
        if (s.sel === '.dahlia') { const r = document.querySelector('.objs .bee-rest'); if (r) setY(r, m); }
        if (Math.abs(e.clientY - drag.y0) > 4) drag.moved = true;
        // a melodic run: every step of the tuning the flower passes sounds, in order (a sun drag moves its choir)
        const st = stepAt(m);
        if (st !== drag.step) {
          const dir = Math.sign(st - drag.step), steps = [];
          for (let k = drag.step + dir; dir > 0 ? k <= st : k >= st; k += dir) steps.push(k);
          steps.slice(-4).forEach((k, n, arr) => setTimeout(() => voiceStep(s.sel, k, panOf(i), { short: n < arr.length - 1 }), n * 70));
          drag.step = st; pluck(i, .8, false);
        }
      });
      const end = () => {
        if (!(drag && drag.o === o)) return;
        o.classList.remove('hs-held');
        if (!drag.moved) figure(drag.sel, drag.step, panOf(drag.i));   // a tap: its little figure
        drag = null;
      };
      o.addEventListener('pointerup', end); o.addEventListener('pointercancel', end); o.addEventListener('lostpointercapture', end);
      // a press taken on the string (begin from the window) moves here too: pointer capture sends its moves to the object
    });
  }
  // ---------- a strum beneath the sun makes it stick its tongue out (11-14, Ivy) ----------
  // four or more strings crossed in one sweep, passing under the sun (below its middle, within its width): the sun flips
  // to its tongue face for a few seconds (with the palmas), then back; once every 12 s at most. Its own schedule goes on
  let sweep = [], tongueAt = 0;
  function strumUnderSun(e) {
    const now = performance.now(); sweep = sweep.filter(t => now - t < 650); sweep.push(now);
    if (sweep.length < 4 || now - tongueAt < 12000 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const sun = document.querySelector('.objs .sun'), jit = sun && sun.querySelector('.jit'); if (!jit) return;
    const r = sun.getBoundingClientRect();
    if (e.clientY < r.top + r.height * .5 || e.clientX < r.left - r.width * .1 || e.clientX > r.right + r.width * .1) return;
    const imgs = [...jit.querySelectorAll('img')], tg = jit.querySelector('img.tongue'), prev = imgs.find(i => i.classList.contains('on'));
    if (!tg || tg === prev || !tg.complete) return;
    tongueAt = now; sweep = [];
    imgs.forEach(i => i.classList.toggle('on', i === tg));
    if (window.HeroSound) HeroSound.play('s', 0, { tongue: true });
    setTimeout(() => { if (tg.classList.contains('on') && prev && !imgs.some(i => i !== tg && i.classList.contains('on'))) imgs.forEach(i => i.classList.toggle('on', i === prev)); }, 3200);
  }
  // the number row plays the strings, 1 low to 0 high (not while typing, not with modifiers)
  addEventListener('keydown', e => {
    if (!live || (window.HeroAtRest && !HeroAtRest()) || e.metaKey || e.ctrlKey || e.altKey || e.repeat || /input|textarea|select/i.test(e.target.tagName) || (e.target.isContentEditable)) return;
    const k = '1234567890'.indexOf(e.key); if (k < 0) return;
    const order = xs.map((s, i) => [s.x, i]).sort((a, b) => a[0] - b[0]).map(a => a[1]);
    pluck(order[Math.round(k * (order.length - 1) / 9)], 1);
  });
  // a shared song moves things: a flower or the sun to the place on its string that gives a step
  function setObj(sel, step, ms = 360) {
    const o = document.querySelector('.objs ' + sel); if (!o) return;
    const m = (10 - step) / 7 * limOf(), hr = hero.getBoundingClientRect(), r = o.getBoundingClientRect(), m0 = parseFloat(o.style.marginTop) || 0;
    const top = Math.max(0, r.top - m0 - hr.top - hero.clientHeight * .14), bot = Math.max(0, hr.bottom - (r.bottom - m0) - 6), mm = Math.max(-top, Math.min(bot, m));
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    [o, sel === '.dahlia' && document.querySelector('.objs .bee-rest')].forEach(el => { if (!el) return; el.style.transition = reduce ? '' : `margin-top ${ms}ms cubic-bezier(.65,0,.35,1),margin-bottom ${ms}ms cubic-bezier(.65,0,.35,1)`; setY(el, mm); });
  }
  let rz = 0;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (!layer) return; const keep = live; positions(); live = keep; const op = baseOp; layer.remove(); layer = null; mountLines(op); }, 150); });
  function mountLines(opacity) {
    layer = document.createElement('div'); layer.className = 'hs-strings'; layer.setAttribute('aria-hidden', 'true');
    hero.insertBefore(layer, hero.querySelector('.art'));   // under the type and the logo: a string never crosses the mark
    els = xs.map(s => { const d = document.createElement('i'); d.style.left = s.x.toFixed(2) + 'px'; d.style.opacity = (s.kind === 'obj' ? opacity * 1.6 : opacity).toFixed(3); layer.appendChild(d); return d; });
    active.forEach(v => v.p.forEach(p => p.remove())); active.clear(); pencilLayer();
  }
  // when the hero leaves the screen, every hero sound stops at once
  (function io() {
    const h = document.querySelector('.hero'); if (!h || !window.IntersectionObserver) return;
    new IntersectionObserver(es => es.forEach(en => { /* 11-14: no cut on leaving; ringing notes finish, new ones are gated */ }), { threshold: [0, .35, .7] }).observe(h);
  })();
  window.HeroStrings = { positions, mount, pluck, scribblePath, stringFor, setObj, VOICE, get xs() { return xs; } };
})();
