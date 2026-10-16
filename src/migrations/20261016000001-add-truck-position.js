'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async transaction => {
      for (const [name, type] of Object.entries({
        latitude: Sequelize.DOUBLE,
        longitude: Sequelize.DOUBLE,
        position_updated_at: Sequelize.DATE,
        position_source: Sequelize.STRING
      })) {
        await queryInterface.addColumn('Trucks', name, { type, allowNull: true }, { transaction });
      }
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async transaction => {
      for (const name of ['latitude', 'longitude', 'position_updated_at', 'position_source']) {
        await queryInterface.removeColumn('Trucks', name, { transaction });
      }
    });
  }
};
