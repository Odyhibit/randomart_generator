import assert from "node:assert/strict";
import { describeStep } from "../js/render/gridView.js";
import { drunkenBishop } from "../js/algorithm/drunkenBishop.js";

export function run() {
  let count = 0;
  const test = (name, fn) => {
    fn();
    count++;
  };

  test("describeStep highlights the correct 2-bit pair for each sub-step", () => {
    const byteValue = 0b10110100; // 0xB4 = 180
    const { steps } = drunkenBishop(new Uint8Array([byteValue]));
    assert.equal(steps.length, 4);

    // Low-bits-first: subIndex 0 -> rightmost pair, subIndex 3 -> leftmost pair.
    const expectedHighlight = ["00", "01", "11", "10"];
    const byteBinary = byteValue.toString(2).padStart(8, "0");
    for (let i = 0; i < 4; i++) {
      const html = describeStep(steps[i], byteValue);
      const match = html.match(/\(([01]*)<strong class="bit-highlight">([01]{2})<\/strong>([01]*)\)/);
      assert.ok(match, `expected a highlighted byte string in: ${html}`);
      const [, prefix, highlighted, suffix] = match;
      assert.equal(prefix + highlighted + suffix, byteBinary, "highlight should split the byte cleanly");
      assert.equal(highlighted, expectedHighlight[i], `sub-step ${i}`);
      // Sanity: the highlighted pair should equal this step's actual bits.
      assert.equal(parseInt(highlighted, 2), steps[i].bits);
    }
  });

  test("describeStep also bold-highlights the standalone 'pair N of 4' bits value", () => {
    const { steps } = drunkenBishop(new Uint8Array([0b11100100]));
    const html = describeStep(steps[0], 0b11100100);
    assert.match(html, /pair 1 of 4 = <strong class="bit-highlight">00<\/strong>/);
  });

  console.log(`test_narration: ${count} assertions passed`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}
