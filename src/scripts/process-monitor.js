#!/usr/bin/env node

/**
 * Process Monitor Script
 * Automated process checking for Tractocamión 4.0
 * Cross-platform compatible (Linux, macOS, Windows, Termux)
 */

const os = require('os');
const { exec } = require('child_process');

class ProcessMonitor {
    constructor() {
        this.platform = process.platform;
        this.interval = process.env.MONITOR_INTERVAL || 30000; // Configurable interval
        this.processes = [];
    }

    // Get system information
    getSystemInfo() {
        return {
            platform: this.platform,
            hostname: os.hostname(),
            cpus: os.cpus().length,
            totalMemory: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
            freeMemory: (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + ' GB',
            uptime: (os.uptime() / 3600).toFixed(2) + ' hours',
            nodeVersion: process.version
        };
    }

    // Check if a process is running
    checkProcess(processName, callback) {
        let cmd;
        
        switch (this.platform) {
            case 'win32':
                cmd = `tasklist /FI "IMAGENAME eq ${processName}.exe"`;
                break;
            case 'darwin':
            case 'linux':
            default:
                cmd = `ps aux | grep ${processName} | grep -v grep`;
                break;
        }

        exec(cmd, (error, stdout, stderr) => {
            // Only check stdout if there's no critical error
            if (error && error.code !== 1) {
                // Code 1 just means no match found, which is ok
                console.error('Error checking process:', error.message);
                callback(false);
                return;
            }
            
            const isRunning = stdout.includes(processName);
            callback(isRunning);
        });
    }

    // Monitor Node.js processes
    monitorNodeProcesses() {
        const cmd = this.platform === 'win32' 
            ? 'tasklist /FI "IMAGENAME eq node.exe"'
            : 'ps aux | grep node | grep -v grep';

        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error('Error monitoring processes:', error.message);
                return;
            }

            const lines = stdout.split('\n').filter(line => line.trim());
            console.log(`\n📊 Active Node.js processes: ${lines.length}`);
        });
    }

    // Display system metrics
    displayMetrics() {
        const info = this.getSystemInfo();
        
        console.log('\n🚛 Tractocamión 4.0 - Process Monitor');
        console.log('='.repeat(60));
        console.log(`🖥️  Platform: ${info.platform}`);
        console.log(`🌐 Hostname: ${info.hostname}`);
        console.log(`⚙️  CPUs: ${info.cpus}`);
        console.log(`💾 Total Memory: ${info.totalMemory}`);
        console.log(`💽 Free Memory: ${info.freeMemory}`);
        console.log(`⏱️  System Uptime: ${info.uptime}`);
        console.log(`📦 Node Version: ${info.nodeVersion}`);
        console.log('='.repeat(60));
    }

    // Run monitoring cycle
    async runMonitoringCycle() {
        this.displayMetrics();
        this.monitorNodeProcesses();

        // Check if main server is running
        this.checkProcess('node', (isRunning) => {
            const status = isRunning ? '✅ RUNNING' : '❌ STOPPED';
            console.log(`\n🚀 Tractocamión Server: ${status}`);
        });

        console.log(`\n🔄 Next check in ${this.interval / 1000} seconds...`);
    }

    // Start monitoring
    start() {
        console.log('🎯 Starting Tractocamión Process Monitor...\n');
        
        // Initial check
        this.runMonitoringCycle();

        // Periodic checks
        setInterval(() => {
            this.runMonitoringCycle();
        }, this.interval);
    }
}

// Main execution
if (require.main === module) {
    const monitor = new ProcessMonitor();
    monitor.start();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n\n👋 Stopping process monitor...');
        console.log('✅ Monitor stopped successfully');
        process.exit(0);
    });
}

module.exports = ProcessMonitor;
