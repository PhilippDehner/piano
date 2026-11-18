/** Browser features of the top bar: fullscreen, orientation lock, closing, vibration. */

type LockableOrientation = ScreenOrientation & { lock?: (o: string) => Promise<void> };

export function isFullscreen(): boolean {
  return document.fullscreenElement != null;
}

export async function enterFullscreen(): Promise<boolean> {
  try {
    await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    return true;
  } catch {
    return false;
  }
}

export async function exitFullscreen() {
  try {
    if (isFullscreen()) await document.exitFullscreen();
  } catch {
    // Ignore
  }
}

/** Locks the current orientation; needs fullscreen on Android, so it enters it first. */
export async function lockOrientation(): Promise<boolean> {
  const o = screen.orientation as LockableOrientation | undefined;
  if (!o?.lock) return false;
  if (!isFullscreen() && !(await enterFullscreen())) return false;
  try {
    await o.lock(o.type.startsWith('portrait') ? 'portrait' : 'landscape');
    return true;
  } catch {
    return false;
  }
}

export function unlockOrientation() {
  try {
    screen.orientation?.unlock();
  } catch {
    // Ignore
  }
}

/** Tries to close the app; returns false if the window is still open shortly after. */
export function closeApp(): Promise<boolean> {
  window.close();
  return new Promise((resolve) => setTimeout(() => resolve(window.closed), 300));
}

export function vibrate() {
  try {
    navigator.vibrate?.(12);
  } catch {
    // Ignore
  }
}
