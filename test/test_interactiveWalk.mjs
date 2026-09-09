import assert from "node:assert/strict";
import { InteractiveWalk } from "../js/algorithm/interactiveWalk.js";
import { drunkenBishop } from "../js/algorithm/drunkenBishop.js";
import { FIELD_W, FIELD_H, CAP, START } from "../js/algorithm/constants.js";

export function run() {
  let count = 0;
  const test = (name, fn) => {
    fn();
    count++;
  };

  test("starts at center with an empty field", () => {
    const w = new InteractiveWalk();
    assert.deepEqual({ x: w.x, y: w.y }, START);
    assert.ok(w.field.every((v) => v === 0));
    assert.equal(w.codes.length, 0);
    assert.equal(w.atByteBoundary, false); // 0 moves is not a valid finish point
  });

  test("push() matches a single move of drunkenBishop() exactly", () => {
    const w = new InteractiveWalk();
    w.push(0b10); // bit0=0 (x-1), bit1=1 (y+1)
    assert.deepEqual({ x: w.x, y: w.y }, { x: START.x - 1, y: START.y + 1 });
    assert.equal(w.field[w.x + w.y * FIELD_W], 1);
  });

  test("4 pushes reconstruct into a byte that reproduces the same walk via drunkenBishop()", () => {
    const codes = [0b01, 0b10, 0b11, 0b00];
    const w = new InteractiveWalk();
    for (const c of codes) w.push(c);

    assert.equal(w.completedBytes.length, 1);
    const expectedByte = codes[0] | (codes[1] << 2) | (codes[2] << 4) | (codes[3] << 6);
    assert.equal(w.completedBytes[0], expectedByte);

    const replay = drunkenBishop(new Uint8Array([expectedByte]));
    assert.deepEqual(replay.endPos, { x: w.x, y: w.y });
    assert.deepEqual(Array.from(replay.finalField), Array.from(w.field));
  });

  test("undo reverses position and field increment exactly", () => {
    const w = new InteractiveWalk();
    w.push(0b00);
    w.push(0b11);
    const midX = w.x, midY = w.y;
    w.push(0b01);
    const ok = w.undo();
    assert.equal(ok, true);
    assert.deepEqual({ x: w.x, y: w.y }, { x: midX, y: midY });
    assert.equal(w.codes.length, 2);
  });

  test("undo does not under-decrement a cell that was already at CAP", () => {
    const w = new InteractiveWalk();
    // Drive the bishop into the (0,0) corner and pin it there, then pile on
    // extra visits past the cap.
    for (let i = 0; i < 40; i++) w.push(0b00);
    const idx = 0; // corner cell (0,0)
    assert.equal(w.field[idx], CAP);
    w.undo(); // this move didn't actually increment the (already-capped) field
    assert.equal(w.field[idx], CAP, "undo must not decrement a cell that was already saturated");
  });

  test("undo on an empty walk is a no-op that reports false", () => {
    const w = new InteractiveWalk();
    assert.equal(w.undo(), false);
  });

  test("reset clears everything back to the initial state", () => {
    const w = new InteractiveWalk();
    w.push(0b01);
    w.push(0b10);
    w.finish(); // not at a boundary yet (2 moves), should fail
    assert.equal(w.finished, false);
    w.push(0b11);
    w.push(0b00);
    assert.equal(w.finish(), true); // now at a 4-move boundary
    assert.equal(w.finished, true);

    w.reset();
    assert.deepEqual({ x: w.x, y: w.y }, START);
    assert.equal(w.codes.length, 0);
    assert.equal(w.finished, false);
    assert.ok(w.field.every((v) => v === 0));
  });

  test("finish() only succeeds at a 4-move boundary, and pushing again un-finishes", () => {
    const w = new InteractiveWalk();
    w.push(0b01);
    w.push(0b10);
    w.push(0b11);
    assert.equal(w.atByteBoundary, false);
    assert.equal(w.finish(), false);
    assert.equal(w.finished, false);

    w.push(0b00); // 4th move -> boundary
    assert.equal(w.atByteBoundary, true);
    assert.equal(w.finish(), true);
    assert.equal(w.finished, true);

    w.push(0b01); // resuming after finish
    assert.equal(w.finished, false);
  });

  test("partialCodes reflects moves not yet forming a complete byte", () => {
    const w = new InteractiveWalk();
    w.push(0b01);
    w.push(0b10);
    assert.deepEqual(w.partialCodes, [0b01, 0b10]);
    assert.equal(w.completedBytes.length, 0);
    w.push(0b11);
    w.push(0b00);
    assert.deepEqual(w.partialCodes, []);
    assert.equal(w.completedBytes.length, 1);
  });

  console.log(`test_interactiveWalk: ${count} assertions passed`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}
