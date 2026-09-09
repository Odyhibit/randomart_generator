// Parses user-supplied plain text into its UTF-8 byte representation.
// Multi-byte characters (emoji, accented letters, non-Latin scripts) will
// produce more than one byte per visible character — that's surfaced in the
// UI as a teaching point, not hidden.

const encoder = new TextEncoder();

/**
 * @param {string} input
 * @returns {{ok: true, bytes: Uint8Array} | {ok: false, error: string}}
 */
export function parseText(input) {
  if (input.length === 0) {
    return { ok: false, error: "Nothing to visualize — enter some text." };
  }
  return { ok: true, bytes: encoder.encode(input) };
}
