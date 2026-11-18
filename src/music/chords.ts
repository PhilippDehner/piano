import { MIDI_MAX } from './notes';

export type ChordType = 'major' | 'minor' | 'diminished' | 'augmented';

export const CHORD_TYPES: { type: ChordType; label: string; intervals: number[] }[] = [
  { type: 'major', label: 'Dur', intervals: [0, 4, 7] },
  { type: 'minor', label: 'Moll', intervals: [0, 3, 7] },
  { type: 'diminished', label: 'vermindert', intervals: [0, 3, 6] },
  { type: 'augmented', label: 'übermäßig', intervals: [0, 4, 8] },
];

export function isChordType(v: unknown): v is ChordType {
  return CHORD_TYPES.some((c) => c.type === v);
}

/** Notes of a triad in root position. */
export function chordNotes(root: number, type: ChordType): number[] {
  const def = CHORD_TYPES.find((c) => c.type === type)!;
  return def.intervals.map((i) => root + i);
}

/** Octaves (scientific numbering, C4 = middle C) selectable in chord mode; every triad stays within C8. */
export const CHORD_OCTAVE_MIN = 1;
export const CHORD_OCTAVE_MAX = Math.floor((MIDI_MAX - 11 - 8) / 12) - 1;

export function clampChordOctave(o: number): number {
  return Math.min(Math.max(CHORD_OCTAVE_MIN, Math.round(o)), CHORD_OCTAVE_MAX);
}

/** The twelve keys (C to B) of a chord-mode octave. */
export function octaveKeys(octave: number): number[] {
  const c = (octave + 1) * 12;
  return Array.from({ length: 12 }, (_, i) => c + i);
}
