'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const cache = require('../src/utils/memoryCache');

test('concurrent cache misses share one query', async () => {
  let calls = 0;
  const factory = async () => { calls += 1; return 42; };
  assert.deepEqual(await Promise.all([
    cache.wrap('concurrent', 1000, factory),
    cache.wrap('concurrent', 1000, factory)
  ]), [42, 42]);
  assert.equal(calls, 1);
  cache.invalidate('concurrent');
});

test('failed queries can be retried', async () => {
  await assert.rejects(cache.wrap('retry', 1000, () => { throw new Error('offline'); }));
  assert.equal(await cache.wrap('retry', 1000, () => 'online'), 'online');
  cache.invalidate('retry');
});

test('invalidation during a query prevents stale results replacing fresh data', async () => {
  let resolveOld;
  const old = cache.wrap('race', 1000, () => new Promise(resolve => { resolveOld = resolve; }));
  await Promise.resolve();
  cache.invalidate('race');
  await cache.wrap('race', 1000, () => 'fresh');
  resolveOld('stale');
  assert.equal(await old, 'stale');
  assert.equal(cache.get('race'), 'fresh');
  cache.invalidate('race');
});
