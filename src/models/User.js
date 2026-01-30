const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [8, 255]
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'gerente', 'operador'),
    allowNull: false,
    defaultValue: 'operador'
  },
  operator_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Operators',
      key: 'id'
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  failed_login_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  locked_until: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true
});

// Hash password before creating user
User.beforeCreate(async (user) => {
  if (user.password) {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    user.password = await bcrypt.hash(user.password, rounds);
  }
});

// Hash password before updating if it changed
User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    user.password = await bcrypt.hash(user.password, rounds);
  }
});

// Instance method to validate password
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Instance method to check if account is locked
User.prototype.isLocked = function() {
  return !!(this.locked_until && this.locked_until > new Date());
};

// Instance method to increment failed login attempts
User.prototype.incrementLoginAttempts = async function() {
  const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
  const lockTimeMinutes = parseInt(process.env.LOCK_TIME_MINUTES) || 15;
  
  this.failed_login_attempts += 1;
  
  if (this.failed_login_attempts >= maxAttempts) {
    this.locked_until = new Date(Date.now() + lockTimeMinutes * 60 * 1000);
  }
  
  await this.save();
};

// Instance method to reset login attempts
User.prototype.resetLoginAttempts = async function() {
  this.failed_login_attempts = 0;
  this.locked_until = null;
  this.last_login = new Date();
  await this.save();
};

module.exports = User;
