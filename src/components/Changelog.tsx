import { useEffect, useRef, useState } from 'react';
import { ChangelogEntry, changesSince } from '../changelog';
import { APP_VERSION } from '../config';
import { hasStoredState } from '../storage';

const KEY = 'piano:lastSeenVersion';

function readLastSeen(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function writeLastSeen() {
  try {
    localStorage.setItem(KEY, APP_VERSION);
  } catch {
    // Storage full or blocked: ignore
  }
}

/** Entries to show on startup: changes since the last visit; nothing for new users. */
function initialEntries(): ChangelogEntry[] {
  const lastSeen = readLastSeen();
  if (lastSeen === APP_VERSION) return [];
  if (lastSeen === null && !hasStoredState()) {
    writeLastSeen();
    return [];
  }
  const entries = changesSince(lastSeen);
  if (entries.length === 0) writeLastSeen();
  return entries;
}

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('de-DE');
}

export function ChangelogDialog({ entries, title, onClose }: { entries: ChangelogEntry[]; title: string; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => closeRef.current?.focus({ preventScroll: true }), []);
  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="changelog-title"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="dialog">
        <h2 id="changelog-title">{title}</h2>
        {entries.map((e) => (
          <section key={e.version}>
            <h3>
              Version {e.version} <span className="muted">· {formatDate(e.date)}</span>
            </h3>
            <ul>
              {e.changes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </section>
        ))}
        <button ref={closeRef} className="primary" onClick={onClose}>
          Schließen
        </button>
      </div>
    </div>
  );
}

/** Shows the release notes once after an update. */
export default function WhatsNew() {
  const [entries, setEntries] = useState(initialEntries);
  if (entries.length === 0) return null;
  return (
    <ChangelogDialog
      entries={entries}
      title="Neu in dieser Version"
      onClose={() => {
        writeLastSeen();
        setEntries([]);
      }}
    />
  );
}
