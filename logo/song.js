// HeroSong: what a visitor plays on the hero becomes a song they can share.
//   Recording: every note they play (voice, step in the shared tuning, timing) is
//   kept, from their first note, up to 160 notes or 40 s.
//   Share: a few seconds into playing, a quiet "Share your song" appears above the Sound button. It writes the song into the link
//   (#song=…, compact, no server, no account), copies the link and writes the page's pencil "✓ copied" beside it.
//   Replay: opening a #song link shows one word, "Play", once the hero has arrived. A tap plays the song (sound for this
//   playback only, the visitor's own setting untouched) and the hero performs it: the strings shiver, the flowers slide
//   to their notes on their strings, the sun chimes, the word opens for its banjo notes.
(function () {
  // the row the hero's chips sit in (Sound, Share, Play): made once
  window.HeroChips = () => { const hero = document.querySelector('.hero'); let r = hero.querySelector('.hs-chips'); if (!r) { r = document.createElement('div'); r.className = 'hs-chips'; hero.appendChild(r); } return r; };
  // the Sound chip: one word that says what a tap does: "Sound" while it is off, "Quiet" while it is on (b and c)
  window.HeroSoundChip = () => {
    const hero = document.querySelector('.hero'); if (!hero || hero.querySelector('.hs-sound')) return;
    const row = HeroChips(), b = document.createElement('button'); b.type = 'button'; b.className = 'hs-chip hs-sound';
    const sync = () => { const on = HeroSound.answer() === 'yes'; b.textContent = on ? 'Quiet' : 'Sound'; b.setAttribute('aria-label', on ? 'Turn the sound off' : 'Turn the sound on'); b.classList.toggle('on', on); };
    b.addEventListener('click', e => { e.stopPropagation(); HeroSound.set(HeroSound.answer() === 'yes' ? 'no' : 'yes'); sync(); });
    HeroSound.onChange(sync); sync();
    row.prepend(b); HeroUnder.layout(); requestAnimationFrame(() => b.classList.add('in'));
  };

  // ---------- the hero's foot (b and c): the slider under "gives energy back.", exactly as long as that line's ink, and the
  // chips at the bottom right, their words sitting on the same baseline as that line ----------
  const scoped = () => /(^|\s)hs-[bc](\s|$)/.test(document.documentElement.className);
  function baseline(el) {
    const p = document.createElement('span'); p.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline;padding:0;margin:0;border:0';
    el.appendChild(p); const y = p.getBoundingClientRect().bottom; p.remove(); return y;
  }
  let cv = null;
  function ink(line) {
    const tn = [...line.childNodes].find(n => n.nodeType === 3 && n.textContent.trim()); if (!tn) return null;
    const rg = document.createRange(); rg.selectNodeContents(tn); const r = rg.getBoundingClientRect();
    const cs = getComputedStyle(line), text = tn.textContent.trim();
    cv = cv || document.createElement('canvas').getContext('2d');
    cv.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    try { cv.letterSpacing = cs.letterSpacing; } catch (e) {}
    const m = cv.measureText(text);
    // the bulk from the DOM (its own optical size, kerning, spacing); only the two end bearings from the canvas
    return { l: r.left - m.actualBoundingBoxLeft, r: r.right - (m.width - m.actualBoundingBoxRight), base: baseline(line), desc: m.actualBoundingBoxDescent };
  }
  function layout() {
    if (!scoped()) return false;
    const hero = document.querySelector('.hero'), t2 = hero && hero.querySelector('.thesis .t2'); if (!t2) return false;
    const k = ink(t2); if (!k) return false;
    const hr = hero.getBoundingClientRect();
    const s = hero.querySelector('.pbs:not(.dial)');
    if (s) {
      const h = s.offsetHeight || 44, top = k.base + k.desc + 8 - hr.top;
      s.style.setProperty('left', (k.l - hr.left).toFixed(1) + 'px', 'important');
      s.style.setProperty('top', top.toFixed(1) + 'px', 'important');
      s.style.setProperty('bottom', 'auto', 'important');
      s.style.setProperty('width', (k.r - k.l).toFixed(1) + 'px', 'important');
    }
    const row = hero.querySelector('.hs-chips');
    if (row && row.children.length) {
      // side by side, Sound at the far right; stacked (Share above Sound) when they would touch the line's ink
      row.classList.remove('stack');
      const right = hr.right - parseFloat(getComputedStyle(row).right || 0);
      if (right - row.offsetWidth < k.r + 24) row.classList.add('stack');
      // stacked on a phone, Share sits beside "Technology that": where the long label would touch that line, it says
      // "Share song"
      const sh = row.querySelector('.hs-share .hs-label'), t1 = hero.querySelector('.thesis .t1');
      if (sh) {
        sh.textContent = 'Share your song';
        const k1 = t1 && ink(t1);
        if (k1 && row.classList.contains('stack') && sh.parentNode.getBoundingClientRect().left < k1.r + 16) sh.textContent = 'Share song';
      }
      const ref = row.querySelector('.hs-sound') || row.firstElementChild, rr = ref.getBoundingClientRect();
      const d = ref.offsetTop + (baseline(ref) - rr.top);
      row.style.top = (k.base - hr.top - d).toFixed(1) + 'px'; row.style.bottom = 'auto';
    }
    return true;
  }
  window.HeroUnder = { layout, place: s => layout() };
  if (document.fonts) document.fonts.ready.then(layout);
  addEventListener('resize', () => setTimeout(layout, 160));
  (function watch() { const t = document.querySelector('.hero .thesis'); if (!t) return setTimeout(watch, 200); if (window.ResizeObserver) new ResizeObserver(() => layout()).observe(t); })();

  const MAXN = 160, MAXMS = 40000, V = 'gpdbfst';
  let rec = [], t0 = 0, shareBtn = null, playing = false;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  // ---------- recording ----------
  function onPlay(voice, step, o) {
    if (playing || !V.includes(voice)) return;
    // a rolling song: the last 160 notes or 40 s, whichever is shorter
    const now = performance.now();
    if (!rec.length) t0 = now;
    rec.push([Math.round(now - t0), voice, Math.max(0, Math.min(35, step | 0)), voice === 'f' ? ((o.dir || 1) > 0 ? 1 : 0) : (voice === 'g' || voice === 'b') && o.down ? 1 : 0]);
    while (rec.length > MAXN || (rec.length && now - t0 - rec[0][0] > MAXMS)) rec.shift();
    if (rec.length >= 6 && rec[rec.length - 1][0] - rec[0][0] > 3000) showShare();
  }
  // ---------- the link: "v1" then tokens  voice + step(base36) + gap in 10 ms (base36) [+ "." extra(base36)] ----------
  function encode(r) {
    let last = 0;
    return 'v1' + r.map(([t, v, st, x]) => { const gap = Math.round((t - last) / 10); last = t; return v + st.toString(36) + gap.toString(36) + (x ? '.' + x.toString(36) : '') + '~'; }).join('').replace(/~$/, '');
  }
  function decode(str) {
    if (!/^v1/.test(str)) return null;
    let t = 0;
    const out = str.slice(2).split('~').map(tok => {
      const m = tok.match(/^([gpdbfst])([0-9a-z])([0-9a-z]+)(?:\.([0-9a-z]+))?$/); if (!m) return null;
      t += parseInt(m[3], 36) * 10;
      return [t, m[1], parseInt(m[2], 36), m[4] ? parseInt(m[4], 36) : 0];
    }).filter(Boolean);
    return out.length ? out.slice(0, MAXN) : null;
  }

  // ---------- share ----------
  function showShare() {
    const hero = document.querySelector('.hero'); if (!hero) return;
    if (!shareBtn) {
      shareBtn = document.createElement('button'); shareBtn.type = 'button'; shareBtn.className = 'hs-chip hs-share'; shareBtn.innerHTML = '<span class="hs-label">Share your song</span>';
      shareBtn.setAttribute('aria-label', 'Share your song: copies a link that plays it');
      const mark = !window.pbCopied && document.querySelector('.mail .copied');
      if (mark) { const c = mark.cloneNode(true); c.querySelectorAll('[id]').forEach(n => n.removeAttribute('id')); shareBtn.appendChild(c); }
      const live = document.createElement('span'); live.className = 'sr'; live.setAttribute('aria-live', 'polite'); live.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)';
      shareBtn.appendChild(live);
      shareBtn.addEventListener('click', e => { e.stopPropagation(); share(live); });
      HeroChips().appendChild(shareBtn); HeroUnder.layout();
    }
    requestAnimationFrame(() => shareBtn.classList.add('in'));
  }
  async function copy(text) {
    // the clipboard API can wait forever on an unfocused page: give it a moment, then the old way
    try { if (await Promise.race([navigator.clipboard.writeText(text).then(() => true), new Promise(r => setTimeout(() => r(false), 700))])) return true; } catch (e) {}
    const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e) {} ta.remove(); return ok;
  }
  async function share(live) {
    if (!rec.length) return;
    const base = rec[0][0], song = rec.map(([t, v, st, x]) => [t - base, v, st, x]);   // the song starts at its first note
    const url = location.origin + location.pathname + location.search.replace(/([?&])(debug|static)(&|$)/g, '$1').replace(/[?&]$/, '') + '#song=' + encode(song);
    // on phones the native share sheet first; the clipboard otherwise (and if the sheet is dismissed)
    if (navigator.share && matchMedia('(pointer: coarse)').matches) { try { await navigator.share({ title: 'A song played on planetbased.io', url }); window.__hsShared = url; return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    window.__hsShared = url;
    const ok = await copy(url);
    // the hand-drawn "copied" (c/breeze, window.pbCopied(host)) when it exists; the page's pencil mark otherwise
    if (ok && window.pbCopied) {
      let host = shareBtn.querySelector('.hs-copied');
      if (!host) { host = document.createElement('span'); host.className = 'hs-copied'; host.setAttribute('aria-hidden', 'true'); shareBtn.appendChild(host); }
      try { window.pbCopied(host, { hold: 3800 }); } catch (e) {}
    }
    const mk = !window.pbCopied && shareBtn.querySelector('.copied');
    if (mk && ok) { mk.classList.remove('on', 'out'); void mk.offsetWidth; mk.classList.add('on'); setTimeout(() => mk.classList.add('out'), 3800); setTimeout(() => mk.classList.remove('on', 'out'), 4600); }
    live.textContent = ok ? 'Link to your song copied' : 'Could not copy the link';
    window.__hsShared = url;
  }

  // ---------- replay ----------
  function songFromHash() { const m = location.hash.match(/song=([^&]+)/); return m ? decode(decodeURIComponent(m[1])) : null; }
  function perform(song) {
    playing = true;
    const S = window.HeroStrings, L = window.HeroLogo;
    let lastWord = -1e9;
    song.forEach(([t, v, st, x]) => setTimeout(() => {
      const o = { replay: true };
      if (v === 'g') { if (S && S.xs.length) { const i = S.stringFor(st); S.pluck(i, 1, false); HeroSound.play('g', st, { ...o, down: x === 1, amp: x === 1 ? .6 : 1, pan: (S.xs[i].x / innerWidth) * 1.6 - .8 }); } else HeroSound.play('g', st, { ...o, down: x === 1 }); return; }
      if (v === 'p' || v === 'd') { if (S && S.setObj) S.setObj(v === 'p' ? '.peony' : '.dahlia', st, 220); HeroSound.play(v, st, o); return; }
      if (v === 's') {
        const sun = document.querySelector('.objs .sun');
        if (sun && !reduce.matches) sun.animate([{ scale: '1' }, { scale: '1.04' }, { scale: '1' }], { duration: 600, easing: 'ease-in-out', composite: 'add' });
        HeroSound.play('s', st, o); return;
      }
      if (v === 'b' && L) { if (L.s < 1.5) L.go(2); lastWord = t; HeroSound.play('b', st, { ...o, down: x === 1 }); setTimeout(() => { if (t === lastWord) L.go(0); }, 1400); return; }
      if (v === 'f') return;   // the word's own opening and folding play their flourishes
      if (v === 't') HeroSound.play('t', 0, o);
    }, t + 120));
    setTimeout(() => { playing = false; HeroSound.endOnce(); invite(); }, song[song.length - 1][0] + 3000);
  }
  // after the song, one invitation to answer it: the listener becomes the next sender
  function invite() {
    const hero = document.querySelector('.hero'); if (!hero || hero.querySelector('.hs-reply')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'hs-chip hs-reply'; b.textContent = 'Play it back';
    b.addEventListener('click', e => { e.stopPropagation(); HeroSound.set('yes'); b.classList.remove('in'); setTimeout(() => b.remove(), 500); });
    HeroChips().appendChild(b); HeroUnder.layout(); requestAnimationFrame(() => b.classList.add('in'));
    setTimeout(() => { b.classList.remove('in'); setTimeout(() => b.remove(), 600); }, 12000);
  }
  function offerPlay(song) {
    const hero = document.querySelector('.hero'); if (!hero) return;
    document.title = 'A song played on planetbased.io';
    const og = document.querySelector('meta[property="og:title"]'); if (og) og.setAttribute('content', 'A song played on planetbased.io');
    const b = document.createElement('button'); b.type = 'button'; b.className = 'hs-chip hs-play'; b.textContent = 'Play';
    b.setAttribute('aria-label', 'Play the song someone made on this page');
    b.addEventListener('click', e => {
      e.stopPropagation();
      if (HeroSound.answer() !== 'yes') HeroSound.allowOnce(); else HeroSound.start();
      b.classList.remove('in'); setTimeout(() => b.remove(), 500);
      setTimeout(() => perform(song), 80);
    });
    HeroChips().appendChild(b); HeroUnder.layout(); requestAnimationFrame(() => b.classList.add('in'));
  }

  // the colour slider is silent (11-14, Ivy: no choir on the slider)
  function init() {
    if (!window.HeroSound) return;
    HeroSound.onPlay(onPlay);
    const song = songFromHash();
    if (song) { const wait = () => (window.HeroStory && HeroStory.S && HeroStory.S.done) ? offerPlay(song) : setTimeout(wait, 300); wait(); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.HeroSong = { encode, decode, get rec() { return rec; }, perform };
})();
