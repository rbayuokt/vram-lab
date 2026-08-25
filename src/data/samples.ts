import { fromRows, TRANSPARENT, type Palette } from '@/utils/pixel';

/** The 8 x 8 sample every "inspect a pixel" playground shares. */
export const GEM_ROWS = [
  '00111100',
  '01222210',
  '12333321',
  '12344321',
  '12333321',
  '01233210',
  '00122100',
  '00011000',
];

export const gemImage = () => fromRows(GEM_ROWS);

export const GEM_PALETTE: Palette = [
  TRANSPARENT, // 0
  '#182a4a', // 1 outline
  '#2f6fd0', // 2 facet dark
  '#5fa8ff', // 3 facet
  '#d8ecff', // 4 highlight
  '#ff6b8b', // 5
  '#ffb454', // 6
  '#9ae66e', // 7
  '#b48dff', // 8
  '#4de3bd', // 9
  '#e8eef8', // 10
  '#8c9bb0', // 11
  '#5b6a7e', // 12
  '#3a4454', // 13
  '#232c3b', // 14
  '#0b0e14', // 15
];

export const GEM_ROLES = [
  'transparent',
  'outline',
  'facet (dark)',
  'facet',
  'highlight',
  'unused',
  'unused',
  'unused',
  'unused',
  'unused',
  'unused',
  'unused',
  'unused',
  'unused',
  'unused',
  'unused',
];

/** Four pixels used by the hex inspector's worked example. */
export const HEX_SAMPLE_INDEXES = [2, 4, 1, 3];
