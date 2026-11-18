import { describe, expect, it } from 'vitest';
import { VoiceTracker } from '../audio/voices';

function setup() {
  const log: string[] = [];
  const t = new VoiceTracker({
    attack: (m) => log.push(`+${m}`),
    release: (m) => log.push(`-${m}`),
  });
  return { t, log };
}

describe('VoiceTracker', () => {
  it('attacks and releases a note', () => {
    const { t, log } = setup();
    t.press(60);
    t.release(60);
    expect(log).toEqual(['+60', '-60']);
  });

  it('sounds a note pressed by two fingers once', () => {
    const { t, log } = setup();
    t.press(60);
    t.press(60);
    t.release(60);
    expect(log).toEqual(['+60']);
    t.release(60);
    expect(log).toEqual(['+60', '-60']);
  });

  it('keeps released notes sounding while the pedal is on', () => {
    const { t, log } = setup();
    t.setPedal(true);
    t.press(60);
    t.release(60);
    t.press(64);
    expect(log).toEqual(['+60', '+64']);
    t.setPedal(false);
    // 64 is still held by a finger
    expect(log).toEqual(['+60', '+64', '-60']);
    t.release(64);
    expect(log).toEqual(['+60', '+64', '-60', '-64']);
  });

  it('re-strikes a note that rings from the pedal', () => {
    const { t, log } = setup();
    t.setPedal(true);
    t.press(60);
    t.release(60);
    t.press(60);
    expect(log).toEqual(['+60', '-60', '+60']);
  });

  it('ignores releases of notes that are not held', () => {
    const { t, log } = setup();
    t.release(60);
    expect(log).toEqual([]);
  });

  it('releases everything', () => {
    const { t, log } = setup();
    t.setPedal(true);
    t.press(60);
    t.release(60);
    t.press(62);
    t.releaseAll();
    expect(log.sort()).toEqual(['+60', '+62', '-60', '-62']);
    expect(t.isHeld(62)).toBe(false);
  });
});
