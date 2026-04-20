'use strict';

const cache = require('../utils/memoryCache');

module.exports = (sequelize, DataTypes) => {
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
    timestamps: false,
    indexes: [
      {
        fields: ['expires_at']
      }
    ]
  });

  // Class method to check if token is blacklisted
  TokenBlacklist.isBlacklisted = async function(token) {
    const cacheKey = `auth:blacklist:${token}`;
    const cachedValue = cache.get(cacheKey);

    if (cachedValue !== null) {
      return cachedValue;
    }

    const entry = await this.findOne({
      where: {
        token,
        expires_at: {
          [sequelize.Sequelize.Op.gt]: new Date()
        }
      }
    });

    const ttlMs = entry
      ? Math.max(1000, new Date(entry.expires_at).getTime() - Date.now())
      : 15000;

    cache.set(cacheKey, !!entry, ttlMs);
    return !!entry;
  };

  // Class method to add token to blacklist
  TokenBlacklist.addToBlacklist = async function(token, userId, expiresAt) {
    await this.create({
      token,
      user_id: userId,
      expires_at: expiresAt
    });

    const ttlMs = Math.max(1000, new Date(expiresAt).getTime() - Date.now());
    cache.set(`auth:blacklist:${token}`, true, ttlMs);
  };

  // Class method to clean up expired tokens (call periodically)
  TokenBlacklist.cleanupExpired = async function() {
    await this.destroy({
      where: {
        expires_at: {
          [sequelize.Sequelize.Op.lt]: new Date()
        }
      }
    });

    cache.invalidate('auth:blacklist:');
  };

  TokenBlacklist.associate = (models) => {
    TokenBlacklist.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return TokenBlacklist;
};
