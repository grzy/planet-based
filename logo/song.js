// HeroSong: what a visitor plays on the hero becomes a song they can share.
//   Recording: every note they play (voice, step in the shared tuning, timing) is
//   kept, from their first note, up to 160 notes or 40 s.
//   Share: a few seconds into playing, a quiet "Share your song" appears above the Sound button. It writes the song into the link
//   (#song=…, compact, no server, no account), copies the link and writes the page's pencil "✓ copied" beside it.
//   Replay: opening a #song link shows one word, "Play", once the hero has arrived. A tap plays the song (sound for this
//   playback only, the visitor's own setting untouched) and the hero performs it: the strings shiver, the flowers slide
//   to their notes on their strings, the sun chimes, the word opens for its banjo notes.
(function () {
  // 11-14 (Ivy, B): three forms for the sound control, to compare (?snd=1/2/3; B defaults to 1, C keeps its chips = 0)
  //   1  TOP LINE   a small speaker and the word, in the top line beside the studio line (phones: just under it)
  //   2  PENCIL     a hand-drawn word with a pencil underline, under the logo
  //   3  ICON       a quiet speaker at the end of the colour slider
  //   Share always goes with it, in the same form. Everything takes the hero's type colour (var(--oat)), so it reads
  //   in every mode
  //   t  TOUCH      (B's default, 11-14) no Sound button at all: the first touch on the instrument turns sound on and a
  //                 small pencil note "sound on" writes itself by the finger, then fades; Share sits in the top line; the
  //                 footer's "Sound: on/off" turns it off
  const SND = () => { const m = location.search.match(/[?&]snd=([0123t])/); return m ? m[1] : (/(^|\s)hs-b(\s|$)/.test(document.documentElement.className) ? 't' : '0'); };
  const SPK = '<svg class="hs-spk" viewBox="0 0 24 24" aria-hidden="true"><path class="b" d="M3 9.2h3.8L12 5v14l-5.2-4.2H3z"/><path class="w" d="M15.4 8.6a4.8 4.8 0 0 1 0 6.8M18 6.1a8.4 8.4 0 0 1 0 11.8"/><path class="x" d="M15.6 9.6l4.8 4.8M20.4 9.6l-4.8 4.8"/></svg>';
  const PEN = '<svg class="hs-pen" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path d="M1.5 6.1C18 4.6 34 7.4 52 5.6S86 4.4 98.6 4.9"/><path class="p2" d="M4 7.2C24 6.2 46 7.9 66 6.6S90 6.1 97 6.5"/></svg>';
  window.HeroChips = () => {
    const hero = document.querySelector('.hero'); let r = hero.querySelector('.hs-chips'); if (r) return r;
    const m = SND(); r = document.createElement('div');
    r.className = 'hs-chips' + (m !== '0' ? ' hs-ctl hs-ctl-' + (m === 't' ? '1' : m) : '');
    if ((m === '1' || m === 't') && matchMedia('(min-width: 760px)').matches) { const dl = hero.querySelector('.dateline'); if (dl) { r.classList.add('inline'); dl.appendChild(r); return r; } }
    hero.appendChild(r); return r;
  };
  // a chip's face in the current form: its word (and the speaker or the pencil line)
  function face(btn, word, kind) {
    const m = SND();
    if (m === '0') { btn.innerHTML = '<span class="hs-label">' + word + '</span>'; return; }
    if (m === '1' || m === 't') btn.innerHTML = (kind === 'sound' ? SPK : '') + '<span class="hs-label">' + word + '</span>';
    if (m === '2') btn.innerHTML = '<span class="hs-label">' + word.toLowerCase() + '</span>' + PEN;
    if (m === '3') btn.innerHTML = kind === 'sound' ? SPK : '<span class="hs-label">' + word + '</span>';
  }
  // the Sound control: its word says what a tap does: "Sound" while it is off, "Quiet" while it is on
  window.HeroSoundChip = () => {
    const hero = document.querySelector('.hero'); if (!hero || hero.querySelector('.hs-sound')) return;
    if (SND() === 't') { touchUnlock(); return; }
    const row = HeroChips(), b = document.createElement('button'); b.type = 'button'; b.className = 'hs-chip hs-sound';
    const sync = () => {
      const on = HeroSound.answer() === 'yes';
      face(b, on ? 'Quiet' : 'Sound', 'sound');
      b.setAttribute('aria-label', on ? 'Turn the sound off' : 'Turn the sound on'); b.title = on ? 'Sound off' : 'Sound on';
      b.classList.toggle('on', on); HeroUnder.layout();
    };
    b.addEventListener('click', e => { e.stopPropagation(); HeroSound.set(HeroSound.answer() === 'yes' ? 'no' : 'yes'); sync(); });
    HeroSound.onChange(sync);
    row.prepend(b); sync(); requestAnimationFrame(() => b.classList.add('in'));
  };

  // the touch that turns sound on: anywhere on the instrument (a string, a flower, the sun, the word), never a link, a
  // button or the slider. A visitor who turned sound off in the footer keeps it off
  let touchOn = false;
  function touchUnlock() {
    if (touchOn) return; touchOn = true;
    addEventListener('pointerdown', e => {
      // 11-14 (Ivy): a direct touch on the instrument is a clear wish to hear it: it turns sound on even if it was saved
      // off (the footer can still turn it off again)
      if (!window.HeroSound || HeroSound.answer() === 'yes' || e.button > 0 || (window.HeroAtRest && !HeroAtRest())) return;
      const hero = document.querySelector('.hero'), hr = hero.getBoundingClientRect();
      if (e.clientY < hr.top || e.clientY > hr.bottom || e.clientX < hr.left || e.clientX > hr.right) return;
      if (e.target.closest && e.target.closest('a,button,input,.hs-chips')) return;   // the colour slider counts (11-14, Ivy)
      HeroSound.set('yes');
      penNote(hero, e.clientX - hr.left, e.clientY - hr.top);
      if (window.HeroLogo && HeroLogo.replayOnce) HeroLogo.replayOnce();
    }, { capture: true });
    // the slider from the keyboard turns it on too (the note by the slider's sun)
    addEventListener('keydown', e => {
      if (!window.HeroSound || HeroSound.answer() === 'yes' || (window.HeroAtRest && !HeroAtRest())) return;
      if (!(e.target.closest && e.target.closest('.pbs')) || !/^(Arrow|Page|Home|End)/.test(e.key)) return;
      const hero = document.querySelector('.hero'), hr = hero.getBoundingClientRect(), th = e.target.closest('.pbs').querySelector('.psun'), r = (th || e.target).getBoundingClientRect();
      HeroSound.set('yes');
      penNote(hero, r.left + r.width / 2 - hr.left, r.top - hr.top);
      if (window.HeroLogo && HeroLogo.replayOnce) HeroLogo.replayOnce();
    }, { capture: true });
  }
  function penNote(hero, x, y) {
    const n = document.createElement('span'); n.className = 'hs-note'; n.setAttribute('role', 'status');
    n.innerHTML = '<span class="hs-label">sound on</span>' + PEN;
    hero.appendChild(n);
    const w = n.offsetWidth, h = n.offsetHeight;
    n.style.left = Math.max(12, Math.min(hero.clientWidth - w - 12, x + 16)).toFixed(0) + 'px';
    n.style.top = Math.max(12, Math.min(hero.clientHeight - h - 12, y - h - 14)).toFixed(0) + 'px';
    requestAnimationFrame(() => n.classList.add('in'));
    setTimeout(() => n.classList.add('out'), 1900); setTimeout(() => n.remove(), 2700);
  }

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
  let anchorShift = 0, anchorDX = 0;
  const capH = el => { const cs = getComputedStyle(el); cv = cv || document.createElement('canvas').getContext('2d'); cv.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; return cv.measureText('T').actualBoundingBoxAscent; };
  const groupGap = el => Math.round(capH(el) * .4);
  // how far below the slider's top its first ink sits (the sun or the bar, whichever is higher)
  const inkTopOffset = s => { const sr = s.getBoundingClientRect(); const tops = [s.querySelector('.psun'), s.querySelector('.strip')].filter(Boolean).map(e => e.getBoundingClientRect().top - sr.top); return tops.length ? Math.min(...tops) : 0; };
  function layout() {
    if (!scoped()) return false;
    const hero = document.querySelector('.hero'), t2 = hero && hero.querySelector('.thesis .t2'); if (!t2) return false;
    let k = ink(t2); if (!k) return false;
    const hr = hero.getBoundingClientRect();
    const s = hero.querySelector('.pbs:not(.dial)');
    const place = () => {
      // 11-18 (Ivy): the hint, the thesis and the slider read as one group: the same gap G above the thesis (to the
      // hint's baseline) and below it (from the g of "energy" to the slider's ink, its sun included); G is 0.4 of the
      // thesis's cap height
      const top = k.base + k.desc + groupGap(hero.querySelector('.thesis .t1') || t2) - hr.top - inkTopOffset(s);
      s.style.setProperty('left', (k.l - hr.left).toFixed(1) + 'px', 'important');
      s.style.setProperty('top', top.toFixed(1) + 'px', 'important');
      s.style.setProperty('bottom', 'auto', 'important');
      s.style.setProperty('width', (k.r - k.l).toFixed(1) + 'px', 'important');
    };
    if (s) {
      place();
      // 11-18 (Ivy): one margin all round, the side margin --m (where the logo starts): the slider's bar (its gradient
      // track, not the sun on it) ends --m above the foot of the first screen (what the window shows), and the thesis's
      // ink starts --m in. The thesis and the slider move together to land there
      const th = hero.querySelector('.thesis'), mk = hero.querySelector('.mark'), strip = s.querySelector('.strip');
      const M = mk ? mk.getBoundingClientRect().left - hr.left : null, t1 = hero.querySelector('.thesis .t1');
      if (th && M != null && strip) {
        const ph = innerWidth < 760, first = Math.min(hr.height, ph ? (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hero-h')) || hr.height) / (window.__heroPh || 1) : innerHeight);
        const want = first - M;
        for (let pass = 0; pass < 2; pass++) {
          const d = want - (strip.getBoundingClientRect().bottom - hr.top), k1 = t1 && ink(t1), dx = k1 ? M - Math.min(k1.l, k.l) + hr.left : 0;
          if (Math.abs(d) < .5 && Math.abs(dx) < .3) break;
          anchorShift += d; anchorDX += dx; th.style.translate = `${anchorDX.toFixed(1)}px ${anchorShift.toFixed(1)}px`;
          k = ink(t2); if (!k) break; place();
        }
      }
    }
    hint(hero, s, hr);
    const row = hero.querySelector('.hs-chips');
    if (row && row.classList.contains('hs-ctl')) {
      // the forms: 2 under the logo, 3 at the slider's end, 1 phones just under the studio line (desktop: in the line, CSS)
      if (row.classList.contains('hs-ctl-2')) {
        const lg = hero.querySelector('.mark .pb-logo'), r = lg && lg.getBoundingClientRect();
        if (r && r.width) { row.style.left = (r.left - hr.left).toFixed(1) + 'px'; row.style.top = (r.bottom - hr.top + 22).toFixed(1) + 'px'; }
      }
      if (row.classList.contains('hs-ctl-3') && s) {
        const sr = s.getBoundingClientRect();
        row.style.left = (sr.right - hr.left + 12).toFixed(1) + 'px'; row.style.top = (sr.top - hr.top + sr.height / 2 - row.offsetHeight / 2).toFixed(1) + 'px';
      }
      return true;
    }
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
  // ---------- the hint (11-14, Ivy; 11-18: above the thesis, "It's all an instrument.") ----------
  // 11-18 (Ivy: she never saw it): no memory any more; it comes on EVERY load. It fades in ~1.2 s after "⟵ tap ♪" has
  // written (c/breeze/tapme.js) and stays; after a tap it stays through the logo's moment, then fades HINT_SHOW later.
  // Without the tap-me it comes as the hero settles. Reduced motion: it simply shows
  const HINT_SHOW = 8000;   // after the tap's logo moment the hint stays this long (ms), then fades out (~0.8 s)
  const HINT_AIR = 2;      // 11-18 (Ivy): the hint sits higher: its gap to the thesis's capitals is this many group gaps
  const HINT_AFTER = 1200;  // after the tap-me has written
  const TM_WRITE = 1900;    // the tap-me starts writing ~0.3 s after the settle and takes ~1.6 s (tapme.js WORDS_AT + pen)
  const hintWaits = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const tapMe = () => !!document.querySelector('script[src*="tapme.js"]');
  let heroSettled = false, hintWant = false, hintFadeT = 0;
  function hint(hero, s, hr) {
    if (!s) return;
    let h = hero.querySelector('.hs-hint');
    if (!h) { h = document.createElement('p'); h.className = 'hs-hint'; h.textContent = 'It\u2019s all an instrument.'; hero.appendChild(h); if (hintWant) showHint(h); }
    // 11-18 (Ivy picked it in protos/hint-r3): gold set type ABOVE the thesis, on its left ink edge, its baseline one
    // group gap above the thesis's capitals (the same gap as from the thesis down to the slider); it only fades
    if (window.__hintPos) return;   // (the hint pages place it themselves)
    const t1 = hero.querySelector('.thesis .t1'), k1 = t1 && ink(t1); if (!k1) return;
    const hb = baseline(h) - h.getBoundingClientRect().top;
    h.style.left = (k1.l - hr.left).toFixed(1) + 'px'; h.style.top = (k1.base - capH(t1) - groupGap(t1) * HINT_AIR - hb - hr.top).toFixed(1) + 'px';
  }
  window.__hsHint = { state: 'pending', at: 0 };
  function showHint(h) {
    hintWant = true; h = h || document.querySelector('.hero .hs-hint'); if (!h || h.classList.contains('stay') || h.classList.contains('gone')) return;
    h.classList.add('stay');
    if (window.__hsHint.state !== 'shown') { window.__hsHint = { state: 'shown', at: performance.now() }; dispatchEvent(new CustomEvent('hs:hint-shown')); }
  }
  function fadeHint() {
    const h = document.querySelector('.hero .hs-hint'); if (!h || h.classList.contains('gone')) return;
    h.style.opacity = getComputedStyle(h).opacity; h.classList.remove('stay'); h.classList.add('gone');
    void h.offsetWidth; h.style.opacity = '0';
  }
  addEventListener('hs:hero-settled', () => {
    heroSettled = true;
    if (hintWaits || !tapMe()) { showHint(); return; }
    // wait for the tap-me to be up, then for it to finish writing, then HINT_AFTER
    const t0 = performance.now();
    const up = () => { const st = window.__tapme && window.__tapme.state; if (st === 'shown' || performance.now() - t0 > 4000) setTimeout(showHint, (st === 'shown' ? TM_WRITE - 300 : 0) + HINT_AFTER); else setTimeout(up, 50); };
    up();
  });
  // after the tap: shown (if it wasn't yet), held through the logo's moment, then gone HINT_SHOW later (reduced motion: it stays)
  addEventListener('hs:tap-logo-done', () => { showHint(); if (hintWaits) return; clearTimeout(hintFadeT); hintFadeT = setTimeout(fadeHint, HINT_SHOW); });
  addEventListener('hs:logo-touched', () => { if (tapMe() || hintWaits) return; showHint(); clearTimeout(hintFadeT); hintFadeT = setTimeout(fadeHint, HINT_SHOW); });
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
    // 11-14 (Ivy): no Share (people won't share it); the recording stays, quiet, unused
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
      shareBtn = document.createElement('button'); shareBtn.type = 'button'; shareBtn.className = 'hs-chip hs-share'; face(shareBtn, 'Share your song', 'share');
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
      const o = { replay: true, song: true };
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
    const b = document.createElement('button'); b.type = 'button'; b.className = 'hs-chip hs-reply'; face(b, 'Play it back', 'play');
    b.addEventListener('click', e => { e.stopPropagation(); HeroSound.set('yes'); b.classList.remove('in'); setTimeout(() => b.remove(), 500); });
    HeroChips().appendChild(b); HeroUnder.layout(); requestAnimationFrame(() => b.classList.add('in'));
    setTimeout(() => { b.classList.remove('in'); setTimeout(() => b.remove(), 600); }, 12000);
  }
  function offerPlay(song) {
    const hero = document.querySelector('.hero'); if (!hero) return;
    document.title = 'A song played on planetbased.io';
    const og = document.querySelector('meta[property="og:title"]'); if (og) og.setAttribute('content', 'A song played on planetbased.io');
    const b = document.createElement('button'); b.type = 'button'; b.className = 'hs-chip hs-play'; face(b, 'Play', 'play');
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
    if (song && /[?&]songs(&|$)/.test(location.search)) { const wait = () => (window.HeroStory && HeroStory.S && HeroStory.S.done) ? offerPlay(song) : setTimeout(wait, 300); wait(); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.HeroSong = { encode, decode, get rec() { return rec; }, perform };
})();
