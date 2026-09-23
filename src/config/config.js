require('dotenv').config();

module.exports = {
  development: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/tractocamion',
    dialect: 'postgres',
    seederStorage: 'sequelize',
    logging: false
  },
  test: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/tractocamion_test',
    dialect: 'postgres',
    seederStorage: 'sequelize',
    logging: false
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    seederStorage: 'sequelize',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};
