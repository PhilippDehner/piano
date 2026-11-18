import { ReactNode, useEffect, useRef } from 'react';

interface Props {
  onStep: () => void;
  disabled?: boolean;
  label: string;
  children: ReactNode;
}

const FIRST_DELAY = 400;
const INTERVAL = 110;

/** Button that fires once on press and keeps firing while held. */
export default function RepeatButton({ onStep, disabled, label, children }: Props) {
  const timer = useRef<number | undefined>(undefined);
  const step = useRef(onStep);
  step.current = onStep;

  const stop = () => {
    window.clearTimeout(timer.current);
    window.clearInterval(timer.current);
    timer.current = undefined;
  };
  useEffect(() => stop, []);
  useEffect(() => {
    if (disabled) stop();
  }, [disabled]);

  return (
    <button
      className="icon-button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onPointerDown={(e) => {
        e.preventDefault();
        stop();
        step.current();
        timer.current = window.setTimeout(() => {
          timer.current = window.setInterval(() => step.current(), INTERVAL);
        }, FIRST_DELAY);
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          step.current();
        }
      }}
    >
      {children}
    </button>
  );
}
