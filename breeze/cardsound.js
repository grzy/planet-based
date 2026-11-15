// Card sounds (11-14, Ivy): a project card's real sound plays softly, only when the visitor has turned the sound on
// (window.HeroSound, the hero's sound switch). Desktop: hovering the picture. Phones: a tap always opens the card; the sound
// plays by itself while a card is mostly in view (60%), one card at a time. A 0.4 s fade in, a 0.6 s fade out.
// Plays decoded buffers through HeroSound's audio context when it offers one (no fresh tap needed on iPhone), else a plain <audio>.
//   Unicorn: the welcome clip's own launch sound (from the case study's welcome.mp4; the card video has no audio track)
//   Beekeeper: a few single honeybees passing, calm and low (NHM London via BioAcoustica, CC BY 3.0)
//   Living Walls: a tūī phrase, Ken George, Whakatāne, xeno-canto XC1090728 (CC BY-NC-SA 4.0)
//   Bioindicators: none for now.
(() => {
  const SND = { uni: 'sounds/card-unicorn.mp3', bee: 'sounds/card-bees-calm.mp3', wall: 'sounds/card-tui.mp3' };
  const VOL = { uni: .2, bee: .12, wall: .22 }, IN = .4, OUT = .6;
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
  function start(k) {
    if (!SND[k] || !soundOn()) return;
    if (cur && cur.k === k) return;
    stop();
    const vol = VOL[k] || .2, c = ctxOf();
    if (c && c.createBufferSource && c.decodeAudioData) {
      try { if (typeof window.HeroSound.unlock === 'function') window.HeroSound.unlock(); if (c.state === 'suspended' && c.resume) c.resume(); } catch (e) {}
      const me = cur = { k, c, g: c.createGain(), s: null };
      me.g.gain.value = 0; me.g.connect(c.destination);
      buf(c, k).then(b => {
        if (cur !== me) return;
        const s = c.createBufferSource(); s.buffer = b; s.loop = true; s.connect(me.g); s.start();
        me.s = s; me.g.gain.setTargetAtTime(vol, c.currentTime, IN / 3);
      }).catch(() => { if (cur === me) cur = null; });
      return;
    }
    const a = new Audio(SND[k]); a.loop = true; a.preload = 'auto'; a.setAttribute('playsinline', '');
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
    // phones: the card most in view (at least 60%) plays; nothing intercepts the tap, so it always opens the card
    const ratio = new Map();
    const pick = () => {
      if (document.hidden || !soundOn()) { stop(); return; }
      let best = null, br = .6;
      ratio.forEach((r, k) => { if (r >= br) { br = r; best = k; } });
      if (best) start(best); else stop();
    };
    const io = new IntersectionObserver(es => { es.forEach(e => ratio.set(e.target.dataset.k, e.intersectionRatio)); pick(); }, { threshold: [0, .3, .6, .8, 1] });
    plates.forEach(p => { const m = p.querySelector('.media'); m.dataset.k = p.dataset.k; io.observe(m); });
    addEventListener('touchend', () => { pick(); setTimeout(pick, 400); }, { passive: true });   // sound just turned on with a card in view
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.pbCardSound = { start, stop };   // review: pbCardSound.start('wall')
})();
