import assert from "node:assert/strict";
import { parseHex } from "../js/input/parseHex.js";
import { parseText } from "../js/input/parseText.js";

function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function run() {
  let count = 0;
  const test = (name, fn) => {
    fn();
    count++;
  };

  test("parseHex: bare hex", () => {
    const r = parseHex("deadbeef");
    assert.ok(r.ok);
    assert.equal(bytesToHex(r.bytes), "deadbeef");
  });

  test("parseHex: colon-separated (fingerprint shape)", () => {
    const r = parseHex("de:ad:be:ef");
    assert.ok(r.ok);
    assert.equal(bytesToHex(r.bytes), "deadbeef");
  });

  test("parseHex: space-separated, mixed case", () => {
    const r = parseHex("DE AD be EF");
    assert.ok(r.ok);
    assert.equal(bytesToHex(r.bytes), "deadbeef");
  });

  test("parseHex: empty input is an error", () => {
    const r = parseHex("   ");
    assert.equal(r.ok, false);
  });

  test("parseHex: odd-length hex is an error", () => {
    const r = parseHex("abc");
    assert.equal(r.ok, false);
    assert.match(r.error, /even number/);
  });

  test("parseHex: invalid character reports its position", () => {
    const r = parseHex("deadxxef"); // even length, so this exercises the invalid-char branch
    assert.equal(r.ok, false);
    assert.equal(r.index, 4);
  });

  test("parseText: ASCII round-trips as expected UTF-8 bytes", () => {
    const r = parseText("abc");
    assert.ok(r.ok);
    assert.equal(bytesToHex(r.bytes), "616263");
  });

  test("parseText: multi-byte UTF-8 (e.g. emoji) produces multiple bytes", () => {
    const r = parseText("\u{1F600}"); // 😀 -> 4 UTF-8 bytes
    assert.ok(r.ok);
    assert.equal(r.bytes.length, 4);
  });

  test("parseText: empty input is an error", () => {
    const r = parseText("");
    assert.equal(r.ok, false);
  });

  console.log(`test_parsers: ${count} assertions passed`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}
