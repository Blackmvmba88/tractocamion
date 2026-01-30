require('dotenv').config();
const jwt = require('jsonwebtoken');
const { User, TokenBlacklist } = require('../models');

/**
 * Middleware to verify JWT token and authenticate user
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    // Verify token signature and expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is blacklisted
    const isBlacklisted = await TokenBlacklist.isBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token invalidado' });
    }

    // Load user from database
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: require('../models/Operator'),
          as: 'operator',
          required: false
        }
      ]
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Usuario inactivo' });
    }

    // Attach user to request
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Token expirado' });
    }
    return res.status(403).json({ error: 'Error al verificar token' });
  }
}

/**
 * Middleware to check if user has required role(s)
 * @param {...string} roles - Allowed roles
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'No tienes permisos para esta acción',
        requiredRoles: roles,
        yourRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Middleware to check if user is accessing their own resource
 * Used for operators to ensure they only access their own data
 */
function checkOwnership(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  // Admins and managers can access all resources
  if (req.user.role === 'admin' || req.user.role === 'gerente') {
    return next();
  }

  // For operators, check if they're accessing their own data
  if (req.user.role === 'operador') {
    const resourceId = req.params.id || req.params.operator_id;
    
    if (resourceId && req.user.operator_id && 
        parseInt(resourceId) !== parseInt(req.user.operator_id)) {
      return res.status(403).json({ 
        error: 'No puedes acceder a datos de otros operadores' 
      });
    }
  }

  next();
}

/**
 * Optional authentication - doesn't fail if no token provided
 * but attaches user if valid token is present
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const isBlacklisted = await TokenBlacklist.isBlacklisted(token);
    
    if (!isBlacklisted) {
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password'] }
      });
      
      if (user && user.is_active) {
        req.user = user;
      }
    }
  } catch (error) {
    // Silently fail - optional auth
  }

  next();
}

module.exports = {
  authenticateToken,
  requireRole,
  checkOwnership,
  optionalAuth
};
