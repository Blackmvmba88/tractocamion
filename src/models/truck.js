'use strict';

module.exports = (sequelize, DataTypes) => {
  const Truck = sequelize.define('Truck', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      validate: {
        is: /^TRK-\d{3}$/i
      }
    },
    plate: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^[A-Z]{3}-\d{3}$/i
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'resting', 'maintenance'),
      allowNull: false,
      defaultValue: 'resting'
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    current_operator_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Operators',
        key: 'id'
      }
    },
    cycle_start_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    total_cycles: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    }
  }, {
    tableName: 'Trucks',
    timestamps: true,
    indexes: [
      {
        fields: ['status']
      },
      {
        fields: ['plate']
      }
    ]
  });

  Truck.associate = (models) => {
    Truck.belongsTo(models.Operator, {
      foreignKey: 'current_operator_id',
      as: 'operator'
    });
    Truck.hasMany(models.Cycle, {
      foreignKey: 'truck_id',
      as: 'cycles'
    });
  };

  return Truck;
};
