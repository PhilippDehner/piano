import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { allNotesOff, noteOff, noteOn, preload, setInstrument, setSustain, unlockAudio } from './audio/engine';
import WhatsNew from './components/Changelog';
import Icon from './components/icons';
import Keyboard, { KeyMark } from './components/Keyboard';
import RepeatButton from './components/RepeatButton';
import Settings from './components/Settings';
import {
  enterFullscreen,
  exitFullscreen,
  isFullscreen,
  vibrate,
} from './device';
import {
  chordNotes,
  CHORD_OCTAVE_MAX,
  CHORD_OCTAVE_MIN,
  CHORD_TYPES,
  ChordType,
  clampChordOctave,
  octaveKeys,
} from './music/chords';
import { clampLeftWhite, maxLeftWhite, rangeLabel, windowKeys } from './music/notes';
import { AppState, loadState, portraitWhiteKeys, saveState } from './storage';

function usePortrait(): boolean {
  const query = '(orientation: portrait)';
  const [portrait, setPortrait] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setPortrait(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return portrait;
}

/** How long a chord sounds when it is replayed by switching the chord type. */
const REPLAY_MS = 700;

export default function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [pressed, setPressed] = useState<ReadonlySet<number>>(new Set());
  const [sustain, setSustainState] = useState(false);
  const [fullscreen, setFullscreen] = useState(isFullscreen);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  /** Last chord played in chord mode (root), for highlighting and replay. */
  const [lastRoot, setLastRoot] = useState<number | null>(null);
  const chordsByRoot = useRef(new Map<number, number[]>());
  const portrait = usePortrait();

  const update = useCallback((patch: Partial<AppState>) => setState((s) => ({ ...s, ...patch })), []);

  useEffect(() => saveState(state), [state]);

  useEffect(() => {
    preload().then(() => setLoading(false));
  }, []);

  useEffect(() => {
    setInstrument(state.instrument);
  }, [state.instrument]);

  // Release everything when the mode changes or the app goes to the background
  useEffect(() => {
    allNotesOff();
    setPressed(new Set());
    chordsByRoot.current.clear();
  }, [state.mode]);
  useEffect(() => {
    const onHide = () => {
      if (document.hidden) {
        allNotesOff();
        setPressed(new Set());
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  useEffect(() => {
    const on = () => setFullscreen(isFullscreen());
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---------- Keyboard window ---------- */

  const whiteCount = portrait ? portraitWhiteKeys(state.whiteKeys) : state.whiteKeys;
  const left = clampLeftWhite(state.leftWhite, whiteCount);
  const pianoKeys = useMemo(() => windowKeys(left, whiteCount), [left, whiteCount]);
  const chordKeys = useMemo(() => octaveKeys(state.chordOctave), [state.chordOctave]);
  const chordMode = state.mode === 'chords';
  const keys = chordMode ? chordKeys : pianoKeys;

  const shift = (dir: -1 | 1) => {
    if (chordMode) {
      setState((s) => ({ ...s, chordOctave: clampChordOctave(s.chordOctave + dir) }));
      setLastRoot(null);
    } else {
      setState((s) => ({ ...s, leftWhite: clampLeftWhite(clampLeftWhite(s.leftWhite, whiteCount) + dir, whiteCount) }));
    }
  };
  const canLeft = chordMode ? state.chordOctave > CHORD_OCTAVE_MIN : left > 0;
  const canRight = chordMode ? state.chordOctave < CHORD_OCTAVE_MAX : left < maxLeftWhite(whiteCount);

  /* ---------- Playing ---------- */

  const markPressed = (midi: number, on: boolean) =>
    setPressed((p) => {
      const n = new Set(p);
      if (on) n.add(midi);
      else n.delete(midi);
      return n;
    });

  const handlePress = (midi: number) => {
    if (state.vibration) vibrate();
    markPressed(midi, true);
    if (chordMode) {
      const notes = chordNotes(midi, state.chordType);
      chordsByRoot.current.set(midi, notes);
      notes.forEach(noteOn);
      setLastRoot(midi);
    } else {
      noteOn(midi);
    }
  };

  const handleRelease = (midi: number) => {
    markPressed(midi, false);
    if (chordMode) {
      const notes = chordsByRoot.current.get(midi);
      chordsByRoot.current.delete(midi);
      notes?.forEach(noteOff);
    } else {
      noteOff(midi);
    }
  };

  const chooseChordType = (type: ChordType) => {
    update({ chordType: type });
    if (lastRoot === null || chordsByRoot.current.size > 0) return;
    unlockAudio();
    const notes = chordNotes(lastRoot, type);
    notes.forEach(noteOn);
    setTimeout(() => notes.forEach(noteOff), REPLAY_MS);
  };

  const marks = useMemo(() => {
    const m = new Map<number, KeyMark>();
    if (!chordMode || lastRoot === null) return m;
    const pcs = chordNotes(lastRoot, state.chordType).map((n) => n % 12);
    for (const k of chordKeys) {
      if (k === lastRoot) m.set(k, 'root');
      else if (pcs.includes(k % 12)) m.set(k, 'tone');
    }
    return m;
  }, [chordMode, lastRoot, state.chordType, chordKeys]);

  /* ---------- Top bar actions ---------- */

  const toggleSustain = () => {
    const on = !sustain;
    setSustainState(on);
    setSustain(on);
  };

  const toggleFullscreen = async () => {
    if (isFullscreen()) await exitFullscreen();
    else if (!(await enterFullscreen())) setToast('Vollbild wird nicht unterstützt');
  };

  const instrumentLabel = state.instrument === 'piano' ? 'Klavier' : 'Orgel';

  return (
    <div className={`app ${portrait ? 'portrait' : 'landscape'}`}>
      <header className="bar">
        <button
          className={`icon-button ${fullscreen ? 'active' : ''}`}
          aria-label="Vollbild"
          aria-pressed={fullscreen}
          title="Vollbild"
          onClick={toggleFullscreen}
        >
          <Icon name={fullscreen ? 'fullscreenExit' : 'fullscreen'} />
        </button>
        <button
          className={`text-button ${sustain ? 'active' : ''}`}
          aria-pressed={sustain}
          title="Sustain-Pedal"
          onClick={toggleSustain}
        >
          Pedal
        </button>

        <div className="range">
          <RepeatButton label="Nach links" onStep={() => shift(-1)} disabled={!canLeft}>
            <Icon name="left" />
          </RepeatButton>
          <span className="range-label" aria-live="polite">
            {rangeLabel(keys[0], keys[keys.length - 1])}
          </span>
          <RepeatButton label="Nach rechts" onStep={() => shift(1)} disabled={!canRight}>
            <Icon name="right" />
          </RepeatButton>
        </div>

        <button
          className="text-button"
          title="Instrument wechseln"
          aria-label={`Instrument: ${instrumentLabel}`}
          onClick={() => update({ instrument: state.instrument === 'piano' ? 'organ' : 'piano' })}
        >
          {instrumentLabel}
        </button>
        <button
          className={`text-button ${chordMode ? 'active' : ''}`}
          aria-pressed={chordMode}
          title="Akkordmodus"
          onClick={() => update({ mode: chordMode ? 'piano' : 'chords' })}
        >
          Akkorde
        </button>
        <button className="icon-button settings-button" aria-label="Einstellungen" title="Einstellungen" onClick={() => setSettingsOpen(true)}>
          <Icon name="settings" />
        </button>
      </header>

      <main className="stage">
        {chordMode && (
          <div className="chord-types" role="radiogroup" aria-label="Akkordtyp">
            {CHORD_TYPES.map((c) => (
              <button
                key={c.type}
                role="radio"
                aria-checked={state.chordType === c.type}
                className={state.chordType === c.type ? 'active' : ''}
                onClick={() => chooseChordType(c.type)}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
        <Keyboard
          keys={keys}
          labels={state.labels}
          pressed={pressed}
          marks={marks}
          onPress={handlePress}
          onRelease={handleRelease}
        />
        {loading && <div className="loading">Klänge werden geladen …</div>}
      </main>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
      {settingsOpen && <Settings state={state} onChange={update} onClose={() => setSettingsOpen(false)} />}
      <WhatsNew />
    </div>
  );
}
