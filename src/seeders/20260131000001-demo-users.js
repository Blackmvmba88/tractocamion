'use strict';

const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    // First check if users already exist
    const existingUsers = await queryInterface.sequelize.query(
      'SELECT COUNT(*) as count FROM users;',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingUsers[0].count > 0) {
      console.log('ℹ️  Users already exist, skipping seed');
      return;
    }

    console.log('🌱 Seeding users...');

    // Hash passwords
    const rounds = 12;
    const hashedPasswords = {
      admin: await bcrypt.hash('Admin123!', rounds),
      gerente: await bcrypt.hash('Gerente123!', rounds),
      operador: await bcrypt.hash('Operador123!', rounds)
    };

    // Get some operator IDs to associate with operador users
    const operators = await queryInterface.sequelize.query(
      'SELECT id FROM "Operators" LIMIT 3;',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const users = [
      {
        username: 'admin',
        email: 'admin@tractocamion.com',
        password: hashedPasswords.admin,
        role: 'admin',
        is_active: true,
        failed_login_attempts: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        username: 'gerente1',
        email: 'gerente1@tractocamion.com',
        password: hashedPasswords.gerente,
        role: 'gerente',
        is_active: true,
        failed_login_attempts: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        username: 'gerente2',
        email: 'gerente2@tractocamion.com',
        password: hashedPasswords.gerente,
        role: 'gerente',
        is_active: true,
        failed_login_attempts: 0,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Add operador users if we have operators
    if (operators.length >= 3) {
      users.push(
        {
          username: 'operador1',
          email: 'operador1@tractocamion.com',
          password: hashedPasswords.operador,
          role: 'operador',
          operator_id: operators[0].id,
          is_active: true,
          failed_login_attempts: 0,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          username: 'operador2',
          email: 'operador2@tractocamion.com',
          password: hashedPasswords.operador,
          role: 'operador',
          operator_id: operators[1].id,
          is_active: true,
          failed_login_attempts: 0,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          username: 'operador3',
          email: 'operador3@tractocamion.com',
          password: hashedPasswords.operador,
          role: 'operador',
          operator_id: operators[2].id,
          is_active: true,
          failed_login_attempts: 0,
          created_at: new Date(),
          updated_at: new Date()
        }
      );
    }

    await queryInterface.bulkInsert('users', users);

    console.log(`✅ Created ${users.length} users`);
    console.log('\n📝 Default credentials:');
    console.log('━'.repeat(50));
    console.log('ADMIN      - Username: admin          Password: Admin123!');
    console.log('GERENTE    - Username: gerente1       Password: Gerente123!');
    console.log('GERENTE    - Username: gerente2       Password: Gerente123!');
    if (operators.length >= 3) {
      console.log('OPERADOR   - Username: operador1      Password: Operador123!');
      console.log('OPERADOR   - Username: operador2      Password: Operador123!');
      console.log('OPERADOR   - Username: operador3      Password: Operador123!');
    }
    console.log('━'.repeat(50));
    console.log('⚠️  SECURITY WARNING: These are TEST credentials with WEAK passwords!');
    console.log('⚠️  IMPORTANT: Change ALL passwords immediately in production!');
    console.log('━'.repeat(50) + '\n');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};
