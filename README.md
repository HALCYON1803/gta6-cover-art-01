# Neon Coast Cover Studio — Make GTA 6 Cover Art

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/HALCYON1803/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/HALCYON1803/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Turn any photo and a caption into GTA 6-style cover art, offline in your browser. No upload, no account, no watermark — your photos never leave your machine.

## What it does

- **6 poster layouts** — Hero Split, Four Panel, Comic Strip, Tilted Snaps, Full Bleed and a 3×3 Nine Panel mosaic with the title block in the middle. The Four Panel grid is full-bleed: the title is lettered over the art on a dark scrim, never in an empty band.
- **Any photo** — upload up to 4 photos, drag-and-drop anywhere, or use the 4 shipped samples (Boulevard, Pier, Neon, Marina). Click a panel to select it, drag to pan the photo inside it, scroll to zoom, or use the crop sliders. One photo can fill every panel, each panel can hold a different photo, or one tap on "Deal 4 different photos" fills every panel with a different photo — no panel ever repeats a face unless you ask it to.
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
- `app/src/cover.js` — the cover renderer (`drawCover`): sky, sun, panels, palms, halftone, gradient lettering, grain and vignette. The same function paints the live preview and the exported PNG, so what you see is what you share.
- `app/src/presets.js` — layouts, grades, one-click looks and export sizes. Every look deals a different photo to every panel.
- `app/src/main.js` — editor wiring, undo/redo, drag-to-pan, exact-size export, four sample photos.
- `app/src/shots.js` — fixed screenshot scenes (`?shot=cover` / `?shot=editor`).
- `app/fonts/` — Anton and Pacifico under the SIL Open Font License, bundled locally so the app works with no network.
- `app/samples/` — model-made sample photos shipped with the app: Boulevard, Pier, Neon and Marina, free to use.
- `main.ts` — the make.fun hand-in program; `vendor/makefun-app.ts` is the kit's library, unchanged.

## Originality

All art, lettering and code in this app are original. No Rockstar Games logos, official artwork, characters or fonts are used. The sample photos are model-made images shipped with the competition kit.

## License

MIT — see [LICENSE](LICENSE).
