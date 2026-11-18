import { MIDI_MAX, isWhite } from './notes';

/**
 * Computer-keyboard mapping by physical key position (KeyboardEvent.code), so it
 * works the same on QWERTZ and QWERTY. The home row plays consecutive white keys
 * from the leftmost visible key; a key of the row above plays the black key
 * between the two home-row keys below it, if there is one.
 */
const WHITE_CODES = [
  'KeyA',
  'KeyS',
  'KeyD',
  'KeyF',
  'KeyG',
  'KeyH',
  'KeyJ',
  'KeyK',
  'KeyL',
  'Semicolon', // Ö
  'Quote', // Ä
  'Backslash', // #
];

/** Upper-row key between home-row keys i and i + 1. */
const BLACK_CODES = [
  'KeyW',
  'KeyE',
  'KeyR',
  'KeyT',
  'KeyY', // Z on QWERTZ
  'KeyU',
  'KeyI',
  'KeyO',
  'KeyP',
  'BracketLeft', // Ü
  'BracketRight', // +
];

const NOTE_CODES = [...WHITE_CODES, ...BLACK_CODES];

/** White key `n` steps above the white key `base`. */
function whiteAbove(base: number, n: number): number {
  let m = base;
  for (let i = 0; i < n; i++) {
    m++;
    while (!isWhite(m)) m++;
  }
  return m;
}

function noteFor(code: string, base: number): number | null {
  const w = WHITE_CODES.indexOf(code);
  if (w >= 0) return whiteAbove(base, w);
  const b = BLACK_CODES.indexOf(code);
  if (b < 0) return null;
  const below = whiteAbove(base, b);
  return isWhite(below + 1) ? null : below + 1; // no black key between e/f and h/c
}

/** Key caps on a German keyboard, used when the browser cannot report the layout. */
const QWERTZ_CAPS: Record<string, string> = {
  KeyY: 'Z',
  Semicolon: 'Ö',
  Quote: 'Ä',
  BracketLeft: 'Ü',
  BracketRight: '+',
  Backslash: '#',
};

export function capFor(code: string, layout?: ReadonlyMap<string, string>): string {
  const fromLayout = layout?.get(code);
  if (fromLayout) return fromLayout.toUpperCase();
  return QWERTZ_CAPS[code] ?? code.replace(/^Key/, '');
}

/** Chord-type shortcuts: digits 1 to 4. */
export function chordTypeIndex(code: string): number | null {
  const m = /^(?:Digit|Numpad)([1-4])$/.exec(code);
  return m ? Number(m[1]) - 1 : null;
}

/** MIDI note of the computer key's base: the leftmost visible white key. */
export function pcBase(keys: readonly number[]): number {
  return keys.find(isWhite) ?? keys[0];
}

/**
 * Note played by a computer key, or null if the key is not mapped or the note
 * falls outside `limit` semitones from the base or the piano range.
 */
export function pcNote(code: string, base: number, limit = Infinity): number | null {
  const midi = noteFor(code, base);
  if (midi === null || midi - base >= limit) return null;
  return midi <= MIDI_MAX ? midi : null;
}

/** Computer key captions by MIDI note, for showing the mapping on the keys. */
export function pcHints(base: number, layout?: ReadonlyMap<string, string>, limit = Infinity): Map<number, string> {
  const hints = new Map<number, string>();
  for (const code of NOTE_CODES) {
    const midi = pcNote(code, base, limit);
    if (midi !== null) hints.set(midi, capFor(code, layout));
  }
  return hints;
}
