// Shared beats for the variants: the lines gather back into the hero mark as its barcode, and the barcode folds into
// THE LOGO with the garden on the fold's beats.
//   gather(K, t, a, b, from)   lines move from their positions `from` (array of [l,t,r,b]) to the mark's bars at s = 1
//   fold(K, t, a, b)           the hero mark from s = 1 to s = 0 between a and b (linear in s; the pose eases inside)
//   beats(a, b)                the fold's beats: { peony, dahlia, bee } (ms)
(function () {
  const X = window.HLPose;
  const H = window.HeroVariantKit = {
    gather(K, t, a, b, from) {
      const to = HeroLogo.screenBars(1), e = X.MOVE(X.seg(t, a, b)), mark = document.querySelector('.hero .mark');
      if (t >= b) { K.lines.forEach((_, i) => K.line(i, 0, 0, 0, 0, 1, 0)); return true; }
      from.forEach((f, i) => {
        const g = to[i]; if (!f || !g) { K.line(i, 0, 0, 0, 0, 1, 0); return; }
        K.line(i, X.lerp(f[0], g[0], e), X.lerp(f[2], g[2], e), X.lerp(f[1], g[1], e), X.lerp(f[3], g[3], e), 1, 1);
      });
      return false;
    },
    fold(K, t, a, b) { HeroLogo.render(1 - X.seg(t, a, b)); },
    // pose sub-phases (shared/pose.js): the bars after the b are folded at s = .55, the bars between at .25, settled at 0
    beats(a, b) { const at = u => a + (1 - u) * (b - a); return { peony: at(.55), dahlia: at(.25), bee: b }; },
    // 11-14 (Ivy: no pops): the word closes back to the logo in ONE eased motion, s 2 -> 0 (no speed change at the
    // barcode), and the garden's beats are found on that same curve: the sun as the letters go (s 1), the peony as the
    // bars after the b fold (s .55), the dahlia as the bars between fold (s .25), the bee as it settles
    close(t, a, b) { return 2 - 2 * X.MOVE(X.seg(t, a, b)); },
    closeBeats(a, b) {
      const inv = y => { let lo = 0, hi = 1; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (X.MOVE(m) < y) lo = m; else hi = m; } return (lo + hi) / 2; };
      const at = s => a + (b - a) * inv((2 - s) / 2);
      return { sun: at(1), peony: at(.55), dahlia: at(.25), bee: b };
    },
    // phones (11-14, Ivy: the rest came in too slowly after the logo): the garden right after the logo lands, each on
    // its own beat, while the mark plays its open and close
    phoneBeats(g) { return { sun: g + 520, peony: g + 820, dahlia: g + 1060, bee: g + 1420, text: g + 900 }; },
    // show or hide the hero mark (it stays hidden while the lines are travelling to it)
    markOn(on) { const m = document.querySelector('.hero .mark'); if (m) m.classList.toggle('hs-on', on); }
  };
})();
