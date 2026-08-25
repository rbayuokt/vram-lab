import { clutBytes, textureBytes, type ColorDepth } from '@/utils/memory';

/**
 * The budgeting model behind the challenge. Kept pure so the suggestion engine
 * can just re-run it against hypothetical configs and diff the totals.
 */

export interface AssetSize {
  label: string;
  w: number;
  h: number;
}

export interface AssetDef {
  id: string;
  name: string;
  color: string;
  /** How many visually distinct versions the game needs. */
  variants: number;
  /** Whether those variants can be palette swaps of one texture. */
  canReuse: boolean;
  sizes: AssetSize[];
  note: string;
}

export interface AssetConfig {
  sizeIndex: number;
  depth: ColorDepth;
  reuse: boolean;
  sharedClut: boolean;
}

export type ConfigMap = Record<string, AssetConfig>;

export const ASSETS: AssetDef[] = [
  {
    id: 'background',
    name: 'Background / sky',
    color: '#62a8ff',
    variants: 1,
    canReuse: false,
    sizes: [
      { label: '128x128', w: 128, h: 128 },
      { label: '256x128', w: 256, h: 128 },
      { label: '256x256', w: 256, h: 256 },
    ],
    note: 'Big, smooth gradients - the one place 16bpp actually earns its cost.',
  },
  {
    id: 'track',
    name: 'Track textures',
    color: '#4de3bd',
    variants: 3,
    canReuse: false,
    sizes: [
      { label: '128x128', w: 128, h: 128 },
      { label: '256x256', w: 256, h: 256 },
      { label: '256x512', w: 256, h: 512 },
    ],
    note: 'Tarmac, kerbs and grass. Tiled across the whole circuit.',
  },
  {
    id: 'cars',
    name: 'Cars',
    color: '#ffb454',
    variants: 6,
    canReuse: true,
    sizes: [
      { label: '64x64', w: 64, h: 64 },
      { label: '128x128', w: 128, h: 128 },
      { label: '256x128', w: 256, h: 128 },
    ],
    note: 'Six liveries. Palette swapping makes five of them nearly free.',
  },
  {
    id: 'characters',
    name: 'Characters',
    color: '#b48dff',
    variants: 4,
    canReuse: true,
    sizes: [
      { label: '48x64', w: 48, h: 64 },
      { label: '64x96', w: 64, h: 96 },
      { label: '128x128', w: 128, h: 128 },
    ],
    note: 'Driver portraits. Same silhouette, different colours.',
  },
  {
    id: 'ui',
    name: 'UI atlas',
    color: '#9ae66e',
    variants: 1,
    canReuse: false,
    sizes: [
      { label: '128x64', w: 128, h: 64 },
      { label: '128x128', w: 128, h: 128 },
      { label: '256x128', w: 256, h: 128 },
    ],
    note: 'Icons, bars, frames. Flat colours - ideal 4bpp material.',
  },
  {
    id: 'font',
    name: 'Font atlas',
    color: '#ff6b8b',
    variants: 1,
    canReuse: false,
    sizes: [
      { label: '64x48', w: 64, h: 48 },
      { label: '128x96', w: 128, h: 96 },
      { label: '256x128', w: 256, h: 128 },
    ],
    note: 'Two colours plus transparency. 4bpp is already wasteful here.',
  },
  {
    id: 'effects',
    name: 'Effects',
    color: '#4dd0e1',
    variants: 2,
    canReuse: true,
    sizes: [
      { label: '64x64', w: 64, h: 64 },
      { label: '128x128', w: 128, h: 128 },
      { label: '256x256', w: 256, h: 256 },
    ],
    note: 'Smoke, sparks, skid marks. Semi-transparent and short-lived.',
  },
];

export const DEFAULT_CONFIG: ConfigMap = Object.fromEntries(
  ASSETS.map((a) => [
    a.id,
    { sizeIndex: 1, depth: 16 as ColorDepth, reuse: false, sharedClut: false },
  ]),
);

export function assetBytes(def: AssetDef, cfg: AssetConfig): number {
  const size = def.sizes[cfg.sizeIndex];
  const textures = cfg.reuse && def.canReuse ? 1 : def.variants;
  const cluts = cfg.sharedClut ? 1 : def.variants;
  return (
    textureBytes(size.w, size.h, cfg.depth) * textures +
    clutBytes(cfg.depth) * (cfg.depth === 16 ? 0 : cluts)
  );
}

/** A crude fidelity score, so shrinking everything to nothing is not a "win". */
export function assetFidelity(def: AssetDef, cfg: AssetConfig): number {
  const depthScore = cfg.depth === 16 ? 3 : cfg.depth === 8 ? 2 : 1;
  const sizeScore = cfg.sizeIndex + 1;
  const reusePenalty = cfg.reuse && def.canReuse ? -0.5 : 0;
  return depthScore + sizeScore + reusePenalty;
}

export const MAX_FIDELITY = ASSETS.reduce(
  (n, a) =>
    n + assetFidelity(a, { sizeIndex: 2, depth: 16, reuse: false, sharedClut: false }),
  0,
);

export interface Suggestion {
  assetId: string;
  label: string;
  saving: number;
  apply: (cfg: AssetConfig) => AssetConfig;
}

/** Concrete, applicable optimisations ranked by how many bytes they return. */
export function suggestionsFor(def: AssetDef, cfg: AssetConfig): Suggestion[] {
  const current = assetBytes(def, cfg);
  const candidates: Array<{ label: string; next: AssetConfig }> = [];

  if (cfg.depth === 16) {
    candidates.push({ label: 'Convert to 8-bit indexed', next: { ...cfg, depth: 8 } });
    candidates.push({ label: 'Convert to 4-bit indexed', next: { ...cfg, depth: 4 } });
  } else if (cfg.depth === 8) {
    candidates.push({ label: 'Convert to 4-bit indexed', next: { ...cfg, depth: 4 } });
  }
  if (def.canReuse && !cfg.reuse) {
    candidates.push({
      label: `Reuse one texture for all ${def.variants} variants (palette swap)`,
      next: { ...cfg, reuse: true },
    });
  }
  if (cfg.sizeIndex > 0) {
    candidates.push({
      label: `Reduce to ${def.sizes[cfg.sizeIndex - 1].label}`,
      next: { ...cfg, sizeIndex: cfg.sizeIndex - 1 },
    });
  }
  if (!cfg.sharedClut && cfg.depth !== 16 && def.variants > 1) {
    candidates.push({
      label: 'Share one palette across variants',
      next: { ...cfg, sharedClut: true },
    });
  }

  return candidates
    .map((c) => ({
      assetId: def.id,
      label: c.label,
      saving: current - assetBytes(def, c.next),
      apply: () => c.next,
    }))
    .filter((s) => s.saving > 0);
}
