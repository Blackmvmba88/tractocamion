# 🚀 Tractocamión 4.0 - Installation Guide

## Cross-Platform Web Application

This guide covers installation on **all major platforms**: Linux, Windows, macOS (DMG), and Termux (Android).

---

## 📋 Prerequisites

- **Node.js** 14.0.0 or higher
- **npm** (included with Node.js)

---

## 🐧 Linux Installation

### Ubuntu/Debian

```bash
# Update package list
sudo apt update

# Install Node.js and npm
sudo apt install nodejs npm -y

# Verify installation
node --version
npm --version

# Clone or download the project
cd tractocamion

# Install dependencies
npm install

# Start the application
npm start
```

### CentOS/RHEL/Fedora

```bash
# Install Node.js
sudo dnf install nodejs npm -y

# Or using yum
sudo yum install nodejs npm -y

# Navigate to project
cd tractocamion

# Install dependencies
npm install

# Start the application
npm start
```

---

## 🪟 Windows Installation

### Method 1: Using Node.js Installer

1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Run the installer (`.msi` file)
3. Follow the installation wizard
4. Open Command Prompt or PowerShell:

```cmd
# Navigate to project folder
cd tractocamion

# Install dependencies
npm install

# Start the application
npm start
```

### Method 2: Using Chocolatey

```powershell
# Install Chocolatey (if not installed)
# Run PowerShell as Administrator

# Install Node.js
choco install nodejs -y

# Navigate to project
cd tractocamion

# Install dependencies
npm install

# Start application
npm start
```

---

## 🍎 macOS Installation (DMG)

### Method 1: Using Node.js Installer

1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Open the `.dmg` file
3. Install Node.js
4. Open Terminal:

```bash
# Navigate to project
cd tractocamion

# Install dependencies
npm install

# Start the application
npm start
```

### Method 2: Using Homebrew

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Navigate to project
cd tractocamion

# Install dependencies
npm install

# Start the application
npm start
```

---

## 📱 Termux Installation (Android)

Termux allows you to run Linux environment on Android devices.

```bash
# Update packages
pkg update && pkg upgrade

# Install Node.js
pkg install nodejs -y

# Install git (if needed)
pkg install git -y

# Navigate to storage (optional)
termux-setup-storage
cd ~/storage/shared

# Navigate to project folder
cd tractocamion

# Install dependencies
npm install

# Start the application
npm start
```

**Note**: On Termux, the server will be accessible at `http://localhost:3000` on your Android device.

---

## 🌐 Accessing the Application

After starting the server, open your browser and navigate to:

```
http://localhost:3000
```

The dashboard will display:
- 📊 Real-time process monitoring
- 🚛 Truck status
- 👷 Operator status
- 📈 System metrics

---

## 🔄 Running in Background

### Linux/macOS

```bash
# Using nohup
nohup npm start &

# Or using screen
screen -S tractocamion
npm start
# Press Ctrl+A, then D to detach

# Or using pm2 (recommended)
npm install -g pm2
pm2 start src/server/index.js --name tractocamion
pm2 save
pm2 startup
```

### Windows

```cmd
# Using start command
start /B npm start

# Or install pm2
npm install -g pm2
pm2 start src/server/index.js --name tractocamion
pm2 save
```

### Termux

```bash
# Using nohup
nohup npm start > output.log 2>&1 &

# Or using termux-wake-lock to prevent sleep
termux-wake-lock
npm start
```

---

## 🔍 Process Monitoring

Run the automated process monitor:

```bash
npm run monitor
```

This will display:
- System information
- Active processes
- Resource usage
- Server status

---

## 🛠️ Troubleshooting

### Port Already in Use

If port 3000 is already in use, set a different port:

```bash
# Linux/macOS/Termux
PORT=8080 npm start

# Windows (Command Prompt)
set PORT=8080 && npm start

# Windows (PowerShell)
$env:PORT=8080; npm start
```

### Permission Denied (Linux/Termux)

```bash
# If you get permission errors
sudo npm install
# Or
npm install --unsafe-perm
```

### Node.js Not Found

Ensure Node.js is in your PATH:

```bash
# Check if node is accessible
which node  # Linux/macOS/Termux
where node  # Windows
```

---

## 🎯 Next Steps

1. Access the dashboard at `http://localhost:3000`
2. Review the API documentation in `API.md`
3. Configure your environment in `.env` file (optional)
4. Set up automatic startup (see platform-specific guides)

---

## 📞 Support

For issues or questions, please check the documentation or open an issue on GitHub.

**Happy trucking! 🚛**
