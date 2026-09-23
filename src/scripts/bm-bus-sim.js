'use strict';

const { BusSimulator } = require('../vehicle/simulatorAdapter');

const sim = new BusSimulator({ vehicleId: 'BM-BUS-001', maxSpeedKmh: 10 });

function print(label) {
  console.log(label, sim.snapshot());
}

// Request above the experimental envelope: simulator clamps to 10 km/h.
const t0 = Date.now();
console.log('command:', sim.request({ targetSpeedKmh: 35, timestampMs: t0 }, t0));

for (let i = 0; i < 12; i += 1) sim.step();
print('after acceleration');

// Simulate communications loss: target becomes zero and the virtual bus brakes.
sim.setLinkHealthy(false);
for (let i = 0; i < 8; i += 1) sim.step();
print('after link loss');

// Restore link, then prove emergency stop dominates.
sim.setLinkHealthy(true);
const t1 = Date.now();
sim.request({ targetSpeedKmh: 5, timestampMs: t1 }, t1);
for (let i = 0; i < 3; i += 1) sim.step();
sim.setEstop(true);
sim.step();
print('after estop');

console.log('events:', sim.events);
