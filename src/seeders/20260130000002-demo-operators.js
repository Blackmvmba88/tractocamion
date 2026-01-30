'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Operators', [
      {
        code: 'OP-001',
        name: 'Juan Pérez',
        status: 'working',
        nfc_tag_id: 'NFC001',
        total_hours: 3.5,
        total_cycles: 4,
        total_earnings: 280.00,
        current_truck_id: 'TRK-001',
        shift_start: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        code: 'OP-002',
        name: 'María García',
        status: 'working',
        nfc_tag_id: 'NFC002',
        total_hours: 2.8,
        total_cycles: 3,
        total_earnings: 210.00,
        current_truck_id: 'TRK-002',
        shift_start: new Date(Date.now() - 2.8 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        code: 'OP-003',
        name: 'Carlos López',
        status: 'working',
        nfc_tag_id: 'NFC003',
        total_hours: 4.2,
        total_cycles: 5,
        total_earnings: 350.00,
        current_truck_id: 'TRK-004',
        shift_start: new Date(Date.now() - 4.2 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        code: 'OP-004',
        name: 'Ana Rodríguez',
        status: 'resting',
        nfc_tag_id: 'NFC004',
        total_hours: 6.0,
        total_cycles: 7,
        total_earnings: 490.00,
        current_truck_id: null,
        shift_start: new Date(Date.now() - 6 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        code: 'OP-005',
        name: 'Pedro Martínez',
        status: 'available',
        nfc_tag_id: 'NFC005',
        total_hours: 0,
        total_cycles: 0,
        total_earnings: 0,
        current_truck_id: null,
        shift_start: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        code: 'OP-006',
        name: 'Luis Hernández',
        status: 'available',
        nfc_tag_id: 'NFC006',
        total_hours: 5.5,
        total_cycles: 6,
        total_earnings: 420.00,
        current_truck_id: null,
        shift_start: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        code: 'OP-007',
        name: 'Carmen Sánchez',
        status: 'offline',
        nfc_tag_id: 'NFC007',
        total_hours: 8.0,
        total_cycles: 9,
        total_earnings: 630.00,
        current_truck_id: null,
        shift_start: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        code: 'OP-008',
        name: 'Roberto Díaz',
        status: 'available',
        nfc_tag_id: 'NFC008',
        total_hours: 4.8,
        total_cycles: 5,
        total_earnings: 360.00,
        current_truck_id: null,
        shift_start: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Operators', null, {});
  }
};
