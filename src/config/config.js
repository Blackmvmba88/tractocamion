require('dotenv').config();

module.exports = {
  development: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/tractocamion',
    dialect: 'postgres',
    logging: console.log
  },
  test: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/tractocamion_test',
    dialect: 'postgres',
    logging: false
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};
