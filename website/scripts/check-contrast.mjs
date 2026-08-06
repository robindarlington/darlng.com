// Zero-dependency WCAG AA contrast gate over the 9 UI-SPEC colour pairs,
// plus a token-presence guard (Guard A) and a non-vacuous table guard (Guard B).
//
// Source: W3C relative-luminance/contrast formula
// https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GLOBAL_CSS_PATH = path.resolve(__dirname, '../src/styles/global.css');

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function linearize(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance([r, g, b]) {
  const [R, G, B] = [r, g, b].map(linearize);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(hexA, hexB) {
  const lA = relativeLuminance(hexToRgb(hexA));
  const lB = relativeLuminance(hexToRgb(hexB));
  const [light, dark] = lA > lB ? [lA, lB] : [lB, lA];
  return (light + 0.05) / (dark + 0.05);
}

// Pairs from UI-SPEC.md's Contrast verification table (all 9, 4.5:1 threshold)
const pairs = [
  ['Body text on bg', '#F5F1EA', '#0A0908', 4.5],
  ['Body text on surface', '#F5F1EA', '#171310', 4.5],
  ['Muted text on bg', '#8C8378', '#0A0908', 4.5],
  ['Muted text on surface', '#8C8378', '#171310', 4.5],
  ['Accent as text on bg', '#2DD9C5', '#0A0908', 4.5],
  ['Accent as text on surface', '#2DD9C5', '#171310', 4.5],
  ['Dark text on solid accent fill', '#0A0908', '#2DD9C5', 4.5],
  ['Error text on bg', '#F0605E', '#0A0908', 4.5],
  ['Error text on surface', '#F0605E', '#171310', 4.5],
];

let failed = false;

// Guard B — non-vacuous table. An empty or short table must never exit 0.
if (pairs.length !== 9) {
  console.log(`FAIL  Guard B: pair table has ${pairs.length} entries, expected exactly 9`);
  process.exit(1);
}

// Guard A — token presence. Every distinct hex the pair table references
// must appear in global.css (case-insensitive 6-digit #RRGGBB match), so a
// re-tint that updates CSS but not this script fails loudly instead of
// staying stale-green.
let cssSource;
try {
  cssSource = readFileSync(GLOBAL_CSS_PATH, 'utf8');
} catch (err) {
  console.log(`FAIL  Guard A: could not read ${GLOBAL_CSS_PATH}: ${err.message}`);
  process.exit(1);
}
const cssLower = cssSource.toLowerCase();

const distinctHexes = new Set();
for (const [, fg, bg] of pairs) {
  distinctHexes.add(fg.toLowerCase());
  distinctHexes.add(bg.toLowerCase());
}

let guardAFailed = false;
for (const hex of distinctHexes) {
  if (!cssLower.includes(hex)) {
    console.log(`FAIL  Guard A: ${hex} not found in ${path.relative(process.cwd(), GLOBAL_CSS_PATH)}`);
    guardAFailed = true;
  }
}
if (guardAFailed) {
  process.exit(1);
}

// Main pair check
for (const [label, fg, bg, min] of pairs) {
  const ratio = contrastRatio(fg, bg);
  const pass = ratio >= min;
  if (!pass) failed = true;
  console.log(`${pass ? 'PASS' : 'FAIL'} ${label}: ${ratio.toFixed(2)}:1 (need ${min}:1)`);
}

process.exit(failed ? 1 : 0);
