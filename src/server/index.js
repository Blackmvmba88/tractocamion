require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const sequelize = require('../config/database');
const { assertValidEnvironment } = require('../config/validateEnvironment');
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
  handleValidationErrors
} = require('../middleware/validation');

// Import controllers
const authController = require('../controllers/authController');
const cycleController = require('../controllers/cycleController');
const analyticsController = require('../controllers/analyticsController');
const nfcController = require('../controllers/nfcController');

assertValidEnvironment();

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

  if (value === 'true') return true;
  if (value === 'false') return false;

  const numericValue = Number.parseInt(value, 10);
  return Number.isInteger(numericValue) ? numericValue : value;
}

const jsonLimit = process.env.JSON_BODY_LIMIT || '256kb';
const urlencodedLimit = process.env.URLENCODED_BODY_LIMIT || '256kb';
const staticAssetsMaxAgeMs = parseIntegerEnv(process.env.STATIC_CACHE_MAX_AGE_MS, 60 * 60 * 1000);
const corsOrigin = process.env.CORS_ORIGIN || '*';
const allowCredentialedCors = corsOrigin !== '*';

const corsOptions = {
  origin: corsOrigin,
  credentials: allowCredentialedCors
};

app.set('trust proxy', parseTrustProxy(process.env.TRUST_PROXY));
app.disable('x-powered-by');
app.set('etag', 'strong');

app.use(cors(corsOptions));
app.use(express.json({ limit: jsonLimit }));
app.use(express.urlencoded({
  extended: true,
  limit: urlencodedLimit,
  parameterLimit: parseIntegerEnv(process.env.URLENCODED_PARAMETER_LIMIT, 100)
}));
app.use(sanitizeInput);

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

const apiRouter = express.Router();
apiRouter.use(apiLimiter);

// Public health endpoints
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    check: 'liveness',
    timestamp: new Date().toISOString(),
    platform: process.platform,
    node_version: process.version
  });
});

apiRouter.get('/health/live', (req, res) => {
  res.json({ status: 'ok', check: 'liveness', timestamp: new Date().toISOString() });
});

apiRouter.get('/health/ready', async (req, res) => {
  try {
    await sequelize.authenticate();
    return res.json({
      status: 'ready',
      check: 'readiness',
      database: 'ok',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(503).json({
      status: 'not_ready',
      check: 'readiness',
      database: 'unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

// Public authentication routes
apiRouter.post('/auth/register',
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

// Protected account routes
apiRouter.post('/auth/logout', authenticateToken, authController.logout);
apiRouter.get('/auth/me', authenticateToken, authController.me);
apiRouter.post('/auth/change-password',
  authenticateToken,
  changePasswordValidation,
  handleValidationErrors,
  authController.changePassword
);

// Everything below exposes operational data or mutates yard state.
apiRouter.use(authenticateToken);

apiRouter.get('/processes', requireRole('admin', 'gerente'), async (req, res) => {
  try {
    const processes = await Process.findAll({
      attributes: ['name', 'status', 'uptime_seconds', 'cpu_percent', 'memory_mb']
    });

    const formattedProcesses = processes.map((process) => ({
      name: process.name,
      status: process.status,
      uptime: formatUptime(process.uptime_seconds),
      cpu: `${process.cpu_percent}%`,
      memory: `${process.memory_mb}MB`
    }));

    res.json({ processes: formattedProcesses, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error fetching processes:', error);
    res.status(500).json({
      error: 'Database error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

apiRouter.get('/trucks', async (req, res) => {
  try {
    const trucks = await Truck.findAll({
      attributes: ['id', 'plate', 'status', 'location', 'cycle_start_time'],
      include: [{
        model: Operator,
        as: 'operator',
        attributes: ['name']
      }]
    });

    const formattedTrucks = trucks.map((truck) => ({
      id: truck.id,
      plate: truck.plate,
      status: truck.status,
      location: truck.location,
      operator: truck.operator ? truck.operator.name : null,
      cycle_time: truck.cycle_start_time ? calculateCycleTime(truck.cycle_start_time) : null
    }));

    res.json({
      trucks: formattedTrucks,
      total: trucks.length,
      active: trucks.filter((truck) => truck.status === 'active').length
    });
  } catch (error) {
    console.error('Error fetching trucks:', error);
    res.status(500).json({
      error: 'Database error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

apiRouter.get('/operators', requireRole('admin', 'gerente'), async (req, res) => {
  try {
    const operators = await Operator.findAll({
      attributes: ['code', 'name', 'status', 'total_hours', 'total_cycles', 'total_earnings']
    });

    const formattedOperators = operators.map((operator) => ({
      id: operator.code,
      name: operator.name,
      status: operator.status,
      hours: `${operator.total_hours}h`,
      cycles: operator.total_cycles,
      earnings: `$${operator.total_earnings}`
    }));

    res.json({
      operators: formattedOperators,
      total: operators.length,
      available: operators.filter((operator) => operator.status === 'available').length
    });
  } catch (error) {
    console.error('Error fetching operators:', error);
    res.status(500).json({
      error: 'Database error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

apiRouter.get('/cycles', cycleController.getCycles);
apiRouter.get('/cycles/:id', cycleController.getCycle);
apiRouter.post('/cycles', requireRole('admin', 'gerente'), cycleController.createCycle);
apiRouter.post('/cycles/:id/complete', requireRole('admin', 'gerente'), cycleController.completeCycle);
apiRouter.patch('/cycles/:id/location', cycleController.updateLocation);

apiRouter.get('/analytics/dashboard', requireRole('admin', 'gerente'), analyticsController.getDashboard);
apiRouter.get('/analytics/operators', requireRole('admin', 'gerente'), analyticsController.getOperatorMetrics);
apiRouter.get('/analytics/trucks', requireRole('admin', 'gerente'), analyticsController.getTruckMetrics);
apiRouter.get('/analytics/alerts', requireRole('admin', 'gerente'), analyticsController.getAlerts);

apiRouter.post('/nfc/verify', nfcController.verifyTag);
apiRouter.post('/nfc/register', requireRole('admin', 'gerente'), nfcController.registerTag);
apiRouter.post('/nfc/unregister', requireRole('admin', 'gerente'), nfcController.unregisterTag);
apiRouter.post('/nfc/checkin', nfcController.quickCheckin);

app.use('/api', apiRouter);

app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(publicDir, 'index.html'));
});

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

  if (res.headersSent) return next(err);

  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

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
        console.error('💡 Intenta con un puerto diferente: PORT=8080 npm start');
      } else {
        console.error('❌ Error al iniciar el servidor:', err.message);
      }
      process.exit(1);
    });

    module.exports = { app, server };
  })
  .catch((err) => {
    console.error('❌ Unable to connect to the database:', err.message);
    console.error('💡 Make sure PostgreSQL is running and DATABASE_URL is correct');
    console.error('💡 See INSTALL.md for database setup instructions');
    process.exit(1);
  });
