import { describe, expect, it } from 'vitest';
import { chordNotes, CHORD_OCTAVE_MAX, clampChordOctave, octaveKeys } from '../music/chords';
import { MIDI_MAX } from '../music/notes';

describe('chords', () => {
  it('builds triads in root position', () => {
    expect(chordNotes(60, 'major')).toEqual([60, 64, 67]);
    expect(chordNotes(60, 'minor')).toEqual([60, 63, 67]);
    expect(chordNotes(60, 'diminished')).toEqual([60, 63, 66]);
    expect(chordNotes(60, 'augmented')).toEqual([60, 64, 68]);
  });

  it('keeps every chord of the highest octave within C8', () => {
    for (const root of octaveKeys(CHORD_OCTAVE_MAX)) {
      expect(Math.max(...chordNotes(root, 'augmented'))).toBeLessThanOrEqual(MIDI_MAX);
    }
    expect(clampChordOctave(9)).toBe(CHORD_OCTAVE_MAX);
    expect(clampChordOctave(-1)).toBe(1);
  });

  it('lists the keys of an octave', () => {
    expect(octaveKeys(4)).toEqual([60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71]);
  });
});
