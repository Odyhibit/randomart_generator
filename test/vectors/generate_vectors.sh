#!/usr/bin/env bash
# Dev-only helper: regenerates test/vectors/known_answers.json fixtures using
# a real, locally-installed `ssh-keygen`. NOT run by CI (CI must stay
# offline/deterministic) — run this manually if you need to add or refresh
# known-answer vectors, then hand-transcribe the results into
# known_answers.json (or extend this script to emit JSON directly).
#
# What it does for each generated keypair:
#   1. Prints the real bordered randomart box for MD5 and SHA256 fingerprints
#      (ssh-keygen -E <alg> -lvf <pub>) — this is the "expectedBox" ground truth.
#   2. Extracts the raw fingerprint digest bytes as hex — this is the
#      "digestHex" fed into drunkenBishop() in test_asciiBox.mjs, decoupling
#      "is the walk+render correct" from "is our own MD5/SHA256 correct"
#      (that's covered separately by test_md5.mjs's RFC 1321 vectors and a
#      known SHA-256 vector).
#
# Usage: bash test/vectors/generate_vectors.sh
set -euo pipefail

d=$(mktemp -d)
trap 'rm -rf "$d"' EXIT
cd "$d"

gen() {
  local type="$1" bits="$2" name="$3"
  if [ -n "$bits" ]; then
    ssh-keygen -t "$type" -b "$bits" -f "$name" -N '' -C "$name" >/dev/null
  else
    ssh-keygen -t "$type" -f "$name" -N '' -C "$name" >/dev/null
  fi
}

show() {
  local pub="$1" alg="$2"
  echo "--- $pub ($alg) ---"
  ssh-keygen -E "$alg" -lvf "$pub"
  echo
  # Extract the raw digest hex: MD5 fingerprint is already colon-hex;
  # SHA256 fingerprint is base64 and needs decoding.
  local fp
  fp=$(ssh-keygen -E "$alg" -lf "$pub" | awk '{print $2}')
  if [ "$alg" = "md5" ]; then
    echo "digestHex: ${fp#MD5:}" | tr -d ':'
  else
    node -e "console.log('digestHex:', Buffer.from('${fp#SHA256:}', 'base64').toString('hex'))"
  fi
  echo
}

gen ed25519 "" k1
gen rsa 2048 k2

for pub in k1.pub k2.pub; do
  show "$pub" md5
  show "$pub" sha256
done
