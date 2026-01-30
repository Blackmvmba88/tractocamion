const { User, Operator } = require('../models');

async function seedUsers() {
  try {
    console.log('🌱 Seeding users...');

    // Check if users already exist
    const existingUsers = await User.count();
    if (existingUsers > 0) {
      console.log('ℹ️  Users already exist, skipping seed');
      return;
    }

    // Create default operators first
    const operators = await Operator.bulkCreate([
      {
        name: 'Juan Pérez',
        status: 'available',
        hours_worked: 0,
        cycles_completed: 0,
        total_earnings: 0
      },
      {
        name: 'María García',
        status: 'available',
        hours_worked: 0,
        cycles_completed: 0,
        total_earnings: 0
      },
      {
        name: 'Carlos López',
        status: 'available',
        hours_worked: 0,
        cycles_completed: 0,
        total_earnings: 0
      }
    ]);

    console.log(`✅ Created ${operators.length} operators`);

    // Create default users
    const users = [
      {
        username: 'admin',
        email: 'admin@tractocamion.com',
        password: 'Admin123!',
        role: 'admin',
        is_active: true
      },
      {
        username: 'gerente1',
        email: 'gerente1@tractocamion.com',
        password: 'Gerente123!',
        role: 'gerente',
        is_active: true
      },
      {
        username: 'gerente2',
        email: 'gerente2@tractocamion.com',
        password: 'Gerente123!',
        role: 'gerente',
        is_active: true
      },
      {
        username: 'operador1',
        email: 'operador1@tractocamion.com',
        password: 'Operador123!',
        role: 'operador',
        operator_id: operators[0].id,
        is_active: true
      },
      {
        username: 'operador2',
        email: 'operador2@tractocamion.com',
        password: 'Operador123!',
        role: 'operador',
        operator_id: operators[1].id,
        is_active: true
      },
      {
        username: 'operador3',
        email: 'operador3@tractocamion.com',
        password: 'Operador123!',
        role: 'operador',
        operator_id: operators[2].id,
        is_active: true
      }
    ];

    // Create users one by one to trigger password hashing
    for (const userData of users) {
      await User.create(userData);
    }

    console.log(`✅ Created ${users.length} users`);
    console.log('\n📝 Default credentials:');
    console.log('━'.repeat(50));
    users.forEach(user => {
      console.log(`${user.role.toUpperCase().padEnd(10)} - Username: ${user.username.padEnd(15)} Password: ${user.password}`);
    });
    console.log('━'.repeat(50));
    console.log('⚠️  SECURITY WARNING: These are TEST credentials with WEAK passwords!');
    console.log('⚠️  IMPORTANT: Change ALL passwords immediately in production!');
    console.log('⚠️  Run: npm run change-default-passwords (when implemented)');
    console.log('━'.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
}

module.exports = { seedUsers };
