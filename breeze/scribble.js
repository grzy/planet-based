// Pencil scribbles that draw themselves: Ivy's Figma pencil studies (breeze/*.png, real brush grain), each revealed through a
// soft mask that travels along the stroke's own centreline (breeze/paths.js), so a line draws on at its head and lifts off
// at its tail. Shared by the loader's wind (below) and the closing's breeze (breeze.js).
(() => {
  const P = window.BREEZE_PATHS;
  if (!P) return;
  const SVGNS = 'http://www.w3.org/2000/svg', SRC = 'breeze/';
  let uid = 0;
  // host: positioned element to draw in. o: x, y (top-left in host px), k (px per study unit), fx/fy (mirror), rot (deg),
  // t0 (s), dur (s), win (share of each stroke shown at once), lag (s between strokes), dx/dy (drift over its life, px),
  // op, mw (mask width in study units), org ([x, y] px pivot, default the centre), alpha (darken the graphite, for small
  // sizes). Returns its element and animations
  window.pbScribble = function (host, key, o) {
    const st = P[key], id = 'pbs' + (++uid), w = st.w * o.k, h = st.h * o.k, anims = [];
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('width', w.toFixed(1)); svg.setAttribute('height', h.toFixed(1));
    svg.setAttribute('viewBox', `0 0 ${st.w} ${st.h}`); svg.setAttribute('focusable', 'false'); svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = `<defs><filter id="${id}f" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.2"/></filter>`
      + `<mask id="${id}" maskUnits="userSpaceOnUse" x="-40" y="-40" width="${st.w + 80}" height="${st.h + 80}"><g filter="url(#${id}f)" fill="none" stroke="#fff" stroke-width="${o.mw || 15}" stroke-linecap="round" stroke-linejoin="round">`
      + st.d.map(d => `<path pathLength="1" stroke-dasharray="${o.win} 3" stroke-dashoffset="${o.win}" d="${d}"/>`).join('')
      + `</g></mask>${o.alpha ? `<filter id="${id}a"><feComponentTransfer><feFuncA type="linear" slope="${o.alpha}"/></feComponentTransfer></filter>` : ''}</defs>`
      + `<g mask="url(#${id})"><image href="${SRC + st.src}" width="${st.w}" height="${st.h}" preserveAspectRatio="none"${o.alpha ? ` filter="url(#${id}a)"` : ''}/></g>`;
    const sx = o.fx ? -1 : 1, sy = o.fy ? -1 : 1;
    const at = (dx, dy) => `translate(${(o.x + dx).toFixed(1)}px,${(o.y + dy).toFixed(1)}px) rotate(${o.rot.toFixed(2)}deg) scale(${sx},${sy})`;
    svg.style.cssText = 'position:absolute;left:0;top:0;overflow:visible;pointer-events:none;opacity:0';
    svg.style.transformOrigin = o.org ? `${o.org[0].toFixed(1)}px ${o.org[1].toFixed(1)}px` : `${(w / 2).toFixed(1)}px ${(h / 2).toFixed(1)}px`;
    svg.style.transform = at(0, 0);
    host.appendChild(svg);
    const paths = svg.querySelectorAll('mask path'), life = o.dur + o.lag * (paths.length - 1);
    const ease = o.ease || 'cubic-bezier(.42,.06,.36,1)';
    paths.forEach((p, j) => anims.push(p.animate([{ strokeDashoffset: String(o.win) }, { strokeDashoffset: '-1' }],
      { duration: o.dur * 1000, delay: (o.t0 + j * o.lag) * 1000, easing: ease, fill: 'both' })));
    anims.push(svg.animate([
      { transform: at(0, 0), opacity: 0 },
      { transform: at(o.dx * .08, o.dy * .08), opacity: o.op, offset: .08 },
      { transform: at(o.dx * .8, o.dy * .8), opacity: o.op, offset: .8 },
      { transform: at(o.dx, o.dy), opacity: 0 }],
      { duration: life * 1000, delay: o.t0 * 1000, easing: 'linear', fill: 'both' }));
    return { el: svg, anims };
  };

  // ---------- the loader: as the orange tree leans into its sway, a few quick pencil swirls of wind draw round it ----------
  // Starts with the tree's animation (or after a beat, on its still frame), all done in under two seconds, and fades away
  // with the tree as it leaves: on phones the swirls ride up with it, on the desktop they lift and fade as the blocks come
  const doc = document.documentElement, tree = document.getElementById('loaderTree');
  if (!tree || !doc.classList.contains('boot')) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = tree.parentNode, loader = box && box.parentNode, pin = document.getElementById('pin');
  if (!box || !loader) return;
  const ride = doc.classList.contains('boot-static');           // phones: the tree and its word lift away as one
  const host = document.createElement('div');
  host.className = 'loader-wind'; host.setAttribute('aria-hidden', 'true');
  (ride ? box : loader).appendChild(host);
  let started = false;
  function go() {
    if (started) return; started = true;
    const tw = tree.offsetWidth, th = tree.offsetHeight; if (!tw) return;
    const hr = host.getBoundingClientRect(), tr = tree.getBoundingClientRect();
    const ox = tr.left - hr.left, oy = tr.top - hr.top;          // the tree's corner inside the host
    const put = (key, wTree, cx, cy, extra) => {                  // centre a study at (cx, cy) in tree units, wTree tree-widths wide
      const st = P[key], k = tw * wTree / st.w;
      return window.pbScribble(host, key, Object.assign({ x: ox + tw * cx - st.w * k / 2, y: oy + th * cy - st.h * k / 2, k,
        fx: false, fy: false, rot: 0, lag: .06, dy: 0, op: .95, mw: 16, alpha: 2.3, ease: 'cubic-bezier(.3,.1,.3,1)' }, extra));
    };
    put('W09', 2.5, .5, .27, { t0: .05, dur: .95, win: .45, dx: tw * .22, rot: -4 });                // a ribbon through the leaves as it leans
    put('W02', 1.7, .66, .1, { t0: .32, dur: 1.0, win: .5, dx: tw * .16, rot: -8 });                // a curl rolls off the crown
    put('W11', 2.2, .55, .4, { t0: .62, dur: 1.15, win: .5, dx: tw * .2, rot: 2, op: .85 });         // hairlines through the canopy, a beat behind
  }
  if (window.__pbTreeAnimAt) go();
  else { addEventListener('pb:treeanim', go, { once: true }); setTimeout(go, 650); }
  // desktop: the original tree hides when the blocks cut it apart; the swirls lift and fade with its pieces
  if (!ride && pin) new MutationObserver((m, ob) => {
    if (!pin.classList.contains('sliding')) return; ob.disconnect();
    host.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-3vh)' }], { duration: 600, easing: 'cubic-bezier(.33,0,.4,1)', fill: 'forwards' });
    setTimeout(() => host.remove(), 900);
  }).observe(pin, { attributes: true, attributeFilter: ['class'] });
  if (ride) new MutationObserver((m, ob) => { if (!doc.classList.contains('boot')) { ob.disconnect(); host.remove(); } }).observe(doc, { attributes: true, attributeFilter: ['class'] });
})();
