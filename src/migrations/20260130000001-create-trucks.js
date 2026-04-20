'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Trucks', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      plate: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      status: {
        type: Sequelize.ENUM('active', 'resting', 'maintenance'),
        allowNull: false,
        defaultValue: 'resting'
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      current_operator_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      cycle_start_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      total_cycles: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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

    await queryInterface.addIndex('Trucks', ['status']);
    await queryInterface.addIndex('Trucks', ['plate']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Trucks');
  }
};
