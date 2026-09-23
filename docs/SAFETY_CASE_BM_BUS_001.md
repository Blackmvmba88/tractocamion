# BM-BUS-001 Safety Case — Foundation

## Status

Draft safety foundation for simulation and closed-course research.

This is not a certification and not approval for public-road operation.

## Safety objective

A single software error, network failure or bad remote command must not be sufficient by itself to create uncontrolled vehicle motion.

## Core principles

### 1. Safety is local

Remote connectivity may request behavior; it must never be the final authority.

### 2. Physical stop is independent

The future physical prototype requires an emergency-stop path that does not depend on the main application server or AI process.

### 3. Speed limiting is independent

Early closed-course experiments require a separately enforced low-speed envelope.

### 4. Fail closed

When required state is missing, stale or inconsistent, motion requests are rejected.

### 5. One unknown at a time

Do not validate a new steering interface while also validating a new network stack, AI policy and braking strategy.

### 6. Evidence over confidence

A phase passes because repeatable evidence satisfies explicit criteria, not because a demonstration looked successful.

## Initial hazards

| Hazard | Initial mitigation |
|---|---|
| stale remote command | command expiry + local validation |
| network loss | safe-state policy |
| excessive speed request | independent envelope |
| conflicting authorities | fixed authority hierarchy |
| software crash | watchdog + independent stop path |
| invalid sensor state | reject motion request |
| accidental public exposure | geofenced/closed-course test process |
| untraceable failure | black-box logging + replay |

## Simulation gate

Before hardware-in-the-loop:

- [ ] speed cap test passes repeatedly
- [ ] emergency-stop test passes repeatedly
- [ ] network-loss scenario reaches safe state
- [ ] stale command is rejected
- [ ] malformed command is rejected
- [ ] state transition log is complete
- [ ] replay reproduces the same decision outcome

## Closed-course gate

Before any powered remote-crawl test:

- [ ] documented test area
- [ ] no public passengers
- [ ] local qualified safety operator
- [ ] independent emergency stop verified
- [ ] independent speed limit verified
- [ ] communications-loss behavior verified
- [ ] manual takeover verified
- [ ] test abort criteria documented
- [ ] incident response plan available
- [ ] version/configuration frozen for the run

## Public-road boundary

No public-road testing is authorized by this repository.

Any future step beyond a closed course must be treated as a separate engineering and regulatory program.
