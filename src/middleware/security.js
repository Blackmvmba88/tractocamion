require('dotenv').config();
const rateLimit = require('express-rate-limit');

function parseIntegerEnv(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function buildRateLimitHandler(defaultMessage) {
  return (req, res) => {
    const resetTime = req.rateLimit?.resetTime;
    const retryAfterSeconds = resetTime
      ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
      : undefined;

    if (retryAfterSeconds) {
      res.set('Retry-After', String(retryAfterSeconds));
    }

    res.status(429).json({
      ...defaultMessage,
      retryAfter: retryAfterSeconds
    });
  };
}

/**
 * Rate limiter for login endpoints
 * Stricter limits to prevent brute force attacks
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseIntegerEnv(process.env.LOGIN_RATE_LIMIT_MAX, 5), // 5 attempts
  handler: buildRateLimitHandler({
    error: 'Demasiados intentos de login desde esta IP',
    message: 'Por favor intenta nuevamente en 15 minutos'
  }),
  skipSuccessfulRequests: true, // Don't count successful logins
  standardHeaders: true,
  legacyHeaders: false,
  ipv6Subnet: 56
});

/**
 * General API rate limiter
 * More lenient for normal API operations
 */
const apiLimiter = rateLimit({
  windowMs: parseIntegerEnv(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000), // 15 minutes
  max: parseIntegerEnv(process.env.RATE_LIMIT_MAX_REQUESTS, 100), // 100 requests
  handler: buildRateLimitHandler({
    error: 'Demasiadas solicitudes desde esta IP',
    message: 'Por favor espera unos minutos antes de intentar nuevamente'
  }),
  standardHeaders: true,
  legacyHeaders: false,
  ipv6Subnet: 56,
  skip: (req) => req.method === 'GET' && req.path === '/health'
});

/**
 * Stricter rate limiter for sensitive operations
 */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  handler: buildRateLimitHandler({
    error: 'Demasiadas solicitudes',
    message: 'Esta operación está limitada. Intenta en 15 minutos.'
  }),
  standardHeaders: true,
  legacyHeaders: false,
  ipv6Subnet: 56
});

/**
 * Check if user account is locked due to failed login attempts
 */
async function checkLoginAttempts(user) {
  if (user.isLocked()) {
    const remainingTime = Math.ceil((user.locked_until - new Date()) / 60000);
    const error = new Error(`Cuenta bloqueada temporalmente. Intenta en ${remainingTime} minuto${remainingTime !== 1 ? 's' : ''}`);
    error.statusCode = 423; // Locked status
    error.lockedUntil = user.locked_until;
    throw error;
  }
}

/**
 * Middleware to sanitize user input
 * Removes null bytes and encodes HTML to prevent XSS
 */
function sanitizeInput(req, res, next) {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove null bytes
      let clean = obj.replace(/\0/g, '');
      // HTML entity encoding to prevent XSS (safer than regex removal)
      clean = clean
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
      return clean;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => sanitize(item));
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key of Object.keys(obj)) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
}

module.exports = {
  loginLimiter,
  apiLimiter,
  strictLimiter,
  checkLoginAttempts,
  sanitizeInput
};
