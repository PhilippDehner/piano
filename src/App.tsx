import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { allNotesOff, noteOff, noteOn, preload, setInstrument, setSustain, unlockAudio } from './audio/engine';
import WhatsNew from './components/Changelog';
import Icon from './components/icons';
import Keyboard, { KeyMark } from './components/Keyboard';
import RepeatButton from './components/RepeatButton';
import Settings from './components/Settings';
import {
  closeApp,
  DESKTOP_QUERY,
  enterFullscreen,
  exitFullscreen,
  isDesktop,
  isFullscreen,
  keyboardLayout,
  lockOrientation,
  unlockOrientation,
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
import { chordTypeIndex, pcBase, pcHints, pcNote } from './music/pcKeys';
import { AppState, loadState, portraitWhiteKeys, saveState } from './storage';

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return matches;
}

/** Scroll distance (px) that shifts the keyboard by one step. */
const WHEEL_STEP = 60;

/** How long a chord sounds when it is replayed by switching the chord type. */
const REPLAY_MS = 700;

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState(isDesktop()));
  const [pressed, setPressed] = useState<ReadonlySet<number>>(new Set());
  const [sustain, setSustainState] = useState(false);
  const [fullscreen, setFullscreen] = useState(isFullscreen);
  const [locked, setLocked] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  /** Last chord played in chord mode (root), for highlighting and replay. */
  const [lastRoot, setLastRoot] = useState<number | null>(null);
  const chordsByRoot = useRef(new Map<number, number[]>());
  const portrait = useMediaQuery('(orientation: portrait)');
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const [layout, setLayout] = useState<ReadonlyMap<string, string>>();
  /** Computer keys held down, with the note each one plays. */
  const heldKeys = useRef(new Map<string, number>());
  const wheel = useRef(0);

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
    heldKeys.current.clear();
  }, [state.mode]);

  useEffect(() => {
    if (desktop) keyboardLayout().then(setLayout);
  }, [desktop]);
  useEffect(() => {
    const onHide = () => {
      if (document.hidden) {
        allNotesOff();
        setPressed(new Set());
        heldKeys.current.clear();
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  useEffect(() => {
    const on = () => {
      const fs = isFullscreen();
      setFullscreen(fs);
      if (!fs) setLocked(false); // the lock ends with fullscreen
    };
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

  const base = pcBase(keys);
  const limit = chordMode ? 12 : Infinity;
  const hints = useMemo(
    () => (desktop && state.keyHints ? pcHints(base, layout, limit) : undefined),
    [desktop, state.keyHints, base, layout, limit],
  );

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

  const toggleLock = async () => {
    if (locked) {
      unlockOrientation();
      setLocked(false);
    } else if (await lockOrientation()) {
      setLocked(true);
    } else {
      setToast('Drehsperre wird auf diesem Gerät nicht unterstützt');
    }
  };

  const close = async () => {
    if (!(await closeApp())) setToast('Die App lässt sich hier nicht schließen');
  };

  const instrumentLabel = state.instrument === 'piano' ? 'Klavier' : 'Orgel';

  /* ---------- Computer keyboard and mouse wheel ---------- */

  // The listeners are registered once and call the handlers of the latest render
  const latest = useRef({ handlePress, handleRelease, shift, toggleSustain, chooseChordType, base, limit, chordMode });
  latest.current = { handlePress, handleRelease, shift, toggleSustain, chooseChordType, base, limit, chordMode };

  useEffect(() => {
    const releaseKeys = () => {
      for (const midi of heldKeys.current.values()) latest.current.handleRelease(midi);
      heldKeys.current.clear();
    };
    const onDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.querySelector('[role="dialog"]')) return; // settings or release notes open
      const l = latest.current;
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        e.preventDefault();
        l.shift(e.code === 'ArrowLeft' ? -1 : 1);
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault(); // no page scroll, no click on a focused button
        if (!e.repeat) l.toggleSustain();
        return;
      }
      const type = chordTypeIndex(e.code);
      if (type !== null && l.chordMode) {
        e.preventDefault();
        if (!e.repeat) l.chooseChordType(CHORD_TYPES[type].type);
        return;
      }
      const midi = pcNote(e.code, l.base, l.limit);
      if (midi === null) return;
      e.preventDefault();
      if (e.repeat || heldKeys.current.has(e.code)) return;
      heldKeys.current.set(e.code, midi);
      l.handlePress(midi);
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') e.preventDefault();
      const midi = heldKeys.current.get(e.code);
      if (midi === undefined) return;
      heldKeys.current.delete(e.code);
      latest.current.handleRelease(midi);
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', releaseKeys);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', releaseKeys);
    };
  }, []);

  const onWheel = (e: React.WheelEvent) => {
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    const px = e.deltaMode === 1 ? d * 20 : d; // lines to pixels
    wheel.current += px;
    while (Math.abs(wheel.current) >= WHEEL_STEP) {
      const dir = wheel.current > 0 ? 1 : -1;
      wheel.current -= dir * WHEEL_STEP;
      shift(dir);
    }
  };

  return (
    <div className={`app ${portrait ? 'portrait' : 'landscape'} ${desktop ? 'desktop' : ''}`}>
      <header className="bar">
        {!desktop && (
          <button className="icon-button" aria-label="App schließen" title="App schließen" onClick={close}>
            <Icon name="close" />
          </button>
        )}
        <button
          className={`icon-button ${fullscreen ? 'active' : ''}`}
          aria-label="Vollbild"
          aria-pressed={fullscreen}
          title="Vollbild"
          onClick={toggleFullscreen}
        >
          <Icon name={fullscreen ? 'fullscreenExit' : 'fullscreen'} />
        </button>
        {!desktop && (
          <button
            className={`icon-button ${locked ? 'active' : ''}`}
            aria-label="Drehsperre"
            aria-pressed={locked}
            title="Drehsperre"
            onClick={toggleLock}
          >
            <Icon name={locked ? 'lock' : 'unlock'} />
          </button>
        )}
        <button
          className={`text-button ${sustain ? 'active' : ''}`}
          aria-pressed={sustain}
          title={desktop ? 'Sustain-Pedal (Leertaste)' : 'Sustain-Pedal'}
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

      <main className="stage" onWheel={onWheel}>
        {chordMode && (
          <div className="chord-types" role="radiogroup" aria-label="Akkordtyp">
            {CHORD_TYPES.map((c, i) => (
              <button
                key={c.type}
                role="radio"
                aria-checked={state.chordType === c.type}
                className={state.chordType === c.type ? 'active' : ''}
                title={desktop ? `Taste ${i + 1}` : undefined}
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
          hints={hints}
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
      {settingsOpen && <Settings state={state} desktop={desktop} onChange={update} onClose={() => setSettingsOpen(false)} />}
      <WhatsNew />
    </div>
  );
}
