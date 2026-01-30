'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Operators', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('working', 'resting', 'available', 'offline'),
        allowNull: false,
        defaultValue: 'available'
      },
      nfc_tag_id: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      total_hours: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      total_cycles: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      total_earnings: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      current_truck_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      shift_start: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('Operators', ['status']);
    await queryInterface.addIndex('Operators', ['nfc_tag_id']);
    await queryInterface.addIndex('Operators', ['code']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Operators');
  }
};
