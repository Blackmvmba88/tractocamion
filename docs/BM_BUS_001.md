# BM-BUS-001

## Purpose

BM-BUS-001 is the first BlackMamba Mobility bus prototype.

The first objective is deliberately narrow:

> prove that a real bus can be observed, represented in simulation, constrained, and stopped predictably before any road deployment is considered.

This document defines the staged path from simulation to a closed-course, low-speed prototype.

## Scope

BM-BUS-001 starts with a mechanically sound used bus and adds:

- onboard computing,
- telemetry,
- sensor gateways,
- a digital twin,
- operator assistance,
- a simulation adapter,
- a black-box event record,
- an independent safety layer,
- and, only after the previous layers are validated, limited remote-command experiments in a closed test area.

The project does **not** currently implement physical actuator control.

## Development sequence

```text
SIMULATE
  ↓
VALIDATE
  ↓
INSTRUMENT
  ↓
OBSERVE
  ↓
ASSIST
  ↓
LIMITED CLOSED-COURSE CONTROL
  ↓
MEASURE
  ↓
REPLAY
  ↓
IMPROVE
```

Never:

```text
BUILD → TRUST → PUBLIC ROAD
```

## Phase 0 — Documentation

Define:

- vehicle interfaces,
- state model,
- authority hierarchy,
- safety boundaries,
- telemetry schema,
- incident model,
- test evidence requirements.

## Phase 1 — Pure simulation

The bus exists only as software.

Minimum simulated state:

- speed,
- steering angle,
- throttle request,
- brake request,
- gear,
- position,
- communications health,
- emergency-stop state,
- safety-envelope state.

Minimum simulated faults:

- loss of communication,
- stale telemetry,
- impossible command,
- sensor disagreement,
- emergency stop,
- controller restart.

## Phase 2 — Hardware in the loop

Real onboard computer, simulated vehicle.

The exact software intended for the vehicle communicates with a simulator rather than actuators.

## Phase 3 — Bench rig

Physical switches, sensors and representative interfaces outside the bus.

No vehicle motion.

## Phase 4 — Vehicle instrumentation

Install telemetry and sensing on the real bus.

The human drives. The software watches.

## Phase 5 — Assisted manual operation

The system can warn about:

- speed envelope,
- anomalous temperatures,
- stale communications,
- unexpected state transitions,
- harsh braking,
- route deviation,
- sensor inconsistency.

The human remains the driver.

## Phase 6 — Limited actuation experiments

Only after the previous phases have passed repeatable tests.

Initial physical testing must be:

- on private/closed property,
- without public passengers,
- with a qualified local safety operator,
- with an independent emergency stop,
- with an independent low-speed limit,
- and with a documented test plan.

A provisional research ceiling of approximately **10 km/h** is a test constraint, not an operating target.

## Phase 7 — Remote crawl

The remote operator requests intent. The vehicle-side safety controller decides whether the request is admissible.

```text
REMOTE OPERATOR
      ↓
COMMAND REQUEST
      ↓
VEHICLE GATEWAY
      ↓
SAFETY ENVELOPE
      ↓
SIMULATOR / APPROVED TEST INTERFACE
```

Internet connectivity must never be treated as a safety mechanism.

## Authority hierarchy

Highest authority first:

1. physical emergency stop / independent safety system
2. local safety operator
3. local safety controller
4. assisted-control layer
5. remote operator
6. AI assistant
7. automatic planning

A lower layer must never override a higher safety authority.

## Safe-state principle

For early experiments, uncertainty resolves toward stopping.

Examples:

- communication lost → stop request in simulation / approved safety behavior in future hardware,
- command exceeds envelope → reject,
- telemetry too stale → reject,
- emergency stop active → reject all motion requests,
- state inconsistent → freeze progression and require human review.

## Black box

Every run should preserve:

- timestamps,
- software version,
- configuration,
- operator requests,
- accepted/rejected commands,
- telemetry,
- communications health,
- warnings,
- overrides,
- emergency-stop events,
- test result.

Every physical test should be replayable against the simulator.

## Gate for any future public-road discussion

Closed-course success does not imply road readiness.

Before any public-road use, the project would need independent engineering validation, applicable permits/approvals, insurance, regulatory review, operating procedures, cybersecurity review, and a safety case appropriate to the jurisdiction and vehicle.
