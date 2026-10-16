'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { BusSimulator } = require('../src/vehicle/simulatorAdapter');
const { validateCommand } = require('../src/vehicle/safetyEnvelope');

test('rejects future, stale, malformed and coercible commands', () => {
  const state = { estop: false, linkHealthy: true };
  const now = 10000;
  for (const command of [
    { timestampMs: now + 1, targetSpeedKmh: 1 },
    { timestampMs: now - 501, targetSpeedKmh: 1 },
    { timestampMs: now, targetSpeedKmh: '9' },
    { timestampMs: now, targetSpeedKmh: -1 },
    { timestampMs: now, targetSpeedKmh: Infinity },
  ]) {
    assert.equal(validateCommand(state, command, { nowMs: now }).accepted, false);
  }
});

test('enforces speed cap and rejects motion when link or E-STOP are unsafe', () => {
  const sim = new BusSimulator();
  const now = 10000;
  const decision = sim.request({ timestampMs: now, targetSpeedKmh: 99 }, now);
  assert.equal(decision.command.targetSpeedKmh, 10);
  for (let i = 0; i < 20; i++) sim.step();
  assert.equal(sim.snapshot().speedKmh, 10);
  sim.setLinkHealthy(false);
  assert.equal(sim.request({ timestampMs: now, targetSpeedKmh: 1 }, now).accepted, false);
  for (let i = 0; i < 20; i++) sim.step();
  assert.equal(sim.snapshot().speedKmh, 0);
  assert.equal(sim.snapshot().safetyState, 'SAFE_STOP');
});

test('E-STOP requests braking over steps and rejects movement requests', () => {
  const sim = new BusSimulator();
  sim.request({ timestampMs: 1000, targetSpeedKmh: 10 }, 1000);
  for (let i = 0; i < 10; i++) sim.step();
  sim.setEstop(true);
  assert.equal(sim.snapshot().safetyState, 'ESTOP');
  assert.equal(sim.request({ timestampMs: 1000, targetSpeedKmh: 5 }, 1000).accepted, false);
  const previous = sim.snapshot().speedKmh;
  sim.step();
  assert.equal(sim.snapshot().speedKmh, previous - 2);
  for (let i = 0; i < 10; i++) sim.step();
  assert.equal(sim.snapshot().speedKmh, 0);
});

test('rejects invalid simulator configuration', () => {
  for (const config of [{ maxSpeedKmh: 0 }, { brakingKmhPerStep: -1 }, { accelerationKmhPerStep: NaN }]) {
    assert.throws(() => new BusSimulator(config), RangeError);
  }
});
