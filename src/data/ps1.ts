import { MIB } from '@/utils/memory';

/**
 * Sony PlayStation (SCPH-1000 family, 1994) hardware facts used across the app.
 * Figures are the commonly cited ones; where a number is a simplification the
 * relevant playground says so in its Deep Dive.
 */
export const PS1 = {
  cpuName: 'MIPS R3000A',
  cpuHz: 33_868_800, // 33.8688 MHz, derived from the 44.1 kHz audio clock
  cpuMhz: 33.8688,
  mainRamBytes: 2 * MIB,
  vramBytes: 1 * MIB,
  soundRamBytes: 512 * 1024,
  cdBufferBytes: 32 * 1024,
  /** VRAM is addressed as a 2D framebuffer, not a flat heap. */
  vram: { width: 1024, height: 512, bitsPerWord: 16 },
  /** A texture page is always 256x256 *texels*, whatever the bit depth. */
  texturePage: { texels: 256, pagesAcross: 16, pagesDown: 2 },
  colorFormat: 'BGR555 + STP bit (15 bits of color)',
  maxCommonResolution: { w: 640, h: 480 },
  typicalResolution: { w: 320, h: 240 },
} as const;

export interface DisplayMode {
  id: string;
  w: number;
  h: number;
  note: string;
}

export const DISPLAY_MODES: DisplayMode[] = [
  { id: '256x240', w: 256, h: 240, note: 'Cheapest common mode' },
  { id: '320x240', w: 320, h: 240, note: 'The workhorse NTSC mode' },
  { id: '512x240', w: 512, h: 240, note: 'Used for crisper 2D / text' },
  { id: '640x480', w: 640, h: 480, note: 'Interlaced, very hungry' },
];

export interface HardwareStat {
  label: string;
  value: string;
  sub: string;
  accent: 'mint' | 'amber' | 'azure' | 'rose';
}

export const HARDWARE_STATS: HardwareStat[] = [
  {
    label: 'CPU',
    value: '33.87 MHz',
    sub: 'MIPS R3000A, 32-bit, no FPU',
    accent: 'azure',
  },
  {
    label: 'Main RAM',
    value: '2 MB',
    sub: 'Code, game state, audio commands',
    accent: 'amber',
  },
  {
    label: 'VRAM',
    value: '1 MB',
    sub: '1024 x 512 x 16-bit, shared by everything drawn',
    accent: 'mint',
  },
  {
    label: 'Sound RAM',
    value: '512 KB',
    sub: 'ADPCM samples + reverb workspace',
    accent: 'rose',
  },
];

/** Byte budgets a modern phone photo blows past without noticing. */
export const SCALE_COMPARISONS = [
  { label: 'One 4K phone photo (JPEG)', bytes: 4 * MIB },
  { label: 'Entire PS1 VRAM', bytes: 1 * MIB },
  { label: 'Entire PS1 main RAM', bytes: 2 * MIB },
  { label: 'One 1024x1024 RGBA texture, uncompressed', bytes: 1024 * 1024 * 4 },
];
