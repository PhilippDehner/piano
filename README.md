# Piano

Einfache Klavier-App als PWA für Android-Handys und Desktop-Browser. Installierbar, offline nutzbar, Oberfläche auf Deutsch.

## Funktionen

- Klaviatur mit 88 Tasten (A₂ bis c⁵), Multitouch und Glissando; Standard: zwei Oktaven sichtbar
- Hochformat: halb so viele Tasten wie im Querformat (mindestens eine Oktave)
- Pfeile verschieben um je eine weiße Taste, gedrückt halten verschiebt fortlaufend
- Klänge: Klavier (Salamander Grand Piano) und Orgel (geloopte Samples, stoppt sofort beim Loslassen)
- Sustain-Pedal als Umschalter
- Akkordmodus: Grundton aus einer Oktave, Typ Dur, Moll, vermindert, übermäßig (Grundstellung). Ein Typ ist immer gewählt (Start: Dur); ein Typwechsel spielt den letzten Akkord erneut. Die Pfeile wechseln hier die Oktave.
- Vollbild, Drehsperre (nur im Vollbild), App schließen (je nach Gerät)
- Einstellungen: Anzahl der Tasten, Beschriftung (keine / nur C / alle), Vibration, Version, Release Notes
- Desktop-Browser (Maus/Trackpad, erkannt über `(hover: hover) and (pointer: fine)`):
  - PC-Tastatur nach physischer Position: `A`–`Ä` (+ `#`) weiße Tasten ab dem ersten sichtbaren c, `W E T Z U O P +` schwarze; im Akkordmodus eine Oktave als Grundtöne
  - `←`/`→` und Mausrad verschieben, Leertaste schaltet das Pedal, `1`–`4` wählen den Akkordtyp
  - Tastenbelegung auf den Tasten (abschaltbar), Hover-Effekte, Standard drei Oktaven ab c
  - Im Fenster: Klavier als zentrierte Karte mit Titel und Hilfezeile, Tastenhöhe nach echten Proportionen; im Vollbild wie auf dem Handy
  - Einstellungen als Dialog (Esc schließt)
  - Drehsperre, App schließen und Vibration ausgeblendet
- Einstellungen und Position werden lokal gespeichert; Updates werden automatisch übernommen, danach erscheinen die Release Notes

## Entwicklung

```bash
npm install
npm run dev
```

```bash
npm run typecheck && npm test && npm run build
```

Die CI (`.github/workflows/ci.yml`) testet jeden Push und veröffentlicht `main` auf GitHub Pages
(Einstellung im Repo: Pages → Source: GitHub Actions).

Neue Funktionen kommen mit Versionssprung in `package.json` und einem Eintrag in `src/changelog.ts`.

## Lizenzen

Code: MIT. Samples: Salamander Grand Piano V3 von Alexander Holm (CC BY 3.0),
Orgel aus [tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments) (CC BY 3.0).
Details in `public/samples/*/README.txt`.
