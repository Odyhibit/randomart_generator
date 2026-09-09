// MD5 (RFC 1321), implemented from scratch against the public spec.
//
// Written from scratch (not adapted from any existing MD5.js library) so the
// whole repo's provenance stays unambiguous and MIT with no attribution or
// license-compatibility questions — the Web Crypto API's SubtleCrypto
// intentionally does not support MD5, so this is the only way to compute it
// in a browser without a server.
//
// Verified against RFC 1321's own published test vectors, see test/test_md5.mjs.

// Per-round left-rotate amounts (4 rounds x 16 steps).
const S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

// K[i] = floor(abs(sin(i + 1)) * 2^32), i = 0..63
const K = new Uint32Array(64);
for (let i = 0; i < 64; i++) {
  K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32);
}

function rotl(x, n) {
  return (x << n) | (x >>> (32 - n));
}

/**
 * @param {Uint8Array} message
 * @returns {Uint8Array} 16-byte MD5 digest
 */
export function md5(message) {
  // --- Padding (standard MD5 scheme: 0x80, zeros, then 64-bit little-endian bit length) ---
  const bitLen = BigInt(message.length) * 8n;
  let padLen = (56 - ((message.length + 1) % 64) + 64) % 64;
  const padded = new Uint8Array(message.length + 1 + padLen + 8);
  padded.set(message, 0);
  padded[message.length] = 0x80;
  const lenOffset = message.length + 1 + padLen;
  for (let i = 0; i < 8; i++) {
    padded[lenOffset + i] = Number((bitLen >> BigInt(8 * i)) & 0xffn);
  }

  // --- Initial hash state ---
  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  const view = new DataView(padded.buffer, padded.byteOffset, padded.byteLength);
  const chunks = padded.length / 64;

  for (let chunk = 0; chunk < chunks; chunk++) {
    const M = new Uint32Array(16);
    for (let j = 0; j < 16; j++) {
      M[j] = view.getUint32(chunk * 64 + j * 4, true); // little-endian
    }

    let A = a0, B = b0, C = c0, D = d0;

    for (let i = 0; i < 64; i++) {
      let F, g;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }
      F = (F + A + K[i] + M[g]) | 0;
      A = D;
      D = C;
      C = B;
      B = (B + rotl(F, S[i])) | 0;
    }

    a0 = (a0 + A) | 0;
    b0 = (b0 + B) | 0;
    c0 = (c0 + C) | 0;
    d0 = (d0 + D) | 0;
  }

  const out = new Uint8Array(16);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, a0 >>> 0, true);
  outView.setUint32(4, b0 >>> 0, true);
  outView.setUint32(8, c0 >>> 0, true);
  outView.setUint32(12, d0 >>> 0, true);
  return out;
}
