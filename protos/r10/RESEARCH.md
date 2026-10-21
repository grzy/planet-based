# planetbased.io ✺ round 10 research

Oct 20, 2026. For the studio site build-out. Three prototypes sit next to this file.

## Small-studio sites worth knowing

Checked this session (Awwwards pages or a juror write-up):

- **Overworld Audio** (Rogier de Boevé), https://overworldaudio.com -- a sonic-branding studio whose site is an explorable 3D map of its sound work. Awwwards SOTD, Oct 15 2026. https://www.awwwards.com/sites/overworld-audio
  The closest thing to planetbased: sound is the product, and you travel through it instead of reading a grid.
- **Signal-A**, https://signal-a.studio -- black and white, with tiny tricks: a cursor that swaps out per case, text that scrambles on hover, an archive slider. SOTD Oct 18 2026. https://www.awwwards.com/sites/signal-a-studio
- **Warm & Fuzzy** (by Neutral Studio) -- two colors only (#190BB6 and #E5CF4F), plus idle animations that keep the page moving when you stop. SOTD Sep 12 2026. https://www.awwwards.com/sites/warm-fuzzy
- **By-Kin**, https://by-kin.com -- big editorial type, scroll with weight to it, and transitions you don't notice. SOTD + Developer + FWA. https://www.hontran.dev/blog/best-award-winning-websites-2026
- **Uncommon Studio**, https://uncommonstudio.com.au -- a strict grid, with GSAP transitions that move like a camera. SOTD + Developer + FWA. (same source)
- **Iventions**, https://iventions.com -- every project lit like an installation in its own Three.js scene, revealed slowly. (same source)
- **Ascension / Pegassi** (Jesper Landberg), https://ascension.pegassi.be -- SOTD Oct 21 2026. Same person who wrote the Codrops Paper Shaders piece below. https://www.awwwards.com/websites/sites_of_the_day/

From reputation, not re-checked this session (their pages are mostly WebGL, so a text fetch doesn't show much):

- **Lusion**, https://lusion.co -- physics you can feel. Soft 3D objects you shove around with the cursor. The bar for tactile WebGL.
- **Active Theory**, https://activetheory.net -- a studio site that plays like a small game world, built on their own engine.
- **Immersive Garden**, https://immersive-g.com -- cinematic 3D scenes with a lot of light and material craft.
- **Basement Studio**, https://basement.studio -- loud, funny, opinionated. The studio's personality comes first.
- **Locomotive**, https://locomotive.ca -- made Locomotive Scroll. Smooth scrolling as a brand trait.
- **Darkroom Engineering** (formerly Studio Freight), https://darkroom.engineering -- made Lenis. Small team, open-source tooling as part of who they are. ⚠️ confirm the rename before citing it publicly.

**The pattern:** the memorable ones each own ONE physical idea (a map, weight, light, a game) and the copy stays tiny. None of them is a card grid.

## Technique menu that fits planetbased

| Technique | Where to learn it | Fit |
|---|---|---|
| Gravity mouse trail (images drop from the cursor, bounce, fade) | Codrops x GSAP, May 20 2026: https://tympanus.net/codrops/2026/05/20/made-with-gsap-building-a-fun-gravity-based-mouse-trail/ | The thing you liked. GSAP timelines fake the physics with elastic eases. Prototype A swaps that for real rigid bodies, so the pieces pile up and you can grab them. |
| Cutout physics (rigid bodies with real silhouettes) | Matter.js https://brm.io/matter-js/ · Rapier (WASM, faster, 2D + 3D) https://rapier.rs | Matter is fine up to ~200 bodies. Move to Rapier if a page needs thousands. |
| Paper / cloth simulation | Verlet integration (hand-written, ~60 lines) · Codrops crumpled paper with Houdini VAT + Three.js + cannon-es, Sep 19 2026: https://tympanus.net/codrops/2026/09/19/crumbled-paper-houdini-vat-threejs/ | Prototype B is a hand-written verlet sheet, so it reacts live. VAT is the route when you want a pre-baked crumple that looks perfect. |
| Paper shaders on real elements | Jesper Landberg, "Taking Paper Shaders off the Background", Oct 19 2026: https://tympanus.net/codrops/2026/10/19/paper-shaders-off-background/ · Ksenia Kondrashova profile, Oct 16 2026: https://tympanus.net/codrops/2026/10/16/ksenia-kondrashova/ | Folds and creases under the cursor, on the type itself. Good for wordmark moments. |
| Shader reveal with a trail buffer | Ping-pong render targets (two textures, each frame reads the last one) | Prototype C. The trail is data, so it can drive more than color: scale, sound, density. |
| Sound-reactive scenes | Web Audio AnalyserNode (live) or an offline FFT of the decoded file (exact, can be drawn before anything plays) | Prototype B scores the paper from an offline spectrogram, then punches it in sync with the audio clock. |
| Real recordings | xeno-canto, credited (already in `sounds/` + `credits.json`) | ⚠️ Most are CC BY-NC-SA. Fine for the site now; swap or ask the recordists before paid client work. |

## Where each direction's look comes from

- **A, Leaf Litter:** Mary Delany's "paper mosaicks", 985 botanically accurate cut-paper flowers on black ground, made from age 72 (1772-82), now at the British Museum. The charm: cut paper with the paper's pale core showing at the scissor edge, on black. Translated, not copied: generated leaves, seeds, beetles, moths, feathers.
- **B, Song Roll:** player-piano / pianola rolls and music-box strips, where a song is stored as holes in paper. The charm: the hole IS the note, and light goes through it.
- **C, Nectar Guides:** the real biology of UV nectar guides (bullseye centers and guide lines that bees see and we don't) and the hexagonal facets of a compound eye. The science is the style.

## Not reused from rounds 1-9

No eyebrow, title, micro-title, CTA skeleton. No contour lines. No store metaphor. No code-drawn mascots, no grain overlay. No card grid, no numbering, no hover lift. Fonts: Ultra (A), Stardos Stencil (B), Host Grotesk (C), all from your Usable Google Fonts shortlist or liked list. Ubuntu Sans Mono for chrome.
