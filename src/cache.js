// localStorage cache with a time-to-live, so repeated requests never hit the network.
const PREFIX = 'odyssey:';
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function getCached(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const { savedAt, data } = JSON.parse(raw);
    if (Date.now() - savedAt > TTL_MS) {
      localStorage.removeItem(PREFIX + key);
      return null;
    }
    return data;
  } catch {
    return null; // corrupted entry or storage unavailable: behave as a miss
  }
}

export function setCached(key, data) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // Storage full or blocked: the app keeps working, just without caching.
  }
}

const cacheKeys = () =>
  Object.keys(localStorage).filter((k) => k.startsWith(PREFIX));

export function clearCache() {
  cacheKeys().forEach((k) => localStorage.removeItem(k));
}

export function cacheStats() {
  const keys = cacheKeys();
  const bytes = keys.reduce((total, k) => total + (localStorage.getItem(k)?.length ?? 0), 0);
  return { entries: keys.length, kb: Math.round(bytes / 1024) };
}
