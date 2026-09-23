# Vehicle Platform Architecture

TRACTOCAMION started as a yard operating system. The same core ideas generalize naturally to a vehicle platform without discarding the logistics product.

## Existing core

The repository already models:

```text
operator → tractor → cycle → location/status → alerts → analytics
```

The mobility extension generalizes this to:

```text
operator → vehicle → mission/trip → telemetry/status → safety/events → observer
```

## Platform domains

```text
TRACTOCAMION / BLACKMAMBA VEHICLE PLATFORM
│
├── logistics/          existing yard/cycle domain
├── mobility/           passenger trips, routes, stops
├── vehicle/            common vehicle state and adapters
├── simulator/          virtual vehicle integration
├── telemetry/          state, health and event streams
├── observer/           analytics and anomaly discovery
├── training/           documented staff learning
└── safety/             envelopes, authority and evidence
```

The current repository is not reorganized into these directories yet. This document establishes the boundary before code migration.

## Vehicle abstraction

Future vehicle types can share a common identity:

```json
{
  "vehicle_id": "BM-BUS-001",
  "vehicle_type": "bus",
  "mode": "simulation",
  "status": "ready",
  "position": null,
  "speed_kmh": 0,
  "communications": "healthy",
  "safety": {
    "estop": false,
    "envelope": "active"
  }
}
```

Possible types:

- tractor,
- bus,
- van,
- service vehicle,
- emergency-support module.

## Mission abstraction

A mission is broader than the current logistics cycle while preserving the cycle engine idea.

Examples:

- yard cargo cycle,
- passenger trip,
- repositioning,
- maintenance movement,
- evacuation support,
- emergency logistics support.

The existing `Cycle` model remains intact until a migration plan is approved.

## Command boundary

The web application is **not** a vehicle actuator.

```text
Dashboard / API
      ↓
command request
      ↓
vehicle gateway
      ↓
local safety controller
      ↓
simulator or separately certified hardware interface
```

No HTTP endpoint should directly map to throttle, braking or steering hardware.

## Digital twin

The digital twin is a read-mostly representation of vehicle state.

Target fields:

- identity,
- current mission,
- position,
- speed,
- powertrain health,
- communications health,
- safety state,
- operator assignment,
- active alerts,
- recent events.

The first implementation is simulated.

## Realtime transport

WebSockets are a planned transport for live UI updates, but the wire protocol is not a safety authority.

Realtime UI may lag or disconnect without changing vehicle safety behavior.

## Observer

The Observer consumes telemetry and events to identify:

- repeated delays,
- abnormal idle time,
- unusual braking,
- route bottlenecks,
- recurring component symptoms,
- maintenance patterns,
- demand patterns.

The Observer proposes and explains. Safety-critical actions require the appropriate human and engineering gate.

## Human development

Operators and onboard staff should build cross-functional knowledge over time:

```text
service
→ inspection
→ assembly exposure
→ maintenance exposure
→ telemetry
→ diagnosis
→ simulation
→ emergency procedures
→ mentoring
```

Regulated tasks still require the applicable external qualification.

## Modular transit concept

A future passenger platform may allow compatible units to operate independently or in coordinated formations.

This is a research concept only. The first software work is demand simulation and formation scheduling; no physical coupling mechanism is specified in this repository.
