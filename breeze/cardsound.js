// Card sounds (11-14, Ivy): a project card's real sound plays softly, only when the visitor has turned the sound on
// (window.HeroSound, the hero's sound switch). Desktop: hovering the picture, as before.
// Phones (11-14, round 2): a tap always opens the card. A sound plays only once scrolling has STOPPED (200 ms with no scroll)
// with a card mostly in view (50%); scrolling again fades it out at once. One card at a time, 0.4 s in, 0.6 s out.
// Unicorn on phones: stopping on it plays the welcome video once from the start, with its welcome sound, then rests on the
// last frame; scrolling past shows the still; leaving it resets it, and stopping on it again replays it.
// Sound path: decoded buffers through HeroSound's unlocked audio context (iOS lets that play without a fresh tap, which a
// video's own unmuted audio does not), else a plain <audio>. The Unicorn video stays muted and its sound is a buffer started
// at the video's own currentTime the moment it is actually playing, so the two stay together.
//   Unicorn: the welcome clip's own launch sound (from the case study's welcome.mp4; the card video has no audio track)
//   Beekeeper: Dan D's clean single buzzes
//   Living Walls: a tūī phrase, Ken George, Whakatāne, xeno-canto XC1090728 (CC BY-NC-SA 4.0)
//   Bioindicators: none for now.
(() => {
  const SND = { uni: 'sounds/card-unicorn.mp3', bee: 'sounds/card-bees-long.mp3', wall: 'sounds/card-tui.mp3', bio: 'sounds/card-bio.mp3' };
  const VOL = { uni: .2, bee: .12, wall: .14, bio: .16 }, IN = .4, OUT = .6;
  const soundOn = () => { const H = window.HeroSound; try { return !!H && typeof H.answer === 'function' && H.answer() === 'yes'; } catch (e) { return false; } };
  const ctxOf = () => { const H = window.HeroSound; if (!H) return null; try { return H.ctx || H.context || (typeof H.getContext === 'function' ? H.getContext() : null) || null; } catch (e) { return null; } };
  const touch = window.matchMedia && matchMedia('(hover: none)').matches;
  let cur = null;
  function ramp(a, to, ms, done) {
    const from = a.volume, t0 = performance.now();
    const step = now => { const k = Math.min(1, (now - t0) / ms); a.volume = from + (to - from) * k; if (k < 1) requestAnimationFrame(step); else if (done) done(); };
    requestAnimationFrame(step);
  }
  const bufs = {};   // decoded once; a buffer source plays without a fresh tap once the hero's context is running (iPhone)
  const buf = (c, k) => bufs[k] || (bufs[k] = fetch(SND[k]).then(r => r.arrayBuffer()).then(b => new Promise((ok, no) => c.decodeAudioData(b, ok, no))));
  function start(k, o = {}) {
    if (!SND[k] || !soundOn()) return;
    if (cur && cur.k === k && !o.once) return;
    stop();
    const loop = !o.once;
    const vol = VOL[k] || .2, c = ctxOf();
    if (c && c.createBufferSource && c.decodeAudioData) {
      try { if (typeof window.HeroSound.unlock === 'function') window.HeroSound.unlock(); if (c.state === 'suspended' && c.resume) c.resume(); } catch (e) {}
      const me = cur = { k, c, g: c.createGain(), s: null };
      me.g.gain.value = 0; me.g.connect(c.destination);
      buf(c, k).then(b => {
        if (cur !== me) return;
        const s = c.createBufferSource(); s.buffer = b; s.loop = loop; s.connect(me.g);
        const off = Math.max(0, Math.min(b.duration - .05, o.at ? o.at() : 0)); s.start(0, off);   // o.at: the video's time, read now
        me.s = s; me.g.gain.setTargetAtTime(vol, c.currentTime, (o.once ? .12 : IN) / 3);
      }).catch(() => { if (cur === me) cur = null; });
      return;
    }
    const a = new Audio(SND[k]); a.loop = loop; if (o.at) a.currentTime = o.at(); a.preload = 'auto'; a.setAttribute('playsinline', '');
    a.volume = 0; ramp(a, vol, IN * 1000);
    a.play().catch(() => {});
    cur = { k, a };
  }
  function stop() {
    if (!cur) return;
    const me = cur; cur = null;
    if (me.g) { me.g.gain.setTargetAtTime(0, me.c.currentTime, OUT / 3); setTimeout(() => { try { me.s && me.s.stop(); } catch (e) {} me.g.disconnect(); }, OUT * 1000 + 300); }
    else ramp(me.a, 0, OUT * 1000, () => { me.a.pause(); me.a.removeAttribute('src'); me.a.load(); });
  }
  const plates = [...document.querySelectorAll('.plate')].filter(p => SND[p.dataset.k] && p.querySelector('.media'));
  if (!touch) plates.forEach(p => { const k = p.dataset.k, m = p.querySelector('.media'); m.addEventListener('pointerenter', () => start(k)); m.addEventListener('pointerleave', stop); });
  else if ('IntersectionObserver' in window) {
    const ratio = new Map(), SETTLE = 120;   // 11-15 Ivy: sooner
    let settleT = 0, uni = null, uniDone = false;
    // ---- Unicorn: a muted overlay video over the still, played once per stop ----
    const uniM = plates.find(p => p.dataset.k === 'uni') ? document.querySelector('.plate[data-k="uni"] .media') : null;
    function uniVid() {
      if (uni || !uniM) return uni;
      const v = uni = document.createElement('video');
      v.className = 'hover-vid'; v.muted = true; v.playsInline = true; v.preload = 'auto';
      v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
      v.src = 'video/unicorn-welcome.mp4'; uniM.appendChild(v);
      v.addEventListener('ended', () => { uniDone = true; });                  // rests on its last frame
      v.addEventListener('error', () => { v.remove(); uni = null; }, { once: true });
      return v;
    }
    function playUni() {
      const v = uniVid(); if (!v || uniDone || !v.paused) return;
      try { v.currentTime = 0; } catch (e) {}
      const go = () => { v.classList.add('on'); if (!cur || cur.k !== 'uni') start('uni', { once: true, at: () => v.currentTime }); };
      v.addEventListener('playing', go, { once: true });
      v.play().catch(() => v.removeEventListener('playing', go));
    }
    function resetUni() {
      if (!uni) return;
      uni.pause(); uni.classList.remove('on'); setTimeout(() => { if (uni && uni.paused) try { uni.currentTime = 0; } catch (e) {} }, 400);
    }
    const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    // ---- settle: nothing plays while the page moves ----
    const bestCard = () => { let best = null, br = .5; ratio.forEach((r, k) => { if (r >= br) { br = r; best = k; } }); return best; };
    const settle = () => {
      if (document.hidden) return;
      const best = bestCard();
      if (best === 'uni') { if (!reduce()) playUni(); else start('uni', { once: true }); }
      else if (best) start(best);
    };
    // 11-15 (Ivy): sooner. A card plays as the scroll glides to a stop (slow, with the card in view), not only once it's still
    let lastY = scrollY, lastT = performance.now();
    const moving = () => {
      const now = performance.now(), v = Math.abs(scrollY - lastY) / Math.max(1, now - lastT); lastY = scrollY; lastT = now;
      clearTimeout(settleT); settleT = setTimeout(settle, SETTLE);
      const b = bestCard();
      if (v < .25 && b) { if (!cur || cur.k !== b) settle(); return; }
      if (cur && b && cur.k === b && v < .6) return;                              // easing on the same card: keep it
      stop();
      if (uni && !uni.paused) resetUni();                                         // playing: back to the still at once
    };
    addEventListener('scroll', moving, { passive: true });
    const io = new IntersectionObserver(es => {
      es.forEach(e => {
        ratio.set(e.target.dataset.k, e.intersectionRatio);
        if (e.intersectionRatio > 0) { const c = ctxOf(); if (c && c.decodeAudioData && soundOn()) buf(c, e.target.dataset.k).catch(() => {}); }
        if (e.target.dataset.k === 'uni' && e.intersectionRatio > 0) uniVid();   // 11-15: load it as it nears, so it starts at once
        if (e.target.dataset.k === 'uni' && e.intersectionRatio < .3) { uniDone = false; resetUni(); }   // left it: it replays next stop
      });
    }, { threshold: [0, .3, .5, .6, .8, 1] });
    plates.forEach(p => { const m = p.querySelector('.media'); m.dataset.k = p.dataset.k; io.observe(m); });
    // sound just turned on (or a first touch) with a card already in view
    addEventListener('touchend', () => { clearTimeout(settleT); settleT = setTimeout(settle, SETTLE); }, { passive: true });
    try { window.HeroSound && HeroSound.onChange && HeroSound.onChange(() => { clearTimeout(settleT); settleT = setTimeout(settle, SETTLE); }); } catch (e) {}
    document.addEventListener('visibilitychange', () => { if (document.hidden) resetUni(); });
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.pbCardSound = { start, stop };   // review: pbCardSound.start('wall')
})();
