'use strict';

/**
 * Simulation-only safety envelope.
 *
 * This module MUST NOT be wired directly to physical vehicle actuators.
 * It validates high-level command requests for the simulator foundation.
 */

const DEFAULTS = Object.freeze({
  maxSpeedKmh: 10,
  maxCommandAgeMs: 500,
});

function validateCommand(state, command, config = {}) {
  const limits = { ...DEFAULTS, ...config };
  const now = Number.isFinite(config.nowMs) ? config.nowMs : Date.now();

  if (!state || !command) {
    return { accepted: false, reason: 'missing_state_or_command' };
  }

  if (state.estop === true) {
    return { accepted: false, reason: 'estop_active' };
  }

  if (state.linkHealthy === false) {
    return { accepted: false, reason: 'link_unhealthy' };
  }

  if (!Number.isFinite(command.timestampMs) || now - command.timestampMs > limits.maxCommandAgeMs) {
    return { accepted: false, reason: 'stale_command' };
  }

  const targetSpeedKmh = Number(command.targetSpeedKmh);
  if (!Number.isFinite(targetSpeedKmh) || targetSpeedKmh < 0) {
    return { accepted: false, reason: 'invalid_speed' };
  }

  return {
    accepted: true,
    reason: 'accepted',
    command: {
      ...command,
      targetSpeedKmh: Math.min(targetSpeedKmh, limits.maxSpeedKmh),
    },
  };
}

module.exports = {
  DEFAULTS,
  validateCommand,
};
