import { useEffect, useState } from 'react';
import { CHANGELOG } from '../changelog';
import { APP_VERSION } from '../config';
import { AppState, LabelMode, portraitWhiteKeys, WHITE_KEYS_MAX, WHITE_KEYS_MIN } from '../storage';
import { ChangelogDialog } from './Changelog';
import Icon from './icons';

interface Props {
  state: AppState;
  /** Desktop browser: computer-keyboard options instead of vibration. */
  desktop: boolean;
  onChange: (patch: Partial<AppState>) => void;
  onClose: () => void;
}

const LABEL_OPTIONS: { value: LabelMode; label: string }[] = [
  { value: 'none', label: 'Keine' },
  { value: 'c', label: 'Nur C' },
  { value: 'all', label: 'Alle' },
];

function octaves(whiteKeys: number): string {
  const o = whiteKeys / 7;
  const text = Number.isInteger(o) ? String(o) : o.toFixed(1).replace('.', ',');
  return `${text} ${o === 1 ? 'Oktave' : 'Oktaven'}`;
}

export default function Settings({ state, desktop, onChange, onClose }: Props) {
  const [notesOpen, setNotesOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !notesOpen) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [notesOpen, onClose]);

  return (
    <>
      {desktop && <div className="settings-backdrop" onClick={onClose} />}
      <div className="settings" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <header className="settings-header">
          <h1 id="settings-title">Einstellungen</h1>
          <button className="icon-button" aria-label="Schließen" title="Schließen" onClick={onClose}>
            <Icon name="close" />
          </button>
        </header>
        <div className="settings-body">
          <section>
            <h2>Anzahl der Tasten</h2>
            <label className="slider">
              <input
                type="range"
                min={WHITE_KEYS_MIN}
                max={WHITE_KEYS_MAX}
                value={state.whiteKeys}
                onChange={(e) => onChange({ whiteKeys: Number(e.target.value) })}
              />
              <span>
                {state.whiteKeys} weiße Tasten ({octaves(state.whiteKeys)})
              </span>
            </label>
            <p className="muted">Im Hochformat: {portraitWhiteKeys(state.whiteKeys)} weiße Tasten.</p>
          </section>

          <section>
            <h2>Beschriftung</h2>
            <div className="segmented" role="radiogroup" aria-label="Beschriftung">
              {LABEL_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  role="radio"
                  aria-checked={state.labels === o.value}
                  className={state.labels === o.value ? 'active' : ''}
                  onClick={() => onChange({ labels: o.value })}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </section>

          {desktop ? (
            <section>
              <h2>PC-Tastatur</h2>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={state.keyHints}
                  onChange={(e) => onChange({ keyHints: e.target.checked })}
                />
                <span>Tastenbelegung auf der Klaviatur anzeigen</span>
              </label>
              <ul className="muted small shortcuts">
                <li>
                  <kbd>A</kbd> bis <kbd>Ä</kbd>: weiße Tasten ab dem ersten c, Reihe darüber (<kbd>W</kbd> <kbd>E</kbd>{' '}
                  <kbd>T</kbd> …): schwarze Tasten
                </li>
                <li>
                  <kbd>←</kbd> <kbd>→</kbd> oder Mausrad: Klaviatur verschieben
                </li>
                <li>
                  <kbd>Leertaste</kbd>: Sustain-Pedal
                </li>
                <li>
                  <kbd>1</kbd> bis <kbd>4</kbd>: Akkordtyp (im Akkordmodus)
                </li>
              </ul>
            </section>
          ) : (
            <section>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={state.vibration}
                  onChange={(e) => onChange({ vibration: e.target.checked })}
                />
                <span>Vibration bei Tastendruck</span>
              </label>
            </section>
          )}

          <section>
            <h2>Über die App</h2>
            <p>Version {APP_VERSION}</p>
            <button onClick={() => setNotesOpen(true)}>Release Notes</button>
            <p className="muted small">
              Klänge: Salamander Grand Piano von Alexander Holm (CC BY 3.0); Orgel aus „tonejs-instruments“ von
              Nicholaus P. Brosowsky, Aufnahmen VSO2 (CC BY 3.0).
            </p>
          </section>
        </div>
        {notesOpen && <ChangelogDialog entries={CHANGELOG} title="Release Notes" onClose={() => setNotesOpen(false)} />}
      </div>
    </>
  );
}
