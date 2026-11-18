/**
 * User-facing changelog (German, shown in the app). Newest version first.
 * Lists new features only (no fixes or small adjustments). Add an entry when a
 * release brings new features; releases without new features get no entry.
 */
export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.1.0',
    date: '2026-11-18',
    changes: [
      'Desktop-Browser: Spielen mit der PC-Tastatur (A bis Ä weiße Tasten, Reihe darüber schwarze), Belegung wird auf den Tasten angezeigt.',
      'Desktop-Browser: Pfeiltasten und Mausrad verschieben die Klaviatur, Leertaste schaltet das Pedal, 1 bis 4 wählen den Akkordtyp.',
      'Desktop-Browser: Klavier als zentrierte Karte mit Hilfezeile, Einstellungen als Dialog.',
      'Desktop-Browser: drei Oktaven als Standard; Drehsperre, App schließen und Vibration werden ausgeblendet.',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-11-18',
    changes: [
      'Erste Version: Klavier mit 88 Tasten (A₂ bis c⁵), Multitouch und Glissando, Klaviatur über Pfeile verschiebbar.',
      'Klänge: Klavier und Orgel, auch offline.',
      'Sustain-Pedal als Umschalter in der oberen Leiste.',
      'Akkordmodus: Dur, Moll, vermindert und übermäßig auf jedem Grundton.',
      'Einstellungen: Anzahl der Tasten, Beschriftung (keine, nur C, alle) und Vibration.',
    ],
  },
];

/** Compares two "x.y.z" versions: negative if a < b, 0 if equal, positive if a > b. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/** Maximum number of releases shown on startup after an update. */
export const MAX_SHOWN_RELEASES = 3;

/** Newest entries newer than `lastSeen` (all if `lastSeen` is null), at most MAX_SHOWN_RELEASES. */
export function changesSince(lastSeen: string | null): ChangelogEntry[] {
  return CHANGELOG.filter((e) => lastSeen === null || compareVersions(e.version, lastSeen) > 0).slice(
    0,
    MAX_SHOWN_RELEASES,
  );
}
