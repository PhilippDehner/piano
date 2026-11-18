import { describe, expect, it } from 'vitest';
import { findLoopPoints, risingZeroCrossing } from '../audio/loop';

describe('loop points', () => {
  it('finds rising zero crossings', () => {
    expect(risingZeroCrossing([1, -1, -0.5, 0.5, 1], 0)).toBe(3);
    expect(risingZeroCrossing([1, 1, 1], 0)).toBe(-1);
  });

  it('places the loop on rising zero crossings of a sine', () => {
    const sr = 1000;
    const data = Float32Array.from({ length: sr * 10 }, (_, i) => Math.sin((2 * Math.PI * 10 * i) / sr + 0.3));
    const { loopStart, loopEnd } = findLoopPoints(data, sr, 1.5);
    expect(loopStart).toBeGreaterThanOrEqual(1.5);
    expect(loopEnd).toBeLessThanOrEqual(8.6);
    expect(loopEnd).toBeGreaterThan(loopStart);
    // Whole number of periods (10 Hz) → seamless loop
    const periods = (loopEnd - loopStart) * 10;
    expect(Math.abs(periods - Math.round(periods))).toBeLessThan(0.02);
  });

  it('falls back for silent data', () => {
    const { loopStart, loopEnd } = findLoopPoints(new Float32Array(1000), 100);
    expect(loopEnd).toBeGreaterThan(loopStart);
  });
});
