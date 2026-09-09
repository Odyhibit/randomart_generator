# Randomart Visualizer

An interactive, step-by-step teaching tool for OpenSSH's "drunken bishop"
randomart algorithm — the little ASCII-art box `ssh-keygen -lv` prints next
to a key fingerprint. It exists to answer two questions: *how* does that
picture actually get drawn from a hash, and *why* is that useful (two keys
that look visibly different are obviously different keys, no hex-string
squinting required)?


## Try it

https://odyhibit.github.io/randomart_generator/

1. Type text, or paste hex bytes (e.g. a colon-separated fingerprint).
2. Choose **Hash mode** (matches how `ssh-keygen` really works — your input
   is hashed with MD5 or SHA256 first) or **Raw mode** (feeds your literal
   bytes straight into the walk, so you can see exactly how the walk
   consumes bytes — not standard `ssh-keygen` behavior, but it can be fun).
3. Press **Play**, or step through one move at a time, and watch the bishop
   walk the grid while the narration explains each move.
4. Click **"Load a real key's MD5 fingerprint"** to see the tool reproduce a
   genuine `ssh-keygen -lv` output byte-for-byte.

See [docs/algorithm.md](docs/algorithm.md) for the full algorithm write-up,
including the exact bit-order/clamping/capping rules.



## Why not use SubtleCrypto for everything?

The browser's Web Crypto API supports SHA-256 natively, but deliberately does
not support MD5 — so `js/hash/md5.js` is a small implementation ofthe public RFC 1321 spec.

## License

MIT — see [LICENSE](LICENSE).
