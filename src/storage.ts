import { ChordType, clampChordOctave, isChordType } from './music/chords';
import { clampLeftWhite, MIDDLE_C_WHITE_INDEX } from './music/notes';

export type LabelMode = 'none' | 'c' | 'all';
export type Instrument = 'piano' | 'organ';
export type Mode = 'piano' | 'chords';

export interface AppState {
  /** Number of white keys shown in landscape (portrait shows about half). */
  whiteKeys: number;
  labels: LabelMode;
  vibration: boolean;
  /** Index of the leftmost visible white key. */
  leftWhite: number;
  instrument: Instrument;
  mode: Mode;
  chordType: ChordType;
  /** Octave of the chord-mode keyboard (4 = c¹ to h¹). */
  chordOctave: number;
  /** Show the computer-keyboard mapping on the keys (desktop only). */
  keyHints: boolean;
}

export const WHITE_KEYS_MIN = 7;
export const WHITE_KEYS_MAX = 36;

export const DEFAULT_STATE: AppState = {
  whiteKeys: 14,
  labels: 'all',
  vibration: false,
  leftWhite: MIDDLE_C_WHITE_INDEX,
  instrument: 'piano',
  mode: 'piano',
  chordType: 'major',
  chordOctave: 4,
  keyHints: true,
};

/** Defaults on desktop browsers: three octaves from c. */
export const DESKTOP_DEFAULTS: Partial<AppState> = {
  whiteKeys: 21,
  leftWhite: MIDDLE_C_WHITE_INDEX - 7,
};

export function defaultState(desktop: boolean): AppState {
  return { ...DEFAULT_STATE, ...(desktop ? DESKTOP_DEFAULTS : {}) };
}

const KEY = 'piano:state';

/** White keys shown in portrait: about half, at least one octave. */
export function portraitWhiteKeys(whiteKeys: number): number {
  return Math.max(WHITE_KEYS_MIN, Math.ceil(whiteKeys / 2));
}

export function clampWhiteKeys(n: number): number {
  return Math.min(Math.max(WHITE_KEYS_MIN, Math.round(n)), WHITE_KEYS_MAX);
}

/** Builds a valid state from stored data; unknown or invalid fields fall back to defaults. */
export function sanitize(raw: unknown): AppState {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_STATE;
  const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
  const whiteKeys = clampWhiteKeys(num(r.whiteKeys, d.whiteKeys));
  return {
    whiteKeys,
    labels: r.labels === 'none' || r.labels === 'c' || r.labels === 'all' ? r.labels : d.labels,
    vibration: typeof r.vibration === 'boolean' ? r.vibration : d.vibration,
    // Clamp against the smallest window so the position survives orientation changes
    leftWhite: clampLeftWhite(num(r.leftWhite, d.leftWhite), WHITE_KEYS_MIN),
    instrument: r.instrument === 'piano' || r.instrument === 'organ' ? r.instrument : d.instrument,
    mode: r.mode === 'piano' || r.mode === 'chords' ? r.mode : d.mode,
    chordType: isChordType(r.chordType) ? r.chordType : d.chordType,
    chordOctave: clampChordOctave(num(r.chordOctave, d.chordOctave)),
    keyHints: typeof r.keyHints === 'boolean' ? r.keyHints : d.keyHints,
  };
}

/** Stored state, or the defaults for this kind of device on first use. */
export function loadState(desktop = false): AppState {
  try {
    const s = localStorage.getItem(KEY);
    return s ? sanitize(JSON.parse(s)) : defaultState(desktop);
  } catch {
    return defaultState(desktop);
  }
}

export function saveState(state: AppState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: ignore
  }
}

/** Whether the app has been used before in this browser. */
export function hasStoredState(): boolean {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}
