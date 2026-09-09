import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { centerBorder, renderAsciiBox } from "../js/render/asciiBox.js";
import { drunkenBishop } from "../js/algorithm/drunkenBishop.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

export function run() {
  let count = 0;
  const test = (name, fn) => {
    fn();
    count++;
  };

  test("centerBorder: exact fit, no padding", () => {
    assert.equal(centerBorder("x".repeat(17), 17), "x".repeat(17));
  });

  test("centerBorder: even remainder splits evenly", () => {
    // width-len = 12 (even) -> 6 before, 6 after
    assert.equal(centerBorder("[MD5]", 17), "------[MD5]------");
  });

  test("centerBorder: odd remainder biases extra dash to the right (floor before)", () => {
    // width-len = 9 (odd) -> floor(9/2)=4 before, 5 after
    assert.equal(centerBorder("[SHA256]", 17), "----[SHA256]-----");
    // width-len = 7 (odd) -> 3 before, 4 after
    assert.equal(centerBorder("[RSA 2048]", 17), "---[RSA 2048]----");
    // width-len = 4 (even) -> 2 before, 2 after
    assert.equal(centerBorder("[ED25519 256]", 17), "--[ED25519 256]--");
  });

  test("centerBorder: label longer than width is truncated, not negative-repeated", () => {
    assert.equal(centerBorder("x".repeat(20), 17), "x".repeat(17));
  });

  test("empty input: E overwrites S at the fixed center cell", () => {
    const result = drunkenBishop(new Uint8Array(0));
    const box = renderAsciiBox({ ...result, titleLabel: "[RAW 0]", footerLabel: "[RAW]" });
    const lines = box.split("\n");
    // center content row is index 1 (border) + 4 (fieldH/2) = row 5, center column 1+8=9
    const centerRow = lines[5];
    assert.equal(centerRow[9], "E", `expected 'E' at fixed center when walk never moves, got row: ${centerRow}`);
  });

  test("known-answer vectors: byte-identical to real `ssh-keygen -lv` output", () => {
    const vectors = JSON.parse(readFileSync(join(__dirname, "vectors", "known_answers.json"), "utf8"));
    for (const v of vectors) {
      const bytes = hexToBytes(v.digestHex);
      const result = drunkenBishop(bytes);
      const box = renderAsciiBox({ ...result, titleLabel: v.titleLabel, footerLabel: v.footerLabel });
      assert.equal(box, v.expectedBox, `mismatch for: ${v.description}`);
    }
  });

  console.log(`test_asciiBox: ${count} assertions passed`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}
