'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.addIndex('token_blacklist', ['expires_at'], {
      name: 'token_blacklist_expires_at_idx'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('token_blacklist', 'token_blacklist_expires_at_idx');
  }
};
