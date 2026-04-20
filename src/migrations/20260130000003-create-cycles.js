'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Cycles', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      truck_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'Trucks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      operator_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Operators',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      start_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      end_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      duration_minutes: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      start_location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      end_location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      earnings: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'in_progress'
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

    await queryInterface.addIndex('Cycles', ['truck_id']);
    await queryInterface.addIndex('Cycles', ['operator_id']);
    await queryInterface.addIndex('Cycles', ['status']);
    await queryInterface.addIndex('Cycles', ['start_time']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Cycles');
  }
};
