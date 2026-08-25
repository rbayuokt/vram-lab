import {
  makeClutItem,
  makeFramebufferItem,
  makeTextureItem,
  type VramItem,
} from '@/utils/vram';

/** A believable mid-90s racing game layout. Feeds the "show me" button and the OG card. */
export function typicalRacingLayout(): VramItem[] {
  return [
    makeFramebufferItem('fb-0', 320, 240, 'Framebuffer A 320x240'),
    makeFramebufferItem('fb-1', 320, 240, 'Framebuffer B 320x240'),
    makeTextureItem('it-1', 256, 256, 8, 'Track surfaces 8bpp'),
    makeTextureItem('it-2', 256, 256, 4, 'Roadside props 4bpp'),
    makeTextureItem('it-3', 128, 128, 4, 'Car A 4bpp'),
    makeTextureItem('it-4', 128, 128, 4, 'Car B 4bpp'),
    makeTextureItem('it-5', 128, 64, 4, 'HUD atlas 4bpp'),
    makeTextureItem('it-6', 128, 48, 4, 'Font atlas 4bpp'),
    makeClutItem('it-7', 8, 'Track CLUT 256'),
    makeClutItem('it-8', 4, 'Car CLUT A'),
    makeClutItem('it-9', 4, 'Car CLUT B'),
    makeClutItem('it-10', 4, 'Font CLUT'),
  ];
}

/** Highest `it-N` id above, so the hook's counter keeps handing out fresh ones. */
export const TYPICAL_LAYOUT_IDS = 10;
