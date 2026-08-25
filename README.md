# VRAM LAB

An interactive playground for how PlayStation 1 era games stored graphics: 1 MB of
VRAM, indexed colour, CLUTs, texture atlases, tilemaps and glyph fonts. Twelve
sections, each a short explanation followed by something you can manipulate.

Everything is drawn from generated pixel data. No game assets, no network calls,
no backend.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # og image -> tsc -b -> vite build -> per-route SEO
npm run preview
npm run typecheck
npm run lint       # oxlint --max-warnings 0
npm run og         # regenerate public/og.png + apple-touch-icon.png
npm run deploy:prod
```

## Guided walkthrough

Every page has a docked guide in the corner. It serves that section's steps one
at a time — what to click, and what changes when you do — and draws an amber ring
around the control the current step is talking about, scrolling it into view.

- `Next step` / `Back` move through the walkthrough; `Restart` returns to step 1.
- `Try this` holds the open-ended experiments and the colour legend.
- `−` minimises it to a pill; `Show guide` in the section header brings it back.
- Each section starts at step 1 on arrival. Only the minimised/expanded state
  persists (in `localStorage`), so it stays out of the way once you dismiss it.

## Sections

| #   | Route                 | What you can do                                                                 |
| --- | --------------------- | ------------------------------------------------------------------------------- |
| 01  | `/hardware`           | Fill a 1024x512 VRAM map with framebuffers, textures and CLUTs, and overflow it |
| 02  | `/bits-per-pixel`     | Click a pixel at 16/8/4 bpp and see the bits it stores                          |
| 03  | `/texture-calculator` | Width x height x depth, with the arithmetic written out                         |
| 04  | `/clut`               | Paint with indexes, then change the palette underneath                          |
| 05  | `/palette-swap`       | One texture, four CLUTs, live-editable                                          |
| 06  | `/atlas`              | Pick UV regions from a sprite sheet and build a scene from them                 |
| 07  | `/tilemap`            | Paint a level, then scale it up and compare storage approaches                  |
| 08  | `/glyphs`             | Type text and step the renderer through char ID to pixels                       |
| 09  | `/text-vs-images`     | Add strings and watch the two approaches diverge                                |
| 10  | `/hex`                | Binary to packed bytes to hex, for a texture and a string                       |
| 11  | `/challenge`          | Fit a racing game into 1 MB with applyable suggestions                          |
| 12  | `/naive-vs-optimized` | Same scene, both budgets, side by side                                          |

## SEO and social previews

`src/data/seo.ts` holds the site URL, the default copy and one title/description
per route. Everything else reads from it:

- `index.html` carries the home page's tags: description, canonical, OG, Twitter
  card, JSON-LD.
- `src/lib/head.ts` re-points title, description, canonical and OG on client-side
  navigation.
- `scripts/postbuild-seo.mjs` writes a real `dist/<route>/index.html` for all 12
  sections, each with its own head, plus `sitemap.xml` and `404.html`. Scrapers
  do not run JS, so sharing `/clut` has to unfurl as the CLUT page without it.
- `scripts/generate-og.mjs` draws `public/og.png` (1200x630) with the app's own
  5x7 glyph font and VRAM packer, through a small PNG writer in
  `scripts/lib/png.mjs`. No image dependency, no headless browser.

Changing the domain means editing `SITE.url` in `src/data/seo.ts`, the absolute
URLs in `index.html`, `public/robots.txt`, and the footer line in
`scripts/generate-og.mjs`.

## Deploying

```bash
npm run deploy:prod   # build, then wrangler pages deploy dist/ --project-name=vram-lab
```

Cloudflare Pages serves the prerendered folder for each route and falls back to
`404.html` (the app, which routes unknown paths home) for anything else.

## Structure

```text
src/
  app/router.tsx          route table
  components/             atoms · molecules · organisms · templates
  playgrounds/<Name>/     one folder per section (view + logic hook)
  utils/                  memory.ts color.ts encoding.ts pixel.ts serialize.ts vram.ts
  data/                   ps1.ts sections.ts seo.ts glossary.ts sprites.ts tiles.ts font.ts atlas.ts samples.ts
scripts/                  og image generator, post-build SEO, node alias hook
```

All byte maths lives in `src/utils`. Playground components read those functions and
render; they never compute sizes inline. See [docs/architecture.md](docs/architecture.md).

## Accuracy

The playgrounds teach a mental model. Where that model is a simplification, the
section carries a **Deep dive** panel with what real hardware does instead —
texture pages, CLUT alignment, BGR555, nibble order, manual VRAM placement.

Two things worth knowing up front:

- PS1 4bpp data puts the **leftmost** pixel in the **low** nibble. The hex
  inspector has a toggle for this; whiteboard order is the intuitive one and the
  wrong one.
- A PS1 16-bit pixel is BGR555 — 15 bits of colour plus a semi-transparency bit,
  not 16 bits of colour.

## Stack

Vite 8, React 19, TypeScript (strict), Tailwind v4 (CSS-first `@theme`, no config
file), React Router v7. No data-fetching layer: the app has no backend, so the
starter's `api/` conventions do not apply here.
