/**
 * localStorage that cannot throw. Private windows, blocked site data and
 * embedded previews all make the accessor itself raise, so every call is
 * wrapped and every read has a fallback.
 */

const PREFIX = 'vramlab.';

export function readPersisted<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writePersisted(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable - the app works without it */
  }
}

/** Drop a key, e.g. one this version no longer honours. */
export function clearPersisted(key: string): void {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* storage unavailable */
  }
}
