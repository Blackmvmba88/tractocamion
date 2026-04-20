const { Sequelize } = require('sequelize');
require('dotenv').config();

function parseIntegerEnv(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

const slowQueryThresholdMs = parseIntegerEnv(process.env.DB_SLOW_QUERY_MS, 0);
const statementTimeoutMs = parseIntegerEnv(process.env.DB_STATEMENT_TIMEOUT_MS, 15000);
const idleTransactionTimeoutMs = parseIntegerEnv(process.env.DB_IDLE_IN_TRANSACTION_TIMEOUT_MS, 10000);
const queryTimeoutMs = parseIntegerEnv(process.env.DB_QUERY_TIMEOUT_MS, statementTimeoutMs);

const logging =
  process.env.NODE_ENV === 'development'
    ? console.log
    : slowQueryThresholdMs > 0
      ? (sql, timingMs) => {
          if (typeof timingMs === 'number' && timingMs >= slowQueryThresholdMs) {
            console.warn(`[sequelize][slow:${timingMs}ms] ${sql}`);
          }
        }
      : false;

const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgresql://localhost:5432/tractocamion',
  {
    dialect: 'postgres',
    logging,
    benchmark: Boolean(logging),
    pool: {
      max: parseIntegerEnv(process.env.DB_POOL_MAX, 12),
      min: parseIntegerEnv(process.env.DB_POOL_MIN, 2),
      acquire: parseIntegerEnv(process.env.DB_POOL_ACQUIRE_MS, 20000),
      idle: parseIntegerEnv(process.env.DB_POOL_IDLE_MS, 10000),
      evict: parseIntegerEnv(process.env.DB_POOL_EVICT_MS, 1000),
      maxUses: parseIntegerEnv(process.env.DB_POOL_MAX_USES, 5000)
    },
    retry: {
      max: parseIntegerEnv(process.env.DB_RETRY_MAX, 2),
      match: [
        /SequelizeConnectionAcquireTimeoutError/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeConnectionTimedOutError/,
        /ETIMEDOUT/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /57P01/
      ]
    },
    dialectOptions: {
      keepAlive: true,
      application_name: process.env.DB_APP_NAME || 'tractocamion-api',
      statement_timeout: statementTimeoutMs,
      query_timeout: queryTimeoutMs,
      idle_in_transaction_session_timeout: idleTransactionTimeoutMs,
      ssl: process.env.DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : undefined
    }
  }
);

module.exports = sequelize;
