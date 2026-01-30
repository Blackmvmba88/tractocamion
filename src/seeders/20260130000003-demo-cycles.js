'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    const cycles = [];
    
    // Create 10 historical cycles
    for (let i = 1; i <= 10; i++) {
      const startTime = new Date(now.getTime() - (i * 2 * 60 * 60 * 1000)); // 2 hours ago each
      const endTime = new Date(startTime.getTime() + (45 * 60 * 1000)); // 45 minutes duration
      const durationMinutes = 45;
      const earnings = 70.00;
      
      cycles.push({
        id: `CYC-${Date.now() - (i * 1000)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        truck_id: `TRK-00${(i % 4) + 1}`,
        operator_id: (i % 8) + 1,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: durationMinutes,
        start_location: i % 2 === 0 ? 'Patio A' : 'Zona de Carga',
        end_location: i % 2 === 0 ? 'Zona de Descarga' : 'Patio B',
        earnings: earnings,
        status: 'completed',
        createdAt: startTime,
        updatedAt: endTime
      });
    }
    
    await queryInterface.bulkInsert('Cycles', cycles, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Cycles', null, {});
  }
};
