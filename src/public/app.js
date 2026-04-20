const API_BASE = '/api';
const VISIBLE_REFRESH_MS = 5000;
const HIDDEN_REFRESH_MS = 30000;

let refreshTimer = null;
let updateInFlight = false;
let hasRenderedOnce = false;
let consecutiveFailures = 0;

const tableState = {
    processes: new Map(),
    trucks: new Map(),
    operators: new Map()
};

function getFetchFn() {
    return (window.authUtils && window.authUtils.isAuthenticated())
        ? window.authUtils.authFetch
        : fetch;
}

function formatTimestamp(date = new Date()) {
    return date.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function formatNumber(value, digits = 0) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
        return '0';
    }
    return numericValue.toLocaleString('es-MX', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    });
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (!element) {
        return;
    }
    const nextValue = String(value);
    if (element.textContent !== nextValue) {
        element.textContent = nextValue;
    }
}

function setMonitorState(state, message) {
    const indicator = document.getElementById('connection-indicator');
    const monitorMessage = document.getElementById('monitor-message');

    if (indicator) {
        indicator.className = `connection-indicator ${state}`;
    }
    if (monitorMessage) {
        monitorMessage.textContent = message;
    }
}

function setSectionStatus(sectionName, state, message) {
    const badge = document.getElementById(`${sectionName}-status`);
    if (!badge) {
        return;
    }
    badge.className = `section-status ${state}`;
    badge.textContent = message;
}

function setStatHighlight(statName, shouldHighlight) {
    const card = document.querySelector(`[data-stat-card="${statName}"]`);
    if (!card) {
        return;
    }
    card.classList.toggle('is-highlight', Boolean(shouldHighlight));
}

function updateRefreshMode() {
    const label = document.hidden ? '30s en segundo plano' : '5s visible';
    setText('refresh-mode', label);
}

function updateSummary(message) {
    setText('update-summary', message);
}

function updateTimestamp() {
    setText('last-update', formatTimestamp());
}

function showTableMessage(tableBodyId, colspan, message) {
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) {
        return;
    }
    const stateMap = tableState[tableBodyId.replace('-table', '')];
    if (stateMap) {
        stateMap.clear();
    }
    tableBody.innerHTML = `<tr><td colspan="${colspan}" class="table-message">${message}</td></tr>`;
}

function normalizeStatus(value) {
    return String(value || 'available').toLowerCase().replace(/\s+/g, '-');
}

function renderBadge(value) {
    const label = value ? String(value).toUpperCase() : 'N/D';
    const className = normalizeStatus(value);
    return `<span class="status-${className}">${label}</span>`;
}

function renderValueTone(text, tone) {
    if (!tone) {
        return text;
    }
    return `<span class="${tone}">${text}</span>`;
}

function syncTableRows({ tableBodyId, rows, getKey, renderCells }) {
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) {
        return;
    }

    const stateMap = tableState[tableBodyId.replace('-table', '')];
    const nextKeys = new Set();

    rows.forEach((rowData, index) => {
        const key = String(getKey(rowData));
        nextKeys.add(key);

        let row = stateMap.get(key);
        if (!row) {
            row = document.createElement('tr');
            row.dataset.rowKey = key;
            stateMap.set(key, row);
        }

        const nextHtml = renderCells(rowData);
        if (row.dataset.renderedHtml !== nextHtml) {
            row.innerHTML = nextHtml;
            row.dataset.renderedHtml = nextHtml;
        }

        const referenceNode = tableBody.children[index];
        if (referenceNode !== row) {
            tableBody.insertBefore(row, referenceNode || null);
        }
    });

    Array.from(stateMap.entries()).forEach(([key, row]) => {
        if (!nextKeys.has(key)) {
            row.remove();
            stateMap.delete(key);
        }
    });
}

function displayUserInfo() {
    const userInfo = document.getElementById('user-info');
    const loginLink = document.getElementById('login-link');

    if (window.authUtils && window.authUtils.isAuthenticated()) {
        const user = window.authUtils.getUser();
        if (user) {
            setText('user-name', user.username);
            setText('user-role', user.role.toUpperCase());
            userInfo.style.display = 'block';
            if (loginLink) {
                loginLink.style.display = 'none';
            }
            return;
        }
    }

    userInfo.style.display = 'none';
    if (loginLink) {
        loginLink.style.display = 'inline-block';
    }
}

function setupLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (!logoutBtn) {
        return;
    }

    logoutBtn.addEventListener('click', async () => {
        if (window.authUtils) {
            await window.authUtils.logout();
        }
    });
}

async function updatePlatformInfo() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        setText('platform-info', `Platform: ${data.platform} | Node: ${data.node_version}`);
    } catch (error) {
        console.error('Error fetching platform info:', error);
        setText('platform-info', 'Platform no disponible');
    }
}

async function updateDashboardMetrics() {
    const response = await getFetchFn()(`${API_BASE}/analytics/dashboard`);
    if (!response.ok) {
        throw new Error(`Metrics request failed with status ${response.status}`);
    }

    const data = await response.json();
    const throughput = data?.today?.cycles_count ?? 0;
    const avgTime = data?.performance?.avg_cycle_time_minutes ?? data?.today?.avg_duration_minutes ?? 0;
    const targetTime = data?.performance?.target_time_minutes ?? 0;
    const workingOperators = data?.summary?.operators?.working ?? 0;
    const totalOperators = data?.summary?.operators?.total ?? 0;
    const activeTrucks = data?.summary?.trucks?.active ?? 0;
    const totalTrucks = data?.summary?.trucks?.total ?? 0;
    const throughputGoal = data?.today?.target_cycles ?? null;

    setText('throughput', formatNumber(throughput));
    setText('avg-time', formatNumber(avgTime, 1));
    setText('active-operators', formatNumber(workingOperators));
    setText('operators-total', formatNumber(totalOperators));
    setText('active-trucks', formatNumber(activeTrucks));
    setText('trucks-total', formatNumber(totalTrucks));
    setText('throughput-label', throughputGoal ? `meta ${formatNumber(throughputGoal)} ciclos` : 'ciclos hoy');
    setText('avg-time-label', targetTime ? `objetivo ${formatNumber(targetTime)} min` : 'minutos/ciclo');

    const operatorCoverage = totalOperators ? Math.round((workingOperators / totalOperators) * 100) : 0;
    const truckCoverage = totalTrucks ? Math.round((activeTrucks / totalTrucks) * 100) : 0;
    const cycleDelta = targetTime ? avgTime - targetTime : null;

    setText(
        'throughput-trend',
        throughputGoal
            ? `${formatNumber(Math.max(throughputGoal - throughput, 0))} ciclos para la meta`
            : 'Seguimiento en tiempo real del día'
    );
    setText(
        'avg-time-trend',
        cycleDelta === null
            ? 'Sin objetivo configurado'
            : cycleDelta <= 0
                ? `${formatNumber(Math.abs(cycleDelta), 1)} min por debajo del objetivo`
                : `${formatNumber(cycleDelta, 1)} min por encima del objetivo`
    );
    setText('operators-trend', `${operatorCoverage}% del equipo en operación`);
    setText('trucks-trend', `${truckCoverage}% de la flota activa`);

    setStatHighlight('throughput', throughputGoal && throughput >= throughputGoal);
    setStatHighlight('avg-time', cycleDelta !== null && cycleDelta <= 0);
    setStatHighlight('active-operators', operatorCoverage >= 70);
    setStatHighlight('active-trucks', truckCoverage >= 70);

    return {
        throughput,
        throughputGoal,
        avgTime,
        targetTime,
        operatorCoverage,
        truckCoverage
    };
}

async function updateProcesses() {
    try {
        const processSection = document.getElementById('processes-container')?.closest('.section');
        const response = await getFetchFn()(`${API_BASE}/processes`);
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                if (processSection) {
                    processSection.style.display = 'none';
                }
                return { hidden: true };
            }
            throw new Error(`Processes request failed with status ${response.status}`);
        }
        if (processSection) {
            processSection.style.display = '';
        }

        const data = await response.json();
        const processes = Array.isArray(data.processes) ? data.processes : [];

        if (!processes.length) {
            showTableMessage('processes-table', 5, 'No hay procesos reportados en este momento.');
            setSectionStatus('processes', 'ok', 'Sin actividad');
            return { count: 0 };
        }

        syncTableRows({
            tableBodyId: 'processes-table',
            rows: processes,
            getKey: (process) => process.name,
            renderCells: (process) => `
                <td><strong>${process.name}</strong></td>
                <td>${renderBadge(process.status)}</td>
                <td>${process.uptime || '-'}</td>
                <td>${process.cpu || '-'}</td>
                <td>${process.memory || '-'}</td>
            `
        });

        const healthyProcesses = processes.filter((process) => normalizeStatus(process.status) === 'running').length;
        setSectionStatus('processes', 'ok', `${healthyProcesses}/${processes.length} activos`);
        return { count: processes.length, healthyProcesses };
    } catch (error) {
        console.error('Error fetching processes:', error);
        showTableMessage('processes-table', 5, 'No fue posible cargar procesos.');
        setSectionStatus('processes', 'error', 'Con error');
        throw error;
    }
}

async function updateTrucks() {
    try {
        const response = await getFetchFn()(`${API_BASE}/trucks`);
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                showTableMessage('trucks-table', 6, '🔐 Inicia sesión para ver los tractores.');
                setSectionStatus('trucks', 'error', 'Acceso restringido');
                return { restricted: true };
            }
            throw new Error(`Trucks request failed with status ${response.status}`);
        }

        const data = await response.json();
        const trucks = Array.isArray(data.trucks) ? data.trucks : [];
        const active = Number.isFinite(Number(data.active)) ? Number(data.active) : trucks.filter((truck) => normalizeStatus(truck.status) === 'active').length;
        setText('active-trucks', formatNumber(active));

        if (!trucks.length) {
            showTableMessage('trucks-table', 6, 'No hay tractores registrados.');
            setSectionStatus('trucks', 'ok', 'Sin unidades');
            return { count: 0, active };
        }

        syncTableRows({
            tableBodyId: 'trucks-table',
            rows: trucks,
            getKey: (truck) => truck.id,
            renderCells: (truck) => `
                <td><strong>${truck.id}</strong></td>
                <td>${truck.plate || '-'}</td>
                <td>${renderBadge(truck.status)}</td>
                <td>${truck.location || '-'}</td>
                <td>${truck.operator || '<span class="row-muted">Sin asignar</span>'}</td>
                <td>${truck.cycle_time || '-'}</td>
            `
        });

        const coverage = Math.round((active / trucks.length) * 100);
        setSectionStatus('trucks', 'ok', `${active}/${trucks.length} operando`);
        return { count: trucks.length, active, coverage };
    } catch (error) {
        console.error('Error fetching trucks:', error);
        showTableMessage('trucks-table', 6, 'No fue posible cargar tractores.');
        setSectionStatus('trucks', 'error', 'Con error');
        throw error;
    }
}

async function updateOperators() {
    try {
        const response = await getFetchFn()(`${API_BASE}/operators`);
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                showTableMessage('operators-table', 6, '🔐 Inicia sesión para ver los operadores.');
                setSectionStatus('operators', 'error', 'Acceso restringido');
                return { restricted: true };
            }
            throw new Error(`Operators request failed with status ${response.status}`);
        }

        const data = await response.json();
        const operators = Array.isArray(data.operators) ? data.operators : [];
        const working = operators.filter((operator) => normalizeStatus(operator.status) === 'working').length;
        setText('active-operators', formatNumber(working));

        if (!operators.length) {
            showTableMessage('operators-table', 6, 'No hay operadores registrados.');
            setSectionStatus('operators', 'ok', 'Sin personal');
            return { count: 0, working };
        }

        syncTableRows({
            tableBodyId: 'operators-table',
            rows: operators,
            getKey: (operator) => operator.id,
            renderCells: (operator) => {
                const cycles = Number(operator.cycles) || 0;
                const hours = operator.hours || '-';
                const earnings = operator.earnings || '-';
                const cycleTone = cycles >= 5 ? 'value-positive' : cycles >= 1 ? 'value-warning' : 'row-muted';
                return `
                    <td><strong>${operator.id}</strong></td>
                    <td>${operator.name || '-'}</td>
                    <td>${renderBadge(operator.status)}</td>
                    <td>${hours}</td>
                    <td>${renderValueTone(cycles, cycleTone)}</td>
                    <td><strong>${earnings}</strong></td>
                `;
            }
        });

        const coverage = Math.round((working / operators.length) * 100);
        setSectionStatus('operators', 'ok', `${working}/${operators.length} en turno`);
        return { count: operators.length, working, coverage };
    } catch (error) {
        console.error('Error fetching operators:', error);
        showTableMessage('operators-table', 6, 'No fue posible cargar operadores.');
        setSectionStatus('operators', 'error', 'Con error');
        throw error;
    }
}

function updateMonitorFromResults(results) {
    const [metrics, processes, trucks, operators] = results;
    const statusParts = [];

    if (metrics) {
        if (metrics.throughputGoal) {
            statusParts.push(`${formatNumber(metrics.throughput)}/${formatNumber(metrics.throughputGoal)} ciclos`);
        } else {
            statusParts.push(`${formatNumber(metrics.throughput)} ciclos hoy`);
        }
    }

    if (trucks && !trucks.restricted && typeof trucks.active === 'number') {
        statusParts.push(`${trucks.active} tractores activos`);
    }

    if (operators && !operators.restricted && typeof operators.working === 'number') {
        statusParts.push(`${operators.working} operadores trabajando`);
    }

    if (processes && !processes.hidden && typeof processes.healthyProcesses === 'number') {
        statusParts.push(`${processes.healthyProcesses} procesos sanos`);
    }

    setMonitorState('healthy', statusParts.length ? statusParts.join(' • ') : 'Telemetría en línea');
    updateSummary('Lectura estable del dashboard; las secciones solo se redibujan cuando cambia algo.');
}

function handleUpdateError(error) {
    consecutiveFailures += 1;
    console.error('Dashboard update failed:', error);
    setMonitorState('error', `Sincronización con errores (${consecutiveFailures})`);
    updateSummary('Se detectaron fallas al refrescar datos. El dashboard seguirá reintentando automáticamente.');
}

async function updateAll(options = {}) {
    if (updateInFlight) {
        return;
    }

    updateInFlight = true;
    if (!hasRenderedOnce || options.forceLoadingState) {
        setMonitorState('loading', 'Actualizando telemetría...');
        setSectionStatus('processes', 'loading', 'Actualizando...');
        setSectionStatus('trucks', 'loading', 'Actualizando...');
        setSectionStatus('operators', 'loading', 'Actualizando...');
    }

    try {
        const results = await Promise.all([
            updateDashboardMetrics(),
            updateProcesses(),
            updateTrucks(),
            updateOperators()
        ]);

        consecutiveFailures = 0;
        hasRenderedOnce = true;
        updateTimestamp();
        updateMonitorFromResults(results);
    } catch (error) {
        handleUpdateError(error);
    } finally {
        updateInFlight = false;
    }
}

function scheduleRefresh() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }

    updateRefreshMode();
    const interval = document.hidden ? HIDDEN_REFRESH_MS : VISIBLE_REFRESH_MS;
    refreshTimer = setInterval(() => {
        updateAll();
    }, interval);
}

async function waitForAuth() {
    if (window.authUtils) {
        return;
    }

    await new Promise((resolve) => {
        setTimeout(resolve, 100);
    });
}

async function init() {
    console.log('🚛 Tractocamión 4.0 Dashboard Initialized');

    await waitForAuth();
    displayUserInfo();
    setupLogoutButton();
    updateRefreshMode();
    await updatePlatformInfo();
    await updateAll({ forceLoadingState: true });
    scheduleRefresh();

    document.addEventListener('visibilitychange', () => {
        scheduleRefresh();
        if (!document.hidden) {
            updateAll();
        } else {
            setMonitorState('healthy', 'Pestaña en segundo plano; monitoreo en modo ahorro.');
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
