require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

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

// Authentication routes
apiRouter.post('/auth/register', 
  loginLimiter,
  registerValidation,
  handleValidationErrors,
  authController.register
);

apiRouter.post('/auth/login',
  loginLimiter,
  loginValidation,
  handleValidationErrors,
  authController.login
);

apiRouter.post('/auth/refresh',
  refreshTokenValidation,
  handleValidationErrors,
  authController.refresh
);

// =================
// PROTECTED ROUTES (Authentication required)
// =================

// Auth endpoints requiring authentication
apiRouter.post('/auth/logout',
  authenticateToken,
  authController.logout
);

apiRouter.get('/auth/me',
  authenticateToken,
  authController.me
);

apiRouter.put('/auth/change-password',
  authenticateToken,
  changePasswordValidation,
  handleValidationErrors,
  authController.changePassword
);

// Process monitoring endpoint - Admin and Gerente only
apiRouter.get('/processes', 
  authenticateToken,
  requireRole('admin', 'gerente'),
  (req, res) => {
    res.json({
      processes: getProcessStatus(),
      timestamp: new Date().toISOString()
    });
  }
);

// Truck status endpoint - Admin and Gerente see all, Operador sees assigned truck
apiRouter.get('/trucks',
  authenticateToken,
  (req, res) => {
    let trucks = getTruckStatus();
    
    // If operator, filter to only their truck
    if (req.user.role === 'operador' && req.user.operator_id) {
      trucks = trucks.filter(t => t.operator_id === req.user.operator_id);
    }
    
    res.json({
      trucks: trucks,
      total: trucks.length,
      active: trucks.filter(t => t.status === 'active').length
    });
  }
);

// Operators endpoint - Admin and Gerente see all, Operador sees only themselves
apiRouter.get('/operators',
  authenticateToken,
  (req, res) => {
    let operators = getOperatorStatus();
    
    // If operator, filter to only themselves
    if (req.user.role === 'operador' && req.user.operator_id) {
      operators = operators.filter(o => o.id === `OP-${String(req.user.operator_id).padStart(3, '0')}`);
    }
    
    res.json({
      operators: operators,
      total: operators.length,
      available: operators.filter(o => o.status === 'available').length
    });
  }
);

// Single operator endpoint - with ownership check
apiRouter.get('/operators/:id',
  authenticateToken,
  checkOwnership,
  (req, res) => {
    const operators = getOperatorStatus();
    const operator = operators.find(o => o.id === req.params.id);
    
    if (!operator) {
      return res.status(404).json({ error: 'Operador no encontrado' });
    }
    
    res.json(operator);
  }
);

// Cycle tracking endpoint - All authenticated users
apiRouter.post('/cycles',
  authenticateToken,
  (req, res) => {
    const cycle = req.body;
    
    // Basic validation
    if (!cycle.truck_id || !cycle.operator_id) {
      return res.status(400).json({
        success: false,
        error: 'truck_id and operator_id are required'
      });
    }
    
    // If operador, ensure they're creating cycles for themselves
    if (req.user.role === 'operador') {
      if (parseInt(cycle.operator_id) !== req.user.operator_id) {
        return res.status(403).json({
          success: false,
          error: 'No puedes crear ciclos para otros operadores'
        });
      }
    }
    
    res.json({
      success: true,
      cycle: {
        id: generateId(),
        ...cycle,
        timestamp: new Date().toISOString(),
        created_by: req.user.username
      }
    });
  }
);

app.use('/api', apiRouter);

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Mock data functions
function getProcessStatus() {
  return [
    { name: 'Web Server', status: 'running', uptime: '5h 23m', cpu: '2.3%', memory: '45MB' },
    { name: 'Database', status: 'running', uptime: '5h 23m', cpu: '1.1%', memory: '128MB' },
    { name: 'API Gateway', status: 'running', uptime: '5h 23m', cpu: '0.8%', memory: '32MB' },
    { name: 'Process Monitor', status: 'running', uptime: '5h 23m', cpu: '0.3%', memory: '18MB' }
  ];
}

function getTruckStatus() {
  return [
    { id: 'TRK-001', plate: 'ABC-123', status: 'active', location: 'Patio A', operator: 'Juan Pérez', operator_id: 1, cycle_time: '45min' },
    { id: 'TRK-002', plate: 'DEF-456', status: 'active', location: 'Zona de Carga', operator: 'María García', operator_id: 2, cycle_time: '32min' },
    { id: 'TRK-003', plate: 'GHI-789', status: 'resting', location: 'Área de Descanso', operator: null, operator_id: null, cycle_time: null },
    { id: 'TRK-004', plate: 'JKL-012', status: 'active', location: 'Patio B', operator: 'Carlos López', operator_id: 3, cycle_time: '28min' }
  ];
}

function getOperatorStatus() {
  return [
    { id: 'OP-001', name: 'Juan Pérez', status: 'working', hours: '3.5h', cycles: 4, earnings: '$280' },
    { id: 'OP-002', name: 'María García', status: 'working', hours: '2.8h', cycles: 3, earnings: '$210' },
    { id: 'OP-003', name: 'Carlos López', status: 'working', hours: '4.2h', cycles: 5, earnings: '$350' },
    { id: 'OP-004', name: 'Ana Rodríguez', status: 'resting', hours: '6.0h', cycles: 7, earnings: '$490' },
    { id: 'OP-005', name: 'Pedro Martínez', status: 'available', hours: '0h', cycles: 0, earnings: '$0' }
  ];
}

function generateId() {
  // Add random component to reduce collision risk
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return 'CYC-' + timestamp + '-' + random;
}

// Start server
const server = app.listen(PORT, async () => {
  console.log('🚛 Tractocamión 4.0 - Sistema de Gestión Logística');
  console.log('='.repeat(50));
  console.log(`✅ Servidor iniciado en puerto ${PORT}`);
  console.log(`🌍 Plataforma: ${process.platform}`);
  console.log(`📡 API disponible en: http://localhost:${PORT}/api`);
  console.log(`🖥️  Dashboard en: http://localhost:${PORT}`);
  console.log('='.repeat(50));
  
  // Initialize database
  try {
    await testConnection();
    await syncDatabase();
    await seedUsers();
    console.log('='.repeat(50));
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Error: Puerto ${PORT} ya está en uso`);
    console.error(`💡 Intenta con un puerto diferente: PORT=8080 npm start`);
  } else {
    console.error('❌ Error al iniciar el servidor:', err.message);
  }
  process.exit(1);
});

// Cleanup on shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = { app, server };
