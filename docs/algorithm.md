# The drunken bishop algorithm

This document explains the algorithm behind the randomart images produced by
OpenSSH's `ssh-keygen -lv`, and how this project reimplements it.

## Where it comes from

This visualization is part of **OpenSSH**. It implements the
"drunken bishop" hash-visualization technique described by Adrian Perrig and
Dawn Song in their 1999 paper *"Hash Visualization: A New Technique to
Improve Real-World Security."* The idea: humans are much better at noticing
that two small pictures look different than at noticing that two long hex
strings differ in one character. `ssh-keygen -lv` (or `-lvE md5`/`-lvE
sha256`) prints one of these pictures next to a key's fingerprint so you can
eyeball-compare keys instead of character-comparing hashes.

## The walk

OpenSSH's implementation (`sshkey.c`, `fingerprint_randomart()`) works over a
17×9 grid:

```
FIELD_W = 17, FIELD_H = 9
AUGMENTATION_STRING = " .o+=*BOX@%&#/^SE"   (17 characters)
```

A virtual "bishop" (a chess piece that only moves diagonally) starts at the
grid's center, `(8, 4)`. It then consumes the input bytes (normally a hash
digest) one at a time. For each byte, it reads off four 2-bit codes,
**low bits first**, and moves diagonally according to each code:

| bit 0 (x) | bit 1 (y) | direction     |
|-----------|-----------|---------------|
| 0         | 0         | up-left       |
| 1         | 0         | up-right      |
| 0         | 1         | down-left     |
| 1         | 1         | down-right    |

After each move, the position is clamped to stay inside the grid (hitting an
edge just stops the bishop there rather than wrapping around), and the
visit-count for that cell is incremented — but capped at 14, so a
frequently-revisited cell doesn't overflow the character palette.

Once every byte has been consumed:
- The **fixed center cell** `(8, 4)` is marked `S` (start) — regardless of
  whether the walk revisited it.
- The bishop's **final position** is marked `E` (end). If the walk happens to
  end back at the center, `E` overwrites `S` there — the center cell prints
  `E`, not `S`.

Every other cell is rendered using its (capped) visit count as an index into
`AUGMENTATION_STRING` — unvisited cells print as a space, lightly-visited
cells as `.`, and so on up to `^` for cells visited 14+ times.

## The box

The grid is wrapped in a border whose title and footer are centered using
integer-division padding — i.e. `before = floor((17 - label.length) / 2)`
dashes, with the remainder after the label. This produces the exact same
left-biased padding real `ssh-keygen` output has for odd-length labels (e.g.
`+--[ED25519 256]--+`, `+----[SHA256]-----+`).

Real `ssh-keygen` uses the key type and bit-length for the title (e.g.
`[RSA 2048]`) and the fingerprint hash algorithm for the footer (e.g.
`[SHA256]`). Since this tool visualizes arbitrary input rather than real SSH
keys, it uses:
- **Hash mode**: `[<ALG> <digest bits>]` / `[<ALG>]`, e.g. `[MD5 128]` /
  `[MD5]` — this is the shape real `ssh-keygen` output takes, since the
  digest genuinely is what's being walked.
- **Raw mode**: `[RAW <n*8>]` / `[RAW]` — flagged as `RAW` so it's never
  mistaken for authentic `ssh-keygen` output, since real `ssh-keygen` always
  hashes the key first.

## Verifying this implementation

`test/vectors/known_answers.json` holds digest bytes and their exact
expected box output, captured directly from a real `ssh-keygen -lv` run
against locally-generated test keys (see
`test/vectors/generate_vectors.sh`). `test/test_asciiBox.mjs` feeds those
digest bytes through this project's own `drunkenBishop()` +
`renderAsciiBox()` and asserts byte-identical output — this is the
project's fidelity gate, run in CI on every push.
