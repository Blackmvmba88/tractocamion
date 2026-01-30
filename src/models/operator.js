'use strict';

module.exports = (sequelize, DataTypes) => {
  const Operator = sequelize.define('Operator', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^OP-\d{3}$/i
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('working', 'resting', 'available', 'offline'),
      allowNull: false,
      defaultValue: 'available'
    },
    nfc_tag_id: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    total_hours: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    total_cycles: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    total_earnings: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    current_truck_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'Trucks',
        key: 'id'
      }
    },
    shift_start: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'Operators',
    timestamps: true,
    indexes: [
      {
        fields: ['status']
      },
      {
        fields: ['nfc_tag_id']
      },
      {
        fields: ['code']
      }
    ]
  });

  Operator.associate = (models) => {
    Operator.belongsTo(models.Truck, {
      foreignKey: 'current_truck_id',
      as: 'truck'
    });
    Operator.hasMany(models.Cycle, {
      foreignKey: 'operator_id',
      as: 'cycles'
    });
  };

  return Operator;
};
