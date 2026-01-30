require('dotenv').config();
const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for login endpoints
 * Stricter limits to prevent brute force attacks
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 5, // 5 attempts
  message: {
    error: 'Demasiados intentos de login desde esta IP',
    message: 'Por favor intenta nuevamente en 15 minutos',
    retryAfter: 15
  },
  skipSuccessfulRequests: true, // Don't count successful logins
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * General API rate limiter
 * More lenient for normal API operations
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests
  message: {
    error: 'Demasiadas solicitudes desde esta IP',
    message: 'Por favor espera unos minutos antes de intentar nuevamente'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Stricter rate limiter for sensitive operations
 */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  message: {
    error: 'Demasiadas solicitudes',
    message: 'Esta operación está limitada. Intenta en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
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
 */
function sanitizeInput(req, res, next) {
  // Remove any null bytes from strings
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/\0/g, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (let key in obj) {
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
