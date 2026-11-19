// b. THE TREE IS CUT INTO THE GREEN. The loader is the orange tree, the preloader's "-ing" words working under it
// (shared/preload.js). When the page is ready the last word gives way to planetbased.io, written on in its place. The
// word recedes into its barcode, and the bars rise as lines straight up through the tree, slicing it. The slices part like an opening
// accordion, and each green block grows out of a slice: the tree's pieces become the page. On the green the lines
// gather into the mark as its barcode while the last blocks settle, open straight into planetbased.io on the green, and
// after a beat the letters go (the sun) and it folds into the logo (the peony, the dahlia, the bee). B's own, tighter
// clock: the word is on the hero about two seconds after the cut.
// A quiet Sound chip at the top right turns the instrument on. Phone: the slices part and fall away as the green rises under them.
(function () {
  const X = window.HLPose, Kit = window.HeroVariantKit, { seg, lerp, MOVE } = X;
  // 11-14 (Ivy): no dead moments. The slices keep parting until the green grows out of them; that same moment they go and
  // the lines set off to gather into the mark
  const T = { swap: [0, 480], recede: [480, 950], rise: [900, 1350], part: [1300, 1950], grow0: 1950, step: 60, dur: 650 };
  const WORD_HOLD = 250;   // 11-19 (Ivy): at most this long (ms) planetbased.io holds, fully written, before it goes and the cut begins
  let HOLD = 0;   // ms the word holds before the cut (plan())
  const vt = t => t <= T.recede[0] ? t : Math.max(T.recede[0], t - HOLD);
  let from = null, strips = [], bounds = [], assign = new Map(), cx = 0, lineTop = 0, lineBot = 0;
  window.HeroVariant = {
    askOn: 'none',
    afterEnd() {
      // 11-14 (Ivy): the flowers and the sun slide on strings in B too (invisible, over B's own guides), and the guides can
      // be strummed; a plucked one shivers in pencil
      if (window.HeroStrings) { HeroStrings.positions({ snap: false }); HeroStrings.mount(0); }
      window.HeroSoundChip();
    },
    plan(K, phone) {
      const reveal = phone ? 2500 : T.grow0 + 5 * T.step + T.dur + 30;
      // the lines gather as the slices go (while the last blocks settle); the barcode opens into the word, holds, and
      // closes back to the logo in one motion (shared/common.js close), the garden on that motion's beats
      const g0 = phone ? reveal + 40 : T.part[1], g1 = phone ? g0 + 550 : Math.max(reveal + 60, g0 + 600);
      const open = [g1, g1 + (phone ? 620 : 760)], hold = open[1] + (phone ? 300 : 480), close = [hold, hold + (phone ? 1500 : 2000)];
      Object.assign(T, { reveal, g0, g1, open, hold, close, f1: close[1] });
      // 11-19 (Ivy: still a pause after the word): the cut starts as soon as the wind's last stroke has finished drawing,
      // or WORD_HOLD ms after planetbased.io is fully written if that comes first; the wind may keep lifting off over the
      // cut. Everything after it keeps its own timing: the variant's clock pauses at the end of the swap for HOLD ms
      const drawn = window.HeroPreload && HeroPreload.windDrawMs ? HeroPreload.windDrawMs() - T.recede[0] : WORD_HOLD;
      HOLD = Math.round(Math.max(0, Math.min(WORD_HOLD, drawn)));
      // 11-18 (Ivy): the tree keeps turning until the slices take it: its one turn is retimed to end at the cut
      if (window.__pbTreeTo) window.__pbTreeTo(performance.now() + T.rise[0] + HOLD + 80);   // +80: the clock starts a beat after plan(); the last frame lands on the cut
      return { reveal: reveal + HOLD, end: close[1] + HOLD, lines: 10 };
    },
    setup(K, phone, h) {
      if (window.HeroPreload) HeroPreload.stop();
      from = K.loaderWord ? K.loaderWord.screen(1) : [];
      const tr = K.tree || [K.W / 2 - 80, K.H * .3, K.W / 2 + 80, K.H * .6];
      lineTop = tr[1] - K.H * .04; lineBot = from[0] ? Math.max(...from.filter(Boolean).map(r => r[3])) : tr[3];
      cx = (tr[0] + tr[2]) / 2;
      // the lines' x: the bars' centres. The tree is cut at every line inside it (plus its own edges)
      const xs = from.filter(Boolean).map(r => (r[0] + r[2]) / 2);
      bounds = [tr[0] - 2, ...xs.filter(x => x > tr[0] && x < tr[2]), tr[2] + 2];
      strips = bounds.slice(0, -1).map((x, i) => [x, tr[1] - 2, bounds[i + 1], tr[3] + 2]);
      h.treePieces(strips);
      // each block grows out of the slice nearest its own place, left to right
      const bl = [...K.blocks].sort((a, b) => (a.hr.x + a.hr.w / 2) - (b.hr.x + b.hr.w / 2));
      bl.forEach((b, j) => assign.set(b, { strip: Math.round(j * (strips.length - 1) / Math.max(1, bl.length - 1)), start: T.grow0 + j * T.step }));
      Kit.markOn(false);
      document.documentElement.classList.add('hs-cutting');
    },
    garden(K, phone) {
      if (phone) return Kit.phoneBeats(T.g1 + HOLD);
      // 11-14 (Ivy): the garden comes out during the word's hold (the word stays out as long as before): the sun as the word
      // is fully open, then the peony and the dahlia, the bee as the logo settles
      const o = T.open[1], sun = Math.max(o - 80, T.reveal + 920);
      return { sun: sun + HOLD, peony: sun + 260 + HOLD, dahlia: sun + 520 + HOLD, bee: T.close[1] + HOLD, text: sun + 180 + HOLD };   // 11-14 (Ivy, again): the type overlaps the sun and the peony   // 11-14 (Ivy): the type, the top line and the slider right after the dahlia
    },
    frame(t, K, phone) {
      t = vt(t);
      // 0. the last "-ing" word gives way and planetbased.io is written on in its place
      const ing = window.HeroPreload && HeroPreload.el, ks = seg(t, ...T.swap);
      if (ing) {
        const txt = ing.querySelector('.hs-txt'), full = txt.dataset.full || (txt.dataset.full = txt.textContent);
        if (ing.classList.contains('hs-ing-1')) { txt.textContent = full.slice(0, Math.round(full.length * (1 - Math.min(1, ks * 1.8)))); ing.style.opacity = ks >= .56 ? '0' : ''; }
        else { ing.classList.toggle('smudge', ks > 0); ing.classList.toggle('shown', ks <= 0); ing.style.opacity = ks >= .9 ? '0' : ''; }
      }
      // 1. the word recedes into its barcode (under the tree)
      if (K.loaderWord) {
        const kw = MOVE(seg(t, T.swap[0] + 160, T.swap[1]));
        K.loaderWord.svg.style.clipPath = kw >= 1 ? '' : `inset(-10% ${(100 - kw * 100).toFixed(2)}% -10% 0)`;
        K.loaderWord.svg.style.visibility = t < T.rise[0] ? '' : 'hidden'; K.loaderWord.draw(Math.max(1, 2 - seg(t, ...T.recede)));
      }
      // 2. the bars rise as lines through the tree; 3. the slices part like an opening accordion
      const er = MOVE(seg(t, ...T.rise)), ep = MOVE(seg(t, ...T.part));
      // 11-14 (Ivy): every gap the same: each slice moves the same step from its neighbour, whatever the bars' spacing
      // (the cut lines come from the word's bars, which are unevenly spaced; a spread by distance made one gap 2-3x wider)
      const gapPx = Math.max(4, Math.min(9, (bounds[bounds.length - 1] - bounds[0]) * .035)), mid = (strips.length - 1) / 2;
      const spread = i => (Math.max(0, Math.min(strips.length - 1, i)) - mid) * gapPx * ep;
      const ink = X.smooth(seg(t, phone ? 1500 : T.grow0 + 200, phone ? 2400 : T.reveal - 100));
      const lineAt = [];
      from.forEach((f, i) => {
        if (!f) { lineAt.push(null); return; }
        const x0 = (f[0] + f[2]) / 2, w = lerp(f[2] - f[0], 1.5, er);
        // a line rides the left edge of the slice to its right
        const si = Math.max(0, Math.min(strips.length - 1, bounds.findIndex(b => b >= x0 - .5)));
        const x = x0 + (si >= 0 ? spread(si) : 0);
        const r = [x - w / 2, lerp(f[1], lineTop, er), x + w / 2, lerp(f[3], lineBot, er)];
        lineAt.push(r);
        if (t < T.g0) K.line(i, ...[r[0], r[2], r[1], r[3]], ink, t < T.rise[0] ? 0 : 1);
      });
      // 4. the green grows out of the slices (desktop); on the phone the slices fall away as one slab rises
      if (!phone) {
        K.blocks.forEach(b => {
          if (t >= T.reveal) return;
          const a = assign.get(b), sr = strips[a.strip], eb = MOVE(seg(t, a.start, a.start + T.dur));
          const sx0 = sr[0] + spread(a.strip), sw = Math.max(2, sr[2] - sr[0]);
          const x = lerp(sx0, b.hr.x, eb), y = lerp(sr[1], b.hr.y, eb), w = lerp(sw, b.hr.w, eb), hh = lerp(sr[3] - sr[1], b.hr.h, eb);
          if (eb <= 0) { K.block(b, -b.hr.w - 200, 0); return; }
          K.block(b, x, y, w / b.hr.w, hh / b.hr.h, eb < 1);
        });
        // every slice leaves together, in one soft fade, as the first blocks grow out of them (none lingers)
        const fade = 1 - X.smooth(seg(t, T.grow0, T.grow0 + 280));   // the slices stay whole until the green grows out of them
        strips.forEach((sr, i) => K.piece(i, t < T.rise[0] ? 0 : spread(i), 0, t < T.rise[0] ? 1 : fade));
      } else {
        if (t >= 1350 && !document.documentElement.classList.contains('boot-out') && t < T.reveal) HeroStory.S.ctx.greenUp();
        strips.forEach((sr, i) => { const fall = MOVE(seg(t, 1400 + i * 40, 2300 + i * 40)); K.piece(i, spread(i), fall * K.H * .5, 1 - fall); });
      }
      // 5. the lines gather into the mark as its barcode, it opens into the word, holds, the letters go, it folds
      if (t >= T.g0) {
        const landed = Kit.gather(K, t, T.g0, T.g1, lineAt.map(r => r && [r[0], r[1], r[2], r[3]]));
        Kit.markOn(landed);
        if (landed) {
          HeroLogo.render(t < T.hold ? 1 + MOVE(seg(t, ...T.open)) : Kit.close(t, ...T.close));
        }
      }
    }
  };
})();
