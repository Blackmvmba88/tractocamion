'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Processes', [
      {
        name: 'Web Server',
        status: 'running',
        uptime_seconds: 19380, // 5h 23m
        cpu_percent: 2.3,
        memory_mb: 45,
        last_check: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Database',
        status: 'running',
        uptime_seconds: 19380,
        cpu_percent: 1.1,
        memory_mb: 128,
        last_check: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'API Gateway',
        status: 'running',
        uptime_seconds: 19380,
        cpu_percent: 0.8,
        memory_mb: 32,
        last_check: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Process Monitor',
        status: 'running',
        uptime_seconds: 19380,
        cpu_percent: 0.3,
        memory_mb: 18,
        last_check: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Processes', null, {});
  }
};
