// Constants for the OpenSSH "drunken bishop" randomart algorithm.
// Verified against OpenSSH's sshkey.c (fingerprint_randomart()).
//
// Single source of truth: the algorithm, renderer, and tests all import
// from here so a constants bug can't silently diverge between modules.

export const FIELD_W = 17; // FLDSIZE_X = FLDBASE * 2 + 1, FLDBASE = 8
export const FIELD_H = 9; // FLDSIZE_Y = FLDBASE + 1

// 17 characters: index 0..14 are ordinary visit-count glyphs (capped at 14),
// index 15 is 'S' (start), index 16 is 'E' (end).
export const AUGMENTATION_STRING = " .o+=*BOX@%&#/^SE";
export const LEN = AUGMENTATION_STRING.length - 1; // 16
export const CAP = LEN - 2; // 14 — ordinary visit counts saturate here

export const START = Object.freeze({ x: (FIELD_W / 2) | 0, y: (FIELD_H / 2) | 0 }); // {x:8, y:4}

export const START_INDEX = LEN - 1; // 15 -> 'S'
export const END_INDEX = LEN; // 16 -> 'E'
