// API base URL
const API_BASE = '/api';

// Check and display user info
function displayUserInfo() {
    const userInfo = document.getElementById('user-info');
    const loginLink = document.getElementById('login-link');
    
    if (window.authUtils && window.authUtils.isAuthenticated()) {
        const user = window.authUtils.getUser();
        if (user) {
            document.getElementById('user-name').textContent = user.username;
            document.getElementById('user-role').textContent = user.role.toUpperCase();
            userInfo.style.display = 'block';
            if (loginLink) loginLink.style.display = 'none';
        }
    } else {
        userInfo.style.display = 'none';
        if (loginLink) loginLink.style.display = 'inline-block';
    }
}

// Setup logout button
function setupLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (window.authUtils) {
                await window.authUtils.logout();
            }
        });
    }
}

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
        // Use authFetch if available and authenticated, otherwise regular fetch
        const fetchFn = (window.authUtils && window.authUtils.isAuthenticated()) 
            ? window.authUtils.authFetch 
            : fetch;
        
        const response = await fetchFn(`${API_BASE}/processes`);
        if (!response.ok) {
            // If 401/403, user might not have access - hide section
            if (response.status === 401 || response.status === 403) {
                document.querySelector('.section:has(#processes-container)').style.display = 'none';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
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
        showError('Error al cargar procesos');
    }
}

// Update truck status
async function updateTrucks() {
    try {
        const fetchFn = (window.authUtils && window.authUtils.isAuthenticated()) 
            ? window.authUtils.authFetch 
            : fetch;
        
        const response = await fetchFn(`${API_BASE}/trucks`);
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                // User not authenticated - show message
                document.getElementById('trucks-table').innerHTML = 
                    '<tr><td colspan="6" style="text-align: center; padding: 20px;">🔐 Inicia sesión para ver los tractores</td></tr>';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
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
        showError('Error al cargar tractores');
    }
}

// Update operator status
async function updateOperators() {
    try {
        const fetchFn = (window.authUtils && window.authUtils.isAuthenticated()) 
            ? window.authUtils.authFetch 
            : fetch;
        
        const response = await fetchFn(`${API_BASE}/operators`);
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                document.getElementById('operators-table').innerHTML = 
                    '<tr><td colspan="6" style="text-align: center; padding: 20px;">🔐 Inicia sesión para ver los operadores</td></tr>';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
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
        showError('Error al cargar operadores');
    }
}

// Update last update time
function updateTimestamp() {
    const lastUpdate = document.getElementById('last-update');
    const now = new Date();
    lastUpdate.textContent = `Última actualización: ${now.toLocaleTimeString()}`;
}

// Show error message
function showError(message) {
    const lastUpdate = document.getElementById('last-update');
    lastUpdate.textContent = `⚠️ ${message}`;
    lastUpdate.style.color = '#f44336';
    setTimeout(() => {
        lastUpdate.style.color = '';
    }, 3000);
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
    
    // Wait for auth.js to load
    await new Promise(resolve => {
        if (window.authUtils) {
            resolve();
        } else {
            setTimeout(resolve, 100);
        }
    });
    
    displayUserInfo();
    setupLogoutButton();
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
