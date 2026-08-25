import { deflateSync } from 'node:zlib';

/**
 * Minimal RGB8 PNG writer, so generating the OG card needs no image library.
 * A surface is just width, height and a w*h*3 byte buffer.
 */

export function surface(w, h, bg = '#000000') {
  const s = { w, h, data: new Uint8Array(w * h * 3) };
  fillRect(s, 0, 0, w, h, bg);
  return s;
}

const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export function setPx(s, x, y, color) {
  if (x < 0 || y < 0 || x >= s.w || y >= s.h) return;
  const [r, g, b] = Array.isArray(color) ? color : rgb(color);
  const i = (y * s.w + x) * 3;
  s.data[i] = r;
  s.data[i + 1] = g;
  s.data[i + 2] = b;
}

export function fillRect(s, x, y, w, h, color) {
  const c = rgb(color);
  const x0 = Math.max(0, Math.round(x));
  const y0 = Math.max(0, Math.round(y));
  const x1 = Math.min(s.w, Math.round(x + w));
  const y1 = Math.min(s.h, Math.round(y + h));
  for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) setPx(s, xx, yy, c);
}

export function strokeRect(s, x, y, w, h, color, t = 1) {
  fillRect(s, x, y, w, t, color);
  fillRect(s, x, y + h - t, w, t, color);
  fillRect(s, x, y, t, h, color);
  fillRect(s, x + w - t, y, t, h, color);
}

/** Blend `color` over what is already there. Used for grid lines and scrims. */
export function overlayRect(s, x, y, w, h, color, alpha) {
  const [r, g, b] = rgb(color);
  const x1 = Math.min(s.w, Math.round(x + w));
  const y1 = Math.min(s.h, Math.round(y + h));
  for (let yy = Math.max(0, Math.round(y)); yy < y1; yy++) {
    for (let xx = Math.max(0, Math.round(x)); xx < x1; xx++) {
      const i = (yy * s.w + xx) * 3;
      s.data[i] += (r - s.data[i]) * alpha;
      s.data[i + 1] += (g - s.data[i + 1]) * alpha;
      s.data[i + 2] += (b - s.data[i + 2]) * alpha;
    }
  }
}

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}

export function encodePng(s) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(s.w, 0);
  ihdr.writeUInt32BE(s.h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // truecolour
  const stride = s.w * 3;
  const raw = Buffer.alloc((stride + 1) * s.h);
  for (let y = 0; y < s.h; y++) {
    raw[y * (stride + 1)] = 0; // no per-row filter
    Buffer.from(s.data.subarray(y * stride, (y + 1) * stride)).copy(
      raw,
      y * (stride + 1) + 1,
    );
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
