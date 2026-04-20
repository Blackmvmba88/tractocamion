'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('token_blacklist', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      token: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      revoked_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('token_blacklist', ['token']);
    await queryInterface.addIndex('token_blacklist', ['user_id']);
    await queryInterface.addIndex('token_blacklist', ['expires_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('token_blacklist');
  }
};
