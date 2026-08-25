/** The guided order of the playground. Nav, routing and prev/next all read this. */
export interface SectionMeta {
  id: string;
  path: string;
  no: string;
  title: string;
  nav: string;
  lede: string;
  /** One-line takeaway shown on the home page. */
  takeaway: string;
}

export const SECTIONS: SectionMeta[] = [
  {
    id: 'hardware',
    path: '/hardware',
    no: '01',
    title: 'The machine and its 1 MB of VRAM',
    nav: 'Hardware & VRAM',
    lede: 'What the PlayStation actually had to work with, and why "1 MB of VRAM" never meant "1 MB for textures".',
    takeaway: 'Framebuffers eat the budget before a single texture is uploaded.',
  },
  {
    id: 'bits-per-pixel',
    path: '/bits-per-pixel',
    no: '02',
    title: 'Bits per pixel',
    nav: 'Bits per pixel',
    lede: 'Click a pixel and see what is really stored in it: a colour, or a number that points at one.',
    takeaway: 'Two 4-bit pixels share a single byte.',
  },
  {
    id: 'texture-calculator',
    path: '/texture-calculator',
    no: '03',
    title: 'Texture memory calculator',
    nav: 'Memory calculator',
    lede: 'Width times height times bit depth. The whole of texture budgeting is this one line of arithmetic.',
    takeaway: '256x256 costs 128 KiB at 16bpp and 32 KiB at 4bpp.',
  },
  {
    id: 'clut',
    path: '/clut',
    no: '04',
    title: 'CLUT playground',
    nav: 'CLUT / palette',
    lede: 'Paint with indexes, not colours. Then change the palette underneath the drawing you just made.',
    takeaway: 'The pixel stores 2. The CLUT decides that 2 means red.',
  },
  {
    id: 'palette-swap',
    path: '/palette-swap',
    no: '05',
    title: 'Palette swapping',
    nav: 'Palette swap',
    lede: 'Identical pixel data, four different CLUTs, four different characters for the price of one texture.',
    takeaway: 'A new colour scheme costs 32 bytes, not another texture.',
  },
  {
    id: 'atlas',
    path: '/atlas',
    no: '06',
    title: 'Texture atlas & sprite sheets',
    nav: 'Texture atlas',
    lede: 'One sheet, many sprites, and a scene that references the same eight images fifty times over.',
    takeaway: 'Instances are free. Unique pixels are what you pay for.',
  },
  {
    id: 'tilemap',
    path: '/tilemap',
    no: '07',
    title: 'Tile-based environments',
    nav: 'Tilemaps',
    lede: 'Paint a level, then look at what the level actually is: a small grid of numbers.',
    takeaway:
      'A level stored as tile indexes is orders of magnitude smaller than a level stored as an image.',
  },
  {
    id: 'glyphs',
    path: '/glyphs',
    no: '08',
    title: 'Font atlas & glyph rendering',
    nav: 'Glyph atlas',
    lede: 'Type a word and watch it turn into character IDs, atlas coordinates and finally pixels.',
    takeaway: 'Text is data plus a lookup, exactly like an indexed texture.',
  },
  {
    id: 'text-vs-images',
    path: '/text-vs-images',
    no: '09',
    title: 'Why not store text as images?',
    nav: 'Text vs images',
    lede: 'Add menu strings and watch the two approaches diverge.',
    takeaway: 'Pre-rendered strings scale with your script. Glyphs do not.',
  },
  {
    id: 'hex',
    path: '/hex',
    no: '10',
    title: 'Raw memory inspector',
    nav: 'Hex inspector',
    lede: 'Binary to packed bytes to hexadecimal, for both a texture and a string.',
    takeaway: 'This is what you would be staring at inside a real game file.',
  },
  {
    id: 'challenge',
    path: '/challenge',
    no: '11',
    title: 'The 1 MB VRAM challenge',
    nav: 'VRAM challenge',
    lede: 'Ship a racing game. You have one megabyte. Choose your depths.',
    takeaway: 'Every optimisation in this app, applied under pressure.',
  },
  {
    id: 'naive-vs-optimized',
    path: '/naive-vs-optimized',
    no: '12',
    title: 'Naive vs optimised',
    nav: 'Naive vs optimised',
    lede: 'The same scene, built twice. Same picture, wildly different budgets.',
    takeaway: 'Optimising is not making it worse. It is storing it better.',
  },
];

export const sectionByPath = (path: string) => SECTIONS.find((s) => s.path === path);
export const sectionIndex = (path: string) => SECTIONS.findIndex((s) => s.path === path);
