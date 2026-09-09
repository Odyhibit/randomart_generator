// Renders a drunkenBishop() result into the classic bordered ASCII-art box,
// e.g.:
//
//   +--[MD5 128]--+
//   |    . .o+o.  |
//   |     o.+.+.  |
//   |   ..o.o.+ . |
//   |   o.oo* + o |
//   |  . +.=S* . o|
//   |     +.= o o |
//   |      + o + .|
//   |     E . o . |
//   |      . .    |
//   +----[MD5]----+
//
// The title/footer centering uses the same integer-division-biased padding
// OpenSSH's ssh-keygen uses, so real title/footer strings of the same
// length line up identically (verified against real ssh-keygen output, see
// test/test_asciiBox.mjs).

import { FIELD_W, FIELD_H, AUGMENTATION_STRING, CAP, START_INDEX, END_INDEX } from "../algorithm/constants.js";

/**
 * Pad `label` with '-' on both sides to exactly `width` characters, biasing
 * extra padding to the right (matches OpenSSH's C integer-division math:
 * `before = (width - len) / 2` truncates toward zero for positive operands).
 * If the label is too long to fit, it's truncated to `width`.
 */
export function centerBorder(label, width) {
  if (label.length >= width) return label.slice(0, width);
  const before = Math.floor((width - label.length) / 2);
  const after = width - label.length - before;
  return "-".repeat(before) + label + "-".repeat(after);
}

/**
 * @param {object} args
 * @param {Uint8Array} args.finalField - raw visit counts from drunkenBishop(), length FIELD_W*FIELD_H
 * @param {{x:number,y:number}} args.startPos
 * @param {{x:number,y:number} | null} [args.endPos] - omit/null to render the walk still in
 *   progress (S shown, no E yet) — used for the live "watch it build" preview
 * @param {string} args.titleLabel - e.g. "[MD5 128]", "[SHA256 256]", "[RAW 64]"
 * @param {string} args.footerLabel - e.g. "[MD5]", "[SHA256]", "[RAW]"
 * @returns {string} the full bordered box, lines joined with "\n"
 */
export function renderAsciiBox({ finalField, startPos, endPos, titleLabel, footerLabel }) {
  const display = new Uint8Array(FIELD_W * FIELD_H);
  for (let i = 0; i < display.length; i++) {
    display[i] = Math.min(finalField[i], CAP);
  }
  // S is written first, E second — if the walk ends back at the start cell,
  // E overwrites S there (matches OpenSSH: center prints 'E', not 'S').
  display[startPos.x + startPos.y * FIELD_W] = START_INDEX;
  if (endPos) display[endPos.x + endPos.y * FIELD_W] = END_INDEX;

  const lines = [];
  lines.push(`+${centerBorder(titleLabel, FIELD_W)}+`);
  for (let y = 0; y < FIELD_H; y++) {
    let row = "|";
    for (let x = 0; x < FIELD_W; x++) {
      row += AUGMENTATION_STRING[display[x + y * FIELD_W]];
    }
    row += "|";
    lines.push(row);
  }
  lines.push(`+${centerBorder(footerLabel, FIELD_W)}+`);
  return lines.join("\n");
}
