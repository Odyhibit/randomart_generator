// DOM rendering of the live 17x9 randomart grid, plus the plain-language
// step narration used both as a teaching aid and as the accessible
// description of the (otherwise purely visual) grid for screen readers.

import { FIELD_W, FIELD_H, AUGMENTATION_STRING, CAP } from "../algorithm/constants.js";

/**
 * Builds the grid's DOM once and returns an `update()` function to call on
 * every animation frame / cursor change — cheap enough to rebuild cell
 * text/classes each time rather than diffing, given only 153 cells.
 *
 * @param {HTMLElement} container - element to mount the grid into
 */
export function createGridView(container) {
  container.innerHTML = "";
  container.setAttribute("role", "img");
  const table = document.createElement("div");
  table.className = "randomart-grid";
  table.style.setProperty("--grid-w", FIELD_W);

  const cells = [];
  for (let y = 0; y < FIELD_H; y++) {
    for (let x = 0; x < FIELD_W; x++) {
      const cell = document.createElement("span");
      cell.className = "cell";
      table.appendChild(cell);
      cells.push(cell);
    }
  }
  container.appendChild(table);

  /**
   * @param {object} args
   * @param {Uint8Array} args.field - current (possibly partial-walk) visit counts
   * @param {{x:number,y:number}} args.pos - current bishop position
   * @param {{x:number,y:number}} args.startPos
   * @param {{x:number,y:number} | null} args.endPos - null while the walk is still in progress
   */
  function update({ field, pos, startPos, endPos }) {
    for (let y = 0; y < FIELD_H; y++) {
      for (let x = 0; x < FIELD_W; x++) {
        const i = x + y * FIELD_W;
        const cell = cells[i];
        const isStart = x === startPos.x && y === startPos.y;
        const isEnd = endPos && x === endPos.x && y === endPos.y;
        const isCurrent = x === pos.x && y === pos.y;

        let glyphIndex;
        if (isEnd) glyphIndex = AUGMENTATION_STRING.length - 1; // 'E'
        else if (isStart) glyphIndex = AUGMENTATION_STRING.length - 2; // 'S'
        else glyphIndex = Math.min(field[i], CAP);

        cell.textContent = AUGMENTATION_STRING[glyphIndex];
        cell.classList.toggle("cell--current", isCurrent);
        cell.classList.toggle("cell--start", isStart);
        cell.classList.toggle("cell--end", !!isEnd);
        cell.dataset.count = String(field[i]);
      }
    }
    container.setAttribute(
      "aria-label",
      `Randomart grid. Bishop currently at column ${pos.x + 1}, row ${pos.y + 1} of ${FIELD_W} by ${FIELD_H}.`
    );
  }

  return { update };
}

const DIRECTION_NAMES = {
  0: "up-left",
  1: "up-right",
  2: "down-left",
  3: "down-right",
};

/**
 * Produces a plain-language description of a single micro-move, for the
 * narration panel. Pure function, independently testable.
 *
 * @param {object} step - one entry from drunkenBishop().steps
 * @param {number} byteValue - the original byte this step's bits came from
 */
export function describeStep(step, byteValue) {
  const byteBinary = byteValue.toString(2).padStart(8, "0");
  const bitsBinary = step.bits.toString(2).padStart(2, "0");
  const dir = DIRECTION_NAMES[step.bits];
  const wall =
    step.clampedX && step.clampedY
      ? " (bounced off a corner)"
      : step.clampedX
        ? " (bounced off the left/right edge)"
        : step.clampedY
          ? " (bounced off the top/bottom edge)"
          : "";
  return (
    `Byte ${step.byteIndex} = 0x${byteValue.toString(16).padStart(2, "0")} (${byteBinary}). ` +
    `Reading 2 bits at a time from the low end, pair ${step.subIndex + 1} of 4 = ${bitsBinary} → move ${dir}${wall}.`
  );
}
