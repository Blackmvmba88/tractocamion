# Yard Operating Model

Tractocamión 4.0 is a logistics yard operating system.

Its purpose is to reduce dead time, increase throughput, protect operator rest, and make every truck cycle visible from arrival to completion.

## Core Flow

```text
Truck arrives
      ↓
Operator check-in
      ↓
NFC/RFID identity verification
      ↓
Cycle created
      ↓
Yard brain assigns dock / lane / task
      ↓
Location and status updates
      ↓
Fatigue and delay monitoring
      ↓
Cycle completed
      ↓
Earnings calculated
      ↓
Operator rest / relay decision
      ↓
Next cycle optimization
```

The yard should behave like a live system, not a paperwork queue.

## Operating Principles

### 1. Every cycle is visible

No truck should disappear into the yard without a timestamped state.

Minimum states:

```text
created
checked_in
assigned
in_progress
waiting
loading
unloading
completed
cancelled
exception
```

### 2. Operators are not treated as disposable throughput

The system should optimize productivity while respecting fatigue, rest, and human dignity.

Operator state matters as much as truck state.

### 3. Paperwork should not be the bottleneck

NFC/RFID check-ins, API integration, and preloaded cycle data should replace manual repetition wherever possible.

### 4. Payment should follow completed work

The cycle is the economic unit.

A completed cycle should produce an earnings calculation immediately, even if real payment rails are implemented later.

### 5. The yard learns from every delay

Every bottleneck should become data.

The system should learn which lanes, operators, trucks, docks, and time windows create friction.

## Main Actors

| Actor | Role |
|---|---|
| Operator | Performs or supervises the cycle |
| Tractor | Physical vehicle unit |
| Manager | Oversees yard flow and exceptions |
| Admin | Manages users, roles, and configuration |
| External System | ERP, port system, warehouse system, payment rail |
| Yard Brain | Assignment and optimization logic |

## Cycle Object

Recommended conceptual cycle model:

```json
{
  "cycle_id": "cycle_001",
  "operator_id": "op_001",
  "tractor_id": "truck_014",
  "status": "in_progress",
  "created_at": "2026-05-28T00:00:00Z",
  "assigned_lane": "lane_03",
  "assigned_dock": "dock_07",
  "started_at": "2026-05-28T00:10:00Z",
  "completed_at": null,
  "current_location": {
    "lat": 18.0,
    "lng": -96.0
  },
  "alerts": [],
  "earnings_estimate": 42.50
}
```

## Yard Brain Responsibilities

The yard brain should eventually handle:

- lane assignment,
- dock assignment,
- operator-to-tractor matching,
- fatigue-aware routing,
- exception prioritization,
- cycle duration prediction,
- queue balancing,
- idle time reduction,
- throughput forecasting.

Initial implementation can be rule-based before machine learning.

## Fatigue Model

Fatigue should be treated as operational risk.

Signals:

- hours active,
- cycles completed,
- time since last rest,
- abnormal delay patterns,
- manual manager flags,
- nighttime shift risk,
- repeated high-stress cycles.

Possible alert:

```json
{
  "type": "fatigue_risk",
  "severity": "high",
  "operator_id": "op_001",
  "reason": "Operator has exceeded safe active cycle threshold.",
  "recommended_action": "assign_rest_or_relay"
}
```

## Relay Module

The relay module is one of the strongest product ideas.

Instead of stopping the whole tractor workflow because one operator is exhausted, the system can separate:

```text
vehicle continuity
operator rest
cycle completion
```

The goal is not to exploit operators harder.

The goal is to keep equipment productive while humans rest properly.

## Earnings Model

Current concept:

```text
base_rate = $50/hour
bonus = $20 for efficient cycle
```

The system should calculate earnings immediately after cycle completion.

Future payment integrations must be safety-gated and auditable.

## Exception Handling

The system should explicitly track exceptions:

```text
missing_operator
missing_tractor
dock_blocked
fatigue_risk
late_cycle
manual_override
rfid_failed
location_stale
payment_pending
```

Every exception should have:

- timestamp,
- severity,
- responsible actor,
- recommended action,
- resolution status.

## MVP Operating Modes

### Demo Mode

Seeded users, fake data, local dashboard, safe credentials.

### Pilot Mode

Real users, real cycles, no real payment automation yet, strict logging.

### Production Mode

Hardened credentials, audit logs, backups, role permission tests, external integrations.

## Pilot Readiness Checklist

- [ ] Production secrets removed from repo
- [ ] Default credentials disabled or rotated
- [ ] Role permissions tested
- [ ] Cycle creation tested
- [ ] Cycle completion tested
- [ ] Earnings calculation verified
- [ ] NFC/RFID failure cases tested
- [ ] Fatigue alerts tested
- [ ] Location stale alerts tested
- [ ] Backup/restore procedure documented
- [ ] Deployment guide validated
- [ ] Incident response path defined

## Long-Term Vision

The yard becomes an intelligent operating layer.

Not just a dashboard.

Not just a CRUD app.

A live logistics brain that coordinates trucks, operators, docks, cycles, rest, earnings, and throughput in one loop.
