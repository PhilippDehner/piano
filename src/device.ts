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

export function vibrate() {
  try {
    navigator.vibrate?.(12);
  } catch {
    // Ignore
  }
}
