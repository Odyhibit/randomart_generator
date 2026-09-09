// Parses user-supplied hex input into bytes. Accepts common copy-paste
// formats: bare hex ("deadbeef"), colon-separated ("de:ad:be:ef" — the
// shape of an MD5 fingerprint line), and space-separated ("DE AD BE EF").
// Case-insensitive.
//
// Returns a result object rather than throwing, so callers (ui.js) can
// render inline error state without try/catch scattered around.

/**
 * @param {string} input
 * @returns {{ok: true, bytes: Uint8Array} | {ok: false, error: string, index?: number}}
 */
export function parseHex(input) {
  // Strip common separators (colons, spaces, tabs, newlines) that appear in
  // copy-pasted fingerprints, but keep track of the cleaned string for
  // character-accurate error reporting.
  const cleaned = input.replace(/[\s:]+/g, "");

  if (cleaned.length === 0) {
    return { ok: false, error: "Nothing to visualize — enter some hex bytes." };
  }

  if (cleaned.length % 2 !== 0) {
    return {
      ok: false,
      error: `Hex input must have an even number of digits (got ${cleaned.length}).`,
      index: cleaned.length - 1,
    };
  }

  const invalidIndex = cleaned.search(/[^0-9a-fA-F]/);
  if (invalidIndex !== -1) {
    return {
      ok: false,
      error: `Invalid hex character '${cleaned[invalidIndex]}' at position ${invalidIndex}.`,
      index: invalidIndex,
    };
  }

  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.substr(i * 2, 2), 16);
  }
  return { ok: true, bytes };
}
