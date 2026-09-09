import assert from "node:assert/strict";
import { sha256 } from "../js/hash/sha256.js";

function toHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const enc = new TextEncoder();

// Well-known published SHA-256 test vectors.
const VECTORS = [
  ["", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
  ["abc", "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"],
];

export async function run() {
  let count = 0;
  for (const [input, expectedHex] of VECTORS) {
    const digest = await sha256(enc.encode(input));
    assert.equal(digest.length, 32);
    assert.equal(toHex(digest), expectedHex, `sha256(${JSON.stringify(input)})`);
    count++;
  }
  console.log(`test_sha256: ${count} assertions passed`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}
