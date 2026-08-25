/**
 * Bit packing, hex formatting and the character-table encoding used by the
 * glyph + hex playgrounds.
 */

export function toBin(value: number, bits: number): string {
  return (value >>> 0).toString(2).padStart(bits, '0').slice(-bits);
}

export function toHex(value: number, digits = 2): string {
  return value.toString(16).toUpperCase().padStart(digits, '0');
}

/**
 * Which nibble holds the left-hand pixel. "display" is whiteboard order (left
 * pixel in the high nibble); "ps1" is what the hardware does, leftmost pixel in
 * the LOW nibble, because VRAM words are little-endian.
 */
export type NibbleOrder = 'display' | 'ps1';

/** Pack 4-bit indexes two-per-byte. */
export function packNibbles(indexes: number[], order: NibbleOrder = 'ps1'): number[] {
  const out: number[] = [];
  for (let i = 0; i < indexes.length; i += 2) {
    const a = (indexes[i] ?? 0) & 0xf;
    const b = (indexes[i + 1] ?? 0) & 0xf;
    out.push(order === 'ps1' ? (b << 4) | a : (a << 4) | b);
  }
  return out;
}

export function unpackNibbles(bytes: number[], order: NibbleOrder = 'ps1'): number[] {
  const out: number[] = [];
  for (const byte of bytes) {
    const lo = byte & 0xf;
    const hi = (byte >> 4) & 0xf;
    out.push(...(order === 'ps1' ? [lo, hi] : [hi, lo]));
  }
  return out;
}

/** Pack 16-bit words little-endian, the way they sit in a PS1 file. */
export function packWordsLE(words: number[]): number[] {
  const out: number[] = [];
  for (const w of words) {
    out.push(w & 0xff, (w >> 8) & 0xff);
  }
  return out;
}

export interface HexRow {
  offset: number;
  bytes: number[];
  ascii: string;
}

export function hexRows(bytes: number[], perRow = 16): HexRow[] {
  const rows: HexRow[] = [];
  for (let i = 0; i < bytes.length; i += perRow) {
    const chunk = bytes.slice(i, i + perRow);
    rows.push({
      offset: i,
      bytes: chunk,
      ascii: chunk
        .map((b) => (b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : '.'))
        .join(''),
    });
  }
  return rows;
}

/**
 * An example encoding, not a standard. Real games shipped whatever the tools
 * emitted: some ASCII, plenty custom-ordered by glyph frequency, and Japanese
 * titles far larger tables. This one is A=0.
 */

export const CHAR_TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,!?:-'/()%".split('');

export const CHAR_TABLE_COLS = 8;

export function charToId(ch: string): number {
  const idx = CHAR_TABLE.indexOf(ch.toUpperCase());
  return idx;
}

export function idToChar(id: number): string {
  return CHAR_TABLE[id] ?? '?';
}

export interface EncodedChar {
  char: string;
  id: number;
  hex: string;
  known: boolean;
}

export function encodeString(text: string): EncodedChar[] {
  return text.split('').map((char) => {
    const id = charToId(char);
    const known = id >= 0;
    return {
      char: char.toUpperCase(),
      id: known ? id : 0xff,
      hex: known ? toHex(id) : 'FF',
      known,
    };
  });
}

/** Where a glyph id lives inside the atlas grid. */
export function glyphCell(id: number, cols = CHAR_TABLE_COLS) {
  return { col: id % cols, row: Math.floor(id / cols) };
}

export function glyphUv(
  id: number,
  cellW: number,
  cellH: number,
  cols = CHAR_TABLE_COLS,
) {
  const { col, row } = glyphCell(id, cols);
  return { u: col * cellW, v: row * cellH, w: cellW, h: cellH };
}
