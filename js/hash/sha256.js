// SHA-256 via the browser's native Web Crypto API (SubtleCrypto). Unlike
// MD5, SHA-256 is directly supported, so no custom implementation is needed.

/**
 * @param {Uint8Array} message
 * @returns {Promise<Uint8Array>} 32-byte SHA-256 digest
 */
export async function sha256(message) {
  const digest = await crypto.subtle.digest("SHA-256", message);
  return new Uint8Array(digest);
}
