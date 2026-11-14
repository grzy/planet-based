// HeroSound: the hero as one instrument, every voice in the same key (D major, open-tuned, add9 / maj7 colours) and the
// same hushed, close, warm room. Silent until the visitor asks for sound (the "Sound" button in c, "Sound?" Yes / No in
// a and b); the answer is remembered (localStorage, guarded); a quiet serif link in the footer changes it.
//
// THE VOICES (HeroSound.play(voice, step, opts); step = a degree of the shared tuning, so every voice agrees):
//   g  STRINGS     the guide lines: a fingerpicked steel-string guitar (Karplus-Strong, body resonance, string noise,
//                  an occasional soft finger squeak, uneven fingers)
//   p  PEONY       a celesta / music-box tine: a bright sine with a glassy inharmonic partial, quick bloom, long ring
//   d  DAHLIA      a felt-piano / soft marimba: a warm mallet, the felt taking the edge off the attack
//   s  SUN         a soft, short, warm chime per step as the sun moves on its string (no sustain)
//   b  WORD        the logo's bars and the letters of planetbased.io: a vibraphone (soft mallet, long ring, slow tremolo)
//   f  FLOURISH    the logo opening (rising) or folding (falling): four vibraphone notes up or down the tuning
//   t  BRASS       a rare, soft flugelhorn-ish call after a big strum (a filtered saw, a slow bloom)
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
        build.init(); decodeGuitar();
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
  const TUNING = [50, 57, 62, 66, 69, 73, 76, 81, 86, 88, 90, 93, 97, 98];   // D3 A3 D4 F#4 A4 C#5 E5 A5 D6 E6 F#6 A6 C#7 D7
  const midi = (n, down) => { n = Math.max(0, Math.round(n)); return Math.min(TUNING[n % TUNING.length] + 12 * Math.floor(n / TUNING.length), 100) - (down ? 12 : 0); };
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
  const GUITAR = [];
  const GDIR = (() => { try { const src = document.currentScript && document.currentScript.src; return src ? src.replace(/[^/]*$/, '') + 'guitar/' : 'guitar/'; } catch (e) { return 'guitar/'; } })();
  const gRaw = new Map(), gBuf = new Map();   // midi -> ArrayBuffer, midi -> AudioBuffer
  let gFetching = false;
  function loadGuitar() {
    if (gFetching || !GUITAR.length) return; gFetching = true;
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
      const t = when(.016), vel = (.62 + Math.random() * .3) * (o.amp || 1), f = hz(step, o.down), out = panner(o.pan || 0);
      const src = ctx.createBufferSource(), m = midi(step, o.down), k = nearestGuitar(m);
      let rate = 1;
      if (k != null) { src.buffer = gBuf.get(k); rate = Math.pow(2, (m - k) / 12); src.playbackRate.value = rate; }   // the real guitar
      else src.buffer = pluckBuffer(f, .4985);                                                                         // the synth, until it loads
      if (o.from) { src.playbackRate.setValueAtTime(rate * o.from / f, t); src.playbackRate.linearRampToValueAtTime(rate, t + .09); }
      const body = ctx.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 190; body.Q.value = 1.1; body.gain.value = k != null ? 1 : 5;   // the recording has its own body
      const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 1700 + 3000 * (o.bright ?? .5) * vel;
      const g = ctx.createGain(); env(g, t, .3 * vel, .004, 2.6); track('g' + step + (o.down ? 'd' : ''), g, t);
      src.connect(body); body.connect(tone); tone.connect(g); g.connect(out); src.start(t); src.stop(t + 2.7);
      if (k == null) { const sq = Math.random() < .25; noise(t, .05, sq ? 2600 + Math.random() * 900 : 4200, sq ? 7 : 1.2, (sq ? .04 : .02) * vel, out); }   // the synth's finger noise (the recording has real ones)
    },
    p(step, o) {                                    // PEONY: celesta / music-box tine
      const t = when(.006), f = hz(step + 3), out = panner(o.pan || 0), vel = .7 + Math.random() * .25;
      [[1, .1, 2.2], [1.002, .04, 2.0], [4.07, .03, .5], [9.6, .008, .18]].forEach(([r, a, d]) => {
        const os = ctx.createOscillator(), g = ctx.createGain(); os.type = 'sine'; os.frequency.value = f * r; env(g, t, a * vel, .003, d);
        os.connect(g); g.connect(out); os.start(t); os.stop(t + d + .05);
      });
    },
    d(step, o) {                                    // DAHLIA: felt piano / soft marimba
      const t = when(.008), f = hz(step), out = panner(o.pan || 0), vel = .7 + Math.random() * .25;
      const felt = ctx.createBiquadFilter(); felt.type = 'lowpass'; felt.frequency.setValueAtTime(2400, t); felt.frequency.exponentialRampToValueAtTime(700, t + .25); felt.connect(out);
      [[1, .2, 1.4], [2, .04, .6], [4, .03, .25]].forEach(([r, a, d]) => {
        const os = ctx.createOscillator(), g = ctx.createGain(); os.type = 'sine'; os.frequency.value = f * r; env(g, t, a * vel, .013, d);
        os.connect(g); g.connect(felt); os.start(t); os.stop(t + d + .05);
      });
      noise(t, .03, 900, 1, .02 * vel, out);        // the felt hammer
    },
    b(step, o) {                                    // WORD: a vibraphone (11-14, Ivy: its own instrument, far from the strings)
      // soft mallet on a tuned bar: the fundamental with the bar's 4x and 10x partials (they die fast), a long ring,
      // and the vibraphone's slow motor tremolo
      const t = when(.008), vel = (.6 + Math.random() * .25) * (o.amp || 1), f = hz(step + 2, o.down), out = panner(o.pan || 0);
      const trem = ctx.createGain(); trem.gain.value = .8;
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5.2; lg.gain.value = .2; lfo.connect(lg); lg.connect(trem.gain);
      const g = ctx.createGain(); env(g, t, .17 * vel, .005, 3.2); track('b' + step, g, t);
      trem.connect(g); g.connect(out);
      [[1, 1, 3.2], [4, .22, .55], [10, .05, .16]].forEach(([r, a, d]) => {
        const os = ctx.createOscillator(), og = ctx.createGain(); os.type = 'sine'; os.frequency.value = f * r;
        og.gain.setValueAtTime(a, t); og.gain.exponentialRampToValueAtTime(.0001, t + d);
        os.connect(og); og.connect(trem); os.start(t); os.stop(t + d + .05);
      });
      lfo.start(t); lfo.stop(t + 3.3);
      noise(t, .02, 2400, 2, .012 * vel, out);      // the mallet's soft tick
    },
    f(step, o) {                                    // FLOURISH: four vibraphone notes up (opening) or down (folding)
      const up = (o.dir || 1) > 0, base = up ? 2 : 7;
      [0, 1, 2, 3].forEach((k, i) => setTimeout(() => live() && V.b(base + (up ? k : -k), { amp: .8, pan: (k - 1.5) * .2 }), i * 85));
    },
    t(step, o) {                                    // BRASS: a soft flugelhorn-ish call (three notes rising)
      [[2, 0], [4, .22], [8, .44]].forEach(([n, dt]) => {
        const t = ctx.currentTime + .02 + dt, f = hz(n, false) / (n === 8 ? 2 : 1), out = panner(0);   // D4, A4, D5
        const os = ctx.createOscillator(), os2 = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
        os.type = 'sawtooth'; os2.type = 'sawtooth'; os.frequency.value = f; os2.frequency.value = f * 1.004;
        lp.type = 'lowpass'; lp.frequency.setValueAtTime(300, t); lp.frequency.linearRampToValueAtTime(900, t + .18); lp.frequency.linearRampToValueAtTime(600, t + .7);
        const tri = ctx.createOscillator(), triG = ctx.createGain(); tri.type = 'triangle'; tri.frequency.value = f; triG.gain.value = .5; tri.connect(triG); triG.connect(lp); tri.start(t); tri.stop(t + 1.15);
        noise(t, .08, 1200, .8, .012, out);   // a breath on the onset
        g.gain.setValueAtTime(.00001, t); g.gain.exponentialRampToValueAtTime(.05, t + .12); g.gain.setValueAtTime(.05, t + .4); g.gain.exponentialRampToValueAtTime(.00001, t + 1.1);
        os.connect(lp); os2.connect(lp); lp.connect(g); g.connect(out); os.start(t); os2.start(t); os.stop(t + 1.15); os2.stop(t + 1.15);
      });
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
    s(step, o) {                                    // SUN: a soft, short, warm chime (no sustain)
      const t = when(.006), f = hz(step + 2), out = panner(o.pan || 0), vel = .7 + Math.random() * .2;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; lp.connect(out);
      [[1, .07, 1.3], [3.01, .012, .5]].forEach(([r, a, d]) => { const os = ctx.createOscillator(), g = ctx.createGain(); os.type = 'sine'; os.frequency.value = f * r; env(g, t, a * vel, .012, d); os.connect(g); g.connect(lp); os.start(t); os.stop(t + d + .05); });
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
  function play(voice, step = 0, o = {}) {
    if (!live() || !V[voice]) return false;
    V[voice](step, o);
    window.__hsNotes = (window.__hsNotes || 0) + 1; if (!o.replay) window.__hsLastPlay = performance.now();
    if (voice !== 'z' && !o.replay) playListeners.forEach(f => f(voice, step, o));
    // 11-14 (Ivy, a stuck hum): no build layer any more (no drone, no heartbeat); every note is a single strike that
    // decays on its own
    // a big strum now and then answers with a soft brass call
    const now = performance.now(); recent = recent.filter(x => now - x < 600); recent.push(now);
    if (voice === 'g' && !o.replay && recent.length >= 9 && (bigStrums = now - lastBig > 1500 ? bigStrums + 1 : bigStrums, lastBig = now, bigStrums >= 2) && now - brassAt > 25000 && Math.random() < .15) { brassAt = now; setTimeout(() => play('t', 0, o.replay ? { replay: true } : {}), 220); }
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

  // ---------- the footer's quiet way to change it ----------
  let footLink = null;
  function syncFooter() { if (footLink) footLink.textContent = answer === 'yes' ? 'Sound: on' : 'Sound: off'; }
  function footer() {
    const foot = document.querySelector('.foot');
    if (!foot || footLink) return;
    footLink = document.createElement('button'); footLink.type = 'button'; footLink.className = 'hs-foot';
    footLink.addEventListener('click', () => set(answer === 'yes' ? 'no' : 'yes'));
    foot.appendChild(footLink); syncFooter();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', footer); else footer();

  window.HeroSound = {
    ask, set, play, note, pitch, swell, start, TUNING, silence, loadGuitar,
    on: () => live(), answer: () => answer,
    onChange: f => listeners.push(f), onPlay: f => playListeners.push(f),
    // a shared song's Play tap: sound for this playback only (the visitor's own setting is untouched)
    allowOnce() { once = true; return start(); },
    endOnce() { if (!once) return; once = false; if (answer !== 'yes' && ctx) ctx.suspend(); }
  };
})();
