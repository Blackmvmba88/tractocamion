require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { validateRuntimeConfig } = require('../config/runtimeConfig');

const sequelize = require('../config/database');
const db = require('../models');
const { Truck, Operator, Cycle, Process } = db;

// Import middleware
const { apiLimiter, loginLimiter, sanitizeInput } = require('../middleware/security');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { 
  registerValidation, 
  loginValidation, 
  changePasswordValidation,
  refreshTokenValidation,
  adminCreateUserValidation,
  adminUpdateUserValidation,
  handleValidationErrors 
} = require('../middleware/validation');

// Import controllers
const authController = require('../controllers/authController');
const cycleController = require('../controllers/cycleController');
const analyticsController = require('../controllers/analyticsController');
const nfcController = require('../controllers/nfcController');
const userController = require('../controllers/userController');

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, '../public');

function parseIntegerEnv(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseTrustProxy(value) {
  if (value === undefined || value === null || value === '') {
    return process.env.NODE_ENV === 'production' ? 1 : false;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  const numericValue = Number.parseInt(value, 10);
  return Number.isInteger(numericValue) ? numericValue : value;
}

const jsonLimit = process.env.JSON_BODY_LIMIT || '256kb';
const urlencodedLimit = process.env.URLENCODED_BODY_LIMIT || '256kb';
const staticAssetsMaxAgeMs = parseIntegerEnv(process.env.STATIC_CACHE_MAX_AGE_MS, 60 * 60 * 1000);
const corsOrigin = process.env.CORS_ORIGIN || '*';
const allowCredentialedCors = corsOrigin !== '*';

validateRuntimeConfig(process.env);

// Middleware
// CORS configuration
const corsOptions = {
  origin: corsOrigin,
  credentials: allowCredentialedCors
};
app.set('trust proxy', parseTrustProxy(process.env.TRUST_PROXY));
app.disable('x-powered-by');
app.set('etag', 'strong');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'script-src': ["'self'"],
      'style-src': ["'self'", "'unsafe-inline'"]
    }
  }
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: jsonLimit }));
app.use(express.urlencoded({
  extended: true,
  limit: urlencodedLimit,
  parameterLimit: parseIntegerEnv(process.env.URLENCODED_PARAMETER_LIMIT, 100)
}));
app.use(sanitizeInput);

// Serve static files from the public directory
app.use(express.static(publicDir, {
  etag: true,
  maxAge: staticAssetsMaxAgeMs,
  redirect: false,
  setHeaders: (res, filePath) => {
    if (path.extname(filePath) === '.html') {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return;
    }

    res.setHeader('Cache-Control', `public, max-age=${Math.floor(staticAssetsMaxAgeMs / 1000)}`);
  }
}));

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

// Readiness check for deployment probes. The server only starts after an
// initial connection, but this also detects a database outage at runtime.
apiRouter.get('/ready', async (req, res) => {
  try {
    await sequelize.query('SELECT 1');
    res.json({ status: 'ready', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'not_ready', database: 'unavailable', timestamp: new Date().toISOString() });
  }
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
// USER ADMINISTRATION (admin only; accounts are never deleted here)
// =================

apiRouter.get('/users', authenticateToken, requireRole('admin'), userController.listUsers);
apiRouter.post('/users',
  authenticateToken,
  requireRole('admin'),
  adminCreateUserValidation,
  handleValidationErrors,
  userController.createUser
);
apiRouter.patch('/users/:id',
  authenticateToken,
  requireRole('admin'),
  adminUpdateUserValidation,
  handleValidationErrors,
  userController.updateUser
);

// =================
// OPERATIONAL ROUTES (authentication and RBAC required)
// =================

// Process monitoring endpoint
apiRouter.get('/processes', authenticateToken, requireRole('admin', 'gerente'), async (req, res) => {
  try {
    const processes = await Process.findAll({
      attributes: ['name', 'status', 'uptime_seconds', 'cpu_percent', 'memory_mb']
    });
    
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
apiRouter.get('/trucks', authenticateToken, requireRole('admin', 'gerente'), async (req, res) => {
  try {
    const trucks = await Truck.findAll({
      attributes: ['id', 'plate', 'status', 'location', 'cycle_start_time'],
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
apiRouter.get('/operators', authenticateToken, requireRole('admin', 'gerente'), async (req, res) => {
  try {
    const operators = await Operator.findAll({
      attributes: ['code', 'name', 'status', 'total_hours', 'total_cycles', 'total_earnings']
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

// =================
// CYCLE MANAGEMENT ROUTES (Enhanced with completeness)
// =================

// Get all cycles (with filters)
apiRouter.get('/cycles', authenticateToken, requireRole('admin', 'gerente'), cycleController.getCycles);

// Get single cycle details
apiRouter.get('/cycles/:id', authenticateToken, requireRole('admin', 'gerente'), cycleController.getCycle);

// Create new cycle
apiRouter.post('/cycles', authenticateToken, requireRole('admin', 'gerente'), cycleController.createCycle);

// Complete a cycle
apiRouter.post('/cycles/:id/complete', authenticateToken, requireRole('admin', 'gerente'), cycleController.completeCycle);

// Update cycle location (real-time tracking)
apiRouter.patch('/cycles/:id/location', authenticateToken, requireRole('admin', 'gerente'), cycleController.updateLocation);

// =================
// ANALYTICS ROUTES (Consciousness - Intelligent Insights)
// =================

// Dashboard analytics
apiRouter.get('/analytics/dashboard', authenticateToken, analyticsController.getDashboard);

// Operator performance metrics
apiRouter.get('/analytics/operators', authenticateToken, requireRole('admin', 'gerente'), analyticsController.getOperatorMetrics);

// Truck utilization metrics
apiRouter.get('/analytics/trucks', authenticateToken, requireRole('admin', 'gerente'), analyticsController.getTruckMetrics);

// Alerts and anomalies (intelligent monitoring)
apiRouter.get('/analytics/alerts', authenticateToken, requireRole('admin', 'gerente'), analyticsController.getAlerts);

// =================
// NFC/RFID ROUTES (Absoluteness - Complete Identification)
// =================

// Verify NFC tag
apiRouter.post('/nfc/verify', authenticateToken, nfcController.verifyTag);

// Register NFC tag to operator
apiRouter.post('/nfc/register', authenticateToken, requireRole('admin', 'gerente'), nfcController.registerTag);

// Unregister NFC tag
apiRouter.post('/nfc/unregister', authenticateToken, requireRole('admin', 'gerente'), nfcController.unregisterTag);

// Quick check-in with NFC
apiRouter.post('/nfc/checkin', authenticateToken, nfcController.quickCheckin);

app.use('/api', apiRouter);

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload demasiado grande',
      message: `El cuerpo de la solicitud excede el limite permitido de ${jsonLimit}`
    });
  }

  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      error: 'JSON invalido',
      message: 'Verifica el formato del cuerpo de la solicitud'
    });
  }

  if (res.headersSent) {
    return next(err);
  }

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
      console.log('');
      console.log('🔥 NEW INTEGRATIONS - More Consciousness & Absoluteness:');
      console.log('   ✅ Cycle completion endpoint');
      console.log('   ✅ Real-time location tracking');
      console.log('   ✅ NFC/RFID identification system');
      console.log('   ✅ Analytics & intelligent insights');
      console.log('   ✅ Alert & anomaly detection');
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
