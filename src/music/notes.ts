/** Lowest and highest key of an 88-key piano (A0 and C8) as MIDI numbers. */
export const MIDI_MIN = 21;
export const MIDI_MAX = 108;

const BLACK_PCS = new Set([1, 3, 6, 8, 10]);

export function isWhite(midi: number): boolean {
  return !BLACK_PCS.has(((midi % 12) + 12) % 12);
}

/** All white keys of the 88-key range, low to high (52 keys). */
export const WHITE_KEYS: number[] = (() => {
  const keys: number[] = [];
  for (let m = MIDI_MIN; m <= MIDI_MAX; m++) if (isWhite(m)) keys.push(m);
  return keys;
})();

export function whiteIndexOf(midi: number): number {
  return WHITE_KEYS.indexOf(midi);
}

/** Index of the white key C4 (middle C, c¹). */
export const MIDDLE_C_WHITE_INDEX = whiteIndexOf(60);

/** Pitch-class names in German spelling (black keys: cis, es, fis, as, b). */
const PC_NAMES = ['c', 'cis', 'd', 'es', 'e', 'f', 'fis', 'g', 'as', 'a', 'b', 'h'];
const SUPERSCRIPTS = ['', '¹', '²', '³', '⁴', '⁵'];
const SUBSCRIPTS = ['', '₁', '₂'];

/**
 * German note name with octave in Helmholtz notation: c¹ = middle C (MIDI 60),
 * c = small octave, C = great octave, C₁ = contra octave, A₂ = lowest key.
 */
export function germanName(midi: number): string {
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1; // scientific octave: C4 = 60
  const name = PC_NAMES[pc];
  if (octave >= 3) return name + SUPERSCRIPTS[octave - 3];
  const upper = name[0].toUpperCase() + name.slice(1);
  return upper + SUBSCRIPTS[2 - octave];
}

/** Largest valid index of the leftmost white key for a window of `count` white keys. */
export function maxLeftWhite(count: number): number {
  return Math.max(0, WHITE_KEYS.length - count);
}

export function clampLeftWhite(left: number, count: number): number {
  return Math.min(Math.max(0, Math.round(left)), maxLeftWhite(count));
}

/** Visible keys (white and black) of a window starting at white key `left`. */
export function windowKeys(left: number, count: number): number[] {
  const l = clampLeftWhite(left, count);
  const lo = WHITE_KEYS[l];
  const hi = WHITE_KEYS[Math.min(WHITE_KEYS.length - 1, l + count - 1)];
  const keys: number[] = [];
  for (let m = lo; m <= hi; m++) keys.push(m);
  return keys;
}

/** Label for a range of keys, e.g. "c¹ – h²". */
export function rangeLabel(lo: number, hi: number): string {
  return `${germanName(lo)} – ${germanName(hi)}`;
}

/** Whether a key gets a label for the given label setting. */
export function showsLabel(midi: number, mode: 'none' | 'c' | 'all'): boolean {
  if (mode === 'all') return true;
  if (mode === 'c') return midi % 12 === 0;
  return false;
}
