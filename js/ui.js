// DOM event wiring: input controls -> parse/hash/walk pipeline -> rendering.
// Keeps all algorithm-facing logic in the imported modules; this file only
// reads form state, calls into them, and pushes results back into the DOM.

import { parseHex } from "./input/parseHex.js";
import { parseText } from "./input/parseText.js";
import { md5 } from "./hash/md5.js";
import { sha256 } from "./hash/sha256.js";
import { drunkenBishop, foldSteps } from "./algorithm/drunkenBishop.js";
import { renderAsciiBox } from "./render/asciiBox.js";
import { createGridView, describeStep } from "./render/gridView.js";
import { StepController } from "./animation/stepController.js";

const els = {
  format: () => document.querySelector('input[name="format"]:checked').value,
  mode: () => document.querySelector('input[name="mode"]:checked').value,
  hashAlg: () => document.querySelector('input[name="hashAlg"]:checked').value,
  input: document.getElementById("input-text"),
  error: document.getElementById("input-error"),
  hashAlgFieldset: document.getElementById("hash-alg-fieldset"),
  byteDump: document.getElementById("byte-dump"),
  narration: document.getElementById("narration"),
  finalBox: document.getElementById("final-box"),
  finalBoxWrap: document.getElementById("final-box-wrap"),
  grid: document.getElementById("grid"),
  playPause: document.getElementById("btn-play-pause"),
  stepBack: document.getElementById("btn-step-back"),
  stepForward: document.getElementById("btn-step-forward"),
  reset: document.getElementById("btn-reset"),
  scrubber: document.getElementById("scrubber"),
  speed: document.getElementById("speed"),
  copyBox: document.getElementById("btn-copy"),
  modeNote: document.getElementById("mode-note"),
  loadExample: document.getElementById("btn-load-example"),
};

// A real ED25519 test key's MD5 fingerprint (captured with
// `ssh-keygen -E md5 -lvf key.pub`) — see test/vectors/known_answers.json
// for the full known-answer vector this is drawn from.
const EXAMPLE_FINGERPRINT_HEX = "c7:d2:e0:3c:1a:55:2c:7e:3a:f8:ee:b2:20:7a:77:3d";

const gridView = createGridView(els.grid);

/** @type {StepController | null} */
let controller = null;
/** @type {ReturnType<typeof drunkenBishop> | null} */
let currentResult = null;
/** @type {Uint8Array} */
let currentBytes = new Uint8Array(0);

function setError(message) {
  els.error.textContent = message || "";
  els.error.hidden = !message;
}

function updateModeNote() {
  const mode = els.mode();
  els.hashAlgFieldset.hidden = mode !== "hash";
  els.modeNote.textContent =
    mode === "raw"
      ? "Raw mode: your literal input bytes are fed directly into the walk. This is not what ssh-keygen does — it's here so you can see exactly how the walk consumes bytes."
      : "Hash mode: your input is hashed first, then the digest is walked — this matches how ssh-keygen actually generates randomart from a real key.";
}

function labelsFor(mode, hashAlg, byteLength) {
  if (mode === "hash") {
    const alg = hashAlg === "md5" ? "MD5" : "SHA256";
    const bits = byteLength * 8;
    return { title: `[${alg} ${bits}]`, footer: `[${alg}]` };
  }
  return { title: `[RAW ${byteLength * 8}]`, footer: "[RAW]" };
}

function renderByteDump(bytes, currentByteIndex) {
  els.byteDump.innerHTML = "";
  bytes.forEach((b, i) => {
    const span = document.createElement("span");
    span.className = "byte" + (i === currentByteIndex ? " byte--current" : "");
    span.textContent = b.toString(16).padStart(2, "0");
    els.byteDump.appendChild(span);
  });
}

function renderAtCursor(cursor) {
  if (!currentResult) return;
  const steps = currentResult.steps;
  const done = cursor >= steps.length;
  const folded = foldSteps(steps, cursor);

  gridView.update({
    field: folded.field,
    pos: folded.pos,
    startPos: currentResult.startPos,
    endPos: done ? currentResult.endPos : null,
  });

  if (cursor > 0) {
    const step = steps[cursor - 1];
    els.narration.textContent = describeStep(step, currentBytes[step.byteIndex]);
    renderByteDump(currentBytes, step.byteIndex);
  } else {
    els.narration.textContent = steps.length
      ? "Press play or step forward to begin the walk."
      : "No bytes to walk (empty input).";
    renderByteDump(currentBytes, -1);
  }

  const mode = els.mode();
  const hashAlg = els.hashAlg();
  const { title, footer } = labelsFor(mode, hashAlg, currentBytes.length);
  els.finalBox.textContent = renderAsciiBox({
    finalField: folded.field,
    startPos: currentResult.startPos,
    endPos: done ? currentResult.endPos : null,
    titleLabel: title,
    footerLabel: footer,
  });
  els.finalBoxWrap.hidden = false;

  els.scrubber.max = String(steps.length);
  els.scrubber.value = String(cursor);
  els.playPause.textContent = controller?.playing ? "Pause" : "Play";
  els.playPause.disabled = steps.length === 0;
  els.stepForward.disabled = done;
  els.stepBack.disabled = cursor === 0;
}

async function recompute() {
  const format = els.format();
  const mode = els.mode();
  const hashAlg = els.hashAlg();
  const text = els.input.value;

  const parsed = format === "hex" ? parseHex(text) : parseText(text);
  if (!parsed.ok) {
    setError(parsed.error);
    currentResult = null;
    controller?.destroy();
    controller = null;
    els.finalBoxWrap.hidden = true;
    renderByteDump(new Uint8Array(0), -1);
    els.narration.textContent = "";
    els.scrubber.max = "0";
    els.scrubber.value = "0";
    els.playPause.disabled = true;
    els.stepForward.disabled = true;
    els.stepBack.disabled = true;
    return;
  }
  setError(null);

  let bytes = parsed.bytes;
  if (mode === "hash") {
    bytes = hashAlg === "md5" ? md5(bytes) : await sha256(bytes);
  }
  currentBytes = bytes;
  currentResult = drunkenBishop(bytes);

  controller?.destroy();
  controller = new StepController(currentResult.steps, (cursor) => renderAtCursor(cursor));
  renderAtCursor(0);
}

export function initUI() {
  updateModeNote();
  recompute();

  els.input.addEventListener("input", () => recompute());
  document.querySelectorAll('input[name="format"]').forEach((el) => el.addEventListener("change", () => recompute()));
  document.querySelectorAll('input[name="mode"]').forEach((el) =>
    el.addEventListener("change", () => {
      updateModeNote();
      recompute();
    })
  );
  document.querySelectorAll('input[name="hashAlg"]').forEach((el) => el.addEventListener("change", () => recompute()));

  els.playPause.addEventListener("click", () => {
    if (!controller) return;
    if (controller.playing) controller.pause();
    else controller.play();
  });
  els.stepForward.addEventListener("click", () => controller?.stepForward());
  els.stepBack.addEventListener("click", () => controller?.stepBack());
  els.reset.addEventListener("click", () => controller?.reset());
  els.scrubber.addEventListener("input", () => controller?.scrubTo(Number(els.scrubber.value)));
  els.speed.addEventListener("input", () => controller?.setSpeed(Number(els.speed.value)));

  els.loadExample.addEventListener("click", () => {
    document.querySelector('input[name="format"][value="hex"]').checked = true;
    document.querySelector('input[name="mode"][value="raw"]').checked = true;
    els.input.value = EXAMPLE_FINGERPRINT_HEX;
    updateModeNote();
    recompute();
    els.input.focus();
  });

  els.copyBox.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(els.finalBox.textContent);
      const original = els.copyBox.textContent;
      els.copyBox.textContent = "Copied!";
      setTimeout(() => (els.copyBox.textContent = original), 1200);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — silently ignore;
      // the text is still selectable/copyable by hand.
    }
  });
}
