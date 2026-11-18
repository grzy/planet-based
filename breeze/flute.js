// The flute flower (11-18, Ivy; from protos/flute-r1): on PHONES the café au lait dahlia that crowns the closing on its
// own (#dahliaTop) plays soft little flute notes, as if from its petals. Scrubbing a thumb around it plays a run in a
// pentatonic of the site's key (E, G#, A, B, D); toward its tight centre the petals come closer together (more notes),
// and the pollen at the very centre is the highest, softest note. Each note nods the flower a touch. Synthesized: a sine
// with a breath of filtered noise and a vibrato that arrives late, short and breathy, through the site's own unlocked
// audio (HeroSound), only when sound is on. Desktop keeps the flowers as they were (shared/sound.js); there this is off.
(() => {
  const SCALE = [64, 68, 69, 71, 74, 76, 80, 81];          // E4 G#4 A4 B4 D5 E5 G#5 A5 (sounded an octave up)
  const POLLEN = 88;                                        // E6
  let last = { k: null, t: 0 }, voices = 0, out = null;
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const flower = () => document.getElementById('dahliaTop');
  const phone = () => innerWidth < 760;
  const soundOn = () => window.HeroSound && HeroSound.on && HeroSound.on();
  // where on the flower: inside its round head (the same 40% ellipse the site uses), its angle and how near the centre
  function where(e) {
    const el = flower(); if (!el) return null;
    const r = el.getBoundingClientRect(); if (!r.width) return null;
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width * .4), dy = (e.clientY - (r.top + r.height / 2)) / (r.height * .4), d = Math.hypot(dx, dy);
    if (d > 1) return null;
    return { d, ang: Math.atan2(dy, dx) };
  }
  // ---------- the flute ----------
  function chain(ctx) {
    if (out && out.context === ctx) return out;
    out = ctx.createGain(); out.gain.value = .9;
    // a little space: one soft echo, darkened, so the notes sound like they come from somewhere among the petals
    const d = ctx.createDelay(.5), fb = ctx.createGain(), lp = ctx.createBiquadFilter(), wet = ctx.createGain();
    d.delayTime.value = .19; fb.gain.value = .22; lp.type = 'lowpass'; lp.frequency.value = 2600; wet.gain.value = .3;
    out.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(wet);
    const dest = HeroSound.out || ctx.destination;
    out.connect(dest); wet.connect(dest);
    return out;
  }
  function flute(m, amp, pan) {
    const ctx = HeroSound.ctx; if (!ctx || voices > 5) return;
    const o = chain(ctx), t = ctx.currentTime + .005, f = 440 * Math.pow(2, (m - 69) / 12), len = .55 + Math.random() * .2;
    voices++; setTimeout(() => voices--, (len + .3) * 1000);
    const g = ctx.createGain(), p = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
    if (p.pan) p.pan.value = pan; g.connect(p); p.connect(o);
    // the tone: a sine and a whisper of its octave
    const s1 = ctx.createOscillator(), s2 = ctx.createOscillator(), g2 = ctx.createGain();
    s1.type = 'sine'; s2.type = 'sine'; s1.frequency.value = f; s2.frequency.value = f * 2; g2.gain.value = .12;
    // the vibrato: arrives late (after 0.18 s), gently, as a player's breath settles
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5.2; lg.gain.setValueAtTime(0, t); lg.gain.setValueAtTime(0, t + .18); lg.gain.linearRampToValueAtTime(f * .006, t + .42);
    lfo.connect(lg); lg.connect(s1.frequency); lg.connect(s2.frequency);
    s1.connect(g); s2.connect(g2); g2.connect(g);
    // the breath: noise around the note's own pitch, strongest at the start
    const n = ctx.createBufferSource(), nb = ctx.createBuffer(1, Math.floor(ctx.sampleRate * (len + .1)), ctx.sampleRate), nd = nb.getChannelData(0);
    for (let k = 0; k < nd.length; k++) nd[k] = Math.random() * 2 - 1;
    n.buffer = nb; const bp = ctx.createBiquadFilter(), ng = ctx.createGain(); bp.type = 'bandpass'; bp.frequency.value = f * 1.5; bp.Q.value = 1.3;
    ng.gain.setValueAtTime(.0001, t); ng.gain.exponentialRampToValueAtTime(.22 * amp, t + .03); ng.gain.exponentialRampToValueAtTime(.05 * amp, t + .16); ng.gain.exponentialRampToValueAtTime(.0001, t + len);
    n.connect(bp); bp.connect(ng); ng.connect(p);
    // the envelope: a soft breathy onset (60 ms), a short body, a gentle release
    const peak = .16 * amp;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + .06); g.gain.exponentialRampToValueAtTime(peak * .7, t + .2); g.gain.exponentialRampToValueAtTime(.0001, t + len);
    [s1, s2, lfo, n].forEach(x => { x.start(t); x.stop(t + len + .05); });
  }
  function nod(dir) {
    if (reduce()) return; const el = flower(); if (!el) return;
    const a = (dir || 1) * (.8 + Math.random() * .6);
    el.animate([{ rotate: '0deg' }, { rotate: a + 'deg', offset: .35 }, { rotate: (-a * .25).toFixed(2) + 'deg', offset: .75 }, { rotate: '0deg' }], { duration: 520, easing: 'ease-out', composite: 'add' });
  }
  function play(w, e) {
    if (!soundOn()) return;
    const now = performance.now(), r = flower().getBoundingClientRect(), pan = Math.max(-.7, Math.min(.7, ((r.left + r.width / 2) / innerWidth) * 1.4 - .7));
    let k, m, amp;
    if (w.d < .2) { k = 'pollen'; m = POLLEN; amp = .75; }                        // the pollen: the highest, softest
    else {
      // the outer petals are eight steps round the flower; the tight centre petals twice as many, so a small circle near
      // the middle plays a quicker, fuller run
      const inner = w.d < .55, n = inner ? 16 : 8, u = (w.ang + Math.PI) / (2 * Math.PI), step = Math.floor(u * n) % n;
      k = (inner ? 'i' : 'o') + step; m = SCALE[(inner ? step : step) % SCALE.length] + 12 + (inner && step >= 8 ? 12 : 0); amp = .55 + (1 - w.d) * .5;
    }
    if (k === last.k && now - last.t < 600) return;                              // the same petal waits a breath
    if (now - last.t < (w.d < .55 ? 55 : 80)) return;                            // a run, never a smear
    last = { k, t: now };
    flute(m, amp, pan); nod(String(k).length % 2 ? -1 : 1);
  }
  // a touch on the flower and the thumb's path across it (the flower takes touches on phones: breeze.css / index.html;
  // its old gamelan note is off there, shared/sound.js)
  const onPtr = e => {
    if (!phone()) return;
    const w = where(e); if (!w) return;
    if (e.type === 'pointerdown' || e.buttons || e.pointerType !== 'mouse') play(w, e);
  };
  addEventListener('pointerdown', onPtr, { passive: true });
  addEventListener('pointermove', onPtr, { passive: true });
  window.__flute = { play: (m = 76) => flute(m, .8, 0) };   // review: __flute.play(76)
})();
