'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Processes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      status: {
        type: Sequelize.ENUM('running', 'stopped', 'error'),
        allowNull: false,
        defaultValue: 'stopped'
      },
      uptime_seconds: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      cpu_percent: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0
      },
      memory_mb: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      last_check: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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

    await queryInterface.addIndex('Processes', ['status']);
    await queryInterface.addIndex('Processes', ['name']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Processes');
  }
};
