const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TokenBlacklist = sequelize.define('TokenBlacklist', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  token: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  revoked_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'token_blacklist',
  timestamps: false
});

// Class method to check if token is blacklisted
TokenBlacklist.isBlacklisted = async function(token) {
  const entry = await this.findOne({
    where: {
      token,
      expires_at: {
        [require('sequelize').Op.gt]: new Date()
      }
    }
  });
  return !!entry;
};

// Class method to add token to blacklist
TokenBlacklist.addToBlacklist = async function(token, userId, expiresAt) {
  await this.create({
    token,
    user_id: userId,
    expires_at: expiresAt
  });
};

// Class method to clean up expired tokens (call periodically)
TokenBlacklist.cleanupExpired = async function() {
  await this.destroy({
    where: {
      expires_at: {
        [require('sequelize').Op.lt]: new Date()
      }
    }
  });
};

module.exports = TokenBlacklist;
