// HeroPreload (options b and c): the loader is a real preloader. While it fetches and decodes what the hero needs (the
// green paintings, the sun's faces, the flowers, the bees, the first cards' images), playful ecological "-ing" words work
// under the tree. HeroPreload.done resolves when everything has loaded, never before MIN ms and never after MAX ms.
// Two treatments, so Ivy can compare (?words=1 or ?words=2; 1 by default):
//   1  TERMINAL  the word types itself on, letter by letter, in the mono, an ornament spinning before it (✺ ✷ ❋ ✢);
//                it holds a beat, then backspaces away and the next one types on
//   2  PENCIL    the word is written on left to right in the serif, graphite grey, as if by hand; it holds, then is
//                smudged out (it softens, drifts and lifts) and the next one is written
// HeroPreload.stop() ends the cycling (the word in view stays whole: in c it falls with the tree, in b it gives way to
// planetbased.io).
(function () {
  const WORDS = ['Germinating', 'Photosynthesizing', 'Pollinating', 'Unfurling', 'Sprouting', 'Rooting', 'Leafing out',
    'Budding', 'Branching', 'Foraging', 'Ripening', 'Counting rings', 'Consulting the mycelium', 'Composting'];
  const MIN = 1900, MAX = 6500;
  const MODE = (location.search.match(/[?&]words=([12])/) || [, '1'])[1];
  const SPIN = ['✺', '✷', '❋', '✢'];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let el = null, txt = null, orn = null, i = 0, timers = [], stopped = false, spinT = 0, shownAt = 0;
  const later = (f, ms) => timers.push(setTimeout(() => { if (!stopped) f(); }, ms));

  // 1. terminal: type on, hold, backspace
  function typeWord() {
    const w = WORDS[i++ % WORDS.length] + '…';
    if (reduce) { txt.textContent = w; if (w.startsWith(POLL)) { shownAt = performance.now(); pollinate(); return; } later(typeWord, 1100); return; }
    if (w.startsWith(POLL)) pollinate();   // the wind comes as Pollinating begins (11-14)
    let k = 0;
    // 11-14 (Ivy): quicker on, a shorter hold, so every word gets read and the words keep moving
    shownAt = 0;
    const type = () => { txt.textContent = w.slice(0, ++k); if (k < w.length) later(type, 16 + Math.random() * 12); else { shownAt = performance.now(); if (w.startsWith(POLL)) return; later(erase, 430); } };
    const erase = () => { shownAt = 0; k = Math.max(0, k - 3); txt.textContent = w.slice(0, k); if (k > 0) later(erase, 14); else later(typeWord, 80); };
    type();
  }
  // 2. pencil: written on, hold, smudged out
  function penWord() {
    const w = WORDS[i++ % WORDS.length] + '…';
    txt.textContent = w; el.classList.remove('smudge', 'write'); void el.offsetWidth;
    if (reduce) { el.classList.add('shown'); later(penWord, 1100); return; }
    const dur = 180 + w.length * 15;
    el.style.setProperty('--write', dur + 'ms');
    el.classList.add('write'); shownAt = 0;
    later(() => { shownAt = performance.now(); if (w.startsWith(POLL)) pollinate(); }, dur);
    if (!w.startsWith(POLL)) later(() => { shownAt = 0; el.classList.add('smudge'); later(penWord, 360); }, dur + 430);
  }
  function urls() {
    const out = new Set();
    document.querySelectorAll('.hero img, .objs img, .plate .media img').forEach(im => out.add(im.currentSrc || im.src));
    ['green-backdrop-4.webp', 'oat-backdrop.webp', 'ink-backdrop.webp'].forEach(n => out.add(new URL('img/' + n, location.href).href));
    return [...out].filter(Boolean);
  }
  const load = u => new Promise(r => { const im = new Image(); im.onload = im.onerror = () => (im.decode ? im.decode().catch(() => {}) : Promise.resolve()).then(r); im.src = u; });
  // ---------- the wind waits for "Pollinating" (11-14, Ivy: the wind pollinates) ----------
  // The words run Germinating, Photosynthesizing, then Pollinating, which stays; the tree's pencil wind swirls (c/breeze)
  // are held back until it appears and then blow; the cut follows the wind. The swirls' own calls are caught here and
  // replayed at that moment, keeping their timing
  const POLL = 'Pollinating';
  let windOn = false, windQ = [], windDoneFn; const windDone = new Promise(r => { windDoneFn = r; });
  const hookWind = () => {
    const orig = window.pbScribble; if (!orig || orig.__hsWind) return;
    const w = function (layer, key, o) {
      if (!windOn && layer && layer.classList && layer.classList.contains('loader-wind')) { windQ.push([this, layer, key, o]); return { el: document.createElement('i'), anims: [] }; }
      return orig.apply(this, arguments);
    };
    w.__hsWind = true; w.__hs = orig.__hs; window.pbScribble = w;
  };
  hookWind();
  function pollinate() {
    if (windOn) return; windOn = true;
    if (!windQ.length) { setTimeout(windDoneFn, reduce ? 300 : 900); return; }
    const t0s = windQ.map(q => (q[3] && q[3].t0) || 0), base = Math.min(...t0s); let end = 0;
    windQ.forEach(([self, layer, key, o]) => { const oo = Object.assign({}, o, { t0: ((o && o.t0) || 0) - base + .05 }); end = Math.max(end, oo.t0 + (oo.dur || 1)); window.pbScribble.call(self, layer, key, oo); });
    windQ = [];
    setTimeout(windDoneFn, Math.max(600, (end - .35) * 1000));   // the cut begins as the last line lifts off
  }
  // a safety: if Pollinating never comes (a very slow start), the wind and the cut still happen
  setTimeout(() => { if (!windOn) pollinate(); }, MAX);
  let resolve; const done = new Promise(r => resolve = r);
  function start() {
    const host = document.querySelector('.loader .loader-in');
    if (host) {
      el = document.createElement('p'); el.className = 'hs-ing hs-ing-' + MODE; el.setAttribute('aria-hidden', 'true');
      if (MODE === '1') { orn = document.createElement('span'); orn.className = 'hs-orn'; el.appendChild(orn); spinT = setInterval(() => { if (!stopped) orn.textContent = SPIN[(Math.floor(performance.now() / 160)) % SPIN.length]; }, 80); orn.textContent = SPIN[0]; }
      txt = document.createElement('span'); txt.className = 'hs-txt'; el.appendChild(txt);
      host.appendChild(el);
      (MODE === '1' ? typeWord : penWord)();
    }
    const all = Promise.all([document.fonts ? document.fonts.ready : 0, ...urls().map(load)]);
    const t0 = performance.now();
    // ready = everything loaded (capped), the tree's pencil swirls finished (capped, c/breeze), and MIN; then the word in
    // view is let finish and be read (shown whole for 300 ms), at most 900 ms more, so a word is never cut mid-way
    const swirls = windDone;   // the wind with Pollinating, then the cut
    Promise.all([Promise.race([all, new Promise(r => setTimeout(r, MAX))]), swirls]).then(() => setTimeout(() => {
      const t1 = performance.now();
      const gate = () => { const now = performance.now(); if (!el || stopped || (shownAt && now - shownAt >= 300) || now - t1 > 900) resolve(); else setTimeout(gate, 30); };
      gate();
    }, Math.max(0, MIN - (performance.now() - t0))));
  }
  // the cycling ends; the word in view is left whole (fully typed / fully written)
  function stop() {
    stopped = true; timers.forEach(clearTimeout); clearInterval(spinT);
    if (!el) return;
    const cur = WORDS[(i - 1 + WORDS.length) % WORDS.length] + '…';
    txt.textContent = cur; el.classList.remove('smudge', 'write'); el.classList.add('shown');
  }
  start();   // included after the hero and the cards in the markup, so everything it needs is already in the DOM
  window.HeroPreload = { done, stop, WORDS, get el() { return el; } };
})();
