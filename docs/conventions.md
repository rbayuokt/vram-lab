# Conventions

## Naming

- Components: `PascalCase.tsx`, one component per file.
- Logic hooks: `useXxx.ts` next to the component that uses them.
- Pure helpers: lowercase verbs (`textureBytes`, `packNibbles`, `serializeClut`).

## Playground shape

```tsx
const meta = SECTIONS[n];

export function XxxPlayground() {
  // state, or a useXxx() hook when there is enough of it
  return <SectionShell meta={meta}> ... </SectionShell>;
}
```

Each section ends with a `<DeepDive>` naming what the simplification hides. That is
not decoration: the brief for this app is to teach a model without teaching
something false.

## Styling

Tailwind v4, tokens defined in `src/styles/index.css` under `@theme`. No
`tailwind.config.js`.

| Token                         | Use                                |
| ----------------------------- | ---------------------------------- |
| `void` `deck` `panel` `raise` | surfaces, darkest to lightest      |
| `line` `hair`                 | borders; `hair` is the quieter one |
| `ink` `dim` `faint`           | text, brightest to quietest        |
| `mint`                        | the optimised / correct path       |
| `rose`                        | the naive / over-budget path       |
| `amber`                       | indexes and palettes               |
| `azure` `lime` `violet`       | framebuffers, savings, deep dives  |

`.hud-label` for the small uppercase captions, `.tabnum` for anything numeric that
changes while you look at it.

## Numbers

- KiB/MiB, never KB/MB, except when quoting the marketing figure ("1 MB of VRAM").
- `group()` for long digit strings — `1,048,576` is more convincing than `1048576`.
- Percentages get one decimal.

## Copy

British spelling ("colour"), sentence case in prose, uppercase only in HUD labels.
Terms with a glossary entry get wrapped in `<Term k="clut">` on first meaningful use
in a section, not every time.

## Guide targets

`data-guide` values are page-scoped, not global — only one section is mounted at a
time, so `depth` can mean different controls on different pages. Keep them short
and descriptive of the control, not of the step.

Every step with a `target` must resolve. The check is a walkthrough pass over all
sections asserting that a ring is drawn wherever the panel claims one.

## Checks

`npm run typecheck` and `npm run lint` must both be clean before anything is done.
