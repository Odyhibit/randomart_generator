// The "drunken bishop" hash-visualization algorithm used by OpenSSH's
// ssh-keygen for randomart images. Ported line-for-line from OpenSSH's
// sshkey.c (fingerprint_randomart()) so output is byte-identical given
// the same input bytes.
//
// This module is a pure, dependency-free function: it takes raw bytes
// (normally a hash digest, but any bytes work) and returns a full trace
// of every micro-move the bishop makes, plus the resulting field. The
// step trace is the single source of truth used both to render the
// final bordered box (see render/asciiBox.js) and to drive the
// step-by-step teaching animation (see animation/stepController.js) —
// both views are guaranteed consistent because neither re-derives
// algorithm logic on its own.

import { FIELD_W, FIELD_H, CAP, START } from "./constants.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * @param {Uint8Array} bytes - input bytes to walk (e.g. a hash digest).
 * @returns {{
 *   fieldW: number,
 *   fieldH: number,
 *   startPos: {x: number, y: number},
 *   endPos: {x: number, y: number},
 *   finalField: Uint8Array,   // length fieldW*fieldH, raw visit counts (0..CAP), no S/E overwrite
 *   steps: Array<{
 *     byteIndex: number,
 *     subIndex: number,       // 0..3, which 2-bit pair within the byte
 *     bits: number,           // 0..3, the raw 2-bit value consumed
 *     from: {x: number, y: number},
 *     to: {x: number, y: number},
 *     clampedX: boolean,
 *     clampedY: boolean,
 *     fieldValueAfter: number
 *   }>
 * }}
 */
export function drunkenBishop(bytes) {
  const finalField = new Uint8Array(FIELD_W * FIELD_H); // zero-initialized
  const steps = [];

  let x = START.x;
  let y = START.y;

  for (let byteIndex = 0; byteIndex < bytes.length; byteIndex++) {
    let input = bytes[byteIndex];
    for (let subIndex = 0; subIndex < 4; subIndex++) {
      const bits = input & 0x3;
      const from = { x, y };

      // bit 0 -> horizontal direction, bit 1 -> vertical direction
      let nx = x + (bits & 0x1 ? 1 : -1);
      let ny = y + (bits & 0x2 ? 1 : -1);

      const clampedX = nx < 0 || nx > FIELD_W - 1;
      const clampedY = ny < 0 || ny > FIELD_H - 1;
      nx = clamp(nx, 0, FIELD_W - 1);
      ny = clamp(ny, 0, FIELD_H - 1);

      x = nx;
      y = ny;

      const idx = x + y * FIELD_W;
      if (finalField[idx] < CAP) finalField[idx]++;

      steps.push({
        byteIndex,
        subIndex,
        bits,
        from,
        to: { x, y },
        clampedX,
        clampedY,
        fieldValueAfter: finalField[idx],
      });

      input >>= 2;
    }
  }

  return {
    fieldW: FIELD_W,
    fieldH: FIELD_H,
    startPos: { x: START.x, y: START.y },
    endPos: { x, y },
    finalField,
    steps,
  };
}

/**
 * Fold a prefix of `steps` (as produced by drunkenBishop) into the visit-count
 * field a live run would show after exactly `count` micro-moves. Used by the
 * step animation to render "in progress" grid state without re-implementing
 * the algorithm's increment/cap logic.
 *
 * @param {ReturnType<typeof drunkenBishop>["steps"]} steps
 * @param {number} count - number of steps to apply, 0..steps.length
 * @returns {{ field: Uint8Array, pos: {x: number, y: number} }}
 */
export function foldSteps(steps, count) {
  const field = new Uint8Array(FIELD_W * FIELD_H);
  let pos = { x: START.x, y: START.y };
  const n = clamp(count, 0, steps.length);
  for (let i = 0; i < n; i++) {
    const step = steps[i];
    const idx = step.to.x + step.to.y * FIELD_W;
    field[idx] = step.fieldValueAfter;
    pos = step.to;
  }
  return { field, pos };
}
