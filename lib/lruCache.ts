const CACHE_SIZE = 100;
const cache = new Map<string, string>();

export function get(key: string): string | undefined {
  const value = cache.get(key);
  if (value) {
    // Move to end (most recently used)
    cache.delete(key);
    cache.set(key, value);
  }
  return value;
}

export function set(key: string, value: string): void {
  if (cache.size >= CACHE_SIZE) {
    // Remove oldest item (first in map)
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, value);
}
