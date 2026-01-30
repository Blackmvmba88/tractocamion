'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update trucks with their current operators
    await queryInterface.bulkUpdate('Trucks', 
      { current_operator_id: 1 },
      { id: 'TRK-001' }
    );
    
    await queryInterface.bulkUpdate('Trucks', 
      { current_operator_id: 2 },
      { id: 'TRK-002' }
    );
    
    await queryInterface.bulkUpdate('Trucks', 
      { current_operator_id: 3 },
      { id: 'TRK-004' }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkUpdate('Trucks',
      { current_operator_id: null },
      { id: ['TRK-001', 'TRK-002', 'TRK-004'] }
    );
  }
};
