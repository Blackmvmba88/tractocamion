'use strict';
(() => {
    const el = id => document.getElementById(id);
    let watch = null, timer = null, latest = null, lastSent = 0, inFlight = false, generation = 0, controller = null;
    const status = (message, type = '') => { el('gps-status').textContent = message; el('gps-status').className = type; };
    function stop(message = 'GPS detenido. No se está compartiendo tu ubicación.', type = '') {
        generation += 1;
        if (watch !== null) navigator.geolocation.clearWatch(watch);
        if (timer !== null) clearInterval(timer);
        controller?.abort(); controller = null;
        watch = timer = latest = null; lastSent = 0; inFlight = false;
        el('gps-unit').disabled = false; el('gps-start').disabled = !el('gps-unit').value; el('gps-stop').disabled = true;
        status(message, type);
    }
    async function send(session) {
        if (inFlight || !latest || session !== generation) return;
        if (Date.now() - latest.timestamp > 60000) { status('Esperando una posición GPS reciente. Mantén la página abierta.'); return; }
        if (latest.timestamp <= lastSent) return;
        const fix = latest, unit = el('gps-unit').value;
        inFlight = true;
        controller = new AbortController();
        const requestController = controller;
        const timeout = setTimeout(() => requestController.abort(), 15000);
        try {
            const response = await window.authUtils.authFetch(`/api/gps/units/${encodeURIComponent(unit)}/positions`, {
                method:'POST', signal:controller.signal, body:JSON.stringify({latitude:fix.coords.latitude,longitude:fix.coords.longitude,accuracy:fix.coords.accuracy,speed:fix.coords.speed,heading:fix.coords.heading,observed_at:new Date(fix.timestamp).toISOString()})
            });
            const data = await response.json();
            if (session !== generation) return;
            if (response.status === 401 || response.status === 403) { stop(data.error || 'La sesión o asignación cambió. Vuelve a iniciar sesión.', 'error'); return; }
            if (response.status === 409) { lastSent = fix.timestamp; status('Otra fuente tiene una posición más reciente. Esperando nueva lectura.'); return; }
            if (!response.ok) throw new Error(data.error || 'No fue posible enviar la ubicación');
            lastSent = fix.timestamp;
            status(`Transmitiendo para ${unit} · última recepción ${new Date().toLocaleTimeString('es-MX')}`, 'active');
            const pairs = [['Coordenadas',`${fix.coords.latitude.toFixed(6)}, ${fix.coords.longitude.toFixed(6)}`],['Precisión',`± ${Math.round(fix.coords.accuracy)} m`],['Velocidad',fix.coords.speed == null ? 'No disponible' : `${(fix.coords.speed * 3.6).toFixed(1)} km/h`]];
            el('gps-fix').replaceChildren(...pairs.flatMap(([key,value])=>{const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=key;dd.textContent=value;return [dt,dd];}));
        } catch (error) { if (session === generation) status(error.name === 'AbortError' ? 'El servidor tardó demasiado. Se reintentará con una lectura reciente.' : `${error.message}. Reintentando...`, 'error'); }
        finally { clearTimeout(timeout); if (session === generation) { inFlight = false; controller = null; } }
    }
    el('gps-start').addEventListener('click', () => {
        if (!window.isSecureContext) { status('Abre esta página mediante HTTPS o desde localhost para usar la ubicación.', 'error'); return; }
        if (!navigator.geolocation) { status('Este navegador no ofrece geolocalización.', 'error'); return; }
        if (watch !== null || !el('gps-unit').value) return;
        const session = ++generation;
        el('gps-unit').disabled = true; el('gps-start').disabled = true; el('gps-stop').disabled = false;
        status('Solicitando permiso y esperando señal de ubicación...');
        watch = navigator.geolocation.watchPosition(fix => {
            if (session !== generation) return;
            const firstFix = latest === null;
            latest = fix;
            if (firstFix) send(session);
        }, error => {
            if (session !== generation) return;
            const messages = {1:'Permiso de ubicación rechazado. Actívalo en el navegador para usar GPS.',2:'No hay señal de ubicación. Se seguirá intentando.',3:'La ubicación tardó demasiado. Esperando una nueva lectura.'};
            if (error.code === 1) stop(messages[1], 'error'); else status(messages[error.code] || 'Error de ubicación', 'error');
        }, {enableHighAccuracy:true,maximumAge:0,timeout:20000});
        timer = setInterval(() => send(session), 10000);
    });
    el('gps-stop').addEventListener('click', () => stop());
    el('gps-unit').addEventListener('change', () => { el('gps-start').disabled = !el('gps-unit').value; });
    window.addEventListener('pagehide', () => { stop(); el('gps-token').value = ''; el('gps-secret').hidden = true; });
    window.addEventListener('storage', event => { if (event.key === 'token' || event.key === 'user') stop('Sesión modificada. Recarga la página antes de transmitir.'); });
    const placeholder = () => { const node=document.createElement('option'); node.value=''; node.textContent='Selecciona una unidad'; return node; };
    const option = unit => {const node=document.createElement('option');node.value=unit.id;node.textContent=`${unit.id} · ${unit.plate}`;return node;};
    async function request(url, options) {
        const response=await window.authUtils.authFetch(url,options), data=await response.json();
        if(!response.ok) throw new Error(data.error || 'Error de conexión');
        return data;
    }
    async function devices() {
        const {devices}=await request('/api/gps/devices');
        el('gps-devices').replaceChildren();
        for(const device of devices) {
            const card=document.createElement('div');card.className='gps-device';
            const text=document.createElement('p');text.textContent=`${device.name} · ${device.truck_id} · ${device.revoked_at ? 'Revocado' : 'Habilitado'} · Última recepción: ${device.last_seen_at ? new Date(device.last_seen_at).toLocaleString('es-MX') : 'Sin conexión recibida'}`;card.append(text);
            if(!device.revoked_at) {const button=document.createElement('button');button.textContent='Revocar credencial';button.addEventListener('click',async()=>{button.disabled=true;try{await request(`/api/gps/devices/${device.id}`,{method:'DELETE'});await devices();}catch(e){el('gps-device-status').textContent=e.message;button.disabled=false;}});card.append(button);}
            el('gps-devices').append(card);
        }
        if(!devices.length) el('gps-devices').textContent='Aún no hay rastreadores registrados.';
    }
    el('gps-device-form').addEventListener('submit',async event=>{
        event.preventDefault();const button=event.currentTarget.querySelector('button');button.disabled=true;
        try {const data=await request('/api/gps/devices',{method:'POST',body:JSON.stringify({truck_id:el('gps-device-unit').value,name:el('gps-device-name').value})});el('gps-token').value=data.token;el('gps-secret').hidden=false;el('gps-device-status').textContent='Credencial creada. El rastreador aún debe configurarse para enviar datos.';await devices();}
        catch(e){el('gps-device-status').textContent=e.message;}finally{button.disabled=false;}
    });
    el('gps-hide-token').addEventListener('click',()=>{el('gps-token').value='';el('gps-secret').hidden=true;});
    async function init(){
        if(!window.authUtils.isAuthenticated()){window.location.replace('/login.html');return;}
        try{const {trucks}=await request('/api/gps/units');el('gps-unit').replaceChildren(placeholder(),...trucks.map(option));el('gps-device-unit').replaceChildren(placeholder(),...trucks.map(option));el('gps-start').disabled=!el('gps-unit').value;if(!trucks.length)status('No tienes una unidad asignada. Solicita la asignación al administrador.');
            if(['admin','gerente'].includes(window.authUtils.getUser()?.role)){el('gps-management').hidden=false;await devices();}
        }catch(e){status(e.message,'error');}
    }
    init();
})();
