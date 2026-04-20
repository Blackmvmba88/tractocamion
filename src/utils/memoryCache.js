'use strict';

const cache = new Map();

function get(key) {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

function set(key, value, ttlMs) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  });

  return value;
}

async function wrap(key, ttlMs, factory) {
  const cachedValue = get(key);

  if (cachedValue !== null) {
    return cachedValue;
  }

  const value = await factory();
  return set(key, value, ttlMs);
}

function invalidate(prefix) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

module.exports = {
  get,
  set,
  wrap,
  invalidate
};
