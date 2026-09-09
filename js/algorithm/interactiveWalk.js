// A user-driven version of the drunken bishop walk: instead of consuming a
// precomputed byte array, moves are pushed one at a time (e.g. from button
// clicks), like an Etch-A-Sketch that can never lift its pen. Every 4 moves
// completes one byte, using exactly the same low-bits-first packing
// drunkenBishop() consumes -- so the resulting bytes, fed back into
// drunkenBishop(), reproduce this exact walk.
//
// Bit packing for a completed byte, given its 4 moves' codes in the order
// they were pushed (c0 first ... c3 last): byte = c0 | (c1<<2) | (c2<<4) |
// (c3<<6). The first move you make ends up as the byte's LOW bits (it's
// consumed first); the fourth ends up as the HIGH bits.

import { FIELD_W, FIELD_H, CAP, START } from "./constants.js";

export class InteractiveWalk {
  constructor() {
    this.reset();
  }

  reset() {
    this.field = new Uint8Array(FIELD_W * FIELD_H);
    this.x = START.x;
    this.y = START.y;
    this.codes = []; // every 2-bit move code (0-3) pushed so far, in order
    this._history = []; // per-move undo info: {prevX, prevY, idx, incremented}
    this.finished = false; // true once the user has "lifted the pen" (places E)
  }

  /** True once a full byte's worth of moves (a multiple of 4) has been made -- the only points where `finish()` is valid. */
  get atByteBoundary() {
    return this.codes.length > 0 && this.codes.length % 4 === 0;
  }

  /** Mark the current position as the end of the walk (draws 'E' there). Only valid at a byte boundary. */
  finish() {
    if (!this.atByteBoundary) return false;
    this.finished = true;
    return true;
  }

  /** @param {number} code - 0-3: bit0 -> x direction, bit1 -> y direction (same convention as drunkenBishop). */
  push(code) {
    this.finished = false; // resuming after a finish just continues the walk
    const prevX = this.x, prevY = this.y;
    let nx = this.x + (code & 1 ? 1 : -1);
    let ny = this.y + (code & 2 ? 1 : -1);
    nx = Math.max(0, Math.min(FIELD_W - 1, nx));
    ny = Math.max(0, Math.min(FIELD_H - 1, ny));
    const idx = nx + ny * FIELD_W;
    const incremented = this.field[idx] < CAP;
    if (incremented) this.field[idx]++;

    this._history.push({ prevX, prevY, idx, incremented });
    this.codes.push(code);
    this.x = nx;
    this.y = ny;
  }

  /** Undo the most recent move. Returns false if there's nothing to undo. */
  undo() {
    if (this.codes.length === 0) return false;
    this.finished = false;
    this.codes.pop();
    const { prevX, prevY, idx, incremented } = this._history.pop();
    if (incremented) this.field[idx]--;
    this.x = prevX;
    this.y = prevY;
    return true;
  }

  /** Completed bytes so far, as a Uint8Array (every group of 4 pushed codes). */
  get completedBytes() {
    const n = Math.floor(this.codes.length / 4);
    const bytes = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const [c0, c1, c2, c3] = this.codes.slice(i * 4, i * 4 + 4);
      bytes[i] = c0 | (c1 << 2) | (c2 << 4) | (c3 << 6);
    }
    return bytes;
  }

  /** The 0-3 codes pushed so far toward the in-progress (not yet complete) byte. */
  get partialCodes() {
    const complete = Math.floor(this.codes.length / 4) * 4;
    return this.codes.slice(complete);
  }
}
