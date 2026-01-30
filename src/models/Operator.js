const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Operator = sequelize.define('Operator', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('available', 'working', 'resting', 'inactive'),
    defaultValue: 'available'
  },
  hours_worked: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  cycles_completed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  total_earnings: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  }
}, {
  tableName: 'operators',
  timestamps: true
});

module.exports = Operator;
