'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Truck } = require('../src/models');
const { updatePosition } = require('../src/controllers/truckPositionController');
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });

test('rejects missing, nonnumeric, nonfinite and out-of-range coordinates without writing', async t => {
  const update = t.mock.method(Truck, 'update', async () => [1]);
  for (const body of [{}, { latitude: null, longitude: 0 }, { latitude: '', longitude: 0 }, { latitude: '19', longitude: 0 }, { latitude: 91, longitude: 0 }, { latitude: 0, longitude: -181 }, { latitude: NaN, longitude: 0 }, { latitude: 0, longitude: Infinity }, { latitude: 0, longitude: 0, location: {} }]) {
    const res = response();
    await updatePosition({ params: { id: 'TRK-001' }, body }, res);
    assert.equal(res.code, 400);
  }
  assert.equal(update.mock.callCount(), 0);
});

test('persists zero coordinates and labels source as manual', async t => {
  const update = t.mock.method(Truck, 'update', async () => [1]);
  const res = response();
  await updatePosition({ params: { id: 'TRK-001' }, body: { latitude: 0, longitude: 0, position_source: 'gps' } }, res);
  assert.equal(res.code, 200);
  const [values, options] = update.mock.calls[0].arguments;
  assert.equal(values.latitude, 0);
  assert.equal(values.longitude, 0);
  assert.equal(values.position_source, 'manual');
  assert.ok(values.position_updated_at instanceof Date);
  assert.deepEqual(options.where, { id: 'TRK-001' });
});

test('missing unit returns 404', async t => {
  t.mock.method(Truck, 'update', async () => [0]);
  const res = response();
  await updatePosition({ params: { id: 'TRK-999' }, body: { latitude: 19, longitude: -99 } }, res);
  assert.equal(res.code, 404);
});
