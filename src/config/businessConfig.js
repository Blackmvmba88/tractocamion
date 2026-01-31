/**
 * Business Configuration
 * Centralized configuration for business rules and constants
 */

module.exports = {
  // Earnings calculation
  earnings: {
    BASE_RATE_PER_HOUR: parseFloat(process.env.BASE_RATE_PER_HOUR || '50'),
    EFFICIENCY_BONUS_THRESHOLD_MINUTES: parseInt(process.env.EFFICIENCY_BONUS_THRESHOLD || '60'),
    EFFICIENCY_BONUS_AMOUNT: parseFloat(process.env.EFFICIENCY_BONUS || '20')
  },

  // Performance targets
  performance: {
    TARGET_CYCLE_TIME_MINUTES: parseInt(process.env.TARGET_CYCLE_TIME || '55'),
    EFFICIENCY_THRESHOLD_MINUTES: parseInt(process.env.EFFICIENCY_THRESHOLD || '60')
  },

  // Alert thresholds
  alerts: {
    FATIGUE_THRESHOLD_HOURS: parseInt(process.env.FATIGUE_THRESHOLD_HOURS || '8'),
    DELAYED_CYCLE_THRESHOLD_HOURS: parseInt(process.env.DELAYED_CYCLE_THRESHOLD_HOURS || '2'),
    EXTENDED_REST_THRESHOLD_HOURS: parseInt(process.env.EXTENDED_REST_THRESHOLD_HOURS || '4')
  },

  // Pagination defaults
  pagination: {
    DEFAULT_LIMIT: parseInt(process.env.DEFAULT_LIMIT || '50'),
    MAX_LIMIT: parseInt(process.env.MAX_LIMIT || '100')
  }
};
