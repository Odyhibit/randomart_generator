// Wiring for draw.html: 4 direction buttons drive an InteractiveWalk, and
// every change re-renders the grid + the growing hex output.

import { START } from "./algorithm/constants.js";
import { InteractiveWalk } from "./algorithm/interactiveWalk.js";
import { createGridView } from "./render/gridView.js";

const DIRECTION_NAMES = { 0: "up-left", 1: "up-right", 2: "down-left", 3: "down-right" };

const els = {
  grid: document.getElementById("grid"),
  narration: document.getElementById("narration"),
  byteProgress: document.getElementById("byte-progress"),
  hexOutput: document.getElementById("hex-output"),
  openInMain: document.getElementById("open-in-main"),
  btnUndo: document.getElementById("btn-undo"),
  btnReset: document.getElementById("btn-reset"),
  btnFinish: document.getElementById("btn-finish"),
  btnCopy: document.getElementById("btn-copy"),
  dirButtons: {
    0: document.getElementById("btn-up-left"),
    1: document.getElementById("btn-up-right"),
    2: document.getElementById("btn-down-left"),
    3: document.getElementById("btn-down-right"),
  },
};

const gridView = createGridView(els.grid);
const walk = new InteractiveWalk();

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
}

/** 8-char MSB-first binary string for the in-progress byte, "_" for not-yet-chosen bits. */
function partialByteBinary(partialCodes) {
  const bits = ["_", "_", "_", "_", "_", "_", "_", "_"];
  partialCodes.forEach((code, i) => {
    bits[6 - i * 2] = String((code >> 1) & 1);
    bits[7 - i * 2] = String(code & 1);
  });
  return bits.join("");
}

function render(lastCode) {
  gridView.update({
    field: walk.field,
    pos: { x: walk.x, y: walk.y },
    startPos: START,
    endPos: walk.finished ? { x: walk.x, y: walk.y } : null,
  });

  const completed = walk.completedBytes;
  const partial = walk.partialCodes;

  if (lastCode !== undefined) {
    const byteNum = Math.floor((walk.codes.length - 1) / 4);
    const pairNum = ((walk.codes.length - 1) % 4) + 1;
    els.narration.textContent =
      `Move ${walk.codes.length} (byte ${byteNum}, pair ${pairNum} of 4): ` +
      `${code2bin(lastCode)} → move ${DIRECTION_NAMES[lastCode]}.`;
  } else if (walk.codes.length === 0) {
    els.narration.textContent = "Click a direction to make your first move.";
  } else if (walk.finished) {
    els.narration.textContent = `E placed at move ${walk.codes.length}.`;
  } else {
    els.narration.textContent = `Back to move ${walk.codes.length}.`;
  }

  els.byteProgress.textContent = partial.length
    ? `${completed.length} complete byte${completed.length === 1 ? "" : "s"}, ${partial.length}/4 moves into the next one.`
    : completed.length
      ? `${completed.length} complete byte${completed.length === 1 ? "" : "s"}.`
      : "No moves yet.";

  const hexParts = [];
  if (completed.length) hexParts.push(bytesToHex(completed));
  if (partial.length) hexParts.push(`[${partialByteBinary(partial)}]`);
  els.hexOutput.textContent = hexParts.join(" ") || "(nothing drawn yet)";

  els.btnUndo.disabled = walk.codes.length === 0;
  els.btnFinish.disabled = !walk.atByteBoundary;
  els.btnFinish.textContent = walk.finished ? "Finished (E placed)" : "Finish (place E)";

  if (completed.length > 0) {
    const hex = bytesToHex(completed).replace(/\s+/g, "");
    els.openInMain.href = `index.html?raw=${hex}`;
    els.openInMain.hidden = false;
  } else {
    els.openInMain.hidden = true;
  }
}

function code2bin(code) {
  return code.toString(2).padStart(2, "0");
}

Object.entries(els.dirButtons).forEach(([code, btn]) => {
  btn.addEventListener("click", () => {
    walk.push(Number(code));
    render(Number(code));
  });
});

els.btnUndo.addEventListener("click", () => {
  walk.undo();
  render();
});

els.btnReset.addEventListener("click", () => {
  walk.reset();
  render();
});

els.btnFinish.addEventListener("click", () => {
  walk.finish();
  render();
});

els.btnCopy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(els.hexOutput.textContent);
    const original = els.btnCopy.textContent;
    els.btnCopy.textContent = "Copied!";
    setTimeout(() => (els.btnCopy.textContent = original), 1200);
  } catch {
    // Clipboard API unavailable -- text is still selectable by hand.
  }
});

export function initDrawUI() {
  render();
}
