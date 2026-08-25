/** Definitions surfaced by the <Term> tooltip. Keys are lowercase slugs. */
export interface GlossaryEntry {
  term: string;
  short: string;
  detail?: string;
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  bpp: {
    term: 'BPP',
    short: 'Bits per pixel: how many bits of storage one pixel costs.',
    detail:
      '16bpp = 2 bytes per pixel. 4bpp = half a byte, so two pixels share one byte.',
  },
  vram: {
    term: 'VRAM',
    short: 'Video RAM. The PS1 has 1 MB of it, shared by everything the GPU touches.',
    detail:
      'Framebuffers, textures and CLUTs all live in the same 1024 x 512 x 16-bit grid.',
  },
  clut: {
    term: 'CLUT',
    short: 'Colour Look-Up Table - the palette an indexed texture points into.',
    detail:
      'On PS1 a CLUT is a run of 16 or 256 16-bit words sitting inside VRAM like any other data.',
  },
  glyph: {
    term: 'glyph',
    short: 'The drawn shape of one character. A font is a bag of glyphs.',
  },
  atlas: {
    term: 'atlas',
    short: 'One big texture holding many small images side by side.',
    detail:
      'Draws sample a sub-rectangle of it, so hundreds of sprites cost one texture binding.',
  },
  tilemap: {
    term: 'tilemap',
    short: 'A grid of numbers where each number names a tile in a tileset.',
  },
  'indexed-color': {
    term: 'indexed colour',
    short: 'The pixel stores a palette index, not a colour.',
    detail: 'Rendering resolves it: pixel -> index -> CLUT -> colour.',
  },
  'direct-color': {
    term: 'direct colour',
    short: 'The pixel stores the colour itself, no lookup needed.',
  },
  uv: {
    term: 'UV',
    short: 'Texture coordinates: which part of a texture a triangle samples.',
    detail:
      'The PS1 GPU uses 8-bit U and V offsets inside a 256 x 256 texture page, not normalised 0-1 floats.',
  },
  framebuffer: {
    term: 'framebuffer',
    short: 'The rectangle of VRAM the video hardware scans out to the TV.',
    detail: 'Usually two of them, so you draw into one while the other is displayed.',
  },
  'texture-page': {
    term: 'texture page',
    short: 'The 256 x 256 texel window a PS1 draw command can sample from.',
    detail: 'Its width in VRAM shrinks with bit depth: 64, 128 or 256 words across.',
  },
  bgr555: {
    term: 'BGR555',
    short: 'The PS1 16-bit colour word: 5 bits blue, green, red, plus one STP bit.',
    detail: 'Only 15 bits are colour, giving 32768 shades - hence the visible banding.',
  },
  stp: {
    term: 'STP',
    short: 'Semi-transparency bit, the top bit of a 16-bit PS1 colour word.',
    detail:
      'It flags a pixel for blending; a CLUT entry of 0x0000 instead means fully transparent.',
  },
  nibble: {
    term: 'nibble',
    short: 'Half a byte: 4 bits, exactly one 4bpp pixel.',
  },
  'palette-swap': {
    term: 'palette swap',
    short: 'Reusing identical pixel data with a different CLUT to get a new look.',
  },
  overdraw: {
    term: 'overdraw',
    short: 'Drawing the same screen pixel more than once in a frame.',
  },
};
