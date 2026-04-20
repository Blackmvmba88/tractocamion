'use strict';

module.exports = (sequelize, DataTypes) => {
  const Process = sequelize.define('Process', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('running', 'stopped', 'error'),
      allowNull: false,
      defaultValue: 'stopped'
    },
    uptime_seconds: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    cpu_percent: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    memory_mb: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    last_check: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'Processes',
    timestamps: true,
    indexes: [
      {
        fields: ['status']
      },
      {
        fields: ['name']
      }
    ]
  });

  return Process;
};
