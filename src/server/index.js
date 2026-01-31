require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const sequelize = require('../config/database');
const db = require('../models');
const { Truck, Operator, Cycle, Process } = db;

// Import database and models
const { syncDatabase } = require('../models');
const { testConnection } = require('../config/database');
const { seedUsers } = require('../seeders/userSeeder');

// Import middleware
const { apiLimiter, loginLimiter, sanitizeInput } = require('../middleware/security');
const { authenticateToken, requireRole, checkOwnership } = require('../middleware/auth');
const { 
  registerValidation, 
  loginValidation, 
  changePasswordValidation,
  refreshTokenValidation,
  handleValidationErrors 
} = require('../middleware/validation');

// Import controllers
const authController = require('../controllers/authController');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(sanitizeInput);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
const apiRouter = express.Router();

// Apply rate limiting to all API routes
apiRouter.use(apiLimiter);

// =================
// PUBLIC ROUTES (No authentication required)
// =================

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    platform: process.platform,
    node_version: process.version
  });
});

// =================
// AUTHENTICATION ROUTES (Public)
// =================

// Register new user (public registration for operators only)
apiRouter.post('/auth/register', 
  registerValidation,
  handleValidationErrors,
  authController.register
);

// Login
apiRouter.post('/auth/login',
  loginLimiter,
  loginValidation,
  handleValidationErrors,
  authController.login
);

// Refresh access token
apiRouter.post('/auth/refresh',
  refreshTokenValidation,
  handleValidationErrors,
  authController.refresh
);

// =================
// PROTECTED ROUTES (Authentication required)
// =================

// Logout (requires valid token)
apiRouter.post('/auth/logout',
  authenticateToken,
  authController.logout
);

// Get current user profile
apiRouter.get('/auth/me',
  authenticateToken,
  authController.me
);

// Change password
apiRouter.post('/auth/change-password',
  authenticateToken,
  changePasswordValidation,
  handleValidationErrors,
  authController.changePassword
);

// =================
// DATA ROUTES (Public for now, can be protected later)
// =================

// Process monitoring endpoint
apiRouter.get('/processes', async (req, res) => {
  try {
    const processes = await Process.findAll();
    
    // Format the data to match the frontend expectation
    const formattedProcesses = processes.map(p => ({
      name: p.name,
      status: p.status,
      uptime: formatUptime(p.uptime_seconds),
      cpu: `${p.cpu_percent}%`,
      memory: `${p.memory_mb}MB`
    }));
    
    res.json({
      processes: formattedProcesses,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching processes:', error);
    res.status(500).json({ 
      error: 'Database error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Truck status endpoint
apiRouter.get('/trucks', async (req, res) => {
  try {
    const trucks = await Truck.findAll({
      include: [{ 
        model: Operator, 
        as: 'operator',
        attributes: ['name']
      }]
    });
    
    // Format the data to match the frontend expectation
    const formattedTrucks = trucks.map(t => ({
      id: t.id,
      plate: t.plate,
      status: t.status,
      location: t.location,
      operator: t.operator ? t.operator.name : null,
      cycle_time: t.cycle_start_time ? calculateCycleTime(t.cycle_start_time) : null
    }));
    
    res.json({
      trucks: formattedTrucks,
      total: trucks.length,
      active: trucks.filter(t => t.status === 'active').length
    });
  } catch (error) {
    console.error('Error fetching trucks:', error);
    res.status(500).json({ 
      error: 'Database error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Operators endpoint
apiRouter.get('/operators', async (req, res) => {
  try {
    const operators = await Operator.findAll({
      include: [{
        model: Truck,
        as: 'truck',
        attributes: ['id', 'plate']
      }]
    });
    
    // Format the data to match the frontend expectation
    const formattedOperators = operators.map(o => ({
      id: o.code,
      name: o.name,
      status: o.status,
      hours: `${o.total_hours}h`,
      cycles: o.total_cycles,
      earnings: `$${o.total_earnings}`
    }));
    
    res.json({
      operators: formattedOperators,
      total: operators.length,
      available: operators.filter(o => o.status === 'available').length
    });
  } catch (error) {
    console.error('Error fetching operators:', error);
    res.status(500).json({ 
      error: 'Database error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Cycle tracking endpoint
apiRouter.post('/cycles', async (req, res) => {
  const cycle = req.body;
  
  // Basic validation
  if (!cycle.truck_id || !cycle.operator_id) {
    return res.status(400).json({
      success: false,
      error: 'truck_id and operator_id are required'
    });
  }
  
  try {
    // Validate that truck and operator exist
    const truck = await Truck.findByPk(cycle.truck_id);
    if (!truck) {
      return res.status(404).json({
        success: false,
        error: `Truck ${cycle.truck_id} not found`
      });
    }
    
    const operator = await Operator.findByPk(cycle.operator_id);
    if (!operator) {
      return res.status(404).json({
        success: false,
        error: `Operator ${cycle.operator_id} not found`
      });
    }
    
    const newCycle = await Cycle.create({
      id: generateId(),
      truck_id: cycle.truck_id,
      operator_id: cycle.operator_id,
      start_time: new Date(),
      start_location: cycle.start_location,
      status: 'in_progress'
    });
    
    res.json({
      success: true,
      cycle: {
        id: newCycle.id,
        truck_id: newCycle.truck_id,
        operator_id: newCycle.operator_id,
        timestamp: newCycle.start_time.toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating cycle:', error);
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.use('/api', apiRouter);

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Helper functions
function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function calculateCycleTime(startTime) {
  const now = new Date();
  const start = new Date(startTime);
  const diffMinutes = Math.floor((now - start) / (1000 * 60));
  return `${diffMinutes}min`;
}

function generateId() {
  // Use UUID for unique and secure ID generation
  const uuid = uuidv4().split('-')[0].toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return 'CYC-' + timestamp + '-' + uuid;
}

// Test database connection and start server
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connection established successfully');
    
    const server = app.listen(PORT, () => {
      console.log('🚛 Tractocamión 4.0 - Sistema de Gestión Logística');
      console.log('='.repeat(50));
      console.log(`✅ Servidor iniciado en puerto ${PORT}`);
      console.log(`🌍 Plataforma: ${process.platform}`);
      console.log(`📡 API disponible en: http://localhost:${PORT}/api`);
      console.log(`🖥️  Dashboard en: http://localhost:${PORT}`);
      console.log('='.repeat(50));
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Error: Puerto ${PORT} ya está en uso`);
        console.error(`💡 Intenta con un puerto diferente: PORT=8080 npm start`);
      } else {
        console.error('❌ Error al iniciar el servidor:', err.message);
      }
      process.exit(1);
    });
    
    module.exports = { app, server };
  })
  .catch(err => {
    console.error('❌ Unable to connect to the database:', err.message);
    console.error('💡 Make sure PostgreSQL is running and DATABASE_URL is correct');
    console.error('💡 See INSTALL.md for database setup instructions');
    process.exit(1);
  });
