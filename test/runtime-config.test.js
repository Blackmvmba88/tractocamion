'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { validateRuntimeConfig } = require('../src/config/runtimeConfig');

const validEnv = {
  NODE_ENV: 'development',
  JWT_SECRET: 'access-secret-that-is-long-and-random-123456',
  JWT_REFRESH_SECRET: 'refresh-secret-that-is-different-987654'
};

test('runtime config accepts distinct strong secrets', () => {
  assert.doesNotThrow(() => validateRuntimeConfig(validEnv));
});

test('runtime config rejects missing or placeholder secrets', () => {
  assert.throws(
    () => validateRuntimeConfig({ JWT_SECRET: 'your-super-secret-jwt-key-change-this', JWT_REFRESH_SECRET: '' }),
    { code: 'INVALID_RUNTIME_CONFIG' }
  );
});

test('runtime config requires production database and explicit CORS origin', () => {
  assert.throws(
    () => validateRuntimeConfig({ ...validEnv, NODE_ENV: 'production', CORS_ORIGIN: '*' }),
    /DATABASE_URL.*CORS_ORIGIN/s
  );
});
