/**
 * Per-section usage guidance: what to click, and what to look at once you have.
 *
 * Kept separate from `sections.ts` because that file drives routing and nav,
 * and this one is pure copy. Keyed by section id.
 */

export interface TutorialStep {
  /** The thing to do. Imperative, names a real control. */
  action: string;
  /** What changes when you do it. */
  notice: string;
  /**
   * `data-guide` value of the control this step is about. The guide draws a
   * ring around it and scrolls it into view. Omit for steps with no single
   * target.
   */
  target?: string;
}

export interface Tutorial {
  /** One line: what you will be able to say afterwards. */
  goal: string;
  steps: TutorialStep[];
  /** Open-ended pokes for after the guided path. */
  experiments: string[];
}

export const TUTORIALS: Record<string, Tutorial> = {
  hardware: {
    goal: 'See why "1 MB of VRAM" was never 1 MB of texture budget.',
    steps: [
      {
        action: 'Start with what is already there: two framebuffers.',
        notice:
          'Used VRAM already reads 300 KiB and nothing has been drawn yet. Those two blue rectangles are the picture on the TV and the picture being drawn into.',
        target: 'allocations',
      },
      {
        action: 'Set width 256, height 256, depth 16BPP, then press + TEXTURE.',
        notice:
          'One texture takes 128 KiB and a visibly wide slab of the map. Watch the percentage jump.',
        target: 'add-texture',
      },
      {
        action: 'Switch the depth to 4BPP and press + TEXTURE again.',
        notice:
          'Same pixel dimensions, but the rectangle is a quarter as wide. Bit depth changes how many VRAM words a row of texels needs.',
        target: 'tex-depth',
      },
      {
        action: 'Keep pressing + TEXTURE until the map turns red.',
        notice:
          'VRAM OVERFLOW appears. There is no swap file on a PlayStation - past this line the data simply has nowhere to live.',
        target: 'vram-map',
      },
      {
        action: 'Press LOAD A TYPICAL GAME.',
        notice:
          'A plausible mid-90s racer layout: mostly 4bpp and 8bpp art, a strip of CLUTs, and framebuffers still taking the single largest bite.',
        target: 'load-typical',
      },
    ],
    experiments: [
      'Set the display mode to 640X480 and press SET FRAMEBUFFERS. How much room is left for art?',
      'Click a rectangle on the map, or hover a row in ALLOCATIONS, to see which is which.',
      'Remove both framebuffers. The app lets you - a real console would just show garbage.',
    ],
  },

  'bits-per-pixel': {
    goal: 'Say exactly what a pixel contains in each of the three PS1 formats.',
    steps: [
      {
        action: 'Click any coloured pixel in the 8 x 8 grid.',
        notice:
          'The right panel names that pixel and shows what is stored there. The orange box marks your selection.',
        target: 'sample',
      },
      {
        action: 'Switch to 16-BIT DIRECT.',
        notice:
          'The chain is two boxes long: pixel, colour. No lookup. The 16 bits split into blue, green, red and one STP flag.',
        target: 'depth',
      },
      {
        action: 'Switch to 4-BIT INDEXED.',
        notice:
          'The chain grows to four boxes. The pixel now stores a small number, and the CLUT decides what that number looks like.',
        target: 'depth',
      },
      {
        action: 'Read the TWO PIXELS, ONE BYTE panel underneath.',
        notice:
          'Your pixel and its right-hand neighbour are packed into a single byte, four bits each. This is the trick the whole format rests on.',
        target: 'two-pixels',
      },
      {
        action: 'Scroll to ROW N LAID OUT IN MEMORY and flip between the three depths.',
        notice:
          'The same eight pixels become 16, 8 or 4 byte cards. Nothing about the picture changed - only how it is written down.',
        target: 'row-bytes',
      },
    ],
    experiments: [
      'Click a pixel in the dark checkerboard area. Index 0 is transparent by convention, and it still costs its bits.',
      'Pick two neighbouring pixels and predict the packed hex before you look at it.',
    ],
  },

  'texture-calculator': {
    goal: 'Do texture budgeting in your head.',
    steps: [
      {
        action: 'Press the 256X256 preset and choose 16-BIT.',
        notice:
          'The arithmetic block spells it out: 65,536 pixels, 1,048,576 bits, 131,072 bytes, 128 KiB. That is one eighth of all VRAM for one texture.',
        target: 'presets',
      },
      {
        action: 'Switch to 4-BIT.',
        notice:
          'Same dimensions, 32 KiB. The only thing that changed is the multiplier in line two.',
        target: 'depth',
      },
      {
        action: 'Untick and re-tick INCLUDE THE CLUT IN THE TOTAL.',
        notice:
          'The palette is a separate, fixed cost. It does not grow when the texture does.',
        target: 'clut-toggle',
      },
      {
        action: 'Look at the SAME TEXTURE, THREE DEPTHS bars.',
        notice:
          'Mint, amber and rose are the pixel data; the amber sliver on the end of each bar is the CLUT.',
        target: 'depth-bars',
      },
      {
        action: 'Drag the width and height sliders.',
        notice:
          'OF 1 MB VRAM tells you how many of this texture the machine could hold - including when the answer is 0.',
        target: 'size-sliders',
      },
    ],
    experiments: [
      'Set 16x16 at 8-BIT. The 512-byte palette costs twice as much as the picture it colours.',
      'Find the largest 16-bit texture that fits in a quarter of VRAM.',
    ],
  },

  clut: {
    goal: 'Feel the difference between painting a colour and painting an index.',
    steps: [
      {
        action: 'Click a swatch in the CLUT panel, then drag on the canvas.',
        notice:
          'You are writing that slot number into pixels. The colour you see is a lookup happening at draw time.',
        target: 'clut-strip',
      },
      {
        action: 'Tick SHOW INDEXES.',
        notice:
          'Every pixel reveals the number it actually holds. The picture is a grid of digits.',
        target: 'show-indexes',
      },
      {
        action: 'With a slot selected, change its colour with the colour picker.',
        notice:
          'Every pixel using that index updates at once, and the pixel data was never touched. You edited 2 bytes.',
        target: 'colour-picker',
      },
      {
        action: 'Hover slowly across the canvas.',
        notice:
          'The LOOKUP panel follows your cursor through pixel value, stored bits, CLUT entry, colour.',
        target: 'lookup',
      },
      {
        action: 'Press MAKE THIS SLOT TRANSPARENT.',
        notice:
          'A CLUT entry of 0x0000 means "do not draw". Transparency is a palette value on this hardware, not a channel.',
        target: 'make-transparent',
      },
    ],
    experiments: [
      'Recolour the jacket without touching a single pixel.',
      'Notice the dimmed slots. They are unused by the drawing and still cost 2 bytes each.',
      'Use FILL to flood an area, then check that the memory figures have not moved.',
    ],
  },

  'palette-swap': {
    goal: 'Explain how one texture becomes four characters.',
    steps: [
      {
        action: 'Read the six-pixel example at the top.',
        notice:
          'One block of index data, two palettes, two different sprites. Nothing else differs.',
        target: 'mini',
      },
      {
        action: 'Click through the four variants below it.',
        notice:
          'They are the same 128 bytes of pixels rendered through four different 32-byte CLUTs.',
        target: 'variants',
      },
      {
        action: 'Select index 2 and change its colour.',
        notice:
          'Only the variant you are editing moves. The others are reading a different CLUT from the same texture.',
        target: 'variant-palette',
      },
      {
        action: 'Compare with THE SHARED INDEX DATA on the right.',
        notice:
          'That grid never changes, no matter which variant you look at or how you recolour it.',
        target: 'index-data',
      },
      {
        action: 'Read WHAT THE VARIANTS COST.',
        notice:
          'Four liveries for 256 bytes, against 2 KiB if each were its own 16-bit texture.',
        target: 'cost',
      },
    ],
    experiments: [
      'Try to make one variant read as a different vehicle. You cannot - the silhouette is shared.',
      'Switch to the Interceptor or the Pilot and see the same trick on a different shape.',
    ],
  },

  atlas: {
    goal: 'See why instances are free and unique pixels are not.',
    steps: [
      {
        action: 'Click a cell in the sprite sheet.',
        notice:
          'It is outlined in amber and the right panel gives you its U, V and size - the numbers a draw command actually carries.',
        target: 'sheet',
      },
      {
        action: 'Look at the CONCEPTUAL DRAW COMMAND.',
        notice:
          'Nothing is copied. The draw reads a rectangle of a texture that is already in VRAM.',
        target: 'draw-command',
      },
      {
        action: 'The cell you clicked is now your brush. Drag across the scene below.',
        notice:
          'The counters move: RENDERED INSTANCES climbs, UNIQUE ASSETS does not, DUPLICATED PIXEL DATA stays at 0 bytes.',
        target: 'scene',
      },
      {
        action: 'Read the three bars under the scene.',
        notice:
          'Storing every instance as its own image costs roughly thirty times what the atlas approach does.',
        target: 'bars',
      },
      {
        action: 'Check the x-counts on the region buttons.',
        notice: 'GRASS may be on screen thirty times. It is stored once.',
        target: 'regions',
      },
    ],
    experiments: [
      'Press FILL WITH GRASS. One unique asset, seventy-two instances, same bytes.',
      'Build something with all eight regions and watch the optimised bar barely move.',
    ],
  },

  tilemap: {
    goal: 'Understand a level as a small tileset plus a list of numbers.',
    steps: [
      {
        action: 'Read the TILESET + TILEMAP = LEVEL strip.',
        notice:
          'Seven images on the left, a grid of digits in the middle, a place on the right.',
        target: 'equation',
      },
      {
        action: 'Pick a tile from the tileset row and drag on the level.',
        notice: 'You are writing numbers into an array, not painting pixels.',
        target: 'tileset',
      },
      {
        action: 'Tick SHOW TILE INDEXES.',
        notice:
          'The level drops its disguise. Every cell is a single digit naming a tile.',
        target: 'show-indexes',
      },
      {
        action: 'Drag the LEVEL WIDTH and LEVEL HEIGHT sliders.',
        notice:
          'Approach A grows with the area of the level. Approach B grows by exactly one byte per tile.',
        target: 'scale-sliders',
      },
      {
        action: 'Change DEPTH FOR APPROACH A to 4BPP to be generous to it.',
        notice: 'It still loses, because it is storing the same grass a hundred times.',
        target: 'naive-depth',
      },
    ],
    experiments: [
      'Push the level to 128 x 128 tiles. Approach A alone is several times the size of the machine.',
      'Paint a level using only two tiles. DISTINCT TILES USED drops; the tileset cost does not, because it is still loaded.',
    ],
  },

  glyphs: {
    goal: 'Trace a letter from keystroke to pixels.',
    steps: [
      {
        action: 'Click a glyph in the atlas, or a letter in the row beneath it.',
        notice:
          'The right panel gives its id, its hex byte, and the U, V of its cell. That is everything the renderer needs.',
        target: 'atlas',
      },
      {
        action: 'Type a word into the TEXT field.',
        notice:
          'CHARACTER TO GLYPH fills in, and EXAMPLE ENCODING shows the bytes that word becomes.',
        target: 'text',
      },
      {
        action: 'Watch the RENDERER row, or press PAUSE then STEP.',
        notice:
          'Five stages per character: read the id, find the glyph, find its coordinates, draw it, advance the cursor.',
        target: 'renderer',
      },
      {
        action: 'Follow the amber line in the OUTPUT box.',
        notice: 'That is the cursor. Each glyph moves it exactly 8 pixels to the right.',
        target: 'output',
      },
      {
        action: 'Compare the last two stat cards.',
        notice:
          'Your word costs one byte per character. The same word as a picture costs a hundred times more and can only ever say that one thing.',
        target: 'stats',
      },
    ],
    experiments: [
      'Type a character the table does not contain, such as # or a lower-case letter.',
      'Type a long string. The data cost rises by 1 byte per letter; the atlas cost does not move.',
    ],
  },

  'text-vs-images': {
    goal: 'Know when to store language as characters and when to store it as art.',
    steps: [
      {
        action: 'Compare the two totals at the top.',
        notice:
          'Six short menu strings already cost four times more as pictures than as characters.',
        target: 'totals',
      },
      {
        action: 'Type something into ADD A STRING and press ADD.',
        notice: 'One side grows by a whole image. The other grows by a few bytes.',
        target: 'add-string',
      },
      {
        action: 'Press + A WHOLE MENU (16).',
        notice:
          'SAVED BY GLYPHS climbs sharply. The atlas was a one-off payment; the strings are nearly free.',
        target: 'bulk-add',
      },
      {
        action: 'Read the growth chart.',
        notice:
          'The rose line has a slope. The mint line is close to flat. That gap is the entire argument.',
        target: 'chart',
      },
      {
        action: 'Set NAIVE IMAGE DEPTH to 4BPP.',
        notice:
          'Even with the naive side given the same compression, it still loses - because it stores the letter A once per phrase.',
        target: 'naive-depth',
      },
    ],
    experiments: [
      'Delete strings until the glyph approach stops winning. With two short labels, an atlas is not worth it.',
      'Add "START MENU" and "START GAME" and think about how many times the word START is now stored on each side.',
    ],
  },

  hex: {
    goal: 'Recognise a texture and a string when you meet them in a hex editor.',
    steps: [
      {
        action: 'Read FOUR PIXELS, PACKED from left to right.',
        notice: 'Indexes, then binary, then packed bytes, then hex. Nothing is skipped.',
        target: 'worked',
      },
      {
        action: 'Toggle between PS1 ORDER and WHITEBOARD ORDER.',
        notice:
          'The same four pixels are 42 31 or 24 13. The PS1 puts the leftmost pixel in the low nibble, and this is the single most common thing to get wrong.',
        target: 'order',
      },
      {
        action: 'In the texture inspector, click a pixel.',
        notice:
          'Its byte offset is highlighted in the dump. At 4bpp one byte covers two pixels; at 16bpp one pixel spans two bytes.',
        target: 'texture',
      },
      {
        action: 'Hover bytes in the dump.',
        notice:
          'The highlight follows your cursor so you can read the layout row by row.',
        target: 'dump',
      },
      {
        action: 'Type in the text inspector and look at BYTE VIEW.',
        notice:
          'The ASCII gutter is deliberately useless here, because 0x00 is the letter A in this table, not a terminator.',
        target: 'text-inspector',
      },
    ],
    experiments: [
      'Switch the same sprite between 4BPP, 8BPP and 16BPP and watch the row stride change.',
      'Compare CLUT DATA with the palette. Every entry is a little-endian 16-bit word.',
    ],
  },

  challenge: {
    goal: 'Make the trade-offs yourself, under a hard limit.',
    steps: [
      {
        action: 'Read the top row before touching anything.',
        notice:
          'The naive starting point is over budget. Everything is 16-bit and nothing is reused.',
        target: 'budget',
      },
      {
        action: 'Click the top card under SUGGESTED OPTIMISATIONS.',
        notice:
          'It applies immediately and the bar redraws. The suggestions are ranked by bytes returned, one per asset.',
        target: 'suggestions',
      },
      {
        action: 'Tick PALETTE SWAP on the Cars row.',
        notice:
          'Six liveries collapse into one texture plus six palettes - the trick from section 05, in a budget.',
        target: 'asset-cars',
      },
      {
        action: 'Get under 1 MiB.',
        notice: 'The panel turns mint and tells you how much headroom is left.',
        target: 'status',
      },
      {
        action: 'Now spend that headroom.',
        notice:
          'FIDELITY SCORE rewards bigger and deeper. Fitting is not the goal on its own; fitting well is.',
        target: 'fidelity',
      },
    ],
    experiments: [
      'Try to ship with the sky still at 16BPP. Gradients are the one place direct colour earns its keep.',
      'Press OPTIMISE EVERYTHING, then raise quality only where it would show on screen.',
      'Set the Font atlas to 16BPP and look at the cost of storing a two-colour image in direct colour.',
    ],
  },

  'naive-vs-optimized': {
    goal: 'Put the whole app into one sentence.',
    steps: [
      {
        action: 'Look at the scene on WHAT THE PLAYER SEES.',
        notice: 'Four cars, a wall with doors, a road, water, a HUD. Ordinary enough.',
        target: 'scene',
      },
      {
        action: 'Switch to WHAT IS ACTUALLY STORED.',
        notice:
          'Left: one flattened image and a pile of duplicates. Right: seven tiles, a grid of numbers, one car, four palettes and a font.',
        target: 'view-toggle',
      },
      {
        action: 'Compare the two stat rows.',
        notice:
          'DUPLICATED DATA on the naive side is the same grass stored over and over. REUSED INSTANCES on the other side is that data being referenced instead.',
        target: 'stats',
      },
      {
        action: 'Read the two checklists.',
        notice:
          'Every line on the mint side is one of the earlier playgrounds. This page is the assembly.',
        target: 'checklists',
      },
    ],
    experiments: [
      'Cover the numbers and try to spot the difference in the picture. There is none - that is the point.',
      'Name which section taught each line of the optimised checklist.',
    ],
  },
};

/** Shown on the home page: how to drive the site itself. */
export const HOME_TUTORIAL: Tutorial = {
  goal: 'Get comfortable with how this site works before diving in.',
  steps: [
    {
      action:
        'Work through the sections in order using the left rail, or the arrows at the foot of each page.',
      notice:
        'Each one builds on the last. Section 12 only lands if you have seen 02 through 09.',
      target: 'nav',
    },
    {
      action: 'Hover any term with a dotted underline, such as CLUT or VRAM.',
      notice: 'A short definition appears. Every piece of jargon in the app has one.',
      target: 'term',
    },
    {
      action: 'Look for this guide panel on every section.',
      notice:
        'It tells you which controls to touch and what to watch when you do, and it starts again at step 1 on each new section. Collapse it with the − button if you would rather explore.',
    },
    {
      action: 'Expand the DEEP DIVE panel at the foot of a section.',
      notice:
        'That is where the simplifications are owned up to: texture pages, CLUT alignment, nibble order, and what real hardware does instead.',
    },
    {
      action: 'Treat every canvas as interactive.',
      notice:
        'If it shows pixels you can usually click, drag or hover it. Nothing you do here can break anything - reset buttons are on every panel.',
    },
  ],
  experiments: [
    'Short on time? Sections 02, 05 and 12 carry most of the idea on their own.',
    'Already know this material? Go straight to section 11 and try to ship under 1 MB with a high fidelity score.',
  ],
};

/** Colour conventions used consistently across the app. */
export const LEGEND: Array<{ token: string; meaning: string }> = [
  { token: 'mint', meaning: 'the optimised path, and anything that fits' },
  { token: 'rose', meaning: 'the naive path, and anything over budget' },
  { token: 'amber', meaning: 'indexes, palettes and the current selection' },
  { token: 'azure', meaning: 'framebuffers' },
  { token: 'violet', meaning: 'deep dives and exact hardware behaviour' },
];
