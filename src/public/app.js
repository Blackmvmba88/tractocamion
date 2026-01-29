// API base URL
const API_BASE = '/api';

// Update platform info
async function updatePlatformInfo() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        const platformBadge = document.getElementById('platform-info');
        platformBadge.textContent = `Platform: ${data.platform} | Node: ${data.node_version}`;
    } catch (error) {
        console.error('Error fetching platform info:', error);
    }
}

// Update process status
async function updateProcesses() {
    try {
        const response = await fetch(`${API_BASE}/processes`);
        const data = await response.json();
        const tableBody = document.getElementById('processes-table');
        
        tableBody.innerHTML = data.processes.map(process => `
            <tr>
                <td><strong>${process.name}</strong></td>
                <td><span class="status-running">● ${process.status}</span></td>
                <td>${process.uptime}</td>
                <td>${process.cpu}</td>
                <td>${process.memory}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error fetching processes:', error);
    }
}

// Update truck status
async function updateTrucks() {
    try {
        const response = await fetch(`${API_BASE}/trucks`);
        const data = await response.json();
        const tableBody = document.getElementById('trucks-table');
        
        // Update stat card
        document.getElementById('active-trucks').textContent = data.active;
        
        tableBody.innerHTML = data.trucks.map(truck => `
            <tr>
                <td><strong>${truck.id}</strong></td>
                <td>${truck.plate}</td>
                <td><span class="status-${truck.status}">${truck.status.toUpperCase()}</span></td>
                <td>${truck.location}</td>
                <td>${truck.operator || '-'}</td>
                <td>${truck.cycle_time || '-'}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error fetching trucks:', error);
    }
}

// Update operator status
async function updateOperators() {
    try {
        const response = await fetch(`${API_BASE}/operators`);
        const data = await response.json();
        const tableBody = document.getElementById('operators-table');
        
        // Update stat card
        const working = data.operators.filter(o => o.status === 'working').length;
        document.getElementById('active-operators').textContent = working;
        
        tableBody.innerHTML = data.operators.map(operator => `
            <tr>
                <td><strong>${operator.id}</strong></td>
                <td>${operator.name}</td>
                <td><span class="status-${operator.status}">${operator.status.toUpperCase()}</span></td>
                <td>${operator.hours}</td>
                <td>${operator.cycles}</td>
                <td><strong>${operator.earnings}</strong></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error fetching operators:', error);
    }
}

// Update last update time
function updateTimestamp() {
    const lastUpdate = document.getElementById('last-update');
    const now = new Date();
    lastUpdate.textContent = `Última actualización: ${now.toLocaleTimeString('es-ES')}`;
}

// Update all data
async function updateAll() {
    await Promise.all([
        updateProcesses(),
        updateTrucks(),
        updateOperators()
    ]);
    updateTimestamp();
}

// Initialize the dashboard
async function init() {
    console.log('🚛 Tractocamión 4.0 Dashboard Initialized');
    await updatePlatformInfo();
    await updateAll();
    
    // Auto-refresh every 5 seconds
    setInterval(updateAll, 5000);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
