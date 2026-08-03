# 🚀 Tractocamión 4.0 - Quick Start Guide

## Launch the Application

## Preparación obligatoria

```bash
npm ci
cp .env.example .env
# Edita .env y genera dos secretos diferentes con: openssl rand -hex 32
docker compose up -d postgres   # si Docker está disponible
npm run db:migrate
npm run db:seed
npm run preflight
npm test
npm run test:integration   # con el servidor encendido
```

El servidor se detiene intencionalmente cuando faltan secretos seguros o PostgreSQL. La configuración incluida en `compose.yaml` es sólo para desarrollo local.

### Linux / macOS / Termux

```bash
./start.sh
```

### Windows

```cmd
start.bat
```

Or simply:

```bash
npm start
```

---

## Access Points

- **Dashboard:** http://localhost:3000
- **API:** http://localhost:3000/api
- **Health Check:** http://localhost:3000/api/health
- **Readiness (incluye PostgreSQL):** http://localhost:3000/api/ready

---

## Features

🧪 **Cross-platform codebase**: requiere validación separada en cada plataforma; no incluye DMG
✅ **Real-time monitoring**: Live updates every 5 seconds  
✅ **Process tracking**: Automatic monitoring of system processes  
✅ **REST API**: Full API for integration with other systems  
✅ **Responsive design**: Works on desktop and mobile devices  
🟡 **Configured startup**: requiere PostgreSQL y un archivo `.env` seguro

---

## Project Structure

```
tractocamion/
├── src/
│   ├── server/          # Backend server
│   │   └── index.js     # Express server
│   ├── public/          # Frontend files
│   │   ├── index.html   # Dashboard UI
│   │   ├── styles.css   # Styling
│   │   └── app.js       # Frontend logic
│   └── scripts/         # Utility scripts
│       └── process-monitor.js
├── package.json         # Dependencies
├── start.sh            # Linux/macOS launcher
├── start.bat           # Windows launcher
├── INSTALL.md          # Installation guide
├── API.md              # API documentation
└── README.md           # Project overview
```

---

## Common Tasks

### Change Port

```bash
# Linux/macOS/Termux
PORT=8080 npm start

# Windows
set PORT=8080 && npm start
```

### Run Process Monitor

```bash
npm run monitor
```

### Background Execution

```bash
# Linux/macOS/Termux
nohup npm start &

# Windows
start /B npm start
```

---

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start with custom port
PORT=8080 npm start
```

---

## Troubleshooting

### Port Already in Use

Change the port using the `PORT` environment variable (see above).

### Dependencies Not Found

```bash
npm install
```

### Permission Denied (Linux/Termux)

```bash
chmod +x start.sh
./start.sh
```

---

## Learn More

- [Installation Guide](INSTALL.md) - Complete installation instructions for all platforms
- [API Documentation](API.md) - Full API reference
- [Main README](README.md) - Project overview and vision

---

**🚛 Revolucionando la logística latinoamericana, un ciclo a la vez.**
