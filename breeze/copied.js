// The "copied" mark (11-14, Ivy): a quick pencil check and "copied" in loose handwriting, drawn in Figma with the same
// pencil brushes as the scribbles (planetbased file, page "✎ Scribbles", section "Copied", variant C3). It writes itself
// stroke by stroke. Chromium and Firefox reveal the real pencil PNG (breeze/copied.png) along each stroke's centreline
// through a plain mask; WebKit (every iPhone browser) gets the same centrelines as pencil-grey strokes drawn on by dash
// offset, with no mask and no filter (masks and filters paint pink stripes there).
// window.pbCopied(host, { hold }) draws it inside host (a positioned box; the svg fills its width), holds, then fades.
// Returns a promise for the end. Calling it again restarts it.
(() => {
  const S = [{"k":"chk","d":"M 14 123 C 14 123 14 122 15 122 C 15 122 16 122 17 122 C 17 122 18 122 19 123 C 20 123 21 123 22 124 C 23 124 24 125 25 126 C 26 127 27 128 28 128 C 29 129 30 130 31 132 C 32 133 34 135 35 136 C 36 138 38 140 38 142 C 39 144 40 146 40 147 C 41 149 42 151 43 153 C 44 155 45 157 46 159 C 48 161 49 163 50 165 C 52 167 52 172 54 170 C 55 169 56 162 57 157 C 58 152 60 147 62 142 C 64 137 67 132 69 126 C 71 121 73 115 75 110 C 77 104 78 98 81 92 C 83 87 88 80 92 74 C 96 68 100 63 104 57 C 108 50 113 39 115 35","w":8.6,"o":0.72},{"k":"chk2","d":"M 18 124 C 19 124 20 124 22 125 C 23 125 25 126 26 127 C 28 128 29 129 31 130 C 32 132 34 134 36 136 C 38 138 40 141 41 144 C 42 147 43 149 44 152 C 45 155 47 158 49 161 C 51 164 53 170 55 170 C 57 170 58 165 60 159 C 62 154 66 144 69 136 C 72 128 74 120 78 112 C 81 103 84 94 89 86 C 94 77 104 63 106 59","w":5.5,"o":0.36},{"k":"w1","d":"M 157 110 C 155 109 151 102 147 101 C 144 100 138 102 134 106 C 130 110 125 117 125 125 C 125 133 129 146 132 154 C 134 161 136 166 140 169 C 145 171 153 170 159 167 C 164 165 170 160 174 154 C 178 148 178 138 181 130 C 183 122 184 112 188 106 C 193 100 204 96 210 95 C 216 94 219 97 223 101 C 227 105 231 113 232 120 C 232 128 230 138 227 146 C 225 153 222 161 218 165 C 215 170 209 173 205 174 C 200 174 195 172 192 167 C 189 163 188 154 189 147 C 190 141 196 133 200 126 C 204 120 209 113 214 109 C 219 105 226 102 229 100","w":7.5,"o":0.69},{"k":"w2","d":"M 229 100 C 232 100 239 100 243 99 C 248 99 251 100 255 100 C 258 99 262 94 264 96 C 267 99 268 106 268 115 C 268 123 266 137 265 148 C 263 160 261 176 260 184 C 259 193 258 201 258 198 C 259 195 260 178 261 168 C 262 158 264 148 266 140 C 268 131 271 122 274 116 C 278 109 282 104 286 100 C 291 97 298 93 303 93 C 308 94 313 100 316 106 C 319 112 321 123 320 130 C 318 136 313 142 307 147 C 302 151 292 154 288 155 C 283 156 278 154 280 154 C 281 154 290 154 296 154 C 301 153 307 152 313 150 C 318 147 326 140 328 139","w":7.9,"o":0.67},{"k":"w3","d":"M 328 139 C 329 136 332 130 333 126 C 334 121 335 117 337 112 C 338 108 340 98 341 98 C 342 98 342 105 342 111 C 342 118 341 129 341 136 C 341 144 340 152 341 157 C 343 163 348 167 351 169 C 355 172 359 172 363 171 C 367 170 369 166 372 163 C 375 159 376 153 379 149 C 382 146 387 145 391 142 C 394 139 398 135 401 131 C 404 128 407 123 408 118 C 409 114 407 107 405 104 C 402 102 397 101 393 102 C 390 103 385 104 382 109 C 380 114 376 123 376 130 C 376 136 379 146 383 151 C 387 157 395 162 401 164 C 408 166 416 162 423 162 C 430 162 436 165 443 162 C 451 160 462 156 468 148 C 475 141 480 125 481 117 C 482 108 478 100 473 97 C 469 94 460 97 454 100 C 448 104 439 110 437 117 C 434 125 437 138 440 146 C 442 154 448 162 454 166 C 459 169 468 169 473 166 C 479 162 483 153 487 144 C 490 135 491 123 493 112 C 496 100 500 87 502 75 C 504 63 506 43 506 40 C 506 37 504 46 502 57 C 501 67 497 86 496 100 C 495 114 496 128 497 139 C 499 149 500 157 503 161 C 506 166 511 166 516 166 C 520 165 525 163 530 158 C 536 154 544 141 547 138","w":7.7,"o":0.71},{"k":"dot","d":"M 348 76 C 348 77 348 77 348 78 C 349 79 349 80 350 80 C 350 80 351 77 352 77 C 353 77 355 80 356 80","w":8.2,"o":0.72}];
  const SVGNS = 'http://www.w3.org/2000/svg', SRC = 'breeze/copied.png';
  const PLAIN = /AppleWebKit/.test(navigator.userAgent) && !/Chrome|Chromium|Edg|Firefox/.test(navigator.userAgent) || /iP(hone|ad|od)/.test(navigator.userAgent) || /[?&]plainlines(&|$)/.test(location.search);
  // when each stroke starts and how long it takes (s): the check, its quick second pass, then the word, then the dot
  const T = { chk: [0, .3], chk2: [.12, .26], w1: [.42, .4], w2: [.8, .34], w3: [1.12, .62], dot: [1.82, .1] };
  let uid = 0;
  function build(host) {
    const id = 'pbc' + (++uid);
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '12 36 546 210'); svg.setAttribute('focusable', 'false'); svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('pb-copied');
    const path = (s, extra) => `<path pathLength="1" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 2" stroke-dashoffset="1" ${extra} d="${s.d}"/>`;
    svg.innerHTML = PLAIN
      ? S.map(s => path(s, `class="pc" stroke-width="${s.w}" stroke-opacity="${s.o}"`)).join('')
      : `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="-20" y="-20" width="650" height="340">`
        + S.map(s => path(s, `stroke="#fff" stroke-width="${(s.w * 2.6).toFixed(1)}"`)).join('')
        + `</mask></defs><image href="${SRC}" x="0" y="0" width="606" height="294" mask="url(#${id})"/>`;
    host.textContent = ''; host.appendChild(svg);
    return [...svg.querySelectorAll('path')];
  }
  window.pbCopied = function (host, opt = {}) {
    if (!host) return Promise.resolve();
    const hold = opt.hold == null ? 3800 : opt.hold;
    (host.__pbc || []).forEach(a => a.cancel());
    const paths = build(host), anims = [];
    paths.forEach((p, i) => {
      const [t0, d] = T[S[i].k] || [i * .3, .3];
      anims.push(p.animate([{ strokeDashoffset: '1' }, { strokeDashoffset: '0' }],
        { duration: d * 1000, delay: t0 * 1000, easing: S[i].k === 'chk' ? 'cubic-bezier(.5,0,.4,1)' : 'cubic-bezier(.4,.05,.6,.95)', fill: 'forwards' }));
    });
    anims.push(host.animate([
      { opacity: 1, visibility: 'visible' },
      { opacity: 1, visibility: 'visible', offset: hold / (hold + 700) },
      { opacity: 0, visibility: 'visible' }], { duration: hold + 700, easing: 'ease' }));
    host.__pbc = anims;
    return anims[anims.length - 1].finished.catch(() => {});
  };
})();
