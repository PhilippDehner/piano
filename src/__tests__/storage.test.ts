import { describe, expect, it } from 'vitest';
import { DEFAULT_STATE, portraitWhiteKeys, sanitize, WHITE_KEYS_MAX, WHITE_KEYS_MIN } from '../storage';

describe('storage', () => {
  it('uses defaults for missing data', () => {
    expect(sanitize(null)).toEqual(DEFAULT_STATE);
    expect(sanitize('x')).toEqual(DEFAULT_STATE);
  });

  it('defaults to two octaves, all labels, no vibration', () => {
    expect(DEFAULT_STATE.whiteKeys).toBe(14);
    expect(DEFAULT_STATE.labels).toBe('all');
    expect(DEFAULT_STATE.vibration).toBe(false);
  });

  it('keeps valid values and repairs invalid ones', () => {
    const s = sanitize({
      whiteKeys: 100,
      labels: 'c',
      vibration: true,
      leftWhite: 999,
      instrument: 'harpsichord',
      mode: 'chords',
      chordType: 'sus4',
      chordOctave: 3,
    });
    expect(s.whiteKeys).toBe(WHITE_KEYS_MAX);
    expect(s.labels).toBe('c');
    expect(s.vibration).toBe(true);
    expect(s.leftWhite).toBe(52 - WHITE_KEYS_MIN);
    expect(s.instrument).toBe('piano');
    expect(s.mode).toBe('chords');
    expect(s.chordType).toBe('major');
    expect(s.chordOctave).toBe(3);
  });

  it('shows about half the keys in portrait', () => {
    expect(portraitWhiteKeys(14)).toBe(7);
    expect(portraitWhiteKeys(7)).toBe(7);
    expect(portraitWhiteKeys(21)).toBe(11);
  });
});
