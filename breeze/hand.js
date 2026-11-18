// Ivy's pencil hand, drawn in code (11-17): the 'Rising' hand from protos/hand-r2, for the ✓ copied and the hero's tap me.
// Includes perfect-freehand 1.2.3 by Steve Ruiz (MIT, https://github.com/steveruizok/perfect-freehand), vendored so the site
// has no runtime CDN dependency.
(() => {
  const getStroke = (() => {
const{PI:kn}=Math,F=kn+1e-4,tn=.5,rn=[1,1];function un(n,t,r,u=e=>e){return n*u(.5-t*(.5-r))}const{min:Q}=Math;function en(n,t,r){let u=Q(1,t/r);return Q(1,n+(Q(1,1-u)-n)*(u*.275))}function zn(n){return[-n[0],-n[1]]}function g(n,t){return[n[0]+t[0],n[1]+t[1]]}function on(n,t,r){return n[0]=t[0]+r[0],n[1]=t[1]+r[1],n}function d(n,t){return[n[0]-t[0],n[1]-t[1]]}function U(n,t,r){return n[0]=t[0]-r[0],n[1]=t[1]-r[1],n}function x(n,t){return[n[0]*t,n[1]*t]}function V(n,t,r){return n[0]=t[0]*r,n[1]=t[1]*r,n}function An(n,t){return[n[0]/t,n[1]/t]}function sn(n){return[n[1],-n[0]]}function W(n,t){let r=t[0];return n[0]=t[1],n[1]=-r,n}function ln(n,t){return n[0]*t[0]+n[1]*t[1]}function bn(n,t){return n[0]===t[0]&&n[1]===t[1]}function In(n){return Math.hypot(n[0],n[1])}function cn(n,t){let r=n[0]-t[0],u=n[1]-t[1];return r*r+u*u}function fn(n){return An(n,In(n))}function Tn(n,t){return Math.hypot(n[1]-t[1],n[0]-t[0])}function X(n,t,r){let u=Math.sin(r),e=Math.cos(r),o=n[0]-t[0],i=n[1]-t[1],l=o*e-i*u,v=o*u+i*e;return[l+t[0],v+t[1]]}function an(n,t,r,u){let e=Math.sin(u),o=Math.cos(u),i=t[0]-r[0],l=t[1]-r[1],v=i*o-l*e,P=i*e+l*o;return n[0]=v+r[0],n[1]=P+r[1],n}function hn(n,t,r){return g(n,x(d(t,n),r))}function jn(n,t,r,u){let e=r[0]-t[0],o=r[1]-t[1];return n[0]=t[0]+e*u,n[1]=t[1]+o*u,n}function pn(n,t,r){return g(n,x(t,r))}const c=[0,0],y=[0,0],L=[0,0];function wn(n,t){let r=pn(n,fn(sn(d(n,g(n,[1,1])))),-t),u=[],e=1/13;for(let o=e;o<=1;o+=e)u.push(X(r,n,F*2*o));return u}function Fn(n,t,r){let u=[],e=1/r;for(let o=e;o<=1;o+=e)u.push(X(t,n,F*o));return u}function On(n,t,r){let u=d(t,r),e=x(u,.5),o=x(u,.51);return[d(n,e),d(n,o),g(n,o),g(n,e)]}function Rn(n,t,r,u){let e=[],o=pn(n,t,r),i=1/u;for(let l=i;l<1;l+=i)e.push(X(o,n,F*3*l));return e}function _n(n,t,r){return[g(n,x(t,r)),g(n,x(t,r*.99)),d(n,x(t,r*.99)),d(n,x(t,r))]}function gn(n,t,r){return n===!1||n===void 0?0:n===!0?Math.max(t,r):n}function qn(n,t,r){return n.slice(0,10).reduce((u,e)=>{let o=e.pressure;return t&&(o=en(u,e.distance,r)),(u+o)/2},n[0].pressure)}function vn(n,t={}){let{size:r=16,smoothing:u=.5,thinning:e=.5,simulatePressure:o=!0,easing:i=s=>s,start:l={},end:v={},last:P=!1}=t,{cap:M=!0,easing:O=s=>s*(2-s)}=l,{cap:f=!0,easing:a=s=>--s*s*s+1}=v;if(n.length===0||r<=0)return[];let p=n[n.length-1].runningLength,A=gn(l.taper,r,p),b=gn(v.taper,r,p),Y=(r*u)**2,I=[],z=[],Z=qn(n,o,r),h=un(r,e,n[n.length-1].pressure,i),C,D=n[0].vector,T=n[0].point,R=T,S=T,k=R,E=!1;for(let s=0;s<n.length;s++){let{pressure:K}=n[s],{point:m,vector:j,distance:yn,runningLength:w}=n[s],q=s===n.length-1;if(!q&&p-w<3)continue;e?(o&&(K=en(Z,yn,r)),h=un(r,e,K,i)):h=r/2,C===void 0&&(C=h);let Ln=w<A?O(w/A):1,Pn=p-w<b?a((p-w)/b):1;h=Math.max(.01,h*Math.min(Ln,Pn));let $=(q?n[s]:n[s+1]).vector,N=q?1:ln(j,$),Sn=ln(j,D)<0&&!E,nn=N!==null&&N<0;if(Sn||nn){W(c,D),V(c,c,h);for(let B=0;B<=1;B+=.07692307692307693)U(y,m,c),an(y,y,m,F*B),S=[y[0],y[1]],I.push(S),on(L,m,c),an(L,L,m,F*-B),k=[L[0],L[1]],z.push(k);T=S,R=k,nn&&(E=!0);continue}if(E=!1,q){W(c,j),V(c,c,h),I.push(d(m,c)),z.push(g(m,c));continue}jn(c,$,j,N),W(c,c),V(c,c,h),U(y,m,c),S=[y[0],y[1]],(s<=1||cn(T,S)>Y)&&(I.push(S),T=S),on(L,m,c),k=[L[0],L[1]],(s<=1||cn(R,k)>Y)&&(z.push(k),R=k),Z=K,D=j}let G=[n[0].point[0],n[0].point[1]],H=n.length>1?[n[n.length-1].point[0],n[n.length-1].point[1]]:g(n[0].point,[1,1]),J=[],_=[];if(n.length===1){if(!(A||b)||P)return wn(G,C||h)}else{A||b&&n.length===1||(M?J.push(...Fn(G,z[0],13)):J.push(...On(G,I[0],z[0])));let s=sn(zn(n[n.length-1].vector));b||A&&n.length===1?_.push(H):f?_.push(...Rn(H,s,h,29)):_.push(..._n(H,s,h))}return I.concat(_,z.reverse(),J)}const Mn=[0,0];function mn(n){return n!=null&&n>=0}function dn(n,t={}){let{streamline:r=.5,size:u=16,last:e=!1}=t;if(n.length===0)return[];let o=.15+(1-r)*.85,i=Array.isArray(n[0])?n:n.map(({x:f,y:a,pressure:p=tn})=>[f,a,p]);if(i.length===2){let f=i[1];i=i.slice(0,-1);for(let a=1;a<5;a++)i.push(hn(i[0],f,a/4))}i.length===1&&(i=[...i,[...g(i[0],rn),...i[0].slice(2)]]);let l=[{point:[i[0][0],i[0][1]],pressure:mn(i[0][2])?i[0][2]:.25,vector:[...rn],distance:0,runningLength:0}],v=!1,P=0,M=l[0],O=i.length-1;for(let f=1;f<i.length;f++){let a=e&&f===O?[i[f][0],i[f][1]]:hn(M.point,i[f],o);if(bn(M.point,a))continue;let p=Tn(a,M.point);if(P+=p,f<O&&!v){if(P<u)continue;v=!0}U(Mn,M.point,a),M={point:a,pressure:mn(i[f][2])?i[f][2]:tn,vector:fn(Mn),distance:p,runningLength:P},l.push(M)}return l[0].vector=l[1]?.vector||[0,0],l}function xn(n,t={}){return vn(dn(n,t),t)}var Bn=xn;return xn;
  })();

  // ---------- seeded randomness + smooth 1D noise (tremor that varies along a stroke, never uniform) ----------
  const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const noise1 = r => { const k = Array.from({ length: 64 }, () => r() * 2 - 1); return x => { const i = Math.floor(x), f = x - i, a = k[((i % 64) + 64) % 64], b = k[(((i + 1) % 64) + 64) % 64], u = f * f * (3 - 2 * f); return a + (b - a) * u; }; };
  // ---------- letter skeletons: x right, y down; the x-height runs y 0..1, the baseline is y 1 ----------
  const L = {
    c: { adv: .78, s: [[[.64,.2],[.46,.03],[.2,.07],[.04,.33],[.03,.63],[.17,.9],[.41,1],[.67,.86]]] },
    o: { adv: .84, s: [[[.44,.02],[.17,.1],[.03,.42],[.08,.82],[.34,1],[.6,.89],[.71,.53],[.61,.16],[.42,.01],[.3,.05]]] },
    p: { adv: .86, s: [[[.09,-.03],[.09,.6],[.08,1.24],[.07,1.62]], [[.09,.34],[.25,.07],[.49,0],[.69,.2],[.73,.56],[.58,.89],[.34,1],[.11,.86]]] },
    i: { adv: .38, s: [[[.12,.02],[.1,.55],[.11,.92],[.22,1]]], dot: [[.1,-.47],[.17,-.42],[.25,-.38]] },
    e: { adv: .8, s: [[[.06,.55],[.36,.53],[.64,.45],[.62,.2],[.44,.02],[.18,.06],[.02,.35],[.02,.67],[.16,.93],[.42,1],[.69,.86]]] },
    d: { adv: .9, s: [[[.63,.25],[.45,.03],[.18,.08],[.02,.41],[.06,.79],[.28,1],[.52,.94],[.65,.7]], [[.67,-.8],[.67,.2],[.67,.8],[.71,1],[.81,.96]]] },
    t: { adv: .62, s: [[[.28,-.5],[.27,.3],[.29,.86],[.42,1],[.58,.93]], [[.02,.07],[.3,.04],[.58,.02]]] },
    a: { adv: .88, s: [[[.63,.25],[.45,.03],[.18,.08],[.02,.41],[.06,.79],[.28,1],[.52,.94],[.66,.6],[.67,.04],[.67,.55],[.7,.94],[.82,1]]] },
    m: { adv: 1.1, s: [[[.04,.03],[.05,.55],[.05,1],[.06,.42],[.18,.07],[.34,.02],[.44,.28],[.45,1],[.46,.4],[.58,.06],[.74,.03],[.84,.3],[.84,.82],[.88,1],[.97,.96]]] },
    ' ': { adv: .55, s: [] },
    // 11-18: the letters "it's all an instrument" needs, in the same soft round hand
    l: { adv: .45, s: [[[.3,-.85],[.24,.1],[.21,.84],[.32,1],[.45,.95]]] },
    n: { adv: .8, s: [[[.06,.02],[.07,.55],[.07,1],[.08,.42],[.22,.07],[.42,.02],[.55,.3],[.56,.84],[.61,1],[.72,.97]]] },
    u: { adv: .8, s: [[[.06,.02],[.05,.6],[.15,.95],[.35,1],[.55,.8],[.58,.02],[.58,.7],[.62,.98],[.73,.97]]] },
    r: { adv: .6, s: [[[.07,.02],[.07,.55],[.07,1],[.08,.46],[.22,.11],[.4,.02],[.56,.08]]] },
    s: { adv: .7, s: [[[.58,.15],[.42,.02],[.18,.05],[.08,.25],[.2,.45],[.45,.55],[.6,.75],[.5,.95],[.25,1],[.05,.88]]] },
    "'": { adv: .32, s: [[[.18,-.6],[.16,-.42],[.12,-.26]]] },
    // marks for the hero's tap me (11-17): a small flicked arrow up, and a long lead line that runs into the words
    '↑': { adv: .7, s: [[[.32,1.05],[.33,.55],[.36,-.05],[.4,-.42]], [[.1,-.1],[.25,-.3],[.4,-.46],[.52,-.26],[.66,-.08]]] },
    '←': { adv: 1.05, s: [[[.95,.5],[.55,.47],[.06,.5]], [[.3,.24],[.06,.5],[.32,.76]]] },
    '→': { adv: 1.05, s: [[[.05,.5],[.45,.47],[.94,.5]], [[.7,.24],[.94,.5],[.68,.76]]] },
    '↓': { adv: .75, s: [[[.4,-.45],[.38,.3],[.36,1.02]], [[.12,.74],[.36,1.04],[.6,.72]]] },
    '⟵': { adv: 2.75, s: [[[2.65,.7],[2.15,.8],[1.55,.58],[.95,.08],[.4,-.1],[.04,0]], [[.3,-.3],[.04,0],[.3,.28]]] },
    '!': { adv: .5, s: [[[.24,-.62],[.22,.1],[.2,.64]]], dot: [[0.184,0.903],[0.221,0.908],[0.243,0.935],[0.24,0.966],[0.216,0.985],[0.187,0.984],[0.169,0.964],[0.17,0.941],[0.186,0.926],[0.207,0.926],[0.22,0.939],[0.22,0.954],[0.21,0.964],[0.197,0.964],[0.19,0.957]], bang: true },   // 11-18 (Ivy): a small round dot, a tight pencil swirl spiraled in (~1.4 pen widths across)
    '⟶': { adv: 2.75, s: [[[.1,.7],[.6,.8],[1.2,.58],[1.8,.08],[2.35,-.1],[2.71,0]], [[2.45,-.3],[2.71,0],[2.45,.28]]] },
    // 11-18 (Ivy): a music note for "⟵ tap ♪": an oval head of a tight pencil swirl (filled), a stem, one flag; and "w/"
    '♪': { adv: .75, s: [[[.37,.86],[.38,.3],[.4,-.55]], [[.4,-.55],[.5,-.38],[.64,-.22],[.68,-.02],[.6,.16]]], dot: [[0.351,0.949],[0.268,0.987],[0.173,0.983],[0.103,0.941],[0.081,0.88],[0.113,0.824],[0.181,0.793],[0.257,0.797],[0.313,0.831],[0.329,0.88],[0.303,0.924],[0.25,0.946],[0.192,0.942],[0.151,0.916],[0.141,0.88],[0.161,0.849],[0.199,0.834],[0.239,0.838],[0.265,0.857],[0.269,0.88],[0.255,0.898],[0.232,0.905],[0.21,0.901]], bang: true },
    w: { adv: .78, s: [[[.03,.02],[.15,.6],[.21,1],[.33,.45],[.39,.18],[.46,.6],[.53,1],[.63,.5],[.72,.02]]] },
    '/': { adv: .48, s: [[[.42,-.32],[.25,.35],[.06,1.08]]] },
    '~': { adv: 2.7, s: [[[0,.1],[.5,-.2],[1.1,.05],[1.7,.6],[2.25,.78],[2.6,.66]]] },
  };
  const CHECK = { one: { adv: 1.25, s: [[[0,.42],[.14,.63],[.3,.98],[.52,.52],[.8,.08],[1.12,-.36]]] } };
  // ---------- Rising (11-17, Ivy's pick from protos/hand-r2): soft, round, light, the line climbing toward its end ----------
  const RISING = { seed: 71, slant: 6, xw: 1.16, asc: 1, track: .14, tension: -.08, jit: .015, trem: [.004, 4], drift: .03, join: ['ie'],
    size: .105, thin: .55, ink: .74, rise: .65, checkOver: .2, speed: 8, exit: 3.5 };
  function spline(pts, tension, step = .02) {
    const out = [], P = [pts[0], ...pts, pts[pts.length - 1]], k = (1 - tension) / 2;
    for (let i = 1; i < P.length - 2; i++) {
      const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
      const seg = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), n = Math.max(2, Math.ceil(seg / step));
      for (let j = 0; j < n; j++) {
        const t = j / n, t2 = t * t, t3 = t2 * t;
        const m1 = [(p2[0] - p0[0]) * k, (p2[1] - p0[1]) * k], m2 = [(p3[0] - p1[0]) * k, (p3[1] - p1[1]) * k];
        const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
        out.push([h00 * p1[0] + h10 * m1[0] + h01 * p2[0] + h11 * m2[0], h00 * p1[1] + h10 * m1[1] + h01 * p2[1] + h11 * m2[1]]);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  const XH = 30;
  function layout(h, text, withCheck, shift, gscale) {
    const r = rng(h.seed), drift = noise1(r), sl = Math.tan(h.slant * Math.PI / 180), strokes = [], dots = [];
    const chars = [...text], extend = (s, k) => { const a = s[s.length - 2], b = s[s.length - 1]; return [...s, [b[0] + (b[0] - a[0]) * k, b[1] + (b[1] - a[1]) * k]]; };
    let span = (withCheck ? CHECK.one.adv * 1.02 + .55 : 0); chars.forEach(c => { span += (L[c] ? L[c].adv * h.xw : .5) + h.track; });
    const ARROWS = '⟵⟶←→↑↓~';
    const place = (glyph, gx, letterSeed, dyOff = 0) => {
      const lr = rng(letterSeed), wv = 1 + (lr() - .5) * .14, hv = 1 + (lr() - .5) * .1, rot = (lr() - .5) * .05;
      return glyph.s.map(pts => pts.map(([px, py]) => {
        let yy = py; if (yy < 0) yy *= h.asc; if (yy > 1) yy = 1 + (yy - 1) * h.asc;
        let lx = px * h.xw * wv, ly = (yy - 1) * hv + 1;
        const c = Math.cos(rot), s = Math.sin(rot); [lx, ly] = [lx * c - (ly - 1) * s, lx * s + (ly - 1) * c + 1];
        lx += (lr() - .5) * h.jit * 2; ly += (lr() - .5) * h.jit * 2;
        const gy = ly + dyOff + drift((gx + lx) * .9) * h.drift - h.rise * (gx + lx) / span;
        return [gx + lx + (1 - gy) * sl, gy];
      }));
    };
    let x = 0;
    if (withCheck) {
      const ck = { adv: CHECK.one.adv, s: CHECK.one.s.map((s, i, a) => i === a.length - 1 ? extend(s, h.checkOver) : s) };
      place({ s: ck.s.map(s => s.map(([a, b]) => [a * 1.02, (b - 1) * 1.02 + 1])) }, 0, h.seed * 7).forEach(s => strokes.push({ pts: s, kind: 'chk' }));
      x = CHECK.one.adv * 1.02 + .55 + h.track;
    }
    let prev = null;
    chars.forEach((ch, i) => {
      const g = L[ch]; if (!g) { x += .5; return; }
      // shift (x-heights): the words nudged apart from their arrow, which stays put (11-18, Ivy)
      const sx = shift && !ARROWS.includes(ch) ? shift[0] : 0, sy = shift && !ARROWS.includes(ch) ? shift[1] : 0;
      const gs = gscale && gscale[ch], G = gs ? { s: g.s.map(st => st.map(([px, py]) => [gs[1] + (px - gs[1]) * gs[0], gs[2] + (py - gs[2]) * gs[0]])) } : g;
      place(G, x + sx, h.seed * 31 + i * 7, sy).forEach((s, j) => {
        if (j === 0 && prev && h.join.includes(prev + ch) && strokes.length) strokes[strokes.length - 1].pts.push(...s);
        else strokes.push({ pts: s, kind: ch });
      });
      if (g.dot) dots.push(Object.assign(place({ s: [g.dot] }, x + sx, h.seed * 13 + i, sy)[0], { bang: !!g.bang }));
      prev = ch === ' ' ? null : ch;
      x += g.adv * h.xw + h.track * (1 + (rng(h.seed + i)() - .5) * .5);
    });
    dots.forEach(d => strokes.push({ pts: d, kind: d.bang ? 'bang' : 'dot' }));
    return strokes;
  }
  function render(h, strokes) {
    const r = rng(h.seed * 3 + 1), out = [];
    strokes.forEach((st, si) => {
      const dotty = st.kind === 'dot' || st.kind === 'bang';
      let pts = spline(st.pts, dotty ? 0 : h.tension, dotty ? .01 : .018).map(([x, y]) => [x * XH, y * XH]);
      if (pts.length > 3 && !dotty) { const a = pts[pts.length - 3], b = pts[pts.length - 1], ov = .06 + r() * .1; pts.push([b[0] + (b[0] - a[0]) * ov * 2, b[1] + (b[1] - a[1]) * ov * 2]); }
      const tn = noise1(rng(h.seed * 101 + si)), amp = h.trem[0] * XH * (.6 + r() * .8), fr = h.trem[1] * (.7 + r() * .6);
      let len = 0; const L1 = [0]; for (let i = 1; i < pts.length; i++) { len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L1.push(len); }
      pts = pts.map(([x, y], i) => { const u = L1[i] / XH; return [x + tn(u * fr) * amp, y + tn(u * fr + 17) * amp]; });
      const curv = pts.map((p, i) => { if (i === 0 || i === pts.length - 1) return 0; const a = pts[i - 1], b = pts[i + 1]; const v1 = [p[0] - a[0], p[1] - a[1]], v2 = [b[0] - p[0], b[1] - p[1]]; const d = Math.hypot(...v1) * Math.hypot(...v2) || 1; return Math.acos(Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / d))); });
      const sm = curv.map((_, i) => { let s = 0, n = 0; for (let k = -3; k <= 3; k++) { const c = curv[i + k]; if (c != null) { s += c; n++; } } return s / n; });
      const T = len || 1;
      const press = pts.map((_, i) => { const t = L1[i] / T; const inn = Math.min(1, t / .12), outt = Math.min(1, (1 - t) / (st.kind === 'chk' ? .32 : .2)); return Math.max(.12, Math.min(1, (.35 + .65 * Math.sin(Math.PI * Math.min(inn, 1) / 2)) * (.25 + .75 * Math.min(1, outt)) * (.82 + sm[i] * 1.4))); });
      const pen = h.size * .82 * XH * (st.kind === 'bang' ? .95 : st.kind === 'dot' ? 1.15 : 1);
      const outline = getStroke(pts.map((p, i) => [p[0], p[1], press[i]]), { size: pen, thinning: Math.min(.82, h.thin + .15), smoothing: .55, streamline: .2, simulatePressure: false, start: { taper: st.kind === 'bang' ? pen * .4 : pen * 1.4, cap: true }, end: { taper: st.kind === 'chk' ? pen * Math.max(5, h.exit * 1.4) : st.kind === 'bang' ? pen * .4 : pen * h.exit, cap: true }, last: true });
      const v = pts.map((_, i) => { const t = L1[i] / T; return h.speed * XH * (.35 + .9 * Math.sin(Math.PI * t)) / (1 + sm[i] * 3.2); });
      const tt = [0]; for (let i = 1; i < pts.length; i++) tt.push(tt[i - 1] + (L1[i] - L1[i - 1]) / ((v[i] + v[i - 1]) / 2));
      // 11-18 (Ivy: "too clean"): a pencil's darkness follows the pressure. A narrow darker core rides inside the stroke,
      // heaviest mid-stroke and on the downstrokes, fading out well before the entries and exits
      const core = getStroke(pts.map((p, i) => { const a = pts[Math.max(0, i - 2)], b = pts[Math.min(pts.length - 1, i + 2)], seg = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, down = Math.max(0, (b[1] - a[1]) / seg);
        return [p[0], p[1], Math.max(.05, press[i] * (.55 + .6 * down))]; }), { size: pen * .62, thinning: .92, smoothing: .55, streamline: .2, simulatePressure: false, start: { taper: pen * 3.2, cap: true }, end: { taper: pen * 4.2, cap: true }, last: true });
      out.push({ outline, core, pts, L: L1, T, time: tt, dur: tt[tt.length - 1], kind: st.kind, pen, op: h.ink * (st.kind === 'bang' ? 1 : st.kind === 'dot' ? .9 : (.74 + r() * .26)) });
    });
    return out;
  }
  // window.pbHand(text, { check, fast }): one ready-to-draw word in Ivy's hand. Every stroke has its centreline (d, for the
  // write-on mask), its pencil outline (fill), pen width (w), opacity (o), dash keyframes in its natural speed shape (frames:
  // quick mid-stroke, slow in the turns), and timing: T (write on, `fast` times quicker than the hand's own pace, 11-17 Ivy:
  // "a LOT faster") and U (the un-write, from the hand's own pace, unchanged: she loves how it disappears)
  const cache = {};
  window.pbHand = function (text, o = {}) {
    const key = text + '|' + !!o.check + '|' + (o.fast || 2.75) + '|' + (o.shift || '') + '|' + JSON.stringify(o.gscale || '');
    if (cache[key]) return cache[key];
    const h = RISING, R = render(h, layout(h, text, !!o.check, o.shift, o.gscale)), fast = o.fast || 2.75, rl = rng(97 + text.length);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    R.forEach(s => s.outline.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }));
    const pad = 6, dx = pad - x0, dy = pad - y0, w = x1 - x0 + pad * 2, hh = y1 - y0 + pad * 2;
    const f = n => n.toFixed(2), T = {}, U = {}, strokes = [];
    let t = 0;
    R.forEach((s, i) => {
      const k = 's' + i, n = 14, frames = [];
      for (let q = 0; q <= n; q++) { const tk = s.dur * q / n; let j = 0; while (j < s.time.length - 1 && s.time[j + 1] < tk) j++; const a = s.time[j], b = s.time[j + 1] ?? a, fr = b > a ? (tk - a) / (b - a) : 0, l = s.L[j] + (s.L[Math.min(j + 1, s.L.length - 1)] - s.L[j]) * fr; frames.push({ offset: q / n, strokeDashoffset: (1 - l / s.T).toFixed(4) }); }
      frames[n].strokeDashoffset = '0';
      strokes.push({ k, core: s.core.length ? 'M' + s.core.map(p => f(p[0] + dx) + ' ' + f(p[1] + dy)).join('L') + 'Z' : '', d: 'M' + s.pts.map(p => f(p[0] + dx) + ' ' + f(p[1] + dy)).join('L'), fill: 'M' + s.outline.map(p => f(p[0] + dx) + ' ' + f(p[1] + dy)).join('L') + 'Z', w: s.pen, mw: 2.6, o: s.op, frames });
      T[k] = [t, s.dur / fast]; U[k] = Math.max(.08, s.dur * .6);
      t += s.dur / fast + (s.kind === 'dot' || s.kind === 'bang' ? .18 : .05 + rl() * .12) / fast;
    });
    return (cache[key] = { vb: `0 0 ${f(w)} ${f(hh)}`, w, h: hh, strokes, T, U, end: t, seed: h.seed, ox: dx, oy: dy });   // ox, oy: drawing units -> box, to line two renders up
  };
})();
