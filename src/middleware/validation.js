const { body, validationResult } = require('express-validator');

/**
 * Validation rules for user registration
 */
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('El nombre de usuario solo puede contener letras, números, guiones y guiones bajos'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Debe proporcionar un email válido')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una letra mayúscula, una minúscula y un número'),
  
  body('role')
    .optional()
    .isIn(['admin', 'gerente', 'operador'])
    .withMessage('Rol inválido. Debe ser: admin, gerente o operador'),
  
  body('operator_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID del operador debe ser un número entero positivo')
];

/**
 * Validation rules for user login
 */
const loginValidation = [
  body('login')
    .trim()
    .notEmpty()
    .withMessage('Debe proporcionar un nombre de usuario o email'),
  
  body('password')
    .notEmpty()
    .withMessage('Debe proporcionar una contraseña')
];

/**
 * Validation rules for password change
 */
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Debe proporcionar la contraseña actual'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('La nueva contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La nueva contraseña debe contener al menos una letra mayúscula, una minúscula y un número')
];

/**
 * Validation rules for refresh token
 */
const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Debe proporcionar un refresh token')
];

/**
 * Middleware to handle validation errors
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Errores de validación',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
}

module.exports = {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  refreshTokenValidation,
  handleValidationErrors
};
