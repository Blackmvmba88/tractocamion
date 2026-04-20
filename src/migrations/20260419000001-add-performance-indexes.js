'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addIndex('Cycles', ['status', 'start_time'], {
      name: 'cycles_status_start_time_idx'
    });

    await queryInterface.addIndex('Cycles', ['status', 'duration_minutes'], {
      name: 'cycles_status_duration_idx'
    });

    await queryInterface.addIndex('Cycles', ['status', 'truck_id'], {
      name: 'cycles_status_truck_idx'
    });

    await queryInterface.addIndex('Cycles', ['status', 'operator_id'], {
      name: 'cycles_status_operator_idx'
    });

    await queryInterface.addIndex('Operators', ['status', 'shift_start'], {
      name: 'operators_status_shift_start_idx'
    });

    await queryInterface.addIndex('Operators', ['status', 'updatedAt'], {
      name: 'operators_status_updated_at_idx'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('Cycles', 'cycles_status_start_time_idx');
    await queryInterface.removeIndex('Cycles', 'cycles_status_duration_idx');
    await queryInterface.removeIndex('Cycles', 'cycles_status_truck_idx');
    await queryInterface.removeIndex('Cycles', 'cycles_status_operator_idx');
    await queryInterface.removeIndex('Operators', 'operators_status_shift_start_idx');
    await queryInterface.removeIndex('Operators', 'operators_status_updated_at_idx');
  }
};
