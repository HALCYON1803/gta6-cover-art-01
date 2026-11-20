# Neon Coast Cover Studio v4 — Make GTA 6 Cover Art

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/HALCYON1803/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/HALCYON1803/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Turn your own photos into GTA 6-style cover art, offline in your browser. Cast role tags, panel swap, callouts, a billing block and seal, 7 layouts, 6 sunset grades, exact 3-size PNG export. No upload, no account, no watermark — your photos never leave your machine.

## What it does

- **7 poster layouts** — Hero Split, Four Panel, Comic Strip, Tilted Snaps, Full Bleed, a 3×3 Nine Panel mosaic with the title block in the middle, and Triptych (three tall portraits). The Four Panel grid is full-bleed: the title is lettered over the art on a dark scrim, never in an empty band.
- **Your photos, one step onto the cover** — upload up to 4 photos, drag-and-drop a file straight onto a panel in the preview (it lands on that panel), use the "Upload a photo to this panel" button, or use the 4 shipped samples (Boulevard, Pier, Neon, Marina). Click a panel to select it, drag to pan the photo inside it, scroll to zoom, or use the crop sliders. One photo can fill every panel, each panel can hold a different photo, or one tap on "Deal 4 different photos" fills every panel with a different photo — no panel ever repeats a face unless you ask it to.
- **Panel swap** — arm "Swap panels" and click a second panel to trade their photos and crops, or pick the target from the "Swap with" menu.
- **Cast tags** — name the people on your cover: each tag shows a name and a role (Getaway Driver, Muscle, Hacker, Fixer, Lookout, Inside Woman, or your own) pinned to its panel. Click a tag on the preview and drag it to a new spot; edit the name, role or panel in the list.
- **Callouts** — labels with a leader dot pointing at anything on the cover ("VICE CITY • 2026"). Drag a callout on the preview to move it.
- **Billing block and seal** — a movie-poster credits line along the bottom edge and a round "EST. 2026" seal stamp, both toggleable, with editable billing text.
- **Retro-chrome titles** — alongside the classic gradient title, a striped retro-chrome style: silver-and-gold lettering with printed horizontal stripes, drawn through an offscreen canvas so the stripes only touch the letters.
- **6 colour grades** — Vice Sunset, Neon Night, Palm Gold, Teal Noir, Hot Pink and Midnight Noir, each with its own sky, sun, photo tint and title gradient.
- **6 one-click looks** — Sunset Heist, Neon Nights, Palm Gold, Night Shift, Hot Pink and Midnight Noir — plus a random-look dice.
- **Real poster lettering** — gradient Anton titles with ink outlines, neon Pacifico script subtitles, tagline, starburst badge and a 5-star heat meter.
- **Poster effects** — film grain, vignette, halftone sky, sun rays, palm silhouettes and a comic frame, all toggleable. The halftone is painted on the sky before the panels, so its dots never land on a face.
- **Exact PNG export** — 1080 × 1080, 1080 × 1350 and 1920 × 1080, one at a time or all three in one click. Undo/redo throughout.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

Pick a photo, pick a look, export. Three steps to a cover.

## How it is built

- `app/index.html` + `app/style.css` — the editor.
- `app/src/cover.js` — the cover renderer (`drawCover`): sky, sun, panels, palms, halftone, gradient or retro-chrome lettering, cast tags, callouts, billing block and seal, grain and vignette. The same function paints the live preview and the exported PNG, so what you see is what you share. `castTagLayout` / `calloutLayout` measure the exact rectangles the editor hit-tests for dragging.
- `app/src/presets.js` — layouts (now 7, with Triptych), grades, one-click looks and export sizes. Every look deals a different photo to every panel and ships with its own cast, callout, billing block and seal.
- `app/src/main.js` — editor wiring, undo/redo, drag-to-pan, panel swap, cast-tag and callout editing with drag-to-move, upload straight to the selected panel, drop-on-a-panel, exact-size export, four sample photos.
- `app/src/shots.js` — fixed screenshot scenes (`?shot=cover` / `?shot=editor`).
- `app/fonts/` — Anton and Pacifico under the SIL Open Font License, bundled locally so the app works with no network.
- `app/samples/` — model-made sample photos shipped with the app: Boulevard, Pier, Neon and Marina, free to use.
- `main.ts` — the make.fun hand-in program; `vendor/makefun-app.ts` is the kit's library, unchanged.

## Originality

All art, lettering and code in this app are original. No Rockstar Games logos, official artwork, characters or fonts are used. The sample photos are model-made images shipped with the competition kit.

## License

MIT — see [LICENSE](LICENSE).
