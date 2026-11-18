import * as Tone from 'tone';
import type { Instrument } from '../storage';
import { findLoopPoints } from './loop';
import { VoiceOutput, VoiceTracker } from './voices';

// Low latency: play immediately instead of scheduling ahead
Tone.setContext(new Tone.Context({ latencyHint: 'interactive', lookAhead: 0 }));

const BASE = `${import.meta.env.BASE_URL}samples/`;

function sampleNames(octaves: [number, number], extra: string[]): string[] {
  const names: string[] = [];
  for (let o = octaves[0]; o <= octaves[1]; o++) for (const n of ['C', 'Ds', 'Fs', 'A']) names.push(`${n}${o}`);
  return [...names, ...extra];
}

/** Salamander piano: every minor third from A0 to C8. */
const PIANO_SAMPLES = sampleNames([1, 7], ['A0', 'C8']);
/** Organ: every minor third from C1 to C6 (no A5 above the loop range needed). */
const ORGAN_SAMPLES = [...sampleNames([1, 5], []), 'C6'];

function noteToMidi(name: string): number {
  return Tone.Frequency(name.replace('s', '#')).toMidi();
}

/* ---------- Piano: Tone.Sampler, rings out after release ---------- */

class PianoVoices implements VoiceOutput {
  private sampler: Tone.Sampler;
  loaded: Promise<void>;

  constructor() {
    const urls: Record<string, string> = {};
    for (const n of PIANO_SAMPLES) urls[n.replace('s', '#')] = `${n}.mp3`;
    let done!: () => void;
    this.loaded = new Promise((r) => (done = r));
    this.sampler = new Tone.Sampler({ urls, baseUrl: `${BASE}piano/`, release: 1.2, onload: () => done() });
    this.sampler.volume.value = -4;
    this.sampler.toDestination();
  }

  attack(midi: number) {
    this.sampler.triggerAttack(Tone.Frequency(midi, 'midi').toFrequency(), Tone.now(), 0.8);
  }

  release(midi: number) {
    this.sampler.triggerRelease(Tone.Frequency(midi, 'midi').toFrequency(), Tone.now());
  }
}

/* ---------- Organ: looped samples, stops right after release ---------- */

interface OrganSample {
  midi: number;
  buffer: Tone.ToneAudioBuffer;
  loopStart: number;
  loopEnd: number;
}

class OrganVoices implements VoiceOutput {
  private samples: OrganSample[] = [];
  private active = new Map<number, Tone.ToneBufferSource>();
  private out = new Tone.Gain(Tone.dbToGain(-10)).toDestination();
  loaded: Promise<void>;

  constructor() {
    const urls: Record<string, string> = {};
    for (const n of ORGAN_SAMPLES) urls[n] = `${n}.mp3`;
    this.loaded = new Promise((resolve) => {
      const buffers = new Tone.ToneAudioBuffers({
        urls,
        baseUrl: `${BASE}organ/`,
        onload: () => {
          for (const n of ORGAN_SAMPLES) {
            const buffer = buffers.get(n);
            const { loopStart, loopEnd } = findLoopPoints(buffer.getChannelData(0), buffer.sampleRate, 2, 10);
            this.samples.push({ midi: noteToMidi(n), buffer, loopStart, loopEnd });
          }
          resolve();
        },
      });
    });
  }

  attack(midi: number) {
    if (this.samples.length === 0) return;
    this.stop(midi);
    const s = this.samples.reduce((a, b) => (Math.abs(b.midi - midi) < Math.abs(a.midi - midi) ? b : a));
    const src = new Tone.ToneBufferSource({
      url: s.buffer,
      loop: true,
      loopStart: s.loopStart,
      loopEnd: s.loopEnd,
      playbackRate: Math.pow(2, (midi - s.midi) / 12),
      fadeIn: 0.005,
      fadeOut: 0.03,
    }).connect(this.out);
    src.start(Tone.now());
    this.active.set(midi, src);
  }

  release(midi: number) {
    this.stop(midi);
  }

  private stop(midi: number) {
    const src = this.active.get(midi);
    if (!src) return;
    this.active.delete(midi);
    src.stop(Tone.now());
    src.onended = () => src.dispose();
  }
}

/* ---------- Public API ---------- */

let voices: Record<Instrument, PianoVoices | OrganVoices> | null = null;
let current: Instrument = 'piano';
const tracker = new VoiceTracker({ attack: () => {}, release: () => {} });

function ensureVoices() {
  if (!voices) voices = { piano: new PianoVoices(), organ: new OrganVoices() };
  return voices;
}

/** Starts loading all samples (works before the audio context is unlocked). */
export function preload(): Promise<void> {
  const v = ensureVoices();
  return Promise.all([v.piano.loaded, v.organ.loaded]).then(() => undefined);
}

/** Must be called from a user gesture. */
export function unlockAudio() {
  if (Tone.getContext().state !== 'running') void Tone.start();
}

export function setInstrument(instrument: Instrument) {
  const v = ensureVoices();
  if (instrument !== current) tracker.releaseAll();
  current = instrument;
  tracker.setOutput(v[instrument]);
}

export function noteOn(midi: number) {
  unlockAudio();
  tracker.press(midi);
}

export function noteOff(midi: number) {
  tracker.release(midi);
}

export function setSustain(on: boolean) {
  tracker.setPedal(on);
}

export function allNotesOff() {
  tracker.releaseAll();
}
