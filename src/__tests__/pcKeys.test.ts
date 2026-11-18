import { describe, expect, it } from 'vitest';
import { windowKeys } from '../music/notes';
import { capFor, chordTypeIndex, pcBase, pcHints, pcNote } from '../music/pcKeys';

describe('pc keyboard', () => {
  it('maps the home row to white keys and the row above to black keys', () => {
    expect(pcNote('KeyA', 60)).toBe(60);
    expect(pcNote('KeyW', 60)).toBe(61);
    expect(pcNote('KeyF', 60)).toBe(65);
    expect(pcNote('KeyY', 60)).toBe(68);
    expect(pcNote('KeyK', 60)).toBe(72);
    expect(pcNote('Quote', 60)).toBe(77);
    expect(pcNote('KeyQ', 60)).toBeNull();
  });

  it('respects the limit and the top of the piano', () => {
    expect(pcNote('KeyK', 60, 12)).toBeNull();
    expect(pcNote('KeyJ', 60, 12)).toBe(71);
    expect(pcNote('KeyA', 108)).toBe(108);
    expect(pcNote('KeyW', 108)).toBeNull();
  });

  it('starts at the first c of the visible keys', () => {
    expect(pcBase(windowKeys(23, 14))).toBe(60); // c¹ is white key 23
    expect(pcBase(windowKeys(22, 14))).toBe(60); // window starts at h
    expect(pcBase([64, 65, 66, 67])).toBe(64); // no c: first key
  });

  it('shows German key caps without a layout and browser caps with one', () => {
    expect(capFor('KeyY')).toBe('Z');
    expect(capFor('Semicolon')).toBe('Ö');
    expect(capFor('KeyA')).toBe('A');
    expect(capFor('KeyY', new Map([['KeyY', 'y']]))).toBe('Y');
    expect(pcHints(60, undefined, 12).size).toBe(12);
  });

  it('maps digits to chord types', () => {
    expect(chordTypeIndex('Digit1')).toBe(0);
    expect(chordTypeIndex('Numpad4')).toBe(3);
    expect(chordTypeIndex('Digit5')).toBeNull();
  });
});
