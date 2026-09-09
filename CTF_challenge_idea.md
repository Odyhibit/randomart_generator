# CTF challenge idea: recover the flag from a randomart box

**Status:** idea only, not built, no upcoming deadline. Notes-to-self from a
design discussion, for whenever this gets picked up.

## The concept

Give solvers only the final rendered randomart **box** (like real
`ssh-keygen -lv` output) for a flag of a known, partial format — e.g.
**4 uppercase letters + 4 digits** (8 characters). No hash step: the flag's
raw ASCII bytes are walked directly (this app's existing **Raw mode**:
Format = Hex or Text, Mode = "Use raw bytes (no hashing)" — already does
exactly this, no new app feature needed).

The hook: naive brute force works, but there's a genuinely satisfying
structural shortcut hiding in ASCII itself.

## The ASCII structural trick

Bits are consumed **low-bits-first**, 4 sub-steps per byte (see
`docs/algorithm.md`) — so the *fixed* high bits of a character class end up
being the *last* move(s) of that byte's 4-move sequence, not the first.

- **Digits (`0`-`9`, `0x30`-`0x39`):** top 4 bits are always `0011`. That
  means the **last two moves** of every digit are always the same fixed
  pair: **down-right, then up-left** (a "there and back" bounce). The first
  two moves directly encode the digit's value as 4 bits (low nibble = the
  digit itself).
- **Uppercase (`A`-`Z`, `0x41`-`0x5A`):** top 3 bits are always `010`. The
  **last move** is always **up-right**; the second-to-last move is always
  "up" (left or right depending on one bit). The first two moves encode the
  letter index (A=1 ... Z=26) in 5 bits.

Verified directly against real byte values — see conversation for the full
per-character move tables. This is the "clever" angle: recognizing these
signatures turns "guess 4.57 billion candidates" into "recognize a pattern
and read off values," at least once you have an ordered move sequence.

## The catch: order isn't in the final picture

The final box only stores **visit counts per cell**, not the order or path
that produced them — so the signature trick above applies directly to an
*ordered move trace* (e.g. this app's step-by-step animation), but only
indirectly to the *static final box*, where a solver has to first infer a
plausible move order from cell adjacency before the signature trick helps.
Decided: **ship the static box only** (more authentic, harder, still
tractable for an 8-character flag) rather than the animated trace.

## Difficulty, measured (not guessed)

- Full keyspace: `26^4 * 10^4` = **4,569,760,000** candidates.
- Naive brute force, single-threaded JS, **raw mode has no hash step** so
  it's faster to attack than a hashed version would be: ~4.4M guesses/sec →
  full keyspace in **~17 minutes**. (Trivially parallelizable further.)
- A **grammar-constrained backtracking solver** (only try the 26 valid
  letter-sequences / 10 valid digit-sequences per slot, pruned by remaining
  visit-count budget) collapses this to **hundreds–low-thousands of search
  nodes, solved in milliseconds** — this is the real gap between "brute
  force" and "use the structure," and it's dramatic.
- **Uniqueness problem, measured over 300 random flags: only ~9.3% have a
  UNIQUE reconstruction from the final grid alone.** Most have multiple
  (2 to 70+) grammar-valid candidate flags that render to the exact same
  picture — the algorithm is inherently many-to-one (ties back to the
  "can you reverse this in general" discussion — no, and this is why).
  A couple of observed collisions were even character-swap pairs (e.g.
  `ZKSJ1940` / `KZSJ1490` / `ZKSJ1490` / `KZSJ1940` all render identically).

**Practical implication:** don't publish a random flag as-is. Generate
candidates and only ship one that's been checked for a unique (or very
small, e.g. ≤5, with a submit-and-check flow) reconstruction. Checking one
candidate is cheap (~0.6ms), so "generate until unique" is trivial — no
need to special-case anything, just loop.

## Bonus teaching point found along the way: checkerboard parity

A diagonal move changes `x` and `y` by ±1 simultaneously, so `x+y`'s parity
is invariant under normal moves — exactly like a real chess bishop stuck on
one board color forever. Verified empirically (80,000 random moves, zero
counterexamples): **`(x+y) mod 2` only flips when exactly one axis gets
wall-clamped** (an edge bounce, not a corner — a corner clamps both axes at
once, which cancels out and preserves parity). This is a legitimate extra
pruning rule for a solver (or for a human tracing by hand): a candidate
move that changes checkerboard color without a justified edge-bounce is
immediately invalid.

## If/when this gets built

- A `tools/ctf_challenge_gen.mjs`-style script, reusing the real
  `js/algorithm/drunkenBishop.js` (not a scratch reimplementation), that:
  1. Generates random 4-letter+4-digit flags.
  2. Renders each via raw mode to get the final box.
  3. Runs the grammar-constrained backtracking solver to count solutions.
  4. Keeps generating until it finds one with a unique (or small) solution
     count, then outputs the flag + the box to publish.
- A companion solver/checker script as the "intended solution" reference,
  usable for grading or a writeup.
- Decide up front: strict order (4 letters then 4 digits, as assumed in the
  numbers above) or some other known-but-partial format — the solver
  generalizes to any fixed per-slot character-class layout, just needs the
  slot→class list changed.
- Consider whether to reveal the hash mode/algorithm at all, or make
  solvers first figure out it's raw ASCII with no hashing — see the earlier
  "how would you make this harder" notes for other knobs (wider charset,
  longer flag, cropped border hiding metadata).
