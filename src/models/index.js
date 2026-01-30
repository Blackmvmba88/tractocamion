const { sequelize } = require('../config/database');
const User = require('./User');
const TokenBlacklist = require('./TokenBlacklist');
const Operator = require('./Operator');

// Define associations
User.belongsTo(Operator, {
  foreignKey: 'operator_id',
  as: 'operator'
});

Operator.hasOne(User, {
  foreignKey: 'operator_id',
  as: 'user'
});

TokenBlacklist.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

User.hasMany(TokenBlacklist, {
  foreignKey: 'user_id',
  as: 'blacklistedTokens'
});

// Sync database (create tables if they don't exist)
async function syncDatabase() {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
  }
}

module.exports = {
  sequelize,
  User,
  TokenBlacklist,
  Operator,
  syncDatabase
};
