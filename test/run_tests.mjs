// Aggregates all test files and exit-codes non-zero on any failure.
// Run with: node test/run_tests.mjs

import { run as runDrunkenBishop } from "./test_drunkenBishop.mjs";
import { run as runAsciiBox } from "./test_asciiBox.mjs";
import { run as runMd5 } from "./test_md5.mjs";
import { run as runSha256 } from "./test_sha256.mjs";
import { run as runParsers } from "./test_parsers.mjs";
import { run as runNarration } from "./test_narration.mjs";

const suites = [
  ["test_drunkenBishop", runDrunkenBishop],
  ["test_asciiBox", runAsciiBox],
  ["test_md5", runMd5],
  ["test_sha256", runSha256],
  ["test_parsers", runParsers],
  ["test_narration", runNarration],
];

let failed = false;
for (const [name, fn] of suites) {
  try {
    await fn();
  } catch (err) {
    failed = true;
    console.error(`\n✗ ${name} FAILED`);
    console.error(err);
  }
}

if (failed) {
  console.error("\nOne or more test suites failed.");
  process.exit(1);
} else {
  console.log("\nAll test suites passed.");
}
