// Card sounds (11-14, Ivy): hovering a project card's picture (a tap on phones) plays its real sound, softly, only when the
// visitor has turned the sound on (window.HeroSound, the hero's sound switch). A 0.4 s fade in, a 0.6 s fade out on leave,
// low volume, never more than one at a time. Uses HeroSound's audio context when it offers one, else a plain <audio>.
//   Beekeeper: the Dan D's Bees hive hum with two buzzes (YleArkisto, CC BY 3.0; NHM London via BioAcoustica, CC BY 3.0)
//   Living Walls: a tūī phrase, Ken George, Whakatāne, xeno-canto XC1090728 (CC BY-NC-SA 4.0)
//   Unicorn: its welcome clip has no audio track, so it stays quiet. Bioindicators: none for now.
// Phones: the first tap on a picture plays its sound and stays on the page; a second tap while it plays follows the link.
(() => {
  const SND = { bee: 'sounds/card-bees.mp3', wall: 'sounds/card-tui.mp3' };
  const VOL = .22, IN = .4, OUT = .6;
  const soundOn = () => { const H = window.HeroSound; try { return !!H && typeof H.answer === 'function' && H.answer() === 'yes'; } catch (e) { return false; } };
  const ctxOf = () => { const H = window.HeroSound; if (!H) return null; try { return H.ctx || H.context || (typeof H.getContext === 'function' ? H.getContext() : null) || null; } catch (e) { return null; } };
  const touch = window.matchMedia && matchMedia('(hover: none)').matches;
  let cur = null, tapT = 0;
  function ramp(a, to, ms, done) {
    const from = a.volume, t0 = performance.now();
    const step = now => { const k = Math.min(1, (now - t0) / ms); a.volume = from + (to - from) * k; if (k < 1) requestAnimationFrame(step); else if (done) done(); };
    requestAnimationFrame(step);
  }
  function start(k) {
    if (!SND[k] || !soundOn()) return;
    if (cur && cur.k === k) return;
    stop();
    const a = new Audio(SND[k]); a.loop = true; a.preload = 'auto'; a.setAttribute('playsinline', '');
    let g = null; const c = ctxOf();
    if (c && c.createMediaElementSource) {
      try {
        if (typeof window.HeroSound.unlock === 'function') window.HeroSound.unlock();
        if (c.state === 'suspended' && c.resume) c.resume();
        const src = c.createMediaElementSource(a); g = c.createGain(); g.gain.value = 0;
        src.connect(g); g.connect(c.destination); g.gain.setTargetAtTime(VOL, c.currentTime, IN / 3);
      } catch (e) { g = null; }
    }
    if (!g) { a.volume = 0; ramp(a, VOL, IN * 1000); }
    a.play().catch(() => {});
    cur = { k, a, g, c };
  }
  function stop() {
    if (!cur) return;
    const { a, g, c } = cur; cur = null; clearTimeout(tapT);
    const end = () => { a.pause(); a.removeAttribute('src'); a.load(); };
    if (g) { g.gain.setTargetAtTime(0, c.currentTime, OUT / 3); setTimeout(end, OUT * 1000 + 300); }
    else ramp(a, 0, OUT * 1000, end);
  }
  document.querySelectorAll('.plate').forEach(p => {
    const k = p.dataset.k, m = p.querySelector('.media');
    if (!m || !SND[k]) return;
    if (!touch) { m.addEventListener('pointerenter', () => start(k)); m.addEventListener('pointerleave', stop); }
    else m.addEventListener('click', e => {
      if (!soundOn() || (cur && cur.k === k)) return;                 // sound off, or already playing: the tap is a link again
      e.preventDefault(); e.stopPropagation(); start(k);
      clearTimeout(tapT); tapT = setTimeout(stop, 7000);
    }, true);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.pbCardSound = { start, stop };   // review: pbCardSound.start('wall')
})();
