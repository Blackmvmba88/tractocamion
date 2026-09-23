'use strict';

const assert = require('assert');
const { BusSimulator } = require('../vehicle/simulatorAdapter');

const sim = new BusSimulator({ maxSpeedKmh: 10 });

const now = Date.now();
let decision = sim.request({ targetSpeedKmh: 99, timestampMs: now }, now);
assert.strictEqual(decision.accepted, true);
assert.strictEqual(decision.command.targetSpeedKmh, 10);

for (let i = 0; i < 20; i += 1) sim.step();
assert.strictEqual(sim.snapshot().speedKmh, 10);

sim.setLinkHealthy(false);
for (let i = 0; i < 20; i += 1) sim.step();
assert.strictEqual(sim.snapshot().speedKmh, 0);
assert.strictEqual(sim.snapshot().safetyState, 'SAFE_STOP');

sim.setLinkHealthy(true);
const now2 = Date.now();
sim.request({ targetSpeedKmh: 5, timestampMs: now2 }, now2);
sim.step();
sim.setEstop(true);
sim.step();
assert.strictEqual(sim.snapshot().speedKmh, 0);
assert.strictEqual(sim.snapshot().safetyState, 'ESTOP');

const staleNow = Date.now();
decision = sim.request({ targetSpeedKmh: 1, timestampMs: staleNow - 5000 }, staleNow);
assert.strictEqual(decision.accepted, false);

console.log('BM-BUS-001 smoke checks passed');
