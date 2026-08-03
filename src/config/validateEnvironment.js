'use strict';

const MIN_SECRET_LENGTH = 32;
const PLACEHOLDER_PATTERNS = [
  /change[-_ ]?this/i,
  /your[-_ ]?super[-_ ]?secret/i,
  /replace[-_ ]?me/i,
  /example/i
];

function isWeakSecret(value) {
  return !value || value.length < MIN_SECRET_LENGTH || PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));
}

function validateEnvironment(env = process.env) {
  const errors = [];
  const warnings = [];
  const isProduction = env.NODE_ENV === 'production';

  if (!env.DATABASE_URL) {
    errors.push('DATABASE_URL is required.');
  }

  if (!env.JWT_SECRET) {
    errors.push('JWT_SECRET is required.');
  }

  if (!env.JWT_REFRESH_SECRET) {
    errors.push('JWT_REFRESH_SECRET is required.');
  }

  if (isProduction) {
    if (isWeakSecret(env.JWT_SECRET)) {
      errors.push(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters and must not use a placeholder in production.`);
    }

    if (isWeakSecret(env.JWT_REFRESH_SECRET)) {
      errors.push(`JWT_REFRESH_SECRET must be at least ${MIN_SECRET_LENGTH} characters and must not use a placeholder in production.`);
    }

    if (!env.CORS_ORIGIN || env.CORS_ORIGIN === '*') {
      errors.push('CORS_ORIGIN must be an explicit trusted origin in production.');
    }
  } else {
    if (isWeakSecret(env.JWT_SECRET) || isWeakSecret(env.JWT_REFRESH_SECRET)) {
      warnings.push('Development JWT secrets are weak or still use example placeholders.');
    }

    if (!env.CORS_ORIGIN || env.CORS_ORIGIN === '*') {
      warnings.push('CORS is open to every origin. Use an explicit origin before pilot deployment.');
    }
  }

  return { errors, warnings };
}

function assertValidEnvironment(env = process.env, logger = console) {
  const result = validateEnvironment(env);

  result.warnings.forEach((warning) => logger.warn(`[environment] ${warning}`));

  if (result.errors.length > 0) {
    const error = new Error(`Unsafe or incomplete environment configuration:\n- ${result.errors.join('\n- ')}`);
    error.code = 'INVALID_ENVIRONMENT';
    error.validationErrors = result.errors;
    throw error;
  }

  return result;
}

module.exports = {
  MIN_SECRET_LENGTH,
  isWeakSecret,
  validateEnvironment,
  assertValidEnvironment
};
