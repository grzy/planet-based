// HeroStory: the whole entrance on ONE seekable clock: the loader, the lines, the tree's pieces, the green blocks, the
// hero mark's fold into the logo, and the garden landing on the mark's beats. The page's own runIntro and
// startStaticArrival hand over to it (build.py swaps their bodies); a variant file (a.js, b.js, c.js) supplies the
// choreography as pure functions of t.
//   __introAt(ms)  freeze everything at ms (also seeks the page's CSS garden animations)     __introPlay()  run on
(function () {
  const X = window.HLPose, clamp = X.clamp, seg = X.seg, lerp = X.lerp, MOVE = X.MOVE, ARRIVE = X.ARRIVE, smooth = X.smooth;
  const S = { t: 0, ctx: null, V: null, raf: 0, t0: 0, rate: 1, frozen: null, revealed: false, done: false, phone: false };
  const K = {};             // geometry and helpers handed to the variant

  // ---------- the lines overlay ----------
  function linesLayer(n) {
    if (K.layer) K.layer.remove();
    const L = document.createElement('div'); L.className = 'hs-lines'; L.setAttribute('aria-hidden', 'true');
    document.body.appendChild(L); K.layer = L;
    K.lines = Array.from({ length: n }, () => { const d = document.createElement('i'); L.appendChild(d); return d; });
  }
  // one line: l, r, t, b in viewport px; ink 0 = the loader's ink, 1 = the hero type colour; o opacity
  function line(i, l, r, t, b, ink = 0, o = 1, extra = '') {
    const d = K.lines[i]; if (!d) return;
    if (o <= 0 || r - l < .05 || b - t < .5) { d.style.display = 'none'; return; }
    d.style.display = '';
    d.style.transform = `translate3d(${l.toFixed(2)}px,${t.toFixed(2)}px,0)${extra}`;
    d.style.width = (r - l).toFixed(2) + 'px'; d.style.height = (b - t).toFixed(2) + 'px';
    d.style.opacity = o >= 1 ? '' : o.toFixed(4);
    d.style.setProperty('--ink', (ink * 100).toFixed(1) + '%');
  }

  // ---------- the tree's pieces ----------
  function treePieces(rects) {
    const loader = S.ctx.loader, tree = loader && loader.querySelector('.loader-in');
    K.pieces = [];
    if (!tree) return;
    loader.querySelectorAll('.hs-cut').forEach(n => n.remove());
    rects.forEach(r => {
      const pc = document.createElement('div'); pc.className = 'lcut hs-cut'; pc.setAttribute('aria-hidden', 'true');
      const c = tree.cloneNode(true); c.removeAttribute('id'); c.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
      pc.appendChild(c); loader.appendChild(pc);
      const lr = loader.getBoundingClientRect();
      pc.style.clipPath = `inset(${(r[1] - lr.top).toFixed(1)}px ${(lr.right - r[2]).toFixed(1)}px ${(lr.bottom - r[3]).toFixed(1)}px ${(r[0] - lr.left).toFixed(1)}px)`;
      K.pieces.push(pc);
    });
    S.ctx.pin.classList.add('cut');
  }
  function piece(i, dx, dy, o) {
    const p = K.pieces[i]; if (!p) return;
    p.style.transform = dx || dy ? `translate3d(${dx.toFixed(2)}px,${dy.toFixed(2)}px,0)` : '';
    p.style.opacity = o >= 1 ? '' : Math.max(0, o).toFixed(4);
  }
  const treeRect = () => { const t = S.ctx.loader && S.ctx.loader.querySelector('.loader-tree'); const r = t && t.getBoundingClientRect(); return r && r.width ? [r.left, r.top, r.right, r.bottom] : null; };

  // ---------- blocks ----------
  function block(b, x, y, sx = 1, sy = 1, moving = false) {
    S.ctx.put(b.el, 'transform', `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)` + (sx !== 1 || sy !== 1 ? ` scale(${sx.toFixed(5)},${sy.toFixed(5)})` : ''));
    S.ctx.put(b.el, 'transformOrigin', '0 0');
    b.el.classList.toggle('moving', moving);
  }

  // ---------- the garden on the beats ----------
  // the page's CSS animations run from the reveal; their delays are set here from the variant's beats (ms from reveal)
  function gardenDelays() {
    const G = S.V.garden(K, S.phone), r = S.revealT, st = document.documentElement.style;
    const set = (k, landMs, dur) => st.setProperty(k, ((landMs - r - dur) / 1000).toFixed(3) + 's');
    set('--hs-sun', G.sun, 900); set('--hs-peony', G.peony + 150, 750); set('--hs-dahlia', G.dahlia + 150, 750); set('--hs-bee', G.bee, 500);
    set('--hs-text', G.text, 0);
    S.G = G;
  }
  function seekCSS(t) {
    if (!S.revealed) return;
    document.getAnimations().forEach(a => {
      const tg = a.effect && a.effect.target;
      if (!tg || !(tg.closest && (tg.closest('.hero') || tg.closest('.objs')))) return;
      a.pause(); a.currentTime = Math.max(0, t - S.revealT);
    });
  }

  // ---------- the clock ----------
  function frame(t) {
    S.t = t;
    if (!S.revealed && t >= S.revealT) {
      S.revealed = true; gardenDelays();
      S.ctx.finish();                      // the page's own reveal: the hero shows, its CSS arrival starts
      clearLoader();
      if (window.HeroUnder) HeroUnder.layout();
      if (S.V.afterReveal) S.V.afterReveal(K);
    }
    S.V.frame(t, K, S.phone);
    if (t >= S.endT && !S.done) {
      S.done = true;
      if (K.layer) K.layer.style.display = 'none';
      HeroLogo.render(0);
      HeroLogo.enable({ askOnOpen: S.V.askOn === 'open' });
      if (S.V.afterEnd) S.V.afterEnd(K);
      if (window.HeroSound && HeroSound.loadGuitar) setTimeout(HeroSound.loadGuitar, 900);   // the real guitar, after the hero
      if (window.HeroUnder) HeroUnder.layout();
    }
  }
  function tick(now) {
    const t = (now - S.t0) * S.rate;
    frame(t);
    S.raf = t < S.endT + 40 ? requestAnimationFrame(tick) : 0;
  }
  function measure() {
    K.W = innerWidth; K.H = innerHeight;
    K.X = k => Math.round(K.W * k / 12); K.Y = k => Math.round(K.H * k / 6);
    K.blocks = S.ctx.blocks || [];
    K.tree = treeRect();
    K.hero = HeroLogo.mount();
    K.loaderWord = S.ctx.loader && S.ctx.loader.querySelector('.hs-word') ? (K.loaderWord || HeroLogo.word(S.ctx.loader.querySelector('.hs-word'))) : null;
  }
  function run(ctx, phone) {
    S.ctx = ctx; S.phone = phone; S.V = window.HeroVariant; S.done = false; S.revealed = false; S.rate = 1;
    document.documentElement.classList.add('hs-run');
    measure();
    const plan = S.V.plan(K, phone);       // { reveal, end, lines }
    S.revealT = plan.reveal; S.endT = plan.end;
    linesLayer(plan.lines || 0);
    if (S.V.setup) S.V.setup(K, phone, { treePieces, piece, line, block });
    S.t0 = performance.now();
    frame(0);                              // the first frame now, so the blocks never show at rest for a frame
    S.raf = requestAnimationFrame(tick);
  }
  Object.assign(K, { line, piece, block, treePieces, clamp, seg, lerp, MOVE, ARRIVE, smooth });

  window.HeroStory = {
    runDesktop: ctx => run(ctx, false),
    runPhone: ctx => run(ctx, true),
    // a scroll, a wheel or a key during the entrance: run the rest four times faster (never snap)
    hurry() { if (S.done || !S.ctx) return; const now = performance.now(); const t = (now - S.t0) * S.rate; S.rate = 4; S.t0 = now - t / 4; },
    get t() { return S.t; }, K, S,
    SUN_SETTLE: 9000, BEE_FIRST: 8000
  };
  // ---------- the loader never outlives the hero (11-14, a stuck tree + "-ing" word over the arrived hero on the live
  // site): whatever path the page took (a background tab, a scroll or a resize during the loader, a story that never
  // ran), once the hero is shown the loader goes: its words stop, the tree, its swirls and its pieces are hidden ----------
  const doc = document.documentElement;
  let cleared = false;
  function clearLoader() {
    if (cleared) return; cleared = true;
    try { if (window.HeroPreload) HeroPreload.stop(); } catch (e) {}
    const L = document.querySelector('.loader'); if (L) L.classList.add('hs-gone');
    document.querySelectorAll('.lcut').forEach(n => n.remove());
    const lt = document.getElementById('loaderTree'); if (lt && lt.getAttribute('src')) setTimeout(() => lt.removeAttribute('src'), 50);
  }
  // the hero is shown when the page is out of boot and the pin is out of its intro (or the story has revealed it)
  const heroShown = () => { const pin = document.querySelector('.pin'); return S.revealed || (!doc.classList.contains('boot') && !(pin && pin.classList.contains('intro'))); };
  const check = () => { if (!cleared && heroShown()) clearLoader(); };
  const mo = new MutationObserver(check);
  const watch = () => { mo.observe(doc, { attributes: true, attributeFilter: ['class'] }); const pin = document.querySelector('.pin'); if (pin) mo.observe(pin, { attributes: true, attributeFilter: ['class'] }); check(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
  addEventListener('pageshow', check); document.addEventListener('visibilitychange', check);
  // a last guarantee: if the story never started (a script failed, a path skipped it), the loader still lets go
  setTimeout(() => { if (cleared || S.ctx) return; doc.classList.remove('boot', 'boot-out'); const pin = document.querySelector('.pin'); if (pin) pin.classList.remove('intro'); clearLoader(); }, 15000);
  HeroStory.clearLoader = clearLoader;

  window.__introAt = ms => { cancelAnimationFrame(S.raf); S.raf = 0; frame(ms); seekCSS(ms); return 'frozen at ' + ms; };
  window.__introPlay = () => { S.t0 = performance.now() - S.t / S.rate; S.raf = requestAnimationFrame(tick); document.getAnimations().forEach(a => { if (a.playState === 'paused') a.play(); }); };
})();
