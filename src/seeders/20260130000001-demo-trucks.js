'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Trucks', [
      {
        id: 'TRK-001',
        plate: 'ABC-123',
        status: 'active',
        location: 'Patio A',
        current_operator_id: null,
        cycle_start_time: new Date(),
        total_cycles: 15,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'TRK-002',
        plate: 'DEF-456',
        status: 'active',
        location: 'Zona de Carga',
        current_operator_id: null,
        cycle_start_time: new Date(),
        total_cycles: 12,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'TRK-003',
        plate: 'GHI-789',
        status: 'resting',
        location: 'Área de Descanso',
        current_operator_id: null,
        cycle_start_time: null,
        total_cycles: 8,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'TRK-004',
        plate: 'JKL-012',
        status: 'active',
        location: 'Patio B',
        current_operator_id: null,
        cycle_start_time: new Date(),
        total_cycles: 20,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'TRK-005',
        plate: 'MNO-345',
        status: 'maintenance',
        location: 'Taller',
        current_operator_id: null,
        cycle_start_time: null,
        total_cycles: 25,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Trucks', null, {});
  }
};
