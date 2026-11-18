/** Index of the first rising zero crossing at or after `from`, or -1. */
export function risingZeroCrossing(data: ArrayLike<number>, from: number): number {
  for (let i = Math.max(1, Math.floor(from)); i < data.length; i++) {
    if (data[i - 1] < 0 && data[i] >= 0) return i;
  }
  return -1;
}

/**
 * Loop points (in seconds) for a sustained sample: a section between two rising
 * zero crossings after the attack and before the fade-out, so the loop has no click.
 */
export function findLoopPoints(
  data: ArrayLike<number>,
  sampleRate: number,
  startSec = 1.5,
  endSec?: number,
): { loopStart: number; loopEnd: number } {
  const duration = data.length / sampleRate;
  const end = Math.min(endSec ?? duration - 1.5, duration);
  const s = risingZeroCrossing(data, startSec * sampleRate);
  const e = risingZeroCrossing(data, end * sampleRate);
  if (s < 0 || e < 0 || e <= s) {
    return { loopStart: duration * 0.3, loopEnd: duration * 0.8 };
  }
  return { loopStart: s / sampleRate, loopEnd: e / sampleRate };
}
