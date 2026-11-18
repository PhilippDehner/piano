import { MIDI_MAX } from './notes';

/**
 * Computer-keyboard mapping by physical key position (KeyboardEvent.code), so it
 * works the same on QWERTZ and QWERTY. Home row = white keys from c, the row
 * above = black keys, like a piano.
 */
const NOTE_CODES: [code: string, semitone: number][] = [
  ['KeyA', 0],
  ['KeyW', 1],
  ['KeyS', 2],
  ['KeyE', 3],
  ['KeyD', 4],
  ['KeyF', 5],
  ['KeyT', 6],
  ['KeyG', 7],
  ['KeyY', 8], // Z on QWERTZ
  ['KeyH', 9],
  ['KeyU', 10],
  ['KeyJ', 11],
  ['KeyK', 12],
  ['KeyO', 13],
  ['KeyL', 14],
  ['KeyP', 15],
  ['Semicolon', 16], // Ö
  ['Quote', 17], // Ä
  ['BracketRight', 18], // +
  ['Backslash', 19], // #
];

const SEMITONE_BY_CODE = new Map(NOTE_CODES);

/** Key caps on a German keyboard, used when the browser cannot report the layout. */
const QWERTZ_CAPS: Record<string, string> = {
  KeyY: 'Z',
  Semicolon: 'Ö',
  Quote: 'Ä',
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

/** MIDI note of the computer key's base: the first c in the visible keys. */
export function pcBase(keys: readonly number[]): number {
  return keys.find((k) => k % 12 === 0) ?? keys[0];
}

/**
 * Note played by a computer key, or null if the key is not mapped or the note
 * falls outside `limit` semitones from the base or the piano range.
 */
export function pcNote(code: string, base: number, limit = Infinity): number | null {
  const s = SEMITONE_BY_CODE.get(code);
  if (s === undefined || s >= limit) return null;
  const midi = base + s;
  return midi <= MIDI_MAX ? midi : null;
}

/** Computer key captions by MIDI note, for showing the mapping on the keys. */
export function pcHints(base: number, layout?: ReadonlyMap<string, string>, limit = Infinity): Map<number, string> {
  const hints = new Map<number, string>();
  for (const [code] of NOTE_CODES) {
    const midi = pcNote(code, base, limit);
    if (midi !== null) hints.set(midi, capFor(code, layout));
  }
  return hints;
}
