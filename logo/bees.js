// HeroBees: bees go to the pollen. The resting bee sits at the dahlia's centre (hero CSS), not on its rim, and now and
// then walks one small circle round the centre collecting pollen. It rides the dahlia wherever it has been slid on its
// string (strings.js moves both). The flying bee's visit (the page's own flight, patched by build.py) lands on the
// peony's centre and walks the same small circle there.
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let timer = 0;
  function circle() {
    const bee = document.querySelector('.objs .bee-rest');
    if (!bee || reduce.matches || document.hidden || !bee.offsetWidth) return later(4000);
    const r = bee.offsetWidth * .2, dir = Math.random() < .5 ? 1 : -1, a0 = Math.random() * 6.283, n = 12, kf = [];
    for (let k = 0; k <= n; k++) { const a = a0 + dir * k / n * 6.283; kf.push({ translate: `${(Math.cos(a) * r - Math.cos(a0) * r).toFixed(2)}px ${(Math.sin(a) * r * .75 - Math.sin(a0) * r * .75).toFixed(2)}px` }); }
    // little steps, not a glide: a bee walks
    bee.animate(kf, { duration: 2200, easing: 'steps(24, end)', composite: 'add' });
    if (window.HeroSound && performance.now() - (window.__hsLastPlay || -1e9) < 20000) HeroSound.play('z', 0, { pan: .6 });
    later();
  }
  function later(ms) { clearTimeout(timer); timer = setTimeout(circle, ms || 9000 + Math.random() * 9000); }
  window.HeroBees = { start: () => later(5200), circle };
  addEventListener('load', () => later(9000));
})();
