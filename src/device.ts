/** Browser features of the top bar: fullscreen, vibration. */

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

/** Many Android vibration motors do not respond to pulses shorter than ~20 ms. */
const VIBRATE_MS = 30;

export function vibrate() {
  try {
    navigator.vibrate?.(VIBRATE_MS);
  } catch {
    // Ignore
  }
}
