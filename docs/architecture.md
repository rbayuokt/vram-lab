# Architecture

## The rule

Calculations are pure functions in `src/utils`. Components import them and render
the result. Nothing computes a byte count inside JSX.

This exists so the numbers can be checked on their own, and so two sections that
quote the same figure cannot drift apart.

## Layers

```text
data/      constants and generated assets (no React)
utils/     pure maths and encoding (no React, no DOM beyond a canvas context)
components/ atoms → molecules → organisms → templates
playgrounds/ one folder per section: XxxPlayground.tsx + useXxx.ts when logic is non-trivial
app/       router
```

Imports only go downward. `data/` never imports `components/`; `components/atoms`
never imports a molecule.

## utils

| File           | Owns                                                                     |
| -------------- | ------------------------------------------------------------------------ |
| `memory.ts`    | `textureBytes`, `clutBytes`, `framebufferBytes`, formatting, percentages |
| `color.ts`     | hex ↔ RGB, BGR555 packing, 5-bit snapping, contrast ink                  |
| `encoding.ts`  | binary/hex strings, nibble packing, the character table                  |
| `pixel.ts`     | `IndexedImage`, blitting, canvas drawing, deterministic noise            |
| `serialize.ts` | an indexed image → the bytes a file would hold                           |
| `vram.ts`      | VRAM rectangles and the shelf packer                                     |

`ColorDepth` is `4 | 8 | 16` and is the only depth type in the app.

## IndexedImage

Every picture is `{ width, height, data: Uint8Array }` — one palette index per
pixel. No colour is attached until draw time, when a `Palette` (16 or 256 hex
strings, with `'transparent'` allowed) is supplied.

That split is the subject of the app, so it is also how the code works: palette
swapping is passing a different array to the same image, and the sprite/tile/glyph
data files contain no colours at all.

## Assets

- `data/sprites.ts` — hand-authored 16x16 art as rows of hex digits, plus per-sprite palettes.
- `data/tiles.ts` — 16x16 tiles from `(x, y) => index` generators sharing one 16-entry palette.
- `data/font.ts` — a 5x7 bitmap font in 8x8 cells, baked into a 64x48 atlas.
- `data/atlas.ts` — eight tile cells packed into one 64x32 sheet with UV coordinates.

Generated or hand-authored in-repo, so nothing here is a borrowed game asset.

## Sections

`data/sections.ts` is the single source for order, routes, numbering, nav labels
and prev/next. Adding a section means adding an entry there, a folder under
`playgrounds/`, and a route in `app/router.tsx`.

## The guide

`data/tutorials.ts` holds one `Tutorial` per section: a goal, ordered steps, and
experiments. Each step may name a `target`, which is the `data-guide` attribute of
the control it refers to.

- `GuideProvider` (in `app/providers`) owns only the open/minimised state, persisted
  through `lib/persisted.ts`.
- Step position lives in `GuideDock` and resets whenever the section changes.
  Persisting it meant re-entering a finished section landed on "step 5 of 5",
  which reads as a bug rather than as a convenience.
- `GuideDock` reads the route, serves the matching tutorial, and renders the panel.
- `GuideSpotlight` resolves `[data-guide="..."]`, scrolls it into view and tracks
  its rect on an animation frame so the ring follows scrolling and reflow.

Playgrounds stay unaware of the guide beyond carrying the attribute. `Panel`,
`Stat`, `Segmented`, `PaletteStrip`, `CanvasScroller` and `VramMapCanvas` take a
`dataGuide` prop for this; anything else gets a plain `data-guide` on the element.

Adding a step means adding it to `tutorials.ts` and tagging its control. A step
whose target does not resolve simply draws no ring, so a stale id degrades quietly
rather than breaking the page.

## Canvas rendering

`PixelCanvas` is the only place indexed pixels reach a canvas. It takes an image, a
palette, an integer scale, and optional grid/highlight/cursor overlays, and reports
pointer position in image-pixel coordinates. Scenes that need two palettes at once
(the naive-vs-optimised scene) stack several `PixelCanvas` layers, which is also
what the GPU does with separate draw commands.
