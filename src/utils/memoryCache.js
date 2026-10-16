'use strict';

const cache = new Map();
const pending = new Map();

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

  if (pending.has(key)) return pending.get(key);

  const request = Promise.resolve().then(factory).then((value) => {
    // A mutation may invalidate this key while its query is still running.
    if (pending.get(key) === request) set(key, value, ttlMs);
    return value;
  }).finally(() => {
    if (pending.get(key) === request) pending.delete(key);
  });
  pending.set(key, request);
  return request;
}

function invalidate(prefix) {
  for (const key of pending.keys()) {
    if (key.startsWith(prefix)) pending.delete(key);
  }
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
