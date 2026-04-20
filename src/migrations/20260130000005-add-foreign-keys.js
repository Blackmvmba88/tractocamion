'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add foreign key constraint from Trucks to Operators
    await queryInterface.addConstraint('Trucks', {
      fields: ['current_operator_id'],
      type: 'foreign key',
      name: 'fk_trucks_operator',
      references: {
        table: 'Operators',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // Add foreign key constraint from Operators to Trucks
    await queryInterface.addConstraint('Operators', {
      fields: ['current_truck_id'],
      type: 'foreign key',
      name: 'fk_operators_truck',
      references: {
        table: 'Trucks',
        field: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Trucks', 'fk_trucks_operator');
    await queryInterface.removeConstraint('Operators', 'fk_operators_truck');
  }
};
