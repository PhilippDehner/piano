import { describe, expect, it } from 'vitest';
import {
  clampLeftWhite,
  germanName,
  isWhite,
  maxLeftWhite,
  MIDDLE_C_WHITE_INDEX,
  rangeLabel,
  showsLabel,
  WHITE_KEYS,
  windowKeys,
} from '../music/notes';

describe('notes', () => {
  it('has 52 white keys from A0 to C8', () => {
    expect(WHITE_KEYS).toHaveLength(52);
    expect(WHITE_KEYS[0]).toBe(21);
    expect(WHITE_KEYS[51]).toBe(108);
    expect(WHITE_KEYS[MIDDLE_C_WHITE_INDEX]).toBe(60);
  });

  it('knows white and black keys', () => {
    expect([60, 61, 62, 63, 64, 65, 66].map(isWhite)).toEqual([true, false, true, false, true, true, false]);
  });

  it('names notes in German Helmholtz notation', () => {
    expect(germanName(60)).toBe('c¹');
    expect(germanName(48)).toBe('c');
    expect(germanName(36)).toBe('C');
    expect(germanName(24)).toBe('C₁');
    expect(germanName(21)).toBe('A₂');
    expect(germanName(108)).toBe('c⁵');
    expect(germanName(71)).toBe('h¹');
    expect(germanName(70)).toBe('b¹');
    expect(germanName(61)).toBe('cis¹');
    expect(germanName(63)).toBe('es¹');
    expect(germanName(68)).toBe('as¹');
    expect(germanName(42)).toBe('Fis');
    expect(germanName(39)).toBe('Es');
  });

  it('clamps the window to the 88 keys', () => {
    expect(maxLeftWhite(14)).toBe(38);
    expect(clampLeftWhite(-3, 14)).toBe(0);
    expect(clampLeftWhite(50, 14)).toBe(38);
    expect(clampLeftWhite(10, 14)).toBe(10);
  });

  it('lists the keys of a window including black keys', () => {
    const keys = windowKeys(MIDDLE_C_WHITE_INDEX, 7);
    expect(keys[0]).toBe(60);
    expect(keys[keys.length - 1]).toBe(71);
    expect(keys).toHaveLength(12);
    const top = windowKeys(100, 14);
    expect(top[top.length - 1]).toBe(108);
    expect(top.filter(isWhite)).toHaveLength(14);
  });

  it('labels the range', () => {
    expect(rangeLabel(60, 83)).toBe('c¹ – h²');
  });

  it('decides which keys get a label', () => {
    expect(showsLabel(60, 'c')).toBe(true);
    expect(showsLabel(62, 'c')).toBe(false);
    expect(showsLabel(62, 'all')).toBe(true);
    expect(showsLabel(60, 'none')).toBe(false);
  });
});
