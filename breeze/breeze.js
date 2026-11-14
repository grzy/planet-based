// The breeze moment in the closing (11-13, Ivy).
// Clouds hurry in, hand-drawn pencil wind lines draw through left to right (the way the clouds drift), both flowers nod
// with the wind and settle, the orange tree sways from the trunk (the pot never moves) while its canopy rustles, a small
// newt crawls out from behind the pot, climbs to the bare upper-left wall, pauses there, and slips in at the upper window,
// the wind passes, and a few pencil wisps curl up from the chimney and fade. Every line is one of Ivy's Figma pencil
// studies, drawn by breeze/scribble.js. Runs once soon after the closing comes into view, then every 25 to 40 s while it
// stays in view; pauses off screen; never runs with reduced motion.
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

  // ---------- the whole moment ----------
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

    // the wind: lines from her picks, never two the same in a row, each mirrored, scaled, tilted and timed its own
    // way. They cross the garden toward the house
    // 11-14 (Ivy): phones get only the thin studies, fewer and lighter
    const thin = innerWidth < 760;
    const pool = thin ? ['W11', 'W11', 'W06', 'W08'] : ['W09', 'W09', 'W03', 'W03', 'W02', 'W02', 'W08', 'W08', 'W06', 'W06', 'W05', 'W11', 'W11'];
    // two pulses, like a gust and its follow-through: each pulse travels in one lane with a shared tilt, quick and close
    const x0 = Math.min(S.l, B.l) - 240 * k, x1 = H.l + H.w * .18;
    const ST = rel(document.querySelector('.studio'));
    let yTop = B.t - 70 * k, yBot = B.t + B.h * .7;
    if (innerWidth < 760) { yTop = Math.max(yTop, ST.t + ST.h + 14); yBot = Math.max(yBot, yTop + 60); }   // phones: under the studio line, never over it
    const bursts = thin ? [[.4, .75], [2.0, 2.4]] : [[.4, .6, .85], [2.0, 2.2, 2.45, 2.7]];
    let last = '';
    const mid = B.t + B.h * .3;
    bursts.forEach((times, bi) => {
      const lane = bi === 0 ? R(yTop, mid) : R(mid, yBot), tilt = R(-2, 3);   // one high, one low, so the garden fills
      times.forEach(t => {
        let key; do key = pick(pool); while (key === last); last = key;
        const st = P[key], s = R(.85, 1.25), w = st.w * k * s, h = st.h * k * s;
        const x = Math.max(-w * .25, R(x0, Math.max(x0 + 1, x1 - w * .8)));
        let y = lane + R(-25, 25) * k - h / 2;
        if (x < ST.l + ST.w && y + h > ST.t - 8 && y < ST.t + ST.h) y = innerWidth < 760 ? ST.t + ST.h + 8 : ST.t - 8 - h;   // never across the type
        scribble(key, { x, y, k: k * s, fx: false, fy: rng() < .4, rot: tilt + R(-1.5, 1.5), t0: t + R(-.08, .08),
          dur: R(1.6, 2.2), win: R(.38, .5), lag: R(.06, .12), dx: R(90, 140) * k, dy: R(-6, 4) * k, op: thin ? R(.5, .65) : R(.8, 1) });
      });
    });
    // now and then (her "beautiful but risky" one): a sweep that lifts into the tree's canopy
    if (!thin && rng() < .35) {   // not on phones: it is one of the thicker studies
      const s = .78, st = P.W10, w = st.w * k * s, h = st.h * k * s;
      const ex = T.l + T.w * .45, ey = T.t + T.h * .22;        // the sweep's tip lands in the leaves
      scribble('W10', { x: ex - w * .96, y: ey - h * .09, k: k * s, fx: false, fy: false, rot: 6, t0: 1.3, dur: 3, win: .6, lag: .16, dx: 20 * k, dy: -4 * k, op: .85 });
    }

    // the flowers turn with the wind, a little, and settle
    // a nod, not a spin: each flower turns about a point low in its head (like a stem), written as translate-rotate-
    // translate so the static rotate the small one already has stays exactly as it was
    const turn = (el, a, t0, d) => {
      const p = el.offsetHeight * .3, r = v => ({ transform: `translateY(${p.toFixed(1)}px) rotate(${v}deg) translateY(${(-p).toFixed(1)}px)` });
      return track(el.animate([
        r(0),
        { ...r(a), offset: .3, easing: 'cubic-bezier(.3,0,.3,1)' },
        { ...r((-a * .2).toFixed(2)), offset: .62, easing: 'ease-in-out' },
        { ...r((a * .06).toFixed(2)), offset: .84, easing: 'ease-in-out' },
        r(0)].map((f, i) => i === 0 ? { ...f, easing: 'cubic-bezier(.35,0,.25,1)' } : f),
        { duration: d * 1000, delay: t0 * 1000, easing: 'linear', fill: 'backwards' }));
    };
    turn(small, R(14, 16), 1.5, 3.8);           // the peony is upwind, so it goes first
    turn(big, R(10, 12), 1.85, 4.2);

    // the tree: the trunk leans with the gust from where it meets the soil, the canopy rustles on top of that
    const rots = arr => arr.map(v => ({ rotate: v.toFixed(2) + 'deg' }));
    track(sway.animate(rots([0, 2.1, -.8, 1.25, -.45, .5, -.15, 0]), { duration: 5400, delay: 2600, easing: 'ease-in-out', fill: 'backwards' }));
    track(canopy.animate([0, 1.5, -1.15, 1.05, -.75, .5, -.25, .1, 0].map((v, i) => ({ rotate: v + 'deg', translate: `${(i >= 2 && i <= 4 ? (i % 2 ? -.4 : .4) : 0)}px 0` })),
      { duration: 5400, delay: 2900, easing: 'ease-in-out', fill: 'backwards' }));

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
    const wait = ran === 0 ? (review ? 1200 : R(2600, 4800)) : R(25000, 40000);
    timer = setTimeout(() => { timer = null; if (inView) run(); }, wait);
  }

  // in view: run and schedule; off screen: everything holds where it is
  const io = new IntersectionObserver(es => es.forEach(e => {
    inView = e.isIntersecting;
    if (running && isNaN(freezeAt)) anims.forEach(a => inView ? a.play() : a.pause());
    if (inView) arm(); else { clearTimeout(timer); timer = null; }
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
