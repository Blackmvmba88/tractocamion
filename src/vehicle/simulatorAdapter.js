'use strict';

const { validateCommand } = require('./safetyEnvelope');

/**
 * Small deterministic simulator used to validate state transitions.
 * No physical I/O is implemented here.
 */
class BusSimulator {
  constructor(config = {}) {
    this.config = {
      maxSpeedKmh: config.maxSpeedKmh || 10,
      accelerationKmhPerStep: config.accelerationKmhPerStep || 1,
      brakingKmhPerStep: config.brakingKmhPerStep || 2,
    };

    this.state = {
      vehicleId: config.vehicleId || 'BM-BUS-001',
      mode: 'simulation',
      speedKmh: 0,
      targetSpeedKmh: 0,
      estop: false,
      linkHealthy: true,
      safetyState: 'GREEN',
      sequence: 0,
    };

    this.events = [];
  }

  record(type, details = {}) {
    this.events.push({
      sequence: ++this.state.sequence,
      type,
      details,
    });
  }

  setLinkHealthy(value) {
    this.state.linkHealthy = Boolean(value);
    this.record('link_state', { healthy: this.state.linkHealthy });

    if (!this.state.linkHealthy) {
      this.state.targetSpeedKmh = 0;
      this.state.safetyState = 'STOPPING';
    }
  }

  setEstop(active) {
    this.state.estop = Boolean(active);
    this.record('estop', { active: this.state.estop });

    if (this.state.estop) {
      this.state.targetSpeedKmh = 0;
      this.state.safetyState = 'ESTOP';
    } else if (this.state.linkHealthy) {
      this.state.safetyState = 'GREEN';
    }
  }

  request(command, nowMs = Date.now()) {
    const decision = validateCommand(this.state, command, {
      maxSpeedKmh: this.config.maxSpeedKmh,
      nowMs,
    });

    this.record('command_decision', {
      accepted: decision.accepted,
      reason: decision.reason,
      requestedSpeedKmh: command && command.targetSpeedKmh,
      appliedSpeedKmh: decision.command && decision.command.targetSpeedKmh,
    });

    if (decision.accepted) {
      this.state.targetSpeedKmh = decision.command.targetSpeedKmh;
    }

    return decision;
  }

  step() {
    if (this.state.estop) {
      this.state.speedKmh = 0;
      return this.snapshot();
    }

    if (!this.state.linkHealthy) {
      this.state.targetSpeedKmh = 0;
    }

    if (this.state.speedKmh < this.state.targetSpeedKmh) {
      this.state.speedKmh = Math.min(
        this.state.targetSpeedKmh,
        this.state.speedKmh + this.config.accelerationKmhPerStep
      );
    } else if (this.state.speedKmh > this.state.targetSpeedKmh) {
      this.state.speedKmh = Math.max(
        this.state.targetSpeedKmh,
        this.state.speedKmh - this.config.brakingKmhPerStep
      );
    }

    if (this.state.speedKmh === 0 && !this.state.linkHealthy) {
      this.state.safetyState = 'SAFE_STOP';
    } else if (!this.state.estop && this.state.linkHealthy) {
      this.state.safetyState = 'GREEN';
    }

    return this.snapshot();
  }

  snapshot() {
    return { ...this.state };
  }
}

module.exports = { BusSimulator };
