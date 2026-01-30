const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const sequelize = require('../config/database');
const db = require('../models');
const { Truck, Operator, Cycle, Process } = db;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// NOTE: For production, add rate limiting middleware here (see SECURITY.md)
// and configure CORS with specific allowed origins
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
const apiRouter = express.Router();

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    platform: process.platform,
    node_version: process.version
  });
});

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
  // Add random component to reduce collision risk
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return 'CYC-' + timestamp + '-' + random;
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
