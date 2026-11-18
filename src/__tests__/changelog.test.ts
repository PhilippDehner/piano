import { describe, expect, it } from 'vitest';
import pkg from '../../package.json';
import { CHANGELOG, changesSince, compareVersions } from '../changelog';

describe('Changelog', () => {
  it('has no entry newer than the current version', () => {
    expect(compareVersions(CHANGELOG[0].version, pkg.version)).toBeLessThanOrEqual(0);
  });
  it('is sorted newest first', () => {
    for (let i = 1; i < CHANGELOG.length; i++) {
      expect(compareVersions(CHANGELOG[i - 1].version, CHANGELOG[i].version)).toBeGreaterThan(0);
    }
  });
  it('compares versions numerically', () => {
    expect(compareVersions('1.10.0', '1.9.0')).toBeGreaterThan(0);
    expect(compareVersions('1.1', '1.1.0')).toBe(0);
  });
  it('returns nothing new for the current version', () => {
    expect(changesSince(pkg.version)).toEqual([]);
    expect(changesSince(null).length).toBeGreaterThan(0);
  });
});
