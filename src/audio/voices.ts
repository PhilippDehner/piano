export interface VoiceOutput {
  attack(midi: number): void;
  release(midi: number): void;
}

/**
 * Tracks which notes are held (by fingers or the sustain pedal) and turns
 * presses into attack/release calls. A note pressed by several pointers sounds
 * once; with the pedal on, released notes keep sounding until the pedal is
 * switched off.
 */
export class VoiceTracker {
  private held = new Map<number, number>();
  private sounding = new Set<number>();
  private pedal = false;

  constructor(private out: VoiceOutput) {}

  setOutput(out: VoiceOutput) {
    this.out = out;
  }

  press(midi: number) {
    const count = this.held.get(midi) ?? 0;
    if (count === 0) {
      // Re-strike a note that still rings from the pedal
      if (this.sounding.has(midi)) this.out.release(midi);
      this.out.attack(midi);
      this.sounding.add(midi);
    }
    this.held.set(midi, count + 1);
  }

  release(midi: number) {
    const count = this.held.get(midi) ?? 0;
    if (count === 0) return;
    if (count > 1) {
      this.held.set(midi, count - 1);
      return;
    }
    this.held.delete(midi);
    if (!this.pedal) {
      this.out.release(midi);
      this.sounding.delete(midi);
    }
  }

  setPedal(on: boolean) {
    this.pedal = on;
    if (on) return;
    for (const m of [...this.sounding]) {
      if (!this.held.has(m)) {
        this.out.release(m);
        this.sounding.delete(m);
      }
    }
  }

  /** Releases every note, e.g. when switching instruments. */
  releaseAll() {
    for (const m of this.sounding) this.out.release(m);
    this.sounding.clear();
    this.held.clear();
  }

  isHeld(midi: number): boolean {
    return this.held.has(midi);
  }
}
