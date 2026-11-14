// The breeze moment in the closing (11-13, Ivy).
// Clouds hurry in, hand-drawn pencil wind lines draw through left to right (the way the clouds drift), both flowers nod
// with the wind and settle, the orange tree sways from the trunk (the pot never moves) while its canopy rustles, a small
// newt crawls out from behind the pot, climbs to the bare upper-left wall, pauses there, and slips in at the upper window,
// the wind passes, and a few pencil wisps curl up from the chimney and fade. Every line is one of Ivy's Figma pencil
// studies, drawn by breeze/scribble.js. 11-14 (Ivy): the wind is many small gusts spread out: every 6 to 12 s while the
// closing is in view, one gust of one to three lines in its own lane, nudging the flower or the tree it passes; never more
// than about three lines on screen. The full breeze (newt, smoke) comes rarely, its lines spread into separate gusts.
// Pauses off screen; never runs with reduced motion.
// Review: ?breeze (runs right away, B runs it again), ?breeze=4.5 (frozen at 4.5 s), ?seed=N (same layout every run).
(() => {
  const P = window.BREEZE_PATHS;
  const closing = document.querySelector('.closing'), cottage = document.getElementById('cottage');
  const big = document.getElementById('flipBig'), small = document.getElementById('flipSmall'), tree = document.getElementById('potTree');
  if (!P || !window.pbScribble || !closing || !cottage || !big || !small || !tree) return;
  const sway = tree.querySelector('.pt-sway'), canopy = tree.querySelector('.pt-canopy');
  const SRC = 'breeze/', NEWT = 'img/newt-1.webp';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const qs = new URLSearchParams(location.search), review = qs.has('breeze'), freezeAt = parseFloat(qs.get('breeze'));

  const layer = document.createElement('div');
  layer.className = 'breeze'; layer.setAttribute('aria-hidden', 'true');
  closing.appendChild(layer);

  let anims = [], els = [], running = false, inView = false, timer = null, clockAnim = null, ran = 0;
  // ?seed=N (or any frozen review frame) makes every run lay out the same way, so frames from separate loads line up
  const seedQ = qs.get('seed') || (isNaN(freezeAt) ? null : '7');
  let rng = Math.random;
  if (seedQ) { let a = (+seedQ || 7) >>> 0; rng = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const R = (a, b) => a + rng() * (b - a);
  const pick = arr => arr[Math.floor(rng() * arr.length)];
  const rel = el => { const r = el.getBoundingClientRect(), h = closing.getBoundingClientRect(); return { l: r.left - h.left, t: r.top - h.top, w: r.width, h: r.height }; };
  const track = a => (anims.push(a), a);

  const scribble = (key, o) => { const r = window.pbScribble(layer, key, o); els.push(r.el); r.anims.forEach(track); };

  // ---------- one gust: one to three lines in one lane, and a nudge to what it passes ----------
  const thinLines = () => innerWidth < 760;
  let lastKey = '';
  function geo() {
    const H = rel(cottage), B = rel(big), S = rel(small), T = rel(tree), k = H.w / 400, ST = rel(document.querySelector('.studio'));
    let yTop = B.t - 70 * k, yBot = B.t + B.h * .7;
    if (thinLines()) { yTop = Math.max(yTop, ST.t + ST.h + 14); yBot = Math.max(yBot, yTop + 60); }   // phones: under the studio line, never over it
    return { H, B, S, T, k, ST, yTop, yBot, x0: Math.min(S.l, B.l) - 240 * k, x1: H.l + H.w * .18 };
  }
  // add(key, opts) draws a line; nudge(el, amount, t0) makes it move. n lines, at t0 (s), in lane (px), tilted (deg)
  function gustLines(G, t0, n, lane, tilt, add) {
    const thin = thinLines(), k = G.k;
    const pool = thin ? ['W11', 'W11', 'W06', 'W08'] : ['W09', 'W09', 'W03', 'W03', 'W02', 'W02', 'W08', 'W08', 'W06', 'W06', 'W05', 'W11', 'W11'];
    for (let i = 0; i < n; i++) {
      let key; do key = pick(pool); while (key === lastKey); lastKey = key;
      const st = P[key], s = R(.85, 1.2), w = st.w * k * s, h = st.h * k * s;
      const x = Math.max(-w * .25, R(G.x0, Math.max(G.x0 + 1, G.x1 - w * .8)));
      let y = lane + R(-22, 22) * k - h / 2;
      const ST = G.ST;
      if (x < ST.l + ST.w && y + h > ST.t - 8 && y < ST.t + ST.h) y = thin ? ST.t + ST.h + 8 : ST.t - 8 - h;   // never across the type
      add(key, { x, y, k: k * s, fx: false, fy: rng() < .4, rot: tilt + R(-1.5, 1.5), t0: t0 + i * R(.18, .38),
        dur: R(1.6, 2.2), win: R(.38, .5), lag: R(.06, .12), dx: R(90, 140) * k, dy: R(-6, 4) * k, op: thin ? R(.5, .65) : R(.8, 1) });
    }
  }
  // a nod, not a spin: a flower turns about a point low in its head (like a stem), written as translate-rotate-translate
  // so the small one's own static rotate stays exactly as it was
  function nodAnim(el, a, t0, d) {
    const p = el.offsetHeight * .3, r = v => ({ transform: `translateY(${p.toFixed(1)}px) rotate(${v}deg) translateY(${(-p).toFixed(1)}px)` });
    return el.animate([
      r(0),
      { ...r(a), offset: .3, easing: 'cubic-bezier(.3,0,.3,1)' },
      { ...r((-a * .2).toFixed(2)), offset: .62, easing: 'ease-in-out' },
      { ...r((a * .06).toFixed(2)), offset: .84, easing: 'ease-in-out' },
      r(0)].map((f, i) => i === 0 ? { ...f, easing: 'cubic-bezier(.35,0,.25,1)' } : f),
      { duration: d * 1000, delay: t0 * 1000, easing: 'linear', fill: 'backwards' });
  }
  const busy = el => el.getAnimations().some(a => a.playState === 'running' || a.playState === 'paused');
  function swayAnims(scale, t0) {
    const rots = arr => arr.map(v => ({ rotate: (v * scale).toFixed(2) + 'deg' }));
    return [sway.animate(rots([0, 2.1, -.8, 1.25, -.45, .5, -.15, 0]), { duration: 5400, delay: t0 * 1000, easing: 'ease-in-out', fill: 'backwards' }),
      canopy.animate([0, 1.5, -1.15, 1.05, -.75, .5, -.25, .1, 0].map((v, i) => ({ rotate: (v * scale).toFixed(2) + 'deg', translate: `${(i >= 2 && i <= 4 ? (i % 2 ? -.4 : .4) * scale : 0).toFixed(2)}px 0` })),
        { duration: 5400, delay: (t0 + .3) * 1000, easing: 'ease-in-out', fill: 'backwards' })];
  }
  // what a gust in this lane passes: the flowers whose heads it crosses, the tree if it runs low enough to reach the canopy
  function nudges(G, lane, t0, strong) {
    const out = [], reach = 70 * G.k, f = strong ? 1 : .45;
    [[small, G.S, 1.5], [big, G.B, 1.85]].forEach(([el, q, at]) => {
      if (lane > q.t - reach && lane < q.t + q.h + reach && !busy(el)) out.push(nodAnim(el, (el === small ? R(14, 16) : R(10, 12)) * f, t0 + (strong ? at : .7 + (q.l - G.x0) / Math.max(1, G.x1 - G.x0) * .9), strong ? 3.8 : 2.6));
    });
    if ((strong || (lane > G.T.t - reach && lane < G.T.t + G.T.h * .7)) && !busy(sway)) out.push(...swayAnims(strong ? 1 : .5, t0 + (strong ? 2.6 : 1.4)));
    return out;
  }

  // ---------- the small gusts: every 6 to 12 s while the closing is in view ----------
  let gTimer = null, gAnims = [], gEls = [], gLanes = 0;
  function smallGust() {
    gTimer = null;
    if (!inView || reduce.matches || !isNaN(freezeAt)) return;
    if (running) { armGust(); return; }                          // the full breeze has its own gusts
    const G = geo(), lanes = [G.yTop, (G.yTop + G.yBot) / 2, G.yBot];
    const lane = lanes[gLanes++ % 3] + R(-.12, .12) * (G.yBot - G.yTop);   // a different height each time
    const n = rng() < .3 ? 1 : (thinLines() ? (rng() < .6 ? 1 : 2) : 2 + (rng() < .4 ? 1 : 0));
    const anims = [], els = [];
    gustLines(G, .1, n, lane, R(-2, 3), (key, o) => { const r = window.pbScribble(layer, key, o); els.push(r.el); anims.push(...r.anims); });
    anims.push(...nudges(G, lane, .1, false));
    gAnims.push(...anims); gEls.push(...els);
    Promise.all(anims.map(a => a.finished.catch(() => {}))).then(() => {
      els.forEach(e => e.remove()); gEls = gEls.filter(e => !els.includes(e)); gAnims = gAnims.filter(a => !anims.includes(a));
    });
    armGust();
  }
  function armGust(first) {
    clearTimeout(gTimer); gTimer = null;
    if (!inView || reduce.matches || !isNaN(freezeAt)) return;
    gTimer = setTimeout(smallGust, first ? R(1500, 3500) : R(6000, 12000));
  }

  // ---------- the full breeze, rarely: clouds hurry, gusts a couple of seconds apart, the newt, the smoke ----------
  function run() {
    if (running || reduce.matches) return;
    running = true; ran++;
    anims = []; els = [];
    const H = rel(cottage), B = rel(big), S = rel(small), T = rel(tree), W = closing.clientWidth;
    const k = H.w / 400;                                        // study units to px: the studies were drawn at this scale

    // the clouds hurry in: the cloud loop reads this clock, so it pauses with everything else
    const g = document.createElement('i'); g.style.display = 'none'; layer.appendChild(g); els.push(g);
    clockAnim = track(g.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 22000, fill: 'both' }));
    window.__breezeGust = () => {
      if (!clockAnim || clockAnim.playState === 'idle') return 1;
      const s = (clockAnim.currentTime || 0) / 1000;
      return 1 + 2.6 * Math.exp(-Math.pow((s - 2.6) / 2.4, 2));  // up to about three and a half times the usual drift, then back
    };

    // the wind: 11-14 (Ivy) never all at once: three or four separate gusts a couple of seconds apart, each one to two
    // lines in its own lane (phones: one thin line each)
    const thin = thinLines(), G = geo();
    // (a small gust still on screen gets its moment first, so never more than about three lines at once)
    const lead = gEls.length ? 2.2 : .4, sweep = !thin && rng() < .35;
    const times = (thin ? [0, 2.7, 5.4] : [0, 2.7, 5.4, 8.1]).map(t => t + lead);
    const lanes = [G.yTop, G.yBot, (G.yTop + G.yBot) / 2, G.yTop + (G.yBot - G.yTop) * .3];
    times.forEach((t, i) => { if (!(sweep && i === 1)) gustLines(G, t, thin ? 1 : (i % 2 ? 1 : 2), lanes[i] + R(-.1, .1) * (G.yBot - G.yTop), R(-2, 3), scribble); });
    // now and then (her "beautiful but risky" one): a sweep that lifts into the tree's canopy, in place of the second gust
    if (sweep) {   // not on phones: it is one of the thicker studies
      const s = .78, st = P.W10, w = st.w * k * s, h = st.h * k * s;
      const ex = T.l + T.w * .45, ey = T.t + T.h * .22;        // the sweep's tip lands in the leaves
      scribble('W10', { x: ex - w * .96, y: ey - h * .09, k: k * s, fx: false, fy: false, rot: 6, t0: times[1], dur: 3, win: .6, lag: .16, dx: 20 * k, dy: -4 * k, op: .85 });
    }
    // the flowers nod and the tree sways with the breeze (the full nudge)
    nudges(G, (G.yTop + G.yBot) / 2, 0, true).forEach(track);

    // the newt: small, house-scale. He starts out of sight behind the pot, crawls out from behind it once the gust has
    // gone by, climbs the stone beside the door to the bare upper-left wall and pauses there (it draws the eye to that
    // empty corner), then makes for the upper window along under its shutter and slips in. Stop-motion: three quick
    // steps, a pause. He lives in the house's own layer, below the potted tree, so the pot really hides him
    const home = cottage.parentNode, cw = cottage.offsetWidth, chh = cottage.offsetHeight, c0x = cottage.offsetLeft, c0y = cottage.offsetTop;
    const at2 = (u, v) => [c0x + cw * u, c0y + chh * v];
    const nw = Math.max(20, cw * .07), nh = nw * 454 / 849;
    const newt = new Image(); newt.className = 'bnewt'; newt.alt = ''; newt.src = NEWT; newt.width = 849; newt.height = 454;
    newt.style.width = nw.toFixed(1) + 'px';
    home.appendChild(newt); els.push(newt);
    const legs = [
      { pts: [[.15, .915], [.25, .905], [.28, .86], [.28, .6], [.285, .45], [.3, .37]], hold: 1.6, glance: true },
      { pts: [[.3, .37], [.36, .44], [.43, .475], [.515, .465]], hold: .5 }];
    const poseAt = (x, y, deg) => `translate(${(x - nw / 2).toFixed(1)}px,${(y - nh / 2).toFixed(1)}px) rotate(${deg.toFixed(1)}deg) scaleX(-1)`;   // mirrored: the picture faces left, he heads right and up
    const frames = []; let tn = 0, n = 0, lastPose = null;
    legs.forEach(leg => {
      const pts = leg.pts.map(p => at2(p[0], p[1])), step = nw * .8;
      for (let j = 0; j < pts.length - 1; j++) {
        const a = pts[j], b = pts[j + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), cnt = Math.max(1, Math.round(len / step));
        const deg = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
        for (let i = j === 0 && frames.length ? 1 : 0; i <= cnt; i++) {
          const f = i / cnt, x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f;
          lastPose = { x, y, deg: deg + Math.sin(n * 1.7) * 5 };
          frames.push({ t: tn, ...lastPose });
          tn += (n % 3 === 2) ? R(.3, .5) : .09; n++;
        }
      }
      if (leg.glance) {                                  // a look round from the empty corner
        frames.push({ t: tn + .5, ...lastPose, deg: lastPose.deg - 14 });
        frames.push({ t: tn + 1.15, ...lastPose, deg: lastPose.deg + 8 });
      }
      tn += leg.hold;
    });
    const slip = tn + .45, life = slip + .1;
    const kf = frames.map(f => ({ transform: poseAt(f.x, f.y, f.deg) + ' scale(1)', opacity: 1, offset: f.t / life, easing: 'steps(1,end)' }));
    kf.push({ transform: poseAt(lastPose.x, lastPose.y, -90) + ' scale(1)', opacity: 1, offset: tn / life, easing: 'ease-in' });
    kf.push({ transform: poseAt(lastPose.x, lastPose.y - nh * .9, -90) + ' scale(.72)', opacity: 0, offset: 1 });
    kf[0].offset = 0;
    track(newt.animate(kf, { duration: life * 1000, delay: 4000, fill: 'both' }));
    const smokeAt = 4 + life + .3;                      // the chimney breathes once he is in

    // the wind has passed: a few pencil wisps curl up from the chimney (her S05, flipped and varied) and fade
    const chx = H.l + H.w * .768, chy = H.t + H.h * .03;
    const wisps = 3;
    for (let i = 0; i < wisps; i++) {
      const st = P.S05, s = R(.5, .7), fx = i === 2 && rng() < .5;   // mostly as drawn, hook downwind
      const ox = (fx ? st.w - 130 : 130) * k * s, oy = 404 * k * s;
      scribble('S05', { x: chx - ox + R(-3, 3) * k, y: chy - oy, k: k * s, fx, fy: false, rot: R(6, 14), t0: smokeAt + i * R(.8, 1.1),
        dur: R(2.3, 2.9), win: R(.34, .44), lag: .15, dx: R(18, 30) * k, dy: -R(18, 32) * k, op: R(.75, .95), mw: 13, org: [ox, oy], fade: .42 });   // 11-14 (Ivy): out of the chimney and gone, sooner
    }

    // review clock
    if (review) {
      let c = document.querySelector('.breeze-clock');
      if (!c) { c = document.createElement('div'); c.className = 'breeze-clock'; document.body.appendChild(c); }
      const tick = () => { if (!running) { c.textContent = 'breeze: done (B to run again)'; return; } c.textContent = 'breeze ' + ((clockAnim.currentTime || 0) / 1000).toFixed(1) + 's'; requestAnimationFrame(tick); };
      tick();
    }

    if (!isNaN(freezeAt)) { anims.forEach(a => { a.currentTime = freezeAt * 1000; a.pause(); }); return; }
    if (!inView) anims.forEach(a => a.pause());
    Promise.all(anims.map(a => a.finished.catch(() => {}))).then(done);
  }

  function done() {
    els.forEach(e => e.remove()); els = []; anims = []; clockAnim = null; running = false;
    window.__breezeGust = null;
    arm();
  }

  function arm(first) {
    clearTimeout(timer); timer = null;
    if (!inView || running || reduce.matches || !isNaN(freezeAt)) return;
    const wait = ran === 0 ? (review ? 1200 : R(16000, 24000)) : R(70000, 100000);   // 11-14 (Ivy): the full breeze is rare; small gusts fill the time
    timer = setTimeout(() => { timer = null; if (inView) run(); }, wait);
  }

  // in view: run and schedule; off screen: everything holds where it is
  const io = new IntersectionObserver(es => es.forEach(e => {
    inView = e.isIntersecting;
    if (running && isNaN(freezeAt)) anims.forEach(a => inView ? a.play() : a.pause());
    gAnims.forEach(a => inView ? a.play() : a.pause());
    if (inView) { arm(); if (!gTimer) armGust(true); } else { clearTimeout(timer); timer = null; clearTimeout(gTimer); gTimer = null; }
  }), { threshold: .25 });
  io.observe(closing);
  reduce.addEventListener('change', () => { if (reduce.matches && running) { anims.forEach(a => a.cancel()); done(); } else arm(); });

  // the studies load late, as the closing comes near
  const pre = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { pre.disconnect(); Object.values(P).forEach(p => { const i = new Image(); i.src = SRC + p.src; }); } }, { rootMargin: '0px 0px 1200px 0px' });
  pre.observe(closing);

  if (review) {
    addEventListener('keydown', e => {
      if ((e.key === 'b' || e.key === 'B') && !e.metaKey && !e.ctrlKey && !/input|textarea/i.test(e.target.tagName) && !running) { clearTimeout(timer); run(); }
    });
    if (!isNaN(freezeAt)) {                 // frozen frame for review: wait for the page to settle, then pose
      const go = () => { if (running) return; closing.scrollIntoView({ block: 'end' }); setTimeout(run, 600); };
      addEventListener('load', () => setTimeout(go, 2500));
    }
  }
  window.breeze = () => { if (!running) { clearTimeout(timer); run(); } };
})();
