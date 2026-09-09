import assert from "node:assert/strict";
import { drunkenBishop, foldSteps } from "../js/algorithm/drunkenBishop.js";
import { FIELD_W, FIELD_H, AUGMENTATION_STRING, LEN, CAP, START } from "../js/algorithm/constants.js";

export function run() {
  let count = 0;
  const test = (name, fn) => {
    fn();
    count++;
  };

  test("constants sanity", () => {
    assert.equal(FIELD_W, 17);
    assert.equal(FIELD_H, 9);
    assert.equal(AUGMENTATION_STRING.length, 17);
    assert.equal(LEN, 16);
    assert.equal(CAP, 14);
    assert.deepEqual(START, { x: 8, y: 4 });
  });

  test("empty input never moves; end == start", () => {
    const result = drunkenBishop(new Uint8Array(0));
    assert.equal(result.steps.length, 0);
    assert.deepEqual(result.endPos, { x: 8, y: 4 });
    assert.deepEqual(result.startPos, { x: 8, y: 4 });
    assert.ok(result.finalField.every((v) => v === 0));
  });

  test("single byte low-2-bits determine first move direction (bit0=x, bit1=y)", () => {
    // From center (8,4): bit set -> +1, bit clear -> -1
    const cases = [
      { byte: 0x00, expected: { x: 7, y: 3 } }, // 00: x-1, y-1
      { byte: 0x01, expected: { x: 9, y: 3 } }, // 01: x+1, y-1
      { byte: 0x02, expected: { x: 7, y: 5 } }, // 10: x-1, y+1
      { byte: 0x03, expected: { x: 9, y: 5 } }, // 11: x+1, y+1
    ];
    for (const { byte, expected } of cases) {
      const result = drunkenBishop(new Uint8Array([byte]));
      assert.deepEqual(result.steps[0].to, expected, `byte 0x${byte.toString(16)}`);
      assert.equal(result.steps[0].bits, byte & 0x3);
    }
  });

  test("byte is consumed low-bits-first across 4 sub-steps, shifting right by 2 each time", () => {
    // 0b11_10_01_00 = 0xE4: sub-step order should be bits=00, then 01, then 10, then 11
    const result = drunkenBishop(new Uint8Array([0b11100100]));
    assert.equal(result.steps.length, 4);
    assert.deepEqual(
      result.steps.map((s) => s.bits),
      [0b00, 0b01, 0b10, 0b11]
    );
  });

  test("clamping keeps coordinates in bounds and flags clamped moves", () => {
    // Repeatedly push toward the top-left corner (bits=00 => x-1,y-1) until walls are hit.
    const result = drunkenBishop(new Uint8Array(10).fill(0x00));
    for (const step of result.steps) {
      assert.ok(step.to.x >= 0 && step.to.x <= FIELD_W - 1);
      assert.ok(step.to.y >= 0 && step.to.y <= FIELD_H - 1);
    }
    assert.ok(result.steps.some((s) => s.clampedX), "expected some x-clamped step");
    assert.ok(result.steps.some((s) => s.clampedY), "expected some y-clamped step");
    // Bishop should have been driven into the (0,0) corner and pinned there.
    assert.deepEqual(result.endPos, { x: 0, y: 0 });
  });

  test("visit count saturates at CAP (14) and never exceeds it", () => {
    const result = drunkenBishop(new Uint8Array(10).fill(0x00));
    const idx = 0 + 0 * FIELD_W; // corner cell (0,0), visited repeatedly once pinned
    assert.equal(result.finalField[idx], CAP);
    assert.ok(result.finalField.every((v) => v <= CAP));
  });

  test("foldSteps(steps, n) matches drunkenBishop's own incremental state", () => {
    const bytes = new Uint8Array([0x4a, 0xff, 0x00, 0x91, 0x3c]);
    const result = drunkenBishop(bytes);
    // Folding all steps should reproduce the same final field and end position.
    const folded = foldSteps(result.steps, result.steps.length);
    assert.deepEqual(Array.from(folded.field), Array.from(result.finalField));
    assert.deepEqual(folded.pos, result.endPos);
    // Folding zero steps should be the untouched start state.
    const empty = foldSteps(result.steps, 0);
    assert.ok(empty.field.every((v) => v === 0));
    assert.deepEqual(empty.pos, { x: 8, y: 4 });
  });

  console.log(`test_drunkenBishop: ${count} assertions passed`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}
