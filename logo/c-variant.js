// c. THE STRINGS. The loader is a real preloader: playful "-ing" words cycle under the tree while the hero's images load
// (shared/preload.js); the word in view falls with the tree. Then the hero's guide lines are drawn down the
// paper as strings and strummed left to right (with sound, you hear them); three more strings run through where the
// sun and the two flowers will hang. The tree comes apart along the strings and its pieces slide down them; the green
// blocks slide in along them from above and below. On the green the strings fade to the faint guides they are, and the
// logo grows out of two of them; it breathes open once into the barcode and the word, and as it folds back the garden
// arrives: the sun as the letters go, the peony and the dahlia sliding down their strings, the bee as it settles.
// After that it is all one instrument: strum the strings, slide the sun or a flower along its string, open the logo.
// Phone: the same strings (four columns), the green rising as one slab.
(function () {
  const X = window.HLPose, Kit = window.HeroVariantKit, { seg, lerp, MOVE } = X;
  // 11-14 (Ivy): no long rest on flat strings; the green follows the falling tree and the logo grows as it lands
  const T = { draw0: 0, drawStep: 34, drawDur: 520, tree0: 700, blocks0: 1000, step: 95, dur: 760 };
  let SC = null, SP = [];
  let G = [], cuts = [], dirs = new Map(), starts = new Map(), fired = new Set(), logoFrom = null;
  // no question: a quiet "Sound" button under the logo (11-14, Ivy: asking on the loader pressures people before they
  // have seen anything); the footer keeps its link
  window.HeroVariant = {
    askOn: 'none',
    plan(K, phone) {
      const reveal = phone ? 2300 : T.blocks0 + 5 * T.step + T.dur + 120;
      // the logo grows out of its two strings as the last blocks land (no wait on the flat strings), opens once into the
      // word, holds, and closes back in one motion (shared/common.js close), the garden on that motion's beats
      const grow = phone ? [reveal + 40, reveal + 640] : [reveal - 280, reveal + 420];
      const open = [grow[1] + 80, grow[1] + 80 + (phone ? 640 : 800)], hold = open[1] + (phone ? 300 : 420), close = [hold, hold + (phone ? 1500 : 2000)];
      Object.assign(T, { reveal, fade: [reveal, reveal + 700], grow, open, hold, close });
      return { reveal, end: close[1], lines: 40 };
    },
    setup(K, phone, h) {
      if (window.HeroPreload) HeroPreload.stop();      // the word in view falls with the tree
      G = HeroStrings.positions();
      G.sort((a, b) => a.x - b.x);
      // the tree, cut along every string that crosses it; each piece will slide down its string
      cuts = [];
      if (K.tree) {
        const xs = [K.tree[0] - 2, ...G.map(s => s.x).filter(x => x > K.tree[0] && x < K.tree[2]), K.tree[2] + 2];
        for (let j = 0; j < xs.length - 1; j++) cuts.push([xs[j], K.tree[1] - 2, xs[j + 1], K.tree[3] + 2]);
        // the word in view falls too, whole, as its own piece (it sits under the tree, outside the tree's box)
        const w = document.querySelector('.loader .loader-in .hs-ing'), wr = w && w.getBoundingClientRect();
        if (wr && wr.width) cuts.push([wr.left - 8, wr.top - 6, wr.right + 8, wr.bottom + 6]);
        h.treePieces(cuts);
        document.documentElement.classList.add('hs-cutting');
      }
      [...K.blocks].sort((a, b) => a.hr.x - b.hr.x || a.hr.y - b.hr.y).forEach((b, i) => { dirs.set(b, b.hr.y === 0 && b.hr.h < K.H * .7 ? -1 : 1); starts.set(b, T.blocks0 + i * T.step); });
      Kit.markOn(false);
      // the pencil: one overlay for the falling strings (two strokes each, a loose double line that settles into one)
      SC = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); SC.setAttribute('class', 'hs-scribble'); SC.setAttribute('aria-hidden', 'true');
      document.body.appendChild(SC);
      SP = G.map(() => [0, 1].map(() => { const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('fill', 'none'); p.setAttribute('stroke-linecap', 'round'); p.setAttribute('stroke-linejoin', 'round'); SC.appendChild(p); return p; }));
    },
    afterEnd(K) { window.HeroSoundChip(); },
    afterReveal(K) {
      // the peony and the dahlia hang on strings through their centres: they will slide down them on their beats
      document.documentElement.classList.add('hs-strung');
    },
    garden(K, phone) { if (phone) return Kit.phoneBeats(T.grow[1]); const b = Kit.closeBeats(T.close[0], T.close[1]); return { sun: b.sun, peony: b.peony, dahlia: b.dahlia, bee: b.bee, text: T.close[1] + 120 }; },
    frame(t, K, phone) {
      const running = HeroStory.S.raf !== 0;
      // 1. the strings fall down the paper as loose pencil scribbles; as each lands it settles into a clean, light line
      const inkMix = X.smooth(seg(t, phone ? 1400 : T.blocks0 + 100, T.reveal - 60));
      const fade = seg(t, ...T.fade), col = `color-mix(in srgb, var(--oat) ${(inkMix * 100).toFixed(1)}%, var(--hs-ink))`;
      SC.style.display = t >= T.fade[1] ? 'none' : '';
      G.forEach((s, i) => {
        const a = T.draw0 + i * T.drawStep, e = MOVE(seg(t, a, a + T.drawDur)), done = a + T.drawDur, k = MOVE(seg(t, done, done + 650));
        const L = K.H * e, amp = (1 - k) * (3.2 + 2.2 * Math.sin(i * 2.3)), o = lerp(.85, s.kind === 'obj' ? .16 : .1, fade);
        const p = SP[i];
        if (e <= 0 || t >= T.fade[1]) { p[0].setAttribute('d', ''); p[1].setAttribute('d', ''); return; }
        for (let q = 0; q < 2; q++) {
          p[q].setAttribute('d', HeroStrings.scribblePath(s.x, L, amp, i, q, t, k));
          p[q].setAttribute('stroke', col);
          p[q].setAttribute('stroke-width', q ? (1.1 * (1 - k)).toFixed(2) : lerp(1.25, 1, k).toFixed(2));
          p[q].setAttribute('opacity', (q ? o * .6 * (1 - k) : o).toFixed(3));
        }
      });
      // 2. the tree's pieces slide down their strings
      cuts.forEach((c, j) => { const e = MOVE(seg(t, T.tree0 + j * 45, T.tree0 + 800 + j * 45)); K.piece(j, 0, K.H * .7 * e, 1 - e); });
      // 3. the green: blocks along the strings (desktop); one slab (phone)
      if (!phone) K.blocks.forEach(b => {
        if (t >= T.reveal) return;
        const s0 = starts.get(b), eb = MOVE(seg(t, s0, s0 + T.dur)), d = dirs.get(b), off = d < 0 ? -(b.hr.y + b.hr.h + 60) : K.H - b.hr.y + 60;
        K.block(b, b.hr.x, b.hr.y + off * (1 - eb), 1, 1, eb > 0 && eb < 1);
      });
      else if (t >= 1250 && !document.documentElement.classList.contains('boot-out') && t < T.reveal) HeroStory.S.ctx.greenUp();
      // 4. the strings hand over to the hero's own (pluckable) strings
      if (t >= T.fade[1] && !document.querySelector('.hs-strings')) HeroStrings.mount(.1);
      // 5. the logo grows out of two strings: hairlines at the logo's bars thicken into it
      if (t >= T.grow[0]) {
        const lg = document.querySelector('.hero .mark .hl-rest').getBoundingClientRect(), bw = lg.width / 3;
        const to = [[lg.left, lg.top + bw, lg.left + bw, lg.bottom], [lg.left + 2 * bw, lg.top, lg.left + 3 * bw, lg.bottom - bw]];
        const e = MOVE(seg(t, ...T.grow));
        to.forEach((r, k) => {
          const cx = (r[0] + r[2]) / 2, w = lerp(1.2, r[2] - r[0], e);
          K.line(G.length + k, cx - w / 2, cx + w / 2, lerp(0, r[1], e), lerp(K.H, r[3], e), 1, t >= T.grow[1] ? 0 : 1);
        });
        Kit.markOn(t >= T.grow[1]);
        // the one gentle cue: a soft open chord as the logo grows (only with sound already on, only once)
        if (running && !fired.has('cue') && window.HeroSound && HeroSound.on()) { fired.add('cue'); [0, 2, 4].forEach((k, n) => setTimeout(() => HeroSound.play('g', k, { amp: .55, pan: -.3 + n * .3, replay: true }), n * 140)); }
      }
      // 6. it breathes open once (barcode, word) and folds back with the garden on the beats
      if (t >= T.grow[1]) {
        HeroLogo.render(t < T.hold ? 2 * MOVE(seg(t, ...T.open)) : Kit.close(t, ...T.close));
      }
    }
  };
})();
