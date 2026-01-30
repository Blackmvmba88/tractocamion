# 🚀 Tractocamión 4.0 - Installation Guide

## Cross-Platform Web Application

This guide covers installation on **all major platforms**: Linux, Windows, macOS (DMG), and Termux (Android).

---

## 📋 Prerequisites

- **Node.js** 14.0.0 or higher
- **npm** (included with Node.js)
- **PostgreSQL** 12.0 or higher (for database functionality)

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

## 🗄️ Database Setup (PostgreSQL)

The application uses PostgreSQL for persistent data storage. Follow these steps to set up the database:

### Installing PostgreSQL

#### Linux (Ubuntu/Debian)
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Access PostgreSQL prompt
sudo -u postgres psql
```

#### Linux (CentOS/RHEL/Fedora)
```bash
# Install PostgreSQL
sudo dnf install postgresql-server postgresql-contrib -y

# Initialize database
sudo postgresql-setup --initdb

# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Access PostgreSQL prompt
sudo -u postgres psql
```

#### Windows
1. Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run the installer
3. Follow the installation wizard
4. Remember the password you set for the `postgres` user
5. Open pgAdmin or use the SQL Shell (psql)

#### macOS
```bash
# Using Homebrew
brew install postgresql@15

# Start PostgreSQL
brew services start postgresql@15

# Access PostgreSQL prompt
psql postgres
```

#### Termux (Android)
```bash
# Install PostgreSQL
pkg install postgresql -y

# Initialize database cluster
initdb $PREFIX/var/lib/postgresql

# Start PostgreSQL
pg_ctl -D $PREFIX/var/lib/postgresql start

# Access PostgreSQL prompt
psql postgres
```

### Creating the Database

Once PostgreSQL is installed and running, create the application database:

```sql
-- In PostgreSQL prompt (psql)
CREATE DATABASE tractocamion;
CREATE USER tractocamion_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE tractocamion TO tractocamion_user;
\q
```

### Configuring Database Connection

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and update the `DATABASE_URL`:
```env
DATABASE_URL=postgresql://tractocamion_user:your_secure_password@localhost:5432/tractocamion
```

### Running Migrations and Seeders

After configuring the database connection:

```bash
# Run migrations to create tables
npm run db:migrate

# Seed the database with initial data
npm run db:seed

# Start the application
npm start
```

### Database Management Commands

```bash
# Run migrations
npm run db:migrate

# Seed database with test data
npm run db:seed

# Reset database (CAUTION: This will delete all data!)
npm run db:reset

# Create database (if not exists)
npm run db:create
```

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

### Database Connection Issues

If you see "Unable to connect to the database" errors:

```bash
# 1. Check PostgreSQL is running
# Linux/macOS
sudo systemctl status postgresql

# Termux
pg_ctl -D $PREFIX/var/lib/postgresql status

# 2. Verify database exists
psql -U postgres -l

# 3. Test connection
psql -U tractocamion_user -d tractocamion -h localhost

# 4. Check your .env file has correct DATABASE_URL
cat .env | grep DATABASE_URL
```

### Migration Errors

If migrations fail:

```bash
# Reset and try again
npm run db:reset

# Or manually
sequelize-cli db:migrate:undo:all
sequelize-cli db:migrate
sequelize-cli db:seed:all
```

### Permission Issues with PostgreSQL

```bash
# Linux - Grant proper permissions
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE tractocamion TO tractocamion_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tractocamion_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tractocamion_user;
\q
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
