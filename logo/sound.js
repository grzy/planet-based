// HeroSound: the hero as one instrument, every voice in the same key (E Phrygian, the Andalusian colour) and the
// same hushed, close, warm room. Silent until the visitor asks for sound (the "Sound" button in c, "Sound?" Yes / No in
// a and b); the answer is remembered (localStorage, guarded); a quiet serif link in the footer changes it.
//
// THE VOICES (HeroSound.play(voice, step, opts); step = a degree of the shared tuning, so every voice agrees):
//   g  STRINGS     the guide lines: natural guitar harmonics; a sweep rolls a chord of the Andalusian cadence
//   p  PEONY       a Balinese gamelan gender, high, one stroke per step
//   d  DAHLIA      the same gender, low and slow
//   s  SUN         a castanet click per tap and per step; the tongue face: soft palmas
//   b  WORD        the logo's bars and the letters of planetbased.io: the gender in its middle register
//   f  FLOURISH    the logo opening (rising) or folding (falling): a quick Ghanaian-marimba (balafon) run
//   t  ACCENT      one low gender stroke, rarely, after a big full sweep
//   z  BEE         a bee's buzz, harmonized (two quiet, wavering voices a fifth apart)
// No sustained layer: every note is one strike with its own natural release (the old drone and heartbeat are gone).
// Everything stops at once on blur, a hidden page, or when the hero leaves the screen.
// THE SONG: every note played is recorded (voice, step, time) so it can be shared as a link (shared/song.js).
//   HeroSound.on()  HeroSound.start()  HeroSound.pitch(n, down)  HeroSound.onPlay(fn)  HeroSound.allowOnce()
(function () {
  const KEY = 'pb-sound';
  let answer = null, ctx = null, asked = false, once = false;
  try { answer = localStorage.getItem(KEY); } catch (e) {}
  const listeners = [], playListeners = [];
  const allowed = () => answer === 'yes' || once;
  let master, bus, roomSend, cache = new Map();

  // ---------- the room: one context, one bus, tape warmth, a small warm room, a master limiter ----------
  // iOS 16.4+: a 'playback' audio session plays even when the ringer switch is on silent (Web Audio is muted there otherwise)
  const session = () => { try { if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch (e) {} };
  session();
  function start() {
    if (!allowed()) return false;
    session();
    try {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
        const sr = ctx.sampleRate;
        master = ctx.createGain(); master.gain.value = .25;   // about -6 dB from before (Ivy, 11-14)
        const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -16; lim.knee.value = 10; lim.ratio.value = 8; lim.attack.value = .003; lim.release.value = .25;
        const sat = ctx.createWaveShaper(), curve = new Float32Array(2048);
        for (let k = 0; k < 2048; k++) { const x = k / 1023.5 - 1; curve[k] = Math.tanh(1.5 * x) / Math.tanh(1.5); }
        sat.curve = curve; sat.oversample = '2x';
        const wow = ctx.createDelay(.05); wow.delayTime.value = .012;
        const lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.frequency.value = .37; lfoG.gain.value = .0010; lfo.connect(lfoG); lfoG.connect(wow.delayTime); lfo.start();
        const warm = ctx.createBiquadFilter(); warm.type = 'lowshelf'; warm.frequency.value = 220; warm.gain.value = 2;
        const top = ctx.createBiquadFilter(); top.type = 'lowpass'; top.frequency.value = 7000; top.Q.value = .4;
        const room = ctx.createConvolver(), len = Math.floor(sr * 1.1), ir = ctx.createBuffer(2, len, sr);
        for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); let lp = 0; for (let k = 0; k < len; k++) { lp += (Math.random() * 2 - 1 - lp) * .3; d[k] = lp * Math.pow(1 - k / len, 3) * Math.min(1, k / (sr * .008)); } }
        room.buffer = ir;
        const wet = ctx.createGain(); wet.gain.value = .2;
        bus = ctx.createGain(); roomSend = ctx.createGain(); roomSend.gain.value = 1;
        bus.connect(wow); wow.connect(warm); warm.connect(top); top.connect(sat); sat.connect(master);
        top.connect(room); room.connect(wet); wet.connect(master);
        master.connect(lim); lim.connect(ctx.destination);
        // iPhone Safari: a silent buffer started inside the tap unlocks output
        const sil = ctx.createBufferSource(); sil.buffer = ctx.createBuffer(1, 1, sr); sil.connect(ctx.destination); sil.start(0);
        build.init(); decodeGuitar(); decodeVoices();
      }
      if (ctx.state !== 'running') ctx.resume();
    } catch (e) { return false; }
    return true;
  }
  function set(v) {
    answer = v; once = false;
    try { localStorage.setItem(KEY, v); } catch (e) {}
    if (v === 'yes') start(); else if (ctx) ctx.suspend();
    listeners.forEach(f => f(v));
    syncFooter();
  }
  const wake = () => { if (answer === 'yes') start(); };
  // 11-14 (Ivy's iPhone): on iOS a touch's pointerdown is not a user activation; the audio may only start inside
  // touchend, pointerup or click. So on each of those (capture, anywhere) the context is created or resumed and a silent
  // buffer is played right there, synchronously: a drag that turned sound on (song.js, on pointerdown) is heard from the
  // finger lifting on (the settle chord on release plays), and every later touch is live from its first note
  function gestureUnlock() {
    if (!allowed()) return;
    try {
      session();
      if (!ctx) { start(); if (!ctx) return; }
      if (ctx.state !== 'running') ctx.resume();   // (not running yet? the next touchend tries again)
      const b = ctx.createBufferSource(); b.buffer = ctx.createBuffer(1, 1, ctx.sampleRate); b.connect(ctx.destination); b.start(0);
    } catch (e) {}
  }
  ['touchend', 'pointerup', 'click'].forEach(t => addEventListener(t, gestureUnlock, { capture: true, passive: true }));
  addEventListener('pointerdown', wake, { capture: true, passive: true });
  addEventListener('keydown', wake, { capture: true });
  const live = () => allowed() && ctx && ctx.state === 'running';
  // nothing can be orphaned: on blur or a hidden page every voice and the build let go at once
  // 11-14 (Ivy): a gentle ease-out (about 1.2 s) of everything ringing that belongs to one side: the hero ('h') as the page
  // leaves it, the closing ('c') as it leaves view. Never a cut
  function easeOut(tag, sec = 1.2) {
    if (!ctx) return; const t = ctx.currentTime;
    allGains = allGains.filter(([g, end, tg]) => {
      if (tg !== tag || end <= t) return end > t;
      hold(g.gain, t); g.gain.setTargetAtTime(.00001, t, sec / 4); return false;
    });
  }
  function silence() {
    if (!ctx) return; const t = ctx.currentTime;
    allGains.forEach(([g]) => { hold(g.gain, t); g.gain.setTargetAtTime(.00001, t, .02); }); allGains = [];
    if (build.drone) { const d = build.drone; hold(d.g.gain, t); d.g.gain.setTargetAtTime(.00001, t, .05); setTimeout(() => d.oscs.forEach(o => { try { o.stop(); } catch (e) {} }), 600); build.drone = null; }
    build.e = 0; sunStep = null;
  }
  addEventListener('blur', silence); document.addEventListener('visibilitychange', () => { if (document.hidden) silence(); });

  // ---------- the tuning: open D with add9 and maj7, each step a third or a fourth above the last ----------
  // 11-14 (Ivy): Spanish and romantic. E Phrygian with the raised third (the Andalusian colour: E F G# A B C D), two
  // octaves from E3; every voice (strings, flowers, sun, the word) shares it. A step past the top wraps two octaves up
  const TUNING = [52, 53, 56, 57, 59, 60, 62, 64, 65, 68, 69, 71, 72, 74];   // E3 F3 G#3 A3 B3 C4 D4 E4 F4 G#4 A4 B4 C5 D5
  const midi = (n, down) => { n = Math.max(0, Math.round(n)); return Math.min(TUNING[n % TUNING.length] + 24 * Math.floor(n / TUNING.length), 100) - (down ? 12 : 0); };
  const hz = (n, down) => 440 * Math.pow(2, (midi(n, down) - 69) / 12);
  const mhz = m => 440 * Math.pow(2, (m - 69) / 12);

  // ---------- helpers: every gain ramps (no clicks) ----------
  // anchor a param at its current value before a new move (a release during an attack never jumps)
  const hold = (p, t) => { const v = p.value; p.cancelScheduledValues(t); p.setValueAtTime(v, t); };
  let curTag = 'h';   // whose note is being made (play sets it): the hero 'h' or the closing 'c'
  const env = (g, t, peak, a, d) => { allGains.push([g, t + a + d, curTag]); if (allGains.length > 200) { const now = ctx.currentTime; allGains = allGains.filter(x => x[1] > now); } g.gain.setValueAtTime(.00001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.00001, t + a + d); };
  let lastAt = 0;
  const when = (jit = .012) => { const t = Math.max(ctx.currentTime + .003 + Math.random() * jit, lastAt + .012); lastAt = t; return t; };
  const panner = p => { const o = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain(); if (o.pan) o.pan.value = Math.max(-.7, Math.min(.7, p * .7)); o.connect(bus); return o; };

  function pluckBuffer(f, damp) {
    const key = Math.round(f * 4) + ':' + damp; if (cache.has(key)) return cache.get(key);
    const sr = ctx.sampleRate, n = Math.floor(sr * 2.8), b = ctx.createBuffer(1, n, sr), d = b.getChannelData(0);
    const N = Math.max(2, Math.round(sr / f)), line = new Float32Array(N);
    let lp = 0; for (let k = 0; k < N; k++) { lp += (Math.random() * 2 - 1 - lp) * .55; line[k] = lp; }
    const dd = damp - Math.min(.003, f / 400000);   // high strings still ring
    let p = 0; for (let k = 0; k < n; k++) { const a = line[p], c = line[(p + 1) % N]; line[p] = (a + c) * dd; d[k] = a; p = (p + 1) % N; }
    let mx = 0; for (let k = 0; k < Math.min(n, sr * .2); k++) mx = Math.max(mx, Math.abs(d[k])); if (mx) for (let k = 0; k < n; k++) d[k] /= mx;
    cache.set(key, b); return b;
  }
  const noiseCache = new Map();
  function noise(t, dur, freq, q, gain, out) {
    let nb = noiseCache.get(dur);
    if (!nb) { nb = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate); const nd = nb.getChannelData(0); for (let k = 0; k < nd.length; k++) nd[k] = (Math.random() * 2 - 1) * Math.pow(1 - k / nd.length, 3); noiseCache.set(dur, nb); }
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = nb;
    f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; g.gain.value = gain;
    s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + dur + .01);
  }

  // ---------- the recorded voices: Ivy's picks from the sound lab (protos/sound-lab), played exactly as the lab plays
  // them: the nearest sample to the note, pitch-shifted, folded by octaves into the instrument's own range ----------
  //   hrm-*      natural guitar harmonics (the strings)            gender-*  a Balinese gamelan gender (word, peony, dahlia, accent)
  //   balafon-*  a Ghanaian marimba (the logo's open / fold)       cast-click  castanet click (the sun)    palmas  claps (the tongue)
  // Lazy: fetched after the hero has arrived (loadGuitar, the old name), decoded once sound is on
  const BANK = {
    hrm: [52, 57, 62, 64, 67, 69, 74, 78, 79, 83].map(m => [m, 'hrm-' + m * 10]),
    gender: [[53.8, 'gender-538'], [52.1, 'gender-521']],
    balafon: [[43.6, 'balafon-436']],
    click: [[null, 'cast-click']], palmas: [[null, 'palmas']]
  };
  const VDIR = (() => { try { const src = document.currentScript && document.currentScript.src; return src ? src.replace(/[^/]*$/, '') + 'voices/' : 'voices/'; } catch (e) { return 'voices/'; } })();
  const VFILES = Object.values(BANK).flat().map(b => b[1]);
  const vRaw = new Map(), vBuf = new Map(), gBuf = vBuf;   // (gBuf: the old name, for loaded())
  let vFetching = false;
  function decodeVoices() { if (!ctx) return; vRaw.forEach((ab, k) => { vRaw.delete(k); ctx.decodeAudioData(ab).then(b => vBuf.set(k, b)).catch(() => {}); }); }
  const decodeGuitar = () => {};
  function loadGuitar() {
    if (vFetching) return; vFetching = true;
    VFILES.forEach(n => fetch(VDIR + n + '.m4a').then(r => r.ok ? r.arrayBuffer() : null).then(ab => { if (ab) { vRaw.set(n, ab); decodeVoices(); } }).catch(() => {}));
  }
  // the lab's rule: fold the note by octaves into [lowest - 7, highest + 7] of the bank (or a given range), then the
  // nearest loaded sample, pitch-shifted to it
  function pick(bank, m, lo, hi) {
    const ms = BANK[bank].map(b => b[0]).filter(x => x != null);
    if (m != null && ms.length) { const a = lo != null ? lo : Math.min(...ms) - 7, z = hi != null ? hi : Math.max(...ms) + 7; while (m < a) m += 12; while (m > z) m -= 12; }
    let best = null, d = 1e9;
    BANK[bank].forEach(([k, n]) => { if (!vBuf.has(n)) return; const dd = k == null || m == null ? 0 : Math.abs(k - m); if (dd < d) { d = dd; best = [k, n]; } });
    return best ? { name: best[1], rate: best[0] == null || m == null ? 1 : Math.pow(2, (m - best[0]) / 12), m } : null;
  }
  // one recorded sample: its own decay, shaped by a ramped envelope so it can always be silenced (the lab's playBuf)
  function sample(name, t, { rate = 1, gain = .3, pan = 0, dur, lp, att = .004, key } = {}) {
    const b = vBuf.get(name); if (!b) return false;
    const src = ctx.createBufferSource(), g = ctx.createGain(), out = panner(pan); src.buffer = b; src.playbackRate.value = rate;
    const len = Math.min(dur || 9, b.duration / rate);
    env(g, t, gain, att, len); if (key) track(key, g, t);
    let node = src; if (lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; src.connect(f); node = f; }
    node.connect(g); g.connect(out); src.start(t); src.stop(t + att + len + .05); return true;
  }
  // until a sample has loaded: a quiet sine in its place, so nothing ever waits
  function sine(m, t, a, d, pan = 0) { const out = panner(pan), os = ctx.createOscillator(), g = ctx.createGain(); os.type = 'sine'; os.frequency.value = mhz(m); env(g, t, a, .006, d); os.connect(g); g.connect(out); os.start(t); os.stop(t + d + .05); }

  // ---------- the voices ----------
  // a string re-plucked damps its last voice (30 ms), as a real string does; and at most 32 voices sound at once
  const ringing = new Map(), voices = [];
  let allGains = [];   // every enveloped gain (for silence())
  function track(key, g, t) {
    const old = key != null && ringing.get(key); if (old) { hold(old.gain, t); old.gain.setTargetAtTime(.00001, t, .01); }
    if (key != null) ringing.set(key, g);
    voices.push(g); if (voices.length > 32) { const v = voices.shift(); hold(v.gain, t); v.gain.setTargetAtTime(.00001, t, .01); }
  }
  const V = {
    g(step, o) {                                    // STRINGS: natural guitar harmonics (glassy, bell-like)
      const m = o.midi != null ? o.midi : midi(step, o.down), t = when(.016), vel = (o.amp || 1) * .8, k = pick('hrm', m);
      if (k) { sample(k.name, t, { rate: k.rate, gain: .3 * vel, pan: o.pan || 0, dur: 3, key: 'g' + Math.round(k.m) }); return; }
      sine(m + 12, t, .05 * vel, 1.6, o.pan || 0);
    },
    p(step, o) {                                    // PEONY: the gamelan gender, high, one stroke per step
      const k = pick('gender', midi(step + 3), 53, 67), t = when(.004);
      if (k) { sample(k.name, t, { rate: k.rate, gain: .3 * .8, pan: o.pan || 0, dur: 3 }); return; }
      sine(midi(step + 3), t, .05, 1.2, o.pan || 0);
    },
    d(step, o) {                                    // DAHLIA: the gamelan gender, low (an octave and more down), slow and warm
      const k = pick('gender', midi(step), 36, 50), t = when(.006);
      if (k) { sample(k.name, t, { rate: k.rate, gain: .3 * .9, pan: o.pan || 0, dur: 3 }); return; }
      sine(midi(step) - 12, t, .06, 1.6, o.pan || 0);
    },
    b(step, o) {                                    // WORD + LOGO: the gamelan gender in its own middle register, a stroke per bar
      const m = midi(step + 2, o.down) + 12, k = pick('gender', m), t = when(.004), vel = (o.amp || 1) * .7;
      if (k) { sample(k.name, t, { rate: k.rate, gain: .3 * vel, pan: o.pan || 0, dur: 3 }); return; }
      sine(m, t, .05 * vel, 1, o.pan || 0);
    },
    f(step, o) {                                    // FLOURISH: a quick Ghanaian-marimba (balafon) run up (opening) or down (folding)
      const run = [64, 65, 68, 69, 71];
      if (o.single != null) {                       // one note of the run, on the frame the logo passes that beat (hero-logo.js)
        const m = run[Math.max(0, Math.min(4, o.single))], k = pick('balafon', m), t = when(.002);
        if (k) sample(k.name, t, { rate: k.rate, gain: .3 * .7, pan: o.pan || 0, dur: 3 }); else sine(m - 12, t, .04, .5);
        return;
      }
      const up = (o.dir || 1) > 0;
      (up ? run : run.slice().reverse()).forEach((m, i) => setTimeout(() => {
        if (!live() || !atRest()) return;
        const k = pick('balafon', m), t = when(.002);
        if (k) sample(k.name, t, { rate: k.rate, gain: .3 * .7, pan: (i - 2) * .18, dur: 3 }); else sine(m - 12, t, .04, .5);
      }, i * 62));
    },
    t(step, o) {                                    // ACCENT: one low stroke of the gender, rarely, after a big full sweep
      const k = pick('gender', 40, 30, 46), t = ctx.currentTime + .02;
      if (k) sample(k.name, t, { rate: k.rate, gain: .3, dur: 3 }); else sine(40, t, .07, 2);
    },
    k(step, o) {                                    // SLIDER: one gamelan gender note (the lab's fold), quiet
      const k = pick('gender', o.midi, o.lo, o.hi), t = when(.003);
      if (k) sample(k.name, t, { rate: k.rate, gain: .3 * (o.lvl || .8), pan: o.pan || 0, dur: 3, key: 'k' + Math.round(k.m) });
    },
    z(step, o) {                                    // BEE: a buzz, harmonized a fifth apart
      const t = ctx.currentTime + .02, out = panner(o.pan || .5), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.connect(out);
      [mhz(57), mhz(64)].forEach((f, i) => {
        const os = ctx.createOscillator(), g = ctx.createGain(), tr = ctx.createOscillator(), trg = ctx.createGain();
        os.type = 'sawtooth'; os.frequency.value = f; tr.frequency.value = 17 + i * 3; trg.gain.value = 6; tr.connect(trg); trg.connect(os.frequency);
        g.gain.setValueAtTime(.00001, t); g.gain.exponentialRampToValueAtTime(.012, t + .25); g.gain.exponentialRampToValueAtTime(.00001, t + 1.6);
        os.connect(g); g.connect(lp); os.start(t); tr.start(t); os.stop(t + 1.65); tr.stop(t + 1.65);
      });
    },
    s(step, o) {                                    // SUN: a castanet click per tap and per step; the tongue face: palmas
      const t = when(.004), pan = o.pan || 0;
      if (o.tongue) {                               // the lab's palmas: two hands a breath apart
        const k = pick('palmas', null); if (!k) return;
        [[0, 1, .9], [.016, 1.06, .7]].forEach(([dt, r, g]) => sample(k.name, t + dt, { rate: r, gain: .3 * g * (o.lvl || 1), pan: dt ? .25 : -.2 }));
        return;
      }
      const k = pick('click', null);
      if (k) sample(k.name, t, { rate: .97 + Math.random() * .06, gain: .3 * (o.tap ? 1 : .75) * (o.lvl || 1), pan });
    }
  };

  // ---------- the sun: no sustained voice any more (11-14, Ivy). swell(on, step) only chimes once per new step ----------
  let sunStep = null;
  function swell(on, step = 4) {
    if (!on) { sunStep = null; return; }
    if (step === sunStep) return; sunStep = step;
    play('s', step + 4);
  }

  // ---------- the build: a drone, a heartbeat, the choir opening, as the playing gathers ----------
  const build = {
    e: 0, last: 0, drone: null, beatT: 0, pad: null, raf: 0,
    init() { this.tick = this.tick.bind(this); },
    bump(k = 1) { this.e = Math.min(14, this.e + k); this.last = performance.now(); if (!this.raf) this.raf = requestAnimationFrame(this.tick); },
    tick(now) {
      const dt = Math.min(.1, ((now - (this.prev || now)) / 1000)); this.prev = now;
      const idle = (now - this.last) / 1000; this.e *= Math.pow(idle > 2 ? .4 : .83, dt);   // per second, so 60 Hz and 120 Hz agree
      const t = ctx.currentTime;
      // 1. a low drone (D2 + A2), from a few notes in
      const dl = Math.max(0, Math.min(1, (this.e - 3) / 5));
      if (dl > 0 && !this.drone) {
        const g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320; g.gain.value = .00001; lp.connect(g); g.connect(bus);
        const oscs = [38, 45, 50].map(m => { const os = ctx.createOscillator(); os.type = 'triangle'; os.frequency.value = mhz(m); os.connect(lp); os.start(); return os; });
        this.drone = { g, oscs };
      }
      if (this.drone) { hold(this.drone.g.gain, t); this.drone.g.gain.setTargetAtTime(idle > 3 ? .00001 : Math.max(.00001, .022 * dl), t, idle > 3 ? .25 : .4); }
      // 2. a soft heartbeat kick, once the playing really gathers
      if (this.e > 7 && idle < 1.5 && t > this.beatT) {
        this.beatT = t + .78;
        [0, .19].forEach((dt, i) => { const os = ctx.createOscillator(), g = ctx.createGain(); os.frequency.setValueAtTime(120, t + dt); os.frequency.exponentialRampToValueAtTime(48, t + dt + .16); env(g, t + dt, (i ? .025 : .04) * Math.min(1, (this.e - 7) / 4), .005, .22); os.connect(g); g.connect(bus); os.start(t + dt); os.stop(t + dt + .25); });
      }
      // 3. the choir opens on the tonic under everything at the height of it
      if ((this.e < .3 || idle > 4) && this.drone) { const d = this.drone; d.g.gain.setTargetAtTime(.00001, t, .3); setTimeout(() => d.oscs.forEach(o => o.stop()), 2000); this.drone = null; }
      if (idle > 4) this.e = 0;
      this.raf = this.e > .3 ? requestAnimationFrame(this.tick) : 0; if (!this.raf) this.prev = 0;
    }
  };
  // ---------- playing: one entry point, recorded for the song, feeding the build ----------
  let recent = [], brassAt = 0, bigStrums = 0, lastBig = 0;
  // 11-14 (Ivy): the instrument is live only while the hero is at rest. The moment the page scrolls (the blocks begin
  // to part on desktop, where the hero stays pinned and so still "visible"), every hero sound stops (a fast fade) and
  // nothing plays again until the page is back at the top. A shared song's replay is the only exception
  // 11-14 (Ivy): on phones a small accidental scroll stopped the guitar. There the hero stays "at rest" until about half
  // of it has scrolled away; desktop keeps the strict top-of-page gate (its hero is pinned)
  const atRest = () => {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    if (innerWidth >= 760) return y < 8;
    const h = document.querySelector('.hero'); return y < (h ? h.offsetHeight : innerHeight) * .45;
  };
  let wasRest = true;
  // 11-14 (Ivy): leaving the hero no longer cuts the sound: what is already ringing finishes on its own decay (3 s at most);
  // only new hero notes are refused (the gate in play), and anything scheduled but not yet started is refused there too
  addEventListener('scroll', () => { const r = atRest(); if (wasRest && !r) easeOut('h'); wasRest = r; }, { passive: true });   // ease out, never cut
  window.HeroAtRest = atRest;
  function play(voice, step = 0, o = {}) {
    if (!live() || !V[voice]) return false;
    if (o.closing ? !closingSeen() : (!atRest() && !(o.replay && o.song))) return false;   // the closing has its own gate; tremolos and tails scheduled earlier are refused once the hero is left
    curTag = o.closing ? 'c' : 'h';
    try { V[voice](step, o); } finally { curTag = 'h'; }
    window.__hsNotes = (window.__hsNotes || 0) + 1; if (!o.replay) window.__hsLastPlay = performance.now();
    if (voice !== 'z' && !o.replay) playListeners.forEach(f => f(voice, step, o));
    // 11-14 (Ivy, a stuck hum): no build layer any more (no drone, no heartbeat); every note is a single strike that
    // decays on its own
    const now = performance.now(); recent = recent.filter(x => now - x < 600); recent.push(now);
    if (voice === 'g' && !o.replay && recent.length >= 10 && now - brassAt > 20000 && Math.random() < .2) { brassAt = now; setTimeout(() => play('t', 0, {}), 260); }   // a big full sweep, now and then: one soft frame-drum boom
    return true;
  }
  // the old single-voice API (guitar), kept for the strings and bars written against it
  const note = (freq, bright = .5, pan = 0, glideFrom) => { const n = TUNING.findIndex((m, i) => Math.abs(mhz(m) - freq) / freq < .03); return play('g', n < 0 ? 4 : n, { bright, pan, from: glideFrom }); };
  const pitch = (n, down) => hz(n, down);

  // ---------- the question (a and b) ----------
  function ask(host, opts = {}) {
    if (answer || asked || !host) { if (answer && opts.onAnswer) opts.onAnswer(answer); return null; }
    asked = true;
    const q = document.createElement('div');
    q.className = 'hs-ask'; q.setAttribute('role', 'group'); q.setAttribute('aria-label', 'Sound');
    q.innerHTML = '<span class="hs-ask-q">Sound?</span><button type="button" data-v="yes">Yes</button><button type="button" data-v="no">No</button>';
    q.addEventListener('pointerdown', e => e.stopPropagation());
    q.querySelectorAll('button').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation(); set(b.dataset.v); q.classList.add('done');
      setTimeout(() => q.remove(), 600);
      if (opts.onAnswer) opts.onAnswer(b.dataset.v);
    }));
    host.appendChild(q);
    requestAnimationFrame(() => q.classList.add('in'));
    q.dismiss = () => { if (answer || !q.isConnected) return; q.classList.add('done'); setTimeout(() => q.remove(), 500); asked = false; };
    return q;
  }

  // ---------- sound credits (one place, easy to move to a credits page). CC BY sources need a credit; CC0 ones don't,
  // but are listed for the record ----------
  const CREDITS = [
    { what: 'guitar harmonics (the strings)', who: 'quartertone', title: 'ClassicalGuitarHarmonics', url: 'https://freesound.org/people/quartertone/packs/11598/', lic: 'CC BY 4.0' },
    { what: 'castanet click (the sun)', who: 'NoahBangs', title: 'Castanets, 4 Fast Clicks', url: 'https://freesound.org/people/NoahBangs/sounds/666766/', lic: 'CC BY 4.0' },
    { what: 'gamelan gender (the word, the flowers, the accent)', who: 'thedialogueproject', title: 'Bali Xylophone 2', url: 'https://freesound.org/people/thedialogueproject/sounds/48265/', lic: 'CC0' },
    { what: 'Ghanaian marimba (the logo opening)', who: 'Sassaby', title: 'Ghanaian Marimba G1-mp', url: 'https://freesound.org/people/Sassaby/sounds/528065/', lic: 'CC0' },
    { what: 'hand claps (the tongue)', who: 'olehenriksen', title: 'Hand Clap / High Five', url: 'https://freesound.org/people/olehenriksen/sounds/771247/', lic: 'CC0' },
    { what: 'tūī (the Living Walls card)', who: 'Ken George, Whakatāne, NZ', title: 'Tūī, XC1090728', url: 'https://xeno-canto.org/1090728', lic: 'CC BY-NC-SA 4.0', licUrl: 'https://creativecommons.org/licenses/by-nc-sa/4.0/' },
    { what: 'a few honeybees passing (the Beekeeper card)', who: 'Natural History Museum, London, via BioAcoustica', title: 'Honeybee buzz', url: 'https://commons.wikimedia.org/wiki/File:BioAcoustica_898_4_Apis_mellifera_(Honey_Bee)_78.flac', lic: 'CC BY 3.0', licUrl: 'https://creativecommons.org/licenses/by/3.0/' },
    { what: 'Swainson\'s thrush (the Bioindicators card)', who: 'CVLTIV8R, Petrolia, California', title: 'Swainson\'s Thrush Birdsong Lost Coast Ambience of Petrolia, CA', url: 'https://freesound.org/people/CVLTIV8R/sounds/866963/', lic: 'CC0 1.0', licUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' }
  ];

  // ---------- the colour slider plays the gender (11-14, Ivy) ----------
  // Dragging: one note per step along the track (the scale from E3 up to G#4: rising toward the dark end, falling back
  // toward green), at most ~12 notes a second. Released or settled on a mode: a soft rolled chord, the lab's strings
  // gesture (green: E major, home; oatmeal: A minor; dark: F major). Arrow keys play a note per step. Same gate as
  // everything: sound on, hero at rest
  (function sliderUnlock() {
    const hook = () => { const el = document.querySelector('.hero .pbs'); if (!el) return setTimeout(hook, 400); if (el.__hsU) return; el.__hsU = true; ['touchend', 'pointerup'].forEach(t => el.addEventListener(t, gestureUnlock, { passive: true })); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook); else hook();
  })();
  (function slider() {
    const RANGE = 9, CH = [[52, 56, 59, 64, 68, 71, 76], [57, 60, 64, 69, 72, 76], [53, 57, 60, 65, 69, 72, 77]];
    let dragging = false, lastStep = null, lastAt = 0, settleT = 0;
    const tNow = () => (window.PBM ? PBM.t : 0);
    const stepOf = t => Math.round(Math.max(0, Math.min(2, t)) / 2 * RANGE);
    function noteFor(t, force) {
      const st = stepOf(t), now = performance.now();
      if (now - lastAt < 85 || (!force && st === lastStep)) return;   // never more than ~12 a second, keys included
      lastStep = st; lastAt = now;
      play('k', st, { midi: TUNING[st], lo: 48, hi: 70, lvl: .7, pan: st / RANGE * .8 - .4 });   // unfolded, so it always rises toward dark
    }
    function chord() {
      const t = tNow(), mode = Math.round(Math.max(0, Math.min(2, t)));
      CH[mode].forEach((m, i) => setTimeout(() => play('k', i, { midi: m, lvl: .8 * .8, pan: -.35 + i * .1 }), i * 55));
    }
    const onTrack = e => e.target && e.target.closest && e.target.closest('.pbs');
    addEventListener('pointerdown', e => { if (onTrack(e)) { dragging = true; lastStep = null; clearTimeout(settleT); setTimeout(() => noteFor(tNow(), true), 30); } }, true);
    addEventListener('pointermove', () => { if (dragging) noteFor(tNow()); }, { passive: true });
    const up = () => { if (!dragging) return; dragging = false; clearTimeout(settleT); settleT = setTimeout(chord, 380); };   // after the soft pull onto a mode
    addEventListener('pointerup', up, true); addEventListener('pointercancel', up, true);
    addEventListener('keydown', e => {
      if (!onTrack(e) || !/^(Arrow|Page|Home|End)/.test(e.key)) return;
      setTimeout(() => noteFor(tNow(), true), 0);
      clearTimeout(settleT); if (/^(Page|Home|End)/.test(e.key)) settleT = setTimeout(chord, 380);
    }, true);
  })();

  // ---------- the closing (footer scene) plays too (11-14, Ivy) ----------
  // Quiet and sparse, only with sound on and only while the closing is in view (its own gate, independent of the hero's),
  // nothing on scroll alone. It listens to the scene without changing its code: the breeze's pencil lines (pbScribble),
  // the flowers' nods and the tree's sway (their animations), the smiley's wink and tongue (its strokes drawing on) and the
  // email's pencil "copied" (pbCopied); taps and hovers on the flowers and the tree
  let closingIn = false;
  const closingSeen = () => closingIn;
  (function closingSound() {
    const later = (sec, f) => setTimeout(() => { if (live() && closingIn) f(); }, Math.max(0, sec * 1000));
    const C = (v, st, o) => play(v, st, { ...o, closing: true });
    // the voices, in the hero's palette
    const gust = t0 => later(t0 + .35, () => { const ns = [76, 79, 83].slice(0, 2 + (Math.random() < .5 ? 1 : 0)); ns.forEach((m, i) => setTimeout(() => C('g', 0, { midi: m, amp: .38, pan: -.6 + i * .6 }), i * 240)); });   // a faint harmonic shimmer, left to right
    const flower = (which, amp = 1) => { if (which === 'big') C('d', 4, { amp, pan: .3 }); else if (which === 'small') C('p', 6, { amp, pan: -.1 }); else C('b', 5, { amp, pan: 0 }); };   // big low, small high, the café dahlia mid
    const roll = () => [0, 1, 2, 3].forEach((k, i) => setTimeout(() => { if (live() && closingIn) C('f', 0, { single: k, pan: .35 }); }, i * 70));   // the potted tree: a short balafon roll
    let lastRoll = 0; const treeRoll = () => { const n = performance.now(); if (n - lastRoll < 1200) return; lastRoll = n; roll(); };
    // the breeze's pencil lines: one shimmer per gust (lines drawn within a breath of each other are one gust); smoke
    let gustAt = -1e9;
    const hookScribble = () => {
      const orig = window.pbScribble; if (!orig || orig.__hs) return;
      const wrapped = function (layer, key, o = {}) {
        const r = orig.apply(this, arguments);
        try {
          const at = performance.now() + (o.t0 || 0) * 1000;
          if (/^W/.test(key) && at - gustAt > 900) { gustAt = at; gust(o.t0 || 0); }
          if (key === 'S05' && at - (wrapped.smokeAt || 0) > 3000) { wrapped.smokeAt = at; later((o.t0 || 0) + .2, () => C('g', 0, { midi: 88, amp: .32, pan: .4 })); }   // chimney smoke: one long, soft harmonic
        } catch (e) {}
        return r;
      };
      wrapped.__hs = true; window.pbScribble = wrapped;
    };
    hookScribble();
    // nods, the sway, the smiley's acts: read from the animations the scene starts
    const proto = Element.prototype, anim = proto.animate;
    if (anim && !anim.__hs) {
      proto.animate = function (kf, opt) {
        const a = anim.apply(this, arguments);
        try {
          const d = (opt && typeof opt === 'object' && opt.delay || 0) / 1000;
          const id = this.id, cl = this.classList;
          if ((id === 'flipBig' || id === 'flipSmall') && Array.isArray(kf) && kf.length > 3 && String(kf[1].transform || '').includes('rotate')) later(d + .3, () => flower(id === 'flipBig' ? 'big' : 'small', .5));   // the wind nods it: one soft note
          else if (cl && cl.contains('pt-sway') && Array.isArray(kf) && kf.length > 4) later(d + .4, treeRoll);
          else if (this.closest && this.closest('#smiley') && Array.isArray(kf) && kf[0] && kf[0].strokeDashoffset === '1') {
            const paths = [...this.closest('svg').querySelectorAll('path')], i = paths.indexOf(this);   // eye, smile, tongue, wink
            if (i === 3) later(d, () => C('s', 0, { lvl: .7 }));                        // the wink: one castanet click
            else if (i === 2) later(d, () => C('s', 0, { tongue: true, lvl: .45 }));   // the tongue: a tiny palmas
          }
        } catch (e) {}
        return a;
      };
      proto.animate.__hs = true;
    }
    // the email's "✓ copied": a click as the check lands, a gender note as "copied" finishes
    const hookCopied = () => {
      const orig = window.pbCopied; if (!orig || orig.__hs) return;
      const w = function (host) { const r = orig.apply(this, arguments); if (host && host.closest && host.closest('.closing')) { later(.3, () => C('s', 0, { lvl: .8 })); later(1.9, () => C('b', 7, { amp: .7 })); } return r; };
      w.__hs = true; window.pbCopied = w;
    };
    const wire = () => {
      hookScribble(); hookCopied();
      const closing = document.querySelector('.closing'); if (!closing || closing.__hs) return; closing.__hs = true;
      if (window.IntersectionObserver) new IntersectionObserver(es => es.forEach(e => { const was = closingIn; closingIn = e.isIntersecting && e.intersectionRatio >= .2; if (was && !closingIn) easeOut('c'); }), { threshold: [0, .2, .5] }).observe(closing);
      // taps and hovers: each flower its register, the tree its roll (a hover only once in a while)
      // the flowers take no pointer events (the scene's own design), so a press or a hover is found by where it lands: inside
      // the flower's round head (an ellipse of 40% of its box)
      const FL = [['flipBig', 'big'], ['flipSmall', 'small'], ['dahliaTop', 'top']], hov = new Map(), inside = new Set();
      const hit = (e, el) => { const r = el.getBoundingClientRect(); if (!r.width) return false; const dx = (e.clientX - (r.left + r.width / 2)) / (r.width * .4), dy = (e.clientY - (r.top + r.height / 2)) / (r.height * .4); return dx * dx + dy * dy < 1; };
      addEventListener('pointerdown', e => {
        if (!closingIn) return;
        FL.forEach(([id, w]) => { const el = document.getElementById(id); if (el && hit(e, el) && performance.now() - (hov.get(id) || 0) > 400) C(w === 'big' ? 'd' : w === 'small' ? 'p' : 'b', w === 'big' ? 3 : w === 'small' ? 7 : 6, { amp: 1, pan: w === 'big' ? .3 : -.1 }); });
      }, { passive: true });
      addEventListener('pointermove', e => {
        if (!closingIn || e.pointerType !== 'mouse' || (e.movementX === 0 && e.movementY === 0)) return;
        FL.forEach(([id, w]) => {
          const el = document.getElementById(id); if (!el) return;
          const now = hit(e, el);
          if (now && !inside.has(id)) { const n = performance.now(); if (n - (hov.get(id) || 0) > 900) { hov.set(id, n); flower(w, .8); } }
          if (now) inside.add(id); else inside.delete(id);
        });
      }, { passive: true });
      const tree = document.getElementById('potTree');
      if (tree) { tree.addEventListener('pointerdown', treeRoll); tree.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') treeRoll(); }); }
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
    addEventListener('load', wire);
  })();

  // ---------- the footer's quiet way to change it ----------
  let footLink = null;
  function syncFooter() { if (footLink) footLink.textContent = answer === 'yes' ? 'Sound: on' : 'Sound: off'; }
  function footer() {
    const foot = document.querySelector('.foot');
    if (!foot || footLink) return;
    // "Sound: on · credits" as one small item; "credits" opens a quiet panel listing every source (HeroSound.CREDITS)
    const wrap = document.createElement('span'); wrap.className = 'hs-foot-wrap';
    footLink = document.createElement('button'); footLink.type = 'button'; footLink.className = 'hs-foot';
    footLink.addEventListener('click', () => set(answer === 'yes' ? 'no' : 'yes'));
    const dot = document.createElement('span'); dot.className = 'hs-foot-dot'; dot.setAttribute('aria-hidden', 'true'); dot.textContent = '·';
    const cb = document.createElement('button'); cb.type = 'button'; cb.className = 'hs-foot hs-cred-btn'; cb.textContent = 'credits';
    cb.setAttribute('aria-expanded', 'false'); cb.setAttribute('aria-controls', 'hsCredits');
    const pan = document.createElement('div'); pan.className = 'hs-cred'; pan.id = 'hsCredits'; pan.setAttribute('role', 'dialog'); pan.setAttribute('aria-label', 'Sound credits'); pan.hidden = true;
    const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    pan.innerHTML = '<p class="hs-cred-h">Sounds</p><ul>' + CREDITS.map(c => `<li><span class="w">${esc(c.what)}</span> <a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.title)}</a> by ${esc(c.who)}, ${c.lic === 'CC0' ? 'CC0' : '<a href="' + esc(c.licUrl || 'https://creativecommons.org/licenses/by/4.0/') + '" target="_blank" rel="noopener">' + esc(c.lic) + '</a>'}</li>`).join('') + '</ul>';
    const open = v => { pan.hidden = !v; cb.setAttribute('aria-expanded', String(v)); if (v) { const a = pan.querySelector('a'); if (a) a.focus({ preventScroll: true }); } };
    cb.addEventListener('click', e => { e.stopPropagation(); open(pan.hidden); });
    document.addEventListener('pointerdown', e => { if (!pan.hidden && !wrap.contains(e.target)) open(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !pan.hidden) { open(false); cb.focus(); } });
    wrap.append(footLink, dot, cb, pan);
    foot.appendChild(wrap); syncFooter();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', footer); else footer();

  window.HeroSound = {
    ask, set, play, note, pitch, swell, start, TUNING, silence, loadGuitar, CREDITS, unlock: gestureUnlock, loaded: () => ({ guitar: gBuf.size, voices: vBuf.size, of: VFILES.length }), midiOf: (n, down) => midi(n, down),
    on: () => live(), answer: () => answer,
    get ctx() { return ctx; },   // 11-14: the card sounds play through the same unlocked context (breeze/cardsound.js)
    onChange: f => listeners.push(f), onPlay: f => playListeners.push(f),
    // a shared song's Play tap: sound for this playback only (the visitor's own setting is untouched)
    allowOnce() { once = true; return start(); },
    endOnce() { if (!once) return; once = false; if (answer !== 'yes' && ctx) ctx.suspend(); }
  };
})();
