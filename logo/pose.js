// pose(s): the mark as one function of s in [0, 2].   0 = THE LOGO (two bars)   1 = the barcode   2 = planetbased.io
// Pure geometry (no DOM), shared by the page and by node (shared/check.mjs). Units are font units of the wordmark
// (viewBox 0 -1000 5600 1300); the logo's two rects come in from outside, mapped from the static .pb-logo svg.
//
//   s 0 -> .15   the p bar narrows from the logo bar to the p's stem
//   s .12 -> .7  the b bar travels from the logo out to its stem in the word (and back)
//   s .25 -> .7  the bars between open like bellows on the b's left edge (always behind its travel: never overlap)
//   s .55 -> 1   the bars after the b open from its right edge
//   s 1 -> 2     the letters grow in around their bars (every bar is on its stem the whole time: no bar is ever off its
//                letter while a letter shows)
(function (root) {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, k) => a + (b - a) * k;
  const lerpR = (a, b, k) => k >= 1 ? b.slice() : k <= 0 ? a.slice() : a.map((v, n) => lerp(v, b[n], k));
  function bez(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = s => ((ax * s + bx) * s + cx) * s, Y = s => ((ay * s + by) * s + cy) * s;
    return x => { if (x <= 0) return 0; if (x >= 1) return 1; let lo = 0, hi = 1, s = x; for (let i = 0; i < 40; i++) { if (X(s) < x) lo = s; else hi = s; s = (lo + hi) / 2; } return Y(s); };
  }
  const MOVE = bez(.65, 0, .35, 1), ARRIVE = bez(.2, .7, .3, 1);   // the page's own: the blocks' glide, the sun and flowers
  const smooth = k => { k = clamp(k); return k * k * (3 - 2 * k); };

  function make(D) {
    const bars = [];
    D.forEach((g, i) => g.bars.forEach(s => bars.push({ i, g: g.g, s })));
    const P = bars.find(b => b.i === 0), B = bars.find(b => b.i === 6);
    const mid = bars.filter(b => b.i > 0 && b.i < 6), right = bars.filter(b => b.i > 6);
    // rects for every bar at s, given the logo's two rects (font units); null = not shown
    function at(s, P_LOGO, B_LOGO) {
      const u = clamp(s), v = clamp(s - 1);
      const g = MOVE(seg(u, .12, .7)), sMid = MOVE(seg(u, .25, .7)), sR = MOVE(seg(u, .55, 1)), pSet = MOVE(seg(u, 0, .15));
      const br = lerpR(B_LOGO, B.s, g), pr = lerpR(P_LOGO, P.s, pSet), out = new Map();
      out.set(P, pr); out.set(B, br);
      const bL0 = B.s[0], bR0 = B.s[2];
      mid.forEach(b => out.set(b, sMid > 0 ? [br[0] - (bL0 - b.s[0]) * sMid, b.s[1], br[0] - (bL0 - b.s[2]) * sMid, b.s[3]] : null));
      right.forEach(b => out.set(b, sR > 0 ? [br[2] + (b.s[0] - bR0) * sR, b.s[1], br[2] + (b.s[2] - bR0) * sR, b.s[3]] : null));
      return { rects: out, letters: ARRIVE(v) };
    }
    return { bars, P, B, mid, right, at };
  }
  const api = { make, clamp, seg, lerp, lerpR, bez, MOVE, ARRIVE, smooth };
  if (typeof module !== 'undefined') module.exports = api; else root.HLPose = api;
})(typeof window !== 'undefined' ? window : globalThis);
