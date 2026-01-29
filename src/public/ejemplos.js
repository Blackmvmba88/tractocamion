// Ejemplos.js - Interactive examples for GPS, Speed, Weight, and Cargo controls

// Threshold constants
const WARNING_THRESHOLD = 70;
const CRITICAL_THRESHOLD = 90;

// DOM element cache
let domElements = {};

// Interval ID for cleanup
let simulationIntervalId = null;

// Simulation data
let simulationData = {
    gps: {
        lat: 19.4326,
        lng: -99.1332,
        location: 'Patio A - Zona de Carga',
        markerX: 20,
        markerY: 50
    },
    speed: {
        current: 25,
        average: 22,
        max: 40
    },
    weight: {
        current: 18.5,
        empty: 7.5,
        max: 25.0
    },
    cargo: {
        percentage: 75,
        type: 'Contenedores',
        volume: 45,
        loadTime: 15
    }
};

// Initialize the examples
function init() {
    console.log('🚛 Tractocamión 4.0 - Ejemplos de Control Iniciados');
    cacheDOMElements();
    updateAll();
    startSimulation();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);
}

// Cache DOM elements for better performance
function cacheDOMElements() {
    domElements = {
        // GPS elements
        truckMarker: document.getElementById('truck-marker'),
        gpsLat: document.getElementById('gps-lat'),
        gpsLng: document.getElementById('gps-lng'),
        gpsLocation: document.getElementById('gps-location'),
        
        // Speed elements
        speedCurrent: document.getElementById('speed-current'),
        speedAvg: document.getElementById('speed-avg'),
        speedStatus: document.getElementById('speed-status'),
        speedNeedle: document.getElementById('speed-needle'),
        speedArc: document.getElementById('speed-arc'),
        
        // Weight elements
        weightCurrent: document.getElementById('weight-current'),
        weightLoad: document.getElementById('weight-load'),
        weightPercent: document.getElementById('weight-percent'),
        weightFill: document.getElementById('weight-fill'),
        weightNeedle: document.getElementById('weight-needle'),
        
        // Cargo elements
        cargoFill: document.getElementById('cargo-fill'),
        cargoPercentage: document.getElementById('cargo-percentage'),
        cargoType: document.getElementById('cargo-type'),
        cargoVolume: document.getElementById('cargo-volume'),
        cargoDistribution: document.getElementById('cargo-distribution'),
        cargoTime: document.getElementById('cargo-time'),
        
        // Integrated dashboard
        miniGPS: document.getElementById('mini-gps'),
        miniSpeed: document.getElementById('mini-speed'),
        miniWeight: document.getElementById('mini-weight'),
        miniCargo: document.getElementById('mini-cargo'),
        
        // Timestamp
        lastUpdate: document.getElementById('last-update')
    };
}

// Cleanup function
function cleanup() {
    if (simulationIntervalId) {
        clearInterval(simulationIntervalId);
        simulationIntervalId = null;
    }
}

// Update all displays
function updateAll() {
    updateGPS();
    updateSpeed();
    updateWeight();
    updateCargo();
    updateIntegratedDashboard();
    updateTimestamp();
}

// Update GPS display
function updateGPS() {
    const { truckMarker, gpsLat, gpsLng, gpsLocation } = domElements;

    if (truckMarker && gpsLat && gpsLng && gpsLocation) {
        truckMarker.style.left = `${simulationData.gps.markerX}%`;
        truckMarker.style.top = `${simulationData.gps.markerY}%`;
        gpsLat.textContent = simulationData.gps.lat.toFixed(4);
        gpsLng.textContent = simulationData.gps.lng.toFixed(4);
        gpsLocation.textContent = simulationData.gps.location;
    }
}

// Update Speed display
function updateSpeed() {
    const { speedCurrent, speedAvg, speedStatus, speedNeedle, speedArc } = domElements;

    if (speedCurrent && speedAvg && speedStatus && speedNeedle && speedArc) {
        const speed = simulationData.speed.current;
        speedCurrent.textContent = speed;
        speedAvg.textContent = `${simulationData.speed.average} km/h`;

        // Update needle rotation (0 to 180 degrees for 0 to 80 km/h)
        const rotation = (speed / 80) * 180 - 90;
        speedNeedle.setAttribute('transform', `rotate(${rotation} 100 100)`);

        // Update arc
        const arcLength = 251.2;
        const offset = arcLength - (speed / 80) * arcLength;
        speedArc.setAttribute('stroke-dashoffset', offset);

        // Update status based on speed
        if (speed < 30) {
            speedStatus.textContent = 'NORMAL';
            speedStatus.style.color = '#4CAF50';
        } else if (speed <= 35) {
            speedStatus.textContent = 'PRECAUCIÓN';
            speedStatus.style.color = '#FF9800';
        } else {
            speedStatus.textContent = 'ALTA VELOCIDAD';
            speedStatus.style.color = '#f44336';
        }
    }
}

// Update Weight display
function updateWeight() {
    const { weightCurrent, weightLoad, weightPercent, weightFill, weightNeedle } = domElements;

    if (weightCurrent && weightLoad && weightPercent && weightFill && weightNeedle) {
        const weight = simulationData.weight.current;
        const maxWeight = simulationData.weight.max;
        const emptyWeight = simulationData.weight.empty;
        const load = weight - emptyWeight;
        const percentage = Math.round((weight / maxWeight) * 100);

        weightCurrent.textContent = weight.toFixed(1);
        weightLoad.textContent = `${load.toFixed(1)} Ton`;
        weightPercent.textContent = `${percentage}%`;

        // Update gauge fill
        weightFill.style.height = `${percentage}%`;

        // Update needle rotation (-90 to 90 degrees)
        const needleRotation = (percentage / 100) * 180 - 90;
        weightNeedle.style.transform = `translateX(-50%) rotate(${needleRotation}deg)`;

        // Update color based on percentage using thresholds
        if (percentage < WARNING_THRESHOLD) {
            weightPercent.style.color = '#4CAF50';
            weightFill.style.background = 'linear-gradient(180deg, #4CAF50 0%, #8BC34A 100%)';
        } else if (percentage < CRITICAL_THRESHOLD) {
            weightPercent.style.color = '#FF9800';
            weightFill.style.background = 'linear-gradient(180deg, #FF9800 0%, #FFB74D 100%)';
        } else {
            weightPercent.style.color = '#f44336';
            weightFill.style.background = 'linear-gradient(180deg, #f44336 0%, #EF5350 100%)';
        }
    }
}

// Update Cargo display
function updateCargo() {
    const { cargoFill, cargoPercentage, cargoType, cargoVolume, cargoDistribution, cargoTime } = domElements;

    if (cargoFill && cargoPercentage && cargoType && cargoVolume && cargoDistribution && cargoTime) {
        const percentage = simulationData.cargo.percentage;
        
        cargoFill.style.height = `${percentage}%`;
        cargoPercentage.textContent = `${percentage}%`;
        cargoType.textContent = simulationData.cargo.type;
        cargoVolume.textContent = `${simulationData.cargo.volume} m³`;
        cargoTime.textContent = `${simulationData.cargo.loadTime} min`;

        // Update cargo fill color based on percentage using thresholds
        if (percentage < WARNING_THRESHOLD) {
            cargoFill.style.background = 'linear-gradient(180deg, #4CAF50 0%, #66BB6A 100%)';
            cargoDistribution.textContent = 'BALANCEADO';
            cargoDistribution.style.color = '#4CAF50';
        } else if (percentage < CRITICAL_THRESHOLD) {
            cargoFill.style.background = 'linear-gradient(180deg, #FF9800 0%, #FFB74D 100%)';
            cargoDistribution.textContent = 'CERCA DEL LÍMITE';
            cargoDistribution.style.color = '#FF9800';
        } else {
            cargoFill.style.background = 'linear-gradient(180deg, #f44336 0%, #EF5350 100%)';
            cargoDistribution.textContent = 'SOBRECARGA';
            cargoDistribution.style.color = '#f44336';
        }
    }
}

// Update integrated dashboard
function updateIntegratedDashboard() {
    const { miniGPS, miniSpeed, miniWeight, miniCargo } = domElements;

    if (miniGPS && miniSpeed && miniWeight && miniCargo) {
        miniGPS.textContent = simulationData.gps.location.split(' - ')[0];
        miniSpeed.textContent = `${simulationData.speed.current} km/h`;
        miniWeight.textContent = `${simulationData.weight.current.toFixed(1)} Ton`;
        miniCargo.textContent = `${simulationData.cargo.percentage}%`;
    }
}

// Update timestamp
function updateTimestamp() {
    const { lastUpdate } = domElements;
    if (lastUpdate) {
        const now = new Date();
        lastUpdate.textContent = `Última actualización: ${now.toLocaleTimeString()}`;
    }
}

// Start simulation with random variations
function startSimulation() {
    simulationIntervalId = setInterval(() => {
        // Simulate GPS movement
        simulationData.gps.markerX += (Math.random() - 0.5) * 5;
        simulationData.gps.markerY += (Math.random() - 0.5) * 5;
        
        // Keep marker within bounds
        simulationData.gps.markerX = Math.max(5, Math.min(90, simulationData.gps.markerX));
        simulationData.gps.markerY = Math.max(5, Math.min(90, simulationData.gps.markerY));
        
        // Update coordinates slightly
        simulationData.gps.lat += (Math.random() - 0.5) * 0.0001;
        simulationData.gps.lng += (Math.random() - 0.5) * 0.0001;

        // Simulate speed changes
        const speedChange = (Math.random() - 0.5) * 3;
        simulationData.speed.current = Math.max(15, Math.min(40, simulationData.speed.current + speedChange));
        simulationData.speed.current = Math.round(simulationData.speed.current);
        
        // Update average speed
        simulationData.speed.average = Math.round(
            (simulationData.speed.average * 9 + simulationData.speed.current) / 10
        );

        // Simulate weight changes (loading/unloading)
        const weightChange = (Math.random() - 0.5) * 0.3;
        simulationData.weight.current = Math.max(
            simulationData.weight.empty, 
            Math.min(simulationData.weight.max, simulationData.weight.current + weightChange)
        );

        // Simulate cargo percentage changes
        const cargoChange = Math.floor((Math.random() - 0.5) * 3);
        simulationData.cargo.percentage = Math.max(0, Math.min(100, simulationData.cargo.percentage + cargoChange));
        
        // Update load time (increases as cargo loads)
        if (simulationData.cargo.percentage < 95) {
            simulationData.cargo.loadTime += 1;
        } else {
            // Reset when unloading starts (cargo drops below threshold)
            if (cargoChange < 0 && simulationData.cargo.percentage < WARNING_THRESHOLD) {
                simulationData.cargo.loadTime = 0;
            }
        }

        // Change location based on position
        if (simulationData.gps.markerX < 30) {
            simulationData.gps.location = 'Patio A - Zona de Carga';
        } else if (simulationData.gps.markerX < 60) {
            simulationData.gps.location = 'Ruta Principal';
        } else {
            simulationData.gps.location = 'Patio B - Zona de Descarga';
        }

        updateAll();
    }, 2000); // Update every 2 seconds
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
