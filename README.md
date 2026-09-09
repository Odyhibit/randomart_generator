# Randomart Visualizer

An interactive, step-by-step teaching tool for OpenSSH's "drunken bishop"
randomart algorithm — the little ASCII-art box `ssh-keygen -lv` prints next
to a key fingerprint. It exists to answer two questions: *how* does that
picture actually get drawn from a hash, and *why* is that useful (two keys
that look visibly different are obviously different keys, no hex-string
squinting required)?

No build step, no dependencies, no server — open `index.html` (or visit the
hosted GitHub Pages version) and go.

## Try it

1. Type text, or paste hex bytes (e.g. a colon-separated fingerprint).
2. Choose **Hash mode** (matches how `ssh-keygen` really works — your input
   is hashed with MD5 or SHA256 first) or **Raw mode** (feeds your literal
   bytes straight into the walk, so you can see exactly how the walk
   consumes bytes — not standard `ssh-keygen` behavior, called out in the UI
   as such).
3. Press **Play**, or step through one move at a time, and watch the bishop
   walk the grid while the narration explains each move.
4. Click **"Load a real key's MD5 fingerprint"** to see the tool reproduce a
   genuine `ssh-keygen -lv` output byte-for-byte.

See [docs/algorithm.md](docs/algorithm.md) for the full algorithm write-up,
including the exact bit-order/clamping/capping rules and how this
implementation is verified against real `ssh-keygen` output.

## Development

Everything under `js/` runs as plain ES modules — no bundler. The `test/`
directory is a plain-Node test suite (no test framework):

```sh
node test/run_tests.mjs
```

This is the project's fidelity gate: it checks the core algorithm's bit
order/clamping/capping rules, this project's own from-scratch MD5
implementation against RFC 1321 vectors, and — most importantly — feeds real
digest bytes captured from an actual `ssh-keygen -lv` run through this
project's renderer and asserts byte-identical output (see
`test/vectors/known_answers.json` and `test/vectors/generate_vectors.sh`).

Runs automatically on every push via GitHub Actions
(`.github/workflows/test.yml`).

## Why not use SubtleCrypto for everything?

The browser's Web Crypto API supports SHA-256 natively, but deliberately does
not support MD5 — so `js/hash/md5.js` is a small from-scratch implementation
against the public RFC 1321 spec (verified against Node's own MD5 and RFC
1321's published test vectors).

## License

MIT — see [LICENSE](LICENSE).
