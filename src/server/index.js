const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
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
apiRouter.get('/processes', (req, res) => {
  res.json({
    processes: getProcessStatus(),
    timestamp: new Date().toISOString()
  });
});

// Truck status endpoint
apiRouter.get('/trucks', (req, res) => {
  res.json({
    trucks: getTruckStatus(),
    total: getTruckStatus().length,
    active: getTruckStatus().filter(t => t.status === 'active').length
  });
});

// Operators endpoint
apiRouter.get('/operators', (req, res) => {
  res.json({
    operators: getOperatorStatus(),
    total: getOperatorStatus().length,
    available: getOperatorStatus().filter(o => o.status === 'available').length
  });
});

// Cycle tracking endpoint
apiRouter.post('/cycles', (req, res) => {
  const cycle = req.body;
  res.json({
    success: true,
    cycle: {
      id: generateId(),
      ...cycle,
      timestamp: new Date().toISOString()
    }
  });
});

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
    { id: 'TRK-001', plate: 'ABC-123', status: 'active', location: 'Patio A', operator: 'Juan Pérez', cycle_time: '45min' },
    { id: 'TRK-002', plate: 'DEF-456', status: 'active', location: 'Zona de Carga', operator: 'María García', cycle_time: '32min' },
    { id: 'TRK-003', plate: 'GHI-789', status: 'resting', location: 'Área de Descanso', operator: null, cycle_time: null },
    { id: 'TRK-004', plate: 'JKL-012', status: 'active', location: 'Patio B', operator: 'Carlos López', cycle_time: '28min' }
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
  return 'CYC-' + Date.now().toString(36).toUpperCase();
}

// Start server
app.listen(PORT, () => {
  console.log('🚛 Tractocamión 4.0 - Sistema de Gestión Logística');
  console.log('='.repeat(50));
  console.log(`✅ Servidor iniciado en puerto ${PORT}`);
  console.log(`🌍 Plataforma: ${process.platform}`);
  console.log(`📡 API disponible en: http://localhost:${PORT}/api`);
  console.log(`🖥️  Dashboard en: http://localhost:${PORT}`);
  console.log('='.repeat(50));
});

module.exports = app;
