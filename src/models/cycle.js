'use strict';

module.exports = (sequelize, DataTypes) => {
  const Cycle = sequelize.define('Cycle', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    truck_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Trucks',
        key: 'id'
      }
    },
    operator_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Operators',
        key: 'id'
      }
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0
      }
    },
    start_location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    end_location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    earnings: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    status: {
      type: DataTypes.ENUM('in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'in_progress'
    }
  }, {
    tableName: 'Cycles',
    timestamps: true,
    indexes: [
      {
        fields: ['truck_id']
      },
      {
        fields: ['operator_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['start_time']
      }
    ]
  });

  Cycle.associate = (models) => {
    Cycle.belongsTo(models.Truck, {
      foreignKey: 'truck_id',
      as: 'truck'
    });
    Cycle.belongsTo(models.Operator, {
      foreignKey: 'operator_id',
      as: 'operator'
    });
  };

  return Cycle;
};
