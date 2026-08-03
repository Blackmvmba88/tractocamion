'use strict';

require('dotenv').config();
const sequelize = require('../config/database');
const { validateRuntimeConfig } = require('../config/runtimeConfig');

function describeError(error) {
  const candidates = [
    error?.message,
    error?.original?.message,
    error?.parent?.message,
    error?.code,
    error?.original?.code
  ];
  return candidates.find((value) => typeof value === 'string' && value.trim()) || 'no se pudo conectar a PostgreSQL';
}

async function main() {
  try {
    validateRuntimeConfig(process.env);
    console.log('✅ Configuración de seguridad válida');

    await sequelize.authenticate();
    console.log('✅ PostgreSQL disponible');

    const [rows] = await sequelize.query('SELECT current_database() AS database, version() AS version');
    console.log(`✅ Base seleccionada: ${rows[0].database}`);
    console.log(`✅ Motor: ${String(rows[0].version).split(',')[0]}`);
  } catch (error) {
    console.error(`❌ Preflight falló: ${describeError(error)}`);
    process.exitCode = 1;
  } finally {
    await sequelize.close().catch(() => {});
  }
}

main();
