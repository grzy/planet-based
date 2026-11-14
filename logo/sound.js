// HeroSound: the hero as one instrument, every voice in the same key (E Phrygian, the Andalusian colour) and the
// same hushed, close, warm room. Silent until the visitor asks for sound (the "Sound" button in c, "Sound?" Yes / No in
// a and b); the answer is remembered (localStorage, guarded); a quiet serif link in the footer changes it.
//
// THE VOICES (HeroSound.play(voice, step, opts); step = a degree of the shared tuning, so every voice agrees):
//   g  STRINGS     the guide lines: a recorded nylon-string Spanish guitar (falls back to a plucked-string synth until the
//                  samples load); a sweep rolls a chord of the Andalusian cadence, a lone pluck may bloom into a tremolo
//   p  PEONY       a requinto (a small high guitar, the nylon samples an octave up): a delicate p-a-m-i tremolo
//   d  DAHLIA      cello pizzicato, low and warm, each note rolled up to its octave (VSCO-2 CE, CC0)
//   s  SUN         castanets: a tap is a short roll, a drag clicks per step, the tongue face a little ta-ka-ta
//   b  WORD        the logo's bars and the letters of planetbased.io: natural guitar harmonics, one per letter
//   f  FLOURISH    the logo opening (rising) or folding (falling): four harmonics up or down the tuning
//   t  PALMAS      very soft hand claps, rarely, after a big full sweep
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
  function start() {
    if (!allowed()) return false;
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
        // warm the string buffers in small idle slices, so the first touch never waits on them
        build.init(); decodeGuitar(); decodeVoices();
        let k = 0; const warmUp = () => { if (k < TUNING.length) { pluckBuffer(hz(k), .4985); pluckBuffer(hz(k), .4975); k++; if (window.requestIdleCallback) requestIdleCallback(warmUp, { timeout: 200 }); else setTimeout(warmUp, 30); } };
        warmUp();
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
  addEventListener('pointerdown', wake, { capture: true, passive: true });
  addEventListener('keydown', wake, { capture: true });
  const live = () => allowed() && ctx && ctx.state === 'running';
  // nothing can be orphaned: on blur or a hidden page every voice and the build let go at once
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
  const env = (g, t, peak, a, d) => { allGains.push([g, t + a + d]); if (allGains.length > 200) { const now = ctx.currentTime; allGains = allGains.filter(x => x[1] > now); } g.gain.setValueAtTime(.00001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.00001, t + a + d); };
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

  // ---------- the real guitar (11-14, Ivy: Carrie & Lowell, not a synth) ----------
  // Recorded single notes of a steel-string Martin HD-28, one every three semitones (E2 to B5), each note played from
  // the nearest one, pitch-shifted the last semitone or so. Lazy: fetched after the hero has arrived, decoded once sound is
  // on. Until a note's sample is ready the string falls back to the plucked-string synth, so nothing ever waits.
  // GUITAR lists the sample files (shared/guitar/, logo/guitar/ at the root); empty = the synth only.
  const GUITAR = [40, 42, 44, 47, 49, 52, 54, 57, 59, 61, 64, 66, 68, 71, 73, 76, 79].map(m => [m, 'nylon-' + m + '.m4a']);
  // the nylon-string guitar: "ClassicalGuitar-multisampled" by quartertone (Freesound pack 11573), a Yamaha Eterna
  // classical guitar, close-miked; CC BY 4.0 (credited in the footer's sound credits). Trimmed, mono, AAC
  const GDIR = (() => { try { const src = document.currentScript && document.currentScript.src; return src ? src.replace(/[^/]*$/, '') + 'guitar/' : 'guitar/'; } catch (e) { return 'guitar/'; } })();
  const gRaw = new Map(), gBuf = new Map();   // midi -> ArrayBuffer, midi -> AudioBuffer
  let gFetching = false;
  // the rest of the Spanish band (shared/voices/, logo/voices/ at the root), loaded with the guitar:
  //   cast-*  castanets (the sun)            hrm-<m>  natural guitar harmonics (the word and the logo)
  //   pizz-<m> cello pizzicato (the dahlia)   clap     one hand clap, layered into soft palmas
  const VDIR = GDIR.replace(/guitar\/$/, 'voices/');
  const HRM = [52, 57, 62, 64, 67, 69, 74, 78, 79, 83], PIZZ = [40, 43, 47, 50, 53, 57, 60, 64, 67, 71];
  const VFILES = ['cast-click', 'cast-takata', 'cast-roll', 'clap', ...HRM.map(m => 'hrm-' + m), ...PIZZ.map(m => 'pizz-' + m)];
  const vRaw = new Map(), vBuf = new Map();
  function decodeVoices() { if (!ctx) return; vRaw.forEach((ab, k) => { vRaw.delete(k); ctx.decodeAudioData(ab).then(b => vBuf.set(k, b)).catch(() => {}); }); }
  const nearestIn = (list, pre, m, reach = 4) => { let best = null, d = 1e9; list.forEach(k => { if (!vBuf.has(pre + k)) return; const dd = Math.abs(k - m); if (dd < d) { d = dd; best = k; } }); return best != null && d <= reach ? best : null; };
  // one recorded sample: its own decay, shaped by a ramped envelope so it can always be silenced
  function sample(name, t, { rate = 1, gain = .3, pan = 0, dur, lp } = {}) {
    const b = vBuf.get(name); if (!b) return false;
    const src = ctx.createBufferSource(), g = ctx.createGain(), out = panner(pan); src.buffer = b; src.playbackRate.value = rate;
    const len = Math.min(dur || b.duration / rate, b.duration / rate);
    env(g, t, gain, .003, len);
    let node = src; if (lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; src.connect(f); node = f; }
    node.connect(g); g.connect(out); src.start(t); src.stop(t + len + .05); return true;
  }
  function loadGuitar() {
    if (gFetching || !GUITAR.length) return; gFetching = true;
    VFILES.forEach(n => fetch(VDIR + n + '.m4a').then(r => r.ok ? r.arrayBuffer() : null).then(ab => { if (ab) { vRaw.set(n, ab); decodeVoices(); } }).catch(() => {}));
    GUITAR.forEach(([m, file]) => fetch(GDIR + file).then(r => r.ok ? r.arrayBuffer() : null).then(ab => { if (ab) { gRaw.set(m, ab); decodeGuitar(); } }).catch(() => {}));
  }
  function decodeGuitar() {
    if (!ctx) return;
    gRaw.forEach((ab, m) => { gRaw.delete(m); ctx.decodeAudioData(ab).then(b => gBuf.set(m, b)).catch(() => {}); });
  }
  const nearestGuitar = m => { let best = null, d = 1e9; gBuf.forEach((b, k) => { const dd = Math.abs(k - m) + (k > m ? .1 : 0); if (dd < d) { d = dd; best = k; } }); return best != null && d <= 3 ? best : null; };

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
    g(step, o) {                                    // STRINGS: fingerpicked guitar
      const m = o.midi != null ? o.midi : midi(step, o.down);   // o.midi: a chord tone chosen by the strings
      const t = when(.016), vel = (.62 + Math.random() * .3) * (o.amp || 1), f = mhz(m), out = panner(o.pan || 0);
      const src = ctx.createBufferSource(), k = nearestGuitar(m);
      let rate = 1;
      if (k != null) { src.buffer = gBuf.get(k); rate = Math.pow(2, (m - k) / 12); src.playbackRate.value = rate; }   // the real guitar
      else src.buffer = pluckBuffer(f, .4985);                                                                         // the synth, until it loads
      if (o.from) { src.playbackRate.setValueAtTime(rate * o.from / f, t); src.playbackRate.linearRampToValueAtTime(rate, t + .09); }
      const body = ctx.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 190; body.Q.value = 1.1; body.gain.value = k != null ? 1 : 5;   // the recording has its own body
      const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 1700 + 3000 * (o.bright ?? .5) * vel;
      const g = ctx.createGain(); env(g, t, .3 * vel, .004, 2.6); track('g' + m, g, t);
      src.connect(body); body.connect(tone); tone.connect(g); g.connect(out); src.start(t); src.stop(t + 2.7);
      if (k == null) { const sq = Math.random() < .25; noise(t, .05, sq ? 2600 + Math.random() * 900 : 4200, sq ? 7 : 1.2, (sq ? .04 : .02) * vel, out); }   // the synth's finger noise (the recording has real ones)
    },
    p(step, o) {                                    // PEONY: a requinto (a small, high Spanish guitar), a delicate tremolo
      const m = midi(step + 3) + 12, k = nearestGuitar(m), out = panner(o.pan || 0);
      if (k == null) {                                // until the guitar loads: the old music-box tine
        const t = when(.006), f = mhz(m - 12), vel = .7;
        [[1, .1, 2.2], [4.07, .03, .5]].forEach(([r, a, d]) => { const os = ctx.createOscillator(), g = ctx.createGain(); os.type = 'sine'; os.frequency.value = f * r; env(g, t, a * vel, .003, d); os.connect(g); g.connect(out); os.start(t); os.stop(t + d + .05); });
        return;
      }
      const t0 = when(.004), rate = Math.pow(2, (m - k) / 12), n = o.short ? 3 : 5;
      for (let i = 0; i < n; i++) {                   // p-a-m-i: the same note, quick and soft, fading
        const t = t0 + i * .068, src = ctx.createBufferSource(), g = ctx.createGain(), hp = ctx.createBiquadFilter();
        src.buffer = gBuf.get(k); src.playbackRate.value = rate;
        hp.type = 'highpass'; hp.frequency.value = 380;
        env(g, t, (.16 - i * .022) * (i ? .8 : 1), .002, i === n - 1 ? 1.6 : .22);
        src.connect(hp); hp.connect(g); g.connect(out); src.start(t); src.stop(t + 1.7);
      }
    },
    d(step, o) {                                    // DAHLIA: cello pizzicato, low and warm, a slow rolled bass note
      const m = midi(step) - 12, k = nearestIn(PIZZ, 'pizz-', m), pan = o.pan || 0;
      if (k == null) {                                // until it loads: the old felt piano
        const t = when(.008), f = mhz(m + 12), out = panner(pan), felt = ctx.createBiquadFilter(); felt.type = 'lowpass'; felt.frequency.value = 900; felt.connect(out);
        [[1, .2, 1.4], [2, .04, .6]].forEach(([r, a, d]) => { const os = ctx.createOscillator(), g = ctx.createGain(); os.type = 'sine'; os.frequency.value = f * r; env(g, t, a, .013, d); os.connect(g); g.connect(felt); os.start(t); os.stop(t + d + .05); });
        return;
      }
      const t = when(.008), rate = Math.pow(2, (m - k) / 12);
      sample('pizz-' + k, t, { rate, gain: .42, pan, lp: 1800 });
      // the roll: the octave above, a breath later and softer
      const k2 = nearestIn(PIZZ, 'pizz-', m + 12); if (k2 != null) sample('pizz-' + k2, t + .11, { rate: Math.pow(2, (m + 12 - k2) / 12), gain: .2, pan: pan + .1, lp: 2200 });
    },
    b(step, o) {                                    // WORD + LOGO: natural guitar harmonics (glassy, bell-like, still a guitar)
      const m = midi(step + 2, o.down) + 12, k = nearestIn(HRM, 'hrm-', m, 5), pan = o.pan || 0;
      const t = when(.006), vel = (.7 + Math.random() * .2) * (o.amp || 1);
      if (k != null) { sample('hrm-' + k, t, { rate: Math.pow(2, (m - k) / 12), gain: .34 * vel, pan, dur: 3 }); return; }
      // until they load: a pure, quiet sine bell
      const out = panner(pan); [[1, .09, 2.4], [2, .02, .8]].forEach(([r, a, d]) => { const os = ctx.createOscillator(), g = ctx.createGain(); os.type = 'sine'; os.frequency.value = mhz(m) * r; env(g, t, a * vel, .004, d); os.connect(g); g.connect(out); os.start(t); os.stop(t + d + .05); });
    },
    f(step, o) {                                    // FLOURISH: four harmonics up (opening) or down (folding)
      const up = (o.dir || 1) > 0, base = up ? 2 : 7;
      [0, 1, 2, 3].forEach((k, i) => setTimeout(() => live() && V.b(base + (up ? k : -k), { amp: .8, pan: (k - 1.5) * .2 }), i * 85));
    },
    t(step, o) {                                    // PALMAS: very soft hand claps, two hands a breath apart, twice
      [[0, 1, .14], [.016, 1.06, .1], [.27, .97, .11], [.287, 1.03, .08]].forEach(([dt, r, g], i) => sample('clap', ctx.currentTime + .02 + dt, { rate: r, gain: g, pan: i % 2 ? .25 : -.2, lp: 5200 }));
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
    s(step, o) {                                    // SUN: castanets (cheeky, like its tongue)
      const t = when(.004), pan = o.pan || 0;
      if (o.tongue) { if (sample('cast-takata', t, { gain: .3, pan })) return; }
      else if (o.tap) { if (sample('cast-roll', t, { gain: .26, pan, rate: .97 + Math.random() * .06 })) return; }
      else if (sample('cast-click', t, { gain: .24, pan, rate: .9 + (step % 14) * .02 + Math.random() * .03 })) return;
      // until they load: a soft, short chime
      const f = hz(step + 2), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; lp.connect(panner(pan));
      [[1, .06, .9]].forEach(([r, a, d]) => { const os = ctx.createOscillator(), g = ctx.createGain(); os.type = 'sine'; os.frequency.value = f * r; env(g, t, a, .012, d); os.connect(g); g.connect(lp); os.start(t); os.stop(t + d + .05); });
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
  const atRest = () => (window.scrollY || document.documentElement.scrollTop || 0) < 8;
  addEventListener('scroll', () => { if (!atRest()) silence(); }, { passive: true });
  window.HeroAtRest = atRest;
  function play(voice, step = 0, o = {}) {
    if (!live() || !V[voice]) return false;
    if (!o.replay && !atRest()) return false;
    V[voice](step, o);
    window.__hsNotes = (window.__hsNotes || 0) + 1; if (!o.replay) window.__hsLastPlay = performance.now();
    if (voice !== 'z' && !o.replay) playListeners.forEach(f => f(voice, step, o));
    // 11-14 (Ivy, a stuck hum): no build layer any more (no drone, no heartbeat); every note is a single strike that
    // decays on its own
    const now = performance.now(); recent = recent.filter(x => now - x < 600); recent.push(now);
    if (voice === 'g' && !o.replay && recent.length >= 10 && now - brassAt > 20000 && Math.random() < .2) { brassAt = now; setTimeout(() => play('t', 0, {}), 260); }   // a big full sweep, now and then: soft palmas
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
    { what: 'nylon guitar (the strings, the peony)', who: 'quartertone', title: 'ClassicalGuitar-multisampled', url: 'https://freesound.org/people/quartertone/packs/11573/', lic: 'CC BY 4.0' },
    { what: 'guitar harmonics (the word, the logo)', who: 'quartertone', title: 'ClassicalGuitarHarmonics', url: 'https://freesound.org/people/quartertone/packs/11598/', lic: 'CC BY 4.0' },
    { what: 'castanet clicks (the sun)', who: 'NoahBangs', title: 'Castanets, 4 Fast Clicks', url: 'https://freesound.org/people/NoahBangs/sounds/666766/', lic: 'CC BY 4.0' },
    { what: 'castanet roll (the sun)', who: 'joshysqaushy', title: 'Castanet Roll (120bpm)', url: 'https://freesound.org/people/joshysqaushy/sounds/337136/', lic: 'CC0' },
    { what: 'cello pizzicato (the dahlia)', who: 'Versilian Studios', title: 'VSCO 2 CE', url: 'https://github.com/sgossner/VSCO-2-CE', lic: 'CC0' },
    { what: 'hand clap (palmas)', who: 'olehenriksen', title: 'Hand Clap / High Five', url: 'https://freesound.org/people/olehenriksen/sounds/771247/', lic: 'CC0' }
  ];

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
    pan.innerHTML = '<p class="hs-cred-h">Sounds</p><ul>' + CREDITS.map(c => `<li><span class="w">${esc(c.what)}</span> <a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.title)}</a> by ${esc(c.who)}, ${c.lic === 'CC0' ? 'CC0' : '<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">' + esc(c.lic) + '</a>'}</li>`).join('') + '</ul>';
    const open = v => { pan.hidden = !v; cb.setAttribute('aria-expanded', String(v)); if (v) { const a = pan.querySelector('a'); if (a) a.focus({ preventScroll: true }); } };
    cb.addEventListener('click', e => { e.stopPropagation(); open(pan.hidden); });
    document.addEventListener('pointerdown', e => { if (!pan.hidden && !wrap.contains(e.target)) open(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !pan.hidden) { open(false); cb.focus(); } });
    wrap.append(footLink, dot, cb, pan);
    foot.appendChild(wrap); syncFooter();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', footer); else footer();

  window.HeroSound = {
    ask, set, play, note, pitch, swell, start, TUNING, silence, loadGuitar, CREDITS, midiOf: (n, down) => midi(n, down),
    on: () => live(), answer: () => answer,
    onChange: f => listeners.push(f), onPlay: f => playListeners.push(f),
    // a shared song's Play tap: sound for this playback only (the visitor's own setting is untouched)
    allowOnce() { once = true; return start(); },
    endOnce() { if (!once) return; once = false; if (answer !== 'yes' && ctx) ctx.suspend(); }
  };
})();
