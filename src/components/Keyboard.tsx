import { useRef } from 'react';
import { germanName, isWhite, showsLabel } from '../music/notes';
import type { LabelMode } from '../storage';

export type KeyMark = 'root' | 'tone';

interface Props {
  /** Contiguous keys, first and last are white keys. */
  keys: number[];
  labels: LabelMode;
  pressed: ReadonlySet<number>;
  /** Extra highlight (chord mode), by MIDI number. */
  marks?: ReadonlyMap<number, KeyMark>;
  /** Computer-key captions by MIDI number (desktop). */
  hints?: ReadonlyMap<number, string>;
  onPress: (midi: number) => void;
  onRelease: (midi: number) => void;
}

const BLACK_WIDTH = 0.62; // relative to a white key

/**
 * Piano keyboard with multitouch and glissando: every pointer plays the key under
 * it and, when it slides, releases the old key and plays the new one.
 */
export default function Keyboard({ keys, labels, pressed, marks, hints, onPress, onRelease }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, number | null>());

  const whites = keys.filter(isWhite);
  const w = 100 / whites.length;

  function keyAt(x: number, y: number): number | null {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-midi]');
    if (!el || !ref.current?.contains(el)) return null;
    return Number(el.dataset.midi);
  }

  function move(id: number, midi: number | null) {
    const old = pointers.current.get(id) ?? null;
    if (old === midi) return;
    if (old !== null) onRelease(old);
    if (midi !== null) onPress(midi);
    pointers.current.set(id, midi);
  }

  function end(id: number) {
    if (!pointers.current.has(id)) return;
    move(id, null);
    pointers.current.delete(id);
  }

  return (
    <div
      ref={ref}
      className="keyboard"
      onPointerDown={(e) => {
        e.preventDefault();
        ref.current?.setPointerCapture(e.pointerId);
        pointers.current.set(e.pointerId, null);
        move(e.pointerId, keyAt(e.clientX, e.clientY));
      }}
      onPointerMove={(e) => {
        if (pointers.current.has(e.pointerId)) move(e.pointerId, keyAt(e.clientX, e.clientY));
      }}
      onPointerUp={(e) => end(e.pointerId)}
      onPointerCancel={(e) => end(e.pointerId)}
      onLostPointerCapture={(e) => end(e.pointerId)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {keys.map((midi) => {
        const white = isWhite(midi);
        const mark = marks?.get(midi);
        const cls = [
          'key',
          white ? 'white' : 'black',
          pressed.has(midi) ? 'pressed' : '',
          mark ? `mark-${mark}` : '',
        ].join(' ');
        let style: React.CSSProperties;
        if (white) {
          style = { width: `calc(${w}% + 1px)` }; // +1px offsets the overlapping border (margin-right: -1px)
        } else {
          const whitesBefore = whites.filter((m) => m < midi).length;
          style = { left: `${(whitesBefore - BLACK_WIDTH / 2) * w}%`, width: `${w * BLACK_WIDTH}%` };
        }
        const hint = hints?.get(midi);
        return (
          <div key={midi} className={cls} style={style} data-midi={midi}>
            {hint && <span className="hint">{hint}</span>}
            {showsLabel(midi, labels) && <span className="label">{germanName(midi)}</span>}
          </div>
        );
      })}
    </div>
  );
}
