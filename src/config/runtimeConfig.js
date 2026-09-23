'use strict';

function validateRuntimeConfig(env = process.env) {
  const errors = [];
  const weakMarkers = ['your-super-secret', 'change-this', 'change_this', 'changeme', 'replace_with'];

  for (const key of ['JWT_SECRET', 'JWT_REFRESH_SECRET']) {
    const value = env[key] || '';
    if (value.length < 32 || weakMarkers.some((marker) => value.toLowerCase().includes(marker))) {
      errors.push(`${key} debe ser un secreto aleatorio de al menos 32 caracteres`);
    }
  }

  if (env.JWT_SECRET && env.JWT_SECRET === env.JWT_REFRESH_SECRET) {
    errors.push('JWT_SECRET y JWT_REFRESH_SECRET deben ser diferentes');
  }

  if (env.NODE_ENV === 'production') {
    if (!env.DATABASE_URL) {
      errors.push('DATABASE_URL es obligatorio en producción');
    }
    if (!env.CORS_ORIGIN || env.CORS_ORIGIN === '*') {
      errors.push('CORS_ORIGIN debe indicar un origen explícito en producción');
    }
  }

  if (errors.length) {
    const error = new Error(`Configuración insegura:\n- ${errors.join('\n- ')}`);
    error.code = 'INVALID_RUNTIME_CONFIG';
    throw error;
  }
}

module.exports = { validateRuntimeConfig };
