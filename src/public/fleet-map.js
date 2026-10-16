/* global L */
'use strict';

window.fleetMap = (() => {
    let map, layer, units = [], selected = null, initialized = false, fitted = false;
    const markers = new Map();
    const el = id => document.getElementById(id);
    const labels = { active: 'En servicio', resting: 'En descanso', maintenance: 'Mantenimiento' };
    const colors = { active: '#168464', resting: '#d08a13', maintenance: '#7850b8' };
    const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    // Illustrative positions only. Never stored or mixed with registered positions.
    const demo = {
        'TRK-001': [19.4326, -99.1332], 'TRK-002': [19.6500, -99.2100],
        'TRK-003': [19.2826, -99.6557], 'TRK-004': [19.0414, -98.2063],
        'TRK-005': [20.5888, -100.3899]
    };
    const isDemo = () => el('fleet-mode').value === 'demo';
    const valid = (lat, lng) => typeof lat === 'number' && Number.isFinite(lat) && Math.abs(lat) <= 90 && typeof lng === 'number' && Number.isFinite(lng) && Math.abs(lng) <= 180;
    function position(unit) {
        if (isDemo()) return demo[unit.id] || null;
        return valid(unit.latitude, unit.longitude) ? [unit.latitude, unit.longitude] : null;
    }
    const stale = unit => !unit.position_updated_at || Date.now() - new Date(unit.position_updated_at).getTime() > 15 * 60 * 1000;
    function visible() {
        const term = el('fleet-search').value.trim().toLocaleLowerCase();
        const status = el('fleet-filter').value;
        return units.filter(unit => (status === 'all' || status === unit.status) &&
            [unit.id, unit.plate, unit.operator, unit.location].some(v => String(v || '').toLocaleLowerCase().includes(term)));
    }
    function fit() {
        const bounds = visible().map(position).filter(Boolean);
        if (bounds.length) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    }
    function detail(unit) {
        if (!unit) {
            el('fleet-detail').innerHTML = '<p>Selecciona una unidad para consultar su ficha.</p>';
            return;
        }
        const point = position(unit);
        const time = unit.position_updated_at ? new Date(unit.position_updated_at).toLocaleString('es-MX') : 'Sin registro';
        el('fleet-detail').innerHTML = `<h3>${escape(unit.id)} · ${escape(unit.plate)}</h3>
            <p>${escape(labels[unit.status] || unit.status)}</p>
            <p><strong>Operador:</strong> ${escape(unit.operator || 'Sin asignar')}</p>
            <p><strong>Lugar registrado:</strong> ${escape(unit.location || 'Sin nombre')}</p>
            <p><strong>Coordenadas:</strong> ${point ? point.map(v => v.toFixed(5)).join(', ') : 'Sin posición registrada'}</p>
            <p><strong>Origen:</strong> ${isDemo() ? 'Demostración ficticia' : unit.position_source === 'manual' ? 'Captura manual' : 'Sin conexión a rastreador'}</p>
            <p><strong>Última posición:</strong> ${isDemo() ? 'No aplica: demostración' : escape(time)}</p>
            ${!isDemo() && point && stale(unit) ? '<p>⚠ Posición con más de 15 minutos o sin fecha. No confirma la ubicación actual.</p>' : ''}
            ${!isDemo() ? `<details><summary>Registrar posición manual</summary>
                <form id="fleet-position-form">
                    <label>Latitud<input name="latitude" type="number" min="-90" max="90" step="any" required value="${unit.latitude ?? ''}"></label>
                    <label>Longitud<input name="longitude" type="number" min="-180" max="180" step="any" required value="${unit.longitude ?? ''}"></label>
                    <button type="submit">Guardar posición</button><p id="fleet-save-message" role="status"></p>
                </form></details>` : '<p>Cambia a “Registradas” para capturar coordenadas reales.</p>'}`;
        el('fleet-position-form')?.addEventListener('submit', async event => {
            event.preventDefault();
            const form = event.currentTarget;
            const button = form.querySelector('button');
            const message = form.querySelector('[role="status"]');
            button.disabled = true;
            try {
                const response = await window.authUtils.authFetch(`/api/trucks/${encodeURIComponent(unit.id)}/position`, {
                    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ latitude: Number(form.elements.latitude.value), longitude: Number(form.elements.longitude.value) })
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'No fue posible guardar');
                Object.assign(units.find(current => current.id === unit.id) || unit, data.position);
                render(); fit();
            } catch (error) { message.textContent = error.message; }
            finally { button.disabled = false; }
        });
    }
    function select(id, pan = true) {
        selected = id;
        el('fleet-list').querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.unit === id)));
        detail(units.find(unit => unit.id === id));
        const marker = markers.get(id);
        if (marker && pan) { map.setView(marker.getLatLng(), Math.max(map.getZoom(), 11)); marker.openPopup(); }
    }
    function render() {
        const filtered = visible();
        const nextIds = new Set();
        const oldSelection = selected;
        for (const unit of filtered) {
            const point = position(unit);
            if (!point) continue;
            nextIds.add(unit.id);
            const icon = L.divIcon({ className: 'fleet-marker', html: `<span class="fleet-dot ${escape(unit.status)} ${!isDemo() && stale(unit) ? 'is-stale' : ''}">🚛</span>`, iconSize: [32, 32], iconAnchor: [16, 16] });
            let marker = markers.get(unit.id);
            const popup = `<strong>${escape(unit.id)} · ${escape(unit.plate)}</strong><br>${escape(labels[unit.status])}<br>${isDemo() ? 'Posición ficticia · Demo' : 'Posición registrada'}<br>${escape(unit.operator || 'Sin operador')}`;
            if (!marker) {
                marker = L.marker(point, { icon, title: `${unit.id} ${unit.plate}`, alt: `Unidad ${unit.id}` }).addTo(layer).bindPopup(popup);
                marker.on('click', () => select(unit.id, false));
                markers.set(unit.id, marker);
            } else { marker.setLatLng(point); marker.setIcon(icon); marker.setPopupContent(popup); }
        }
        for (const [id, marker] of markers) if (!nextIds.has(id)) { layer.removeLayer(marker); markers.delete(id); }
        el('fleet-count').textContent = `${nextIds.size} en mapa · ${filtered.length} unidades`;
        el('fleet-count').className = 'section-status ok';
        el('fleet-notice').className = `fleet-notice${isDemo() ? ' is-demo' : ''}`;
        el('fleet-notice').textContent = isDemo()
            ? 'DEMOSTRACIÓN · Posiciones ficticias en el centro de México. No representan la ubicación de estas unidades.'
            : `${nextIds.size} unidades con coordenadas; ${filtered.length - nextIds.size} sin posición. Las capturas manuales no son seguimiento GPS en vivo. Actualización cada 5 s con la pestaña visible.`;
        const listHtml = filtered.length ? filtered.map(unit => `<button type="button" class="fleet-unit" data-unit="${escape(unit.id)}" aria-pressed="${unit.id === selected}"><strong>${escape(unit.id)} · ${escape(unit.plate)}</strong><span style="color:${colors[unit.status] || '#65758a'}">${escape(labels[unit.status] || unit.status)}</span><small>${escape(unit.operator || 'Sin operador')} · ${position(unit) ? isDemo() ? 'Demo' : stale(unit) ? 'Posición antigua' : 'Posición registrada' : 'Sin coordenadas'}</small></button>`).join('') : '<p class="fleet-empty">No hay unidades que coincidan con la búsqueda.</p>';
        if (el('fleet-list').innerHTML !== listHtml) {
            el('fleet-list').innerHTML = listHtml;
            el('fleet-list').querySelectorAll('button').forEach(button => button.addEventListener('click', () => select(button.dataset.unit)));
        }
        if (!filtered.some(unit => unit.id === selected)) selected = null;
        // Preserve an open edit form while background refreshes update the map.
        if (selected !== oldSelection || !el('fleet-position-form')?.closest('details')?.open) detail(filtered.find(unit => unit.id === selected));
        if (!fitted && nextIds.size) { fit(); fitted = true; }
    }
    function init() {
        if (initialized) return true;
        if (!window.L) { el('fleet-notice').textContent = 'No fue posible cargar el mapa. Recarga la página.'; return false; }
        map = L.map('fleet-map', { scrollWheelZoom: false }).setView([20.2, -100.2], 6);
        const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
        const failedTiles = new Set();
        const tileKey = event => `${event.coords.z}/${event.coords.x}/${event.coords.y}`;
        tiles.on('tileerror', event => { failedTiles.add(tileKey(event)); el('fleet-tiles-error').hidden = false; });
        for (const type of ['tileload', 'tileunload']) tiles.on(type, event => {
            failedTiles.delete(tileKey(event));
            el('fleet-tiles-error').hidden = failedTiles.size === 0;
        });
        layer = L.layerGroup().addTo(map);
        el('fleet-search').addEventListener('input', render);
        el('fleet-filter').addEventListener('change', () => { render(); fit(); });
        el('fleet-mode').addEventListener('change', () => { selected = null; fitted = false; render(); });
        el('fleet-fit').addEventListener('click', fit);
        initialized = true;
        return true;
    }
    return {
        update(data) { el('fleet-section').hidden = false; units = data; if (init()) render(); },
        restrict() { units = []; if (layer) layer.clearLayers(); markers.clear(); el('fleet-section').hidden = true; },
        fail() { el('fleet-count').textContent = 'Sin actualizar'; el('fleet-count').className = 'section-status error'; el('fleet-notice').textContent = 'No fue posible actualizar las unidades. Las posiciones visibles son de la última lectura recibida.'; }
    };
})();
