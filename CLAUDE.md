# planet based ✺ studio site

The site for Ivy's design studio. Domain: planetbased.io (chosen, not yet purchased -- Porkbun).
This is a STUDIO site, not a portfolio page. First product eventually: Bio Indicators.

## Locked decisions

- **Ground:** darker oatmeal `--oat: #c9beac`, ink `#262019`. Clean, warm, never clinical.
- **Wordmark:** PLANET BASED, Bricolage Grotesque 800, all caps. No italic serifs anywhere.
- **Mono:** Ubuntu Sans Mono for all chrome.
- **Hero wall: wall6.jpg, LOCKED (7-19).** Her call, confirmed: "looks the most real" beats prettier-but-AI -- the unseen-bird mechanic requires believing a bird could be in there. Grade lives in the SHADER now (brightness .955, saturate 1.02; the CSS filter on the img is the no-WebGL fallback). Other walls kept on disk. Upscale verdict (tested both ways): the Pixelmator 2x upscale WON over the raw MJ export for wall6 (raw was blurry) -- judge per-image, no blanket rule. Master is 8832px wide; code resamples to <=3200 before GPU upload (past texture limits otherwise).
- **No enter button, no fake doors.** "Coming soon" is stated in the brand sub-line, nothing pretends to navigate. When the parallax gallery exists, entering gets designed for real.

## The unseen bird -- SHIPPED 7-19 (v1)

- **Cast (5, all Aotearoa NZ, real xeno-canto recordings in `sounds/` + vault):** tūī, korimako/bellbird, pīwakawaka/fantail (Ken George, Whakatāne), riroriro/grey warbler (craig wilson, CC BY 4.0), kōkako (Meena Haribal, Tiritiri Matangi).
- ⚡ **License flag:** riroriro is CC BY (commercial-safe). The other four are CC BY-NC-SA -- fine while the site is a coming-soon page, MUST revisit before the studio takes paid client work (swap recordings or ask recordists).
- **Mechanic:** "✺ TURN THE SOUND ON" arms audio (browser-gesture rule). Hover a zone: the song plays (highpass 80Hz, gain fades in/out), displacement wavefronts ripple outward from the hiding spot driven by the recording's live amplitude history (week-29 Creative Tech technique: animation data the shader reads), and a waveform thread rises from the foliage as the only portrait. Chip = species + recordist + place + xeno-canto link. Footer "sound credits" panel renders the full contract.
- **Zone placer:** open `?place` -- drag rings, `[` `]` resize, `C` copies JSON (also auto-saves to localStorage so her placements override the defaults). Get her JSON and hardcode it into CAST when she's happy.
- **Run it:** `./serve.sh` → localhost:4321. file:// works only as fallback (Chrome blocks WebGL textures + analyser data from file://; audio still plays).
- **Before deploy:** trim/compress sounds (~14MB now), serve WebP+JPEG wall, add favicon, reduced-motion already respected.
- **"The unseen bird" (hero mechanic, NOT built yet):** hover zones = real xeno-canto bird recordings (credits required) + audio-amplitude foliage tremble + live waveform thread as the only "portrait." NO depicted birds, ever -- her call: AI birds would misrepresent real species next to their real songs, and in real life you hear birds you never see.
- **Enter button** → future full-page Parallax Infinity Scroll gallery (4 cols x 3 rows, per-column height loop + speed, staggered starts; spec in memory `project_planetbased_studio_site.md`). Until then: coming-soon behavior.
- About + Contact stay tucked (footer links), never a nav bar.

## Next

1. Zone-placer dev mode: click the wall to drop sound zones, assign birds, save coords.
2. Pull real recordings for her cast (bioacoustics skill; Tūī included).
3. Tremble shader + waveform thread + species/recordist chip.
4. Image optimization at deploy time (masters are ~15MB; serve WebP + JPEG + blur placeholder).
5. git init + GitHub Pages + planetbased.io DNS at Porkbun (same flow as ivygrzy.com).

## Rules carried from the global CLAUDE.md

Ornamental symbols not emojis (✺ ❀ ✷ ❋ ❁ ✿ ❖ ◆), no em dashes in copy, no banned public-copy phrases, radius via `--radius`, cache-bust `?v=N` once deployed.
