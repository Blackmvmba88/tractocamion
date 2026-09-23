# BlackMamba Mobility Roadmap

## Product boundary

The immediate product is transportation.

It is not a general smart-city simulator.

The visual simulation/digital twin exists to understand and operate the transport system.

## Stage A — Reuse the existing core

Keep:

- users and roles,
- operators,
- vehicles/trucks,
- cycles,
- location tracking,
- alerts,
- analytics,
- NFC/RFID,
- PostgreSQL,
- API surface,
- dashboard.

Add a generic vehicle layer without breaking the logistics domain.

## Stage B — BM-BUS-001 simulation

Deliver:

- virtual bus state,
- safety envelope,
- command validation,
- simulated communications loss,
- emergency-stop state,
- black-box event stream,
- smoke tests.

## Stage C — Digital twin

Deliver:

- live simulated position,
- current mode,
- current mission,
- safety state,
- operator assignment,
- alert stream,
- realtime dashboard transport.

## Stage D — Passenger mobility domain

Model:

- route,
- stop,
- trip,
- capacity,
- occupancy,
- schedule,
- demand,
- incident,
- service level.

## Stage E — Demand-aware modular operations

Simulation research:

- when to group units,
- when to separate units,
- how many units continue to low-demand endpoints,
- how to avoid empty vehicle-kilometers,
- how to preserve service during contingencies.

The modular concept is most valuable while fleet size is limited; with a mature dense network it may become an exception rather than the normal operating mode.

## Stage F — Staff learning system

Documented learning path:

- passenger service,
- inspection,
- maintenance observation,
- assembly exposure,
- diagnostics,
- telemetry,
- simulation,
- emergency and evacuation procedures.

Goal: broad systems understanding before narrow specialization.

## Stage G — Emergency support

The transport system may support external emergencies and evacuations when requested by the appropriate authorities and when doing so is safe.

Potential roles:

- evacuation transport,
- stranded-passenger recovery,
- logistics,
- communications support,
- power support,
- transport of supplies.

It does not replace emergency medical, fire, police or civil-protection services.

## Stage H — Physical prototype

Only after simulation and hardware-in-the-loop gates:

- instrument a used bus,
- human drives while software observes,
- add assistance,
- validate independent safety systems,
- conduct closed-course, very-low-speed tests,
- collect evidence,
- replay every run.

## North star

> Move people well first. Earn trust through consistent service. Add responsibility only when capability is demonstrated.
