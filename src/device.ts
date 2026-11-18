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

/** Desktop browser: a mouse or trackpad as the main pointer (no touch screen). */
export const DESKTOP_QUERY = '(hover: hover) and (pointer: fine)';

export function isDesktop(): boolean {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

type KeyboardWithLayout = { getLayoutMap?: () => Promise<ReadonlyMap<string, string>> };

/** Key caps of the user's keyboard layout, where the browser reports them (Chrome, Edge). */
export async function keyboardLayout(): Promise<ReadonlyMap<string, string> | undefined> {
  try {
    const kb = (navigator as Navigator & { keyboard?: KeyboardWithLayout }).keyboard;
    return await kb?.getLayoutMap?.();
  } catch {
    return undefined;
  }
}
