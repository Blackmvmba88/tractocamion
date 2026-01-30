require('dotenv').config();
const jwt = require('jsonwebtoken');
const { User, TokenBlacklist, Operator } = require('../models');
const { checkLoginAttempts } = require('../middleware/security');

/**
 * Generate JWT access token
 */
function generateAccessToken(userId, role) {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
}

/**
 * Generate JWT refresh token
 */
function generateRefreshToken(userId) {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

/**
 * Get token expiration time in seconds
 */
function getTokenExpirationTime(expiresIn) {
  const matches = expiresIn.match(/^(\d+)([smhd])$/);
  if (!matches) return 3600; // Default 1 hour
  
  const value = parseInt(matches[1]);
  const unit = matches[2];
  
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * (multipliers[unit] || 3600);
}

/**
 * Register a new user
 */
async function register(req, res) {
  try {
    const { username, email, password, role, operator_id } = req.body;

    // Check if username already exists
    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }
    }

    // If role is operador, validate operator_id
    if (role === 'operador' && operator_id) {
      const operator = await Operator.findByPk(operator_id);
      if (!operator) {
        return res.status(400).json({ error: 'ID de operador inválido' });
      }

      // Check if operator already has a user
      const operatorUser = await User.findOne({ where: { operator_id } });
      if (operatorUser) {
        return res.status(400).json({ error: 'Este operador ya tiene un usuario asignado' });
      }
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password, // Will be hashed by beforeCreate hook
      role: role || 'operador',
      operator_id: role === 'operador' ? operator_id : null
    });

    // Generate tokens
    const token = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    const expiresIn = getTokenExpirationTime(process.env.JWT_EXPIRES_IN || '1h');

    // Return user data (excluding password)
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      operator_id: user.operator_id
    };

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: userData,
      token,
      refreshToken,
      expiresIn
    });
  } catch (error) {
    console.error('Error in register:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Error de validación',
        details: error.errors.map(e => e.message)
      });
    }
    
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
}

/**
 * Login user
 */
async function login(req, res) {
  try {
    const { login, password } = req.body;

    // Find user by username or email
    const user = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { username: login },
          { email: login }
        ]
      },
      include: [
        {
          model: Operator,
          as: 'operator',
          required: false
        }
      ]
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Check if account is locked
    try {
      await checkLoginAttempts(user);
    } catch (error) {
      return res.status(error.statusCode || 423).json({
        error: error.message,
        lockedUntil: error.lockedUntil
      });
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    
    if (!isValidPassword) {
      // Increment failed login attempts
      await user.incrementLoginAttempts();
      
      const remainingAttempts = (parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5) - user.failed_login_attempts;
      
      if (remainingAttempts > 0) {
        return res.status(401).json({
          error: 'Credenciales inválidas',
          remainingAttempts
        });
      } else {
        return res.status(423).json({
          error: 'Cuenta bloqueada debido a múltiples intentos fallidos',
          message: `Intenta nuevamente en ${process.env.LOCK_TIME_MINUTES || 15} minutos`
        });
      }
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({ error: 'Usuario inactivo. Contacta al administrador' });
    }

    // Reset failed login attempts
    await user.resetLoginAttempts();

    // Generate tokens
    const token = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    const expiresIn = getTokenExpirationTime(process.env.JWT_EXPIRES_IN || '1h');

    // Return user data (excluding password and sensitive fields)
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      operator_id: user.operator_id,
      operator: user.operator ? {
        id: user.operator.id,
        name: user.operator.name,
        status: user.operator.status
      } : null
    };

    res.json({
      message: 'Login exitoso',
      user: userData,
      token,
      refreshToken,
      expiresIn
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

/**
 * Refresh access token
 */
async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token no proporcionado' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    if (decoded.type !== 'refresh') {
      return res.status(403).json({ error: 'Token inválido' });
    }

    // Check if user still exists and is active
    const user = await User.findByPk(decoded.userId);

    if (!user || !user.is_active) {
      return res.status(403).json({ error: 'Usuario no válido' });
    }

    // Generate new access token
    const token = generateAccessToken(user.id, user.role);
    const expiresIn = getTokenExpirationTime(process.env.JWT_EXPIRES_IN || '1h');

    res.json({
      message: 'Token renovado exitosamente',
      token,
      expiresIn
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Refresh token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Refresh token expirado. Por favor inicia sesión nuevamente' });
    }
    
    console.error('Error in refresh:', error);
    res.status(500).json({ error: 'Error al renovar token' });
  }
}

/**
 * Logout user (add token to blacklist)
 */
async function logout(req, res) {
  try {
    const token = req.token;
    const userId = req.user.id;

    // Decode token to get expiration
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000);

    // Add token to blacklist
    await TokenBlacklist.addToBlacklist(token, userId, expiresAt);

    res.json({ message: 'Logout exitoso' });
  } catch (error) {
    console.error('Error in logout:', error);
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
}

/**
 * Get current user profile
 */
async function me(req, res) {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Operator,
          as: 'operator',
          required: false
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      operator_id: user.operator_id,
      is_active: user.is_active,
      last_login: user.last_login,
      createdAt: user.createdAt,
      operator: user.operator
    });
  } catch (error) {
    console.error('Error in me:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
}

/**
 * Change user password
 */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get user with password
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Validate current password
    const isValidPassword = await user.validatePassword(currentPassword);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    // Update password
    user.password = newPassword; // Will be hashed by beforeUpdate hook
    await user.save();

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error in changePassword:', error);
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
  changePassword
};
