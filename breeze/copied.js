// Pencil marks that write themselves (11-14, Ivy): drawn by hand in Figma with the scribbles' pencil brushes (planetbased
// file, page "✎ Scribbles": section "Copied", variant C3; section "Smiley", S2-tongue and S2-wink), written on and off
// stroke by stroke. Chromium and Firefox reveal the real pencil PNG along each stroke's centreline through a plain mask;
// WebKit (Safari, every iPhone browser) draws the same centrelines as pencil-grey strokes by dash offset, with no mask
// and no filter (masks and filters paint pink stripes there).
//   window.pbCopied(host, { hold })  the check + "copied": writes itself, holds, then un-writes backwards. Again = restart
// The smiley after "Don't be a stranger." is a small performance while its line is in view: it writes itself on, then
// every 6 to 10 s does a little act (a wink, a tongue, or both), and pauses off screen. Reduced motion: a still smile.
(() => {
  const SVGNS = 'http://www.w3.org/2000/svg';
  const PLAIN = document.documentElement.classList.contains('wk') || /[?&]plainlines(&|$)/.test(location.search);
  const still = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let uid = 0;
  // one svg; each stroke is its own path (plain) or its own mask over its picture (pencil), so each draws and erases alone
  function build(host, vb, w, h, strokes, srcOf) {
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', vb); svg.setAttribute('focusable', 'false'); svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('pb-copied');
    const path = (s, extra) => `<path pathLength="1" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 2" stroke-dashoffset="1" ${extra} d="${s.d}"/>`;
    if (PLAIN) svg.innerHTML = strokes.map(s => path(s, `class="pc" stroke-width="${s.w}" stroke-opacity="${s.o}"`)).join('');
    else svg.innerHTML = '<defs>' + strokes.map(s => { const id = 'pbm' + (++uid); s.__id = id;
        return `<mask id="${id}" maskUnits="userSpaceOnUse" x="-40" y="-40" width="${w + 80}" height="${h + 80}">${path(s, `stroke="#fff" stroke-width="${(s.w * (s.mw || 2.6)).toFixed(1)}"`)}</mask>`; }).join('') + '</defs>'
      + strokes.map(s => `<image href="${srcOf(s)}" x="0" y="0" width="${w}" height="${h}" mask="url(#${s.__id})"/>`).join('');
    host.textContent = ''; host.appendChild(svg);
    const ps = [...svg.querySelectorAll(PLAIN ? 'path' : 'mask path')], out = {};
    strokes.forEach((s, i) => { out[s.k] = ps[i]; });
    return out;
  }
  // on: draw from start to end. off: retract from the end back to the start, the way it came
  const on = (p, d, t0 = 0) => p.animate([{ strokeDashoffset: '1' }, { strokeDashoffset: '0' }], { duration: d * 1000, delay: t0 * 1000, easing: 'cubic-bezier(.45,.05,.5,.95)', fill: 'forwards' });
  const off = (p, d, t0 = 0) => p.animate([{ strokeDashoffset: '0' }, { strokeDashoffset: '1' }], { duration: d * 1000, delay: t0 * 1000, easing: 'cubic-bezier(.45,.05,.5,.95)', fill: 'forwards' });

  // ---------- ✓ copied ----------
  const COPIED = [{"k":"chk","d":"M 14 123 C 14 123 14 122 15 122 C 15 122 16 122 17 122 C 17 122 18 122 19 123 C 20 123 21 123 22 124 C 23 124 24 125 25 126 C 26 127 27 128 28 128 C 29 129 30 130 31 132 C 32 133 34 135 35 136 C 36 138 38 140 38 142 C 39 144 40 146 40 147 C 41 149 42 151 43 153 C 44 155 45 157 46 159 C 48 161 49 163 50 165 C 52 167 52 172 54 170 C 55 169 56 162 57 157 C 58 152 60 147 62 142 C 64 137 67 132 69 126 C 71 121 73 115 75 110 C 77 104 78 98 81 92 C 83 87 88 80 92 74 C 96 68 100 63 104 57 C 108 50 113 39 115 35","w":8.6,"o":0.72},{"k":"chk2","d":"M 18 124 C 19 124 20 124 22 125 C 23 125 25 126 26 127 C 28 128 29 129 31 130 C 32 132 34 134 36 136 C 38 138 40 141 41 144 C 42 147 43 149 44 152 C 45 155 47 158 49 161 C 51 164 53 170 55 170 C 57 170 58 165 60 159 C 62 154 66 144 69 136 C 72 128 74 120 78 112 C 81 103 84 94 89 86 C 94 77 104 63 106 59","w":5.5,"o":0.36},{"k":"w1","d":"M 157 110 C 155 109 151 102 147 101 C 144 100 138 102 134 106 C 130 110 125 117 125 125 C 125 133 129 146 132 154 C 134 161 136 166 140 169 C 145 171 153 170 159 167 C 164 165 170 160 174 154 C 178 148 178 138 181 130 C 183 122 184 112 188 106 C 193 100 204 96 210 95 C 216 94 219 97 223 101 C 227 105 231 113 232 120 C 232 128 230 138 227 146 C 225 153 222 161 218 165 C 215 170 209 173 205 174 C 200 174 195 172 192 167 C 189 163 188 154 189 147 C 190 141 196 133 200 126 C 204 120 209 113 214 109 C 219 105 226 102 229 100","w":7.5,"o":0.69},{"k":"w2","d":"M 229 100 C 232 100 239 100 243 99 C 248 99 251 100 255 100 C 258 99 262 94 264 96 C 267 99 268 106 268 115 C 268 123 266 137 265 148 C 263 160 261 176 260 184 C 259 193 258 201 258 198 C 259 195 260 178 261 168 C 262 158 264 148 266 140 C 268 131 271 122 274 116 C 278 109 282 104 286 100 C 291 97 298 93 303 93 C 308 94 313 100 316 106 C 319 112 321 123 320 130 C 318 136 313 142 307 147 C 302 151 292 154 288 155 C 283 156 278 154 280 154 C 281 154 290 154 296 154 C 301 153 307 152 313 150 C 318 147 326 140 328 139","w":7.9,"o":0.67},{"k":"w3","d":"M 328 139 C 329 136 332 130 333 126 C 334 121 335 117 337 112 C 338 108 340 98 341 98 C 342 98 342 105 342 111 C 342 118 341 129 341 136 C 341 144 340 152 341 157 C 343 163 348 167 351 169 C 355 172 359 172 363 171 C 367 170 369 166 372 163 C 375 159 376 153 379 149 C 382 146 387 145 391 142 C 394 139 398 135 401 131 C 404 128 407 123 408 118 C 409 114 407 107 405 104 C 402 102 397 101 393 102 C 390 103 385 104 382 109 C 380 114 376 123 376 130 C 376 136 379 146 383 151 C 387 157 395 162 401 164 C 408 166 416 162 423 162 C 430 162 436 165 443 162 C 451 160 462 156 468 148 C 475 141 480 125 481 117 C 482 108 478 100 473 97 C 469 94 460 97 454 100 C 448 104 439 110 437 117 C 434 125 437 138 440 146 C 442 154 448 162 454 166 C 459 169 468 169 473 166 C 479 162 483 153 487 144 C 490 135 491 123 493 112 C 496 100 500 87 502 75 C 504 63 506 43 506 40 C 506 37 504 46 502 57 C 501 67 497 86 496 100 C 495 114 496 128 497 139 C 499 149 500 157 503 161 C 506 166 511 166 516 166 C 520 165 525 163 530 158 C 536 154 544 141 547 138","w":7.7,"o":0.71},{"k":"dot","d":"M 348 76 C 348 77 348 77 348 78 C 349 79 349 80 350 80 C 350 80 351 77 352 77 C 353 77 355 80 356 80","w":8.2,"o":0.72}];
  const CT = { chk: [0, .3], chk2: [.12, .26], w1: [.42, .4], w2: [.8, .34], w3: [1.12, .62], dot: [1.82, .1] };
  window.pbCopied = function (host, opt = {}) {
    if (!host) return Promise.resolve();
    const hold = opt.hold == null ? 3800 : opt.hold;
    (host.__pbc || []).forEach(a => a.cancel());
    const P = build(host, '12 36 546 210', 606, 294, COPIED.map(s => ({ ...s })), () => 'breeze/copied.png'), anims = [];
    let end = 0;
    COPIED.forEach(s => { const [t0, d] = CT[s.k]; anims.push(on(P[s.k], d, t0)); end = Math.max(end, t0 + d); });
    // then it un-writes backwards: the last stroke first, each one retracting to where it began, quicker than it came
    let t = Math.max(end, hold / 1000);
    [...COPIED].reverse().forEach(s => { const d = Math.max(.08, CT[s.k][1] * .6); anims.push(off(P[s.k], d, t)); t += d * .85; });
    anims.push(host.animate([{ opacity: 1, visibility: 'visible' }, { opacity: 1, visibility: 'visible' }], { duration: (t + .1) * 1000 }));
    host.__pbc = anims;
    return anims[anims.length - 1].finished.catch(() => {});
  };
  window.pbMark = (host, name, opt) => window.pbCopied(host, opt);   // kept for older callers

  // ---------- the smiley: the sentence's own period is its left eye ----------
  const SM = {"eye":{"k":"eye","d":"M 164 48 C 168 40 176 48 176 52 C 176 60 168 60 164 52","w":18.7,"o":0.65,"src":"t"},"smile":{"k":"smile","d":"M 44 126 C 88 170 172 166 228 102 C 236 94 248 90 256 98","w":15.8,"o":0.65,"src":"t"},"tongue":{"k":"tongue","d":"M 184 142 C 184 174 220 178 220 134","w":13.7,"o":0.65,"src":"t"},"wink":{"k":"eye","d":"M 148 52 C 156 40 172 36 188 48","w":14.4,"o":0.65,"src":"w"}};
  const smiley = document.getElementById('smiley'), at = smiley && smiley.parentNode, line = at && at.closest('p');
  if (!smiley || !at || !line) return;
  const mark = document.createElement('i'); mark.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
  at.appendChild(mark);
  function place() {
    // the period's centre is (84, 56) in the drawing's 300 x 220 box; the box is 1.6em wide, scaled about that centre
    const em = parseFloat(getComputedStyle(at).fontSize) || 16, base = mark.offsetTop, W = 1.6 * em, s = W / 300;
    const px = .115 * em, py = base - .07 * em;
    smiley.style.left = (px - 84 * s).toFixed(1) + 'px'; smiley.style.top = (py - 56 * s).toFixed(1) + 'px'; smiley.style.width = W.toFixed(1) + 'px';
  }
  place(); addEventListener('resize', place, { passive: true }); if (document.fonts) document.fonts.ready.then(place);

  const SRC = { t: 'breeze/smiley-tongue.png', w: 'breeze/smiley-wink.png' };
  let P = null, inView = false, actT = 0, last = '', live = [];
  const run = a => (live.push(a), a);
  function writeOn() {
    P = build(smiley, '0 0 300 220', 300, 220, Object.entries(SM).map(([k, v]) => ({ ...v, k, mw: 1.7 }))   /* tight masks, so the smile never shows the tongue's root */, s => SRC[s.src]);
    smiley.style.visibility = 'visible';
    if (still()) { [P.eye, P.smile].forEach(p => { p.style.strokeDashoffset = '0'; }); return; }
    run(on(P.eye, .2)); run(on(P.smile, .55, .28));
  }
  // the acts: a wink, a tongue, or the two together; never the same one twice running
  const ACTS = {
    wink: t => { run(off(P.eye, .16, t)); run(on(P.wink, .22, t + .18)); run(off(P.wink, .18, t + 1.05)); run(on(P.eye, .18, t + 1.25)); return t + 1.5; },
    tongue: t => { run(on(P.tongue, .3, t)); run(off(P.tongue, .3, t + 1.5)); return t + 1.9; },
    both: t => { run(off(P.eye, .16, t)); run(on(P.wink, .22, t + .18)); run(on(P.tongue, .3, t + .55)); run(off(P.tongue, .3, t + 1.9)); run(off(P.wink, .18, t + 2.05)); run(on(P.eye, .18, t + 2.25)); return t + 2.5; }
  };
  // 11-14 (Ivy): it acts often, every 2.5 to 4 s while in view, and right away when a pointer comes over it or taps it
  let busyTo = 0;
  function play(n) {
    last = n; live = live.filter(a => a.playState !== 'finished');
    busyTo = performance.now() + ACTS[n](0) * 1000;
  }
  function act() {
    actT = 0;
    if (!inView || !P || still()) return;
    if (performance.now() < busyTo) { actT = setTimeout(act, busyTo - performance.now() + 200); return; }
    const names = Object.keys(ACTS).filter(n => n !== last);
    play(names[Math.floor(Math.random() * names.length)]);
    actT = setTimeout(act, Math.max(busyTo - performance.now() + 600, 2500 + Math.random() * 1500));   // start to start, with a breath after a long act
  }
  function poke() {
    if (!P || still() || performance.now() < busyTo) return;
    play(last === 'wink' ? 'tongue' : 'wink');                    // a quick wink or tongue, whichever it didn't just do
    clearTimeout(actT); actT = setTimeout(act, Math.max(busyTo - performance.now() + 600, 2500 + Math.random() * 1500));
  }
  smiley.addEventListener('pointerenter', poke); smiley.addEventListener('pointerdown', poke);
  at.addEventListener('pointerenter', poke); at.addEventListener('pointerdown', poke);
  const io = new IntersectionObserver(es => es.forEach(e => {
    const was = inView; inView = e.isIntersecting && e.intersectionRatio >= .9;
    if (inView && !was) {
      if (!P) setTimeout(writeOn, 450);
      live.forEach(a => { if (a.playState === 'paused') a.play(); });
      clearTimeout(actT); actT = setTimeout(act, P ? 1000 + Math.random() * 1000 : 2400);   // the first act about a second after it has written on
    } else if (!inView && was) { clearTimeout(actT); actT = 0; live.forEach(a => { if (a.playState === 'running') a.pause(); }); }
  }), { threshold: [0, .9] });
  io.observe(line);
})();
