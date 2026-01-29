// Ejemplos.js - Interactive examples for GPS, Speed, Weight, and Cargo controls

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
    updateAll();
    startSimulation();
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
    const marker = document.getElementById('truck-marker');
    const lat = document.getElementById('gps-lat');
    const lng = document.getElementById('gps-lng');
    const location = document.getElementById('gps-location');

    if (marker && lat && lng && location) {
        marker.style.left = `${simulationData.gps.markerX}%`;
        marker.style.top = `${simulationData.gps.markerY}%`;
        lat.textContent = simulationData.gps.lat.toFixed(4);
        lng.textContent = simulationData.gps.lng.toFixed(4);
        location.textContent = simulationData.gps.location;
    }
}

// Update Speed display
function updateSpeed() {
    const currentSpeed = document.getElementById('speed-current');
    const avgSpeed = document.getElementById('speed-avg');
    const speedStatus = document.getElementById('speed-status');
    const speedNeedle = document.getElementById('speed-needle');
    const speedArc = document.getElementById('speed-arc');

    if (currentSpeed && avgSpeed && speedStatus && speedNeedle && speedArc) {
        const speed = simulationData.speed.current;
        currentSpeed.textContent = speed;
        avgSpeed.textContent = `${simulationData.speed.average} km/h`;

        // Update needle rotation (0 to 180 degrees for 0 to 80 km/h)
        const rotation = (speed / 80) * 180 - 90;
        speedNeedle.setAttribute('transform', `rotate(${rotation} 100 100)`);

        // Update arc
        const arcLength = 251.2;
        const offset = arcLength - (speed / 80) * arcLength;
        speedArc.setAttribute('stroke-dashoffset', offset);

        // Update status based on speed
        if (speed <= 30) {
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
    const currentWeight = document.getElementById('weight-current');
    const loadWeight = document.getElementById('weight-load');
    const percentWeight = document.getElementById('weight-percent');
    const weightFill = document.getElementById('weight-fill');
    const weightNeedle = document.getElementById('weight-needle');

    if (currentWeight && loadWeight && percentWeight && weightFill && weightNeedle) {
        const weight = simulationData.weight.current;
        const maxWeight = simulationData.weight.max;
        const emptyWeight = simulationData.weight.empty;
        const load = weight - emptyWeight;
        const percentage = Math.round((weight / maxWeight) * 100);

        currentWeight.textContent = weight.toFixed(1);
        loadWeight.textContent = `${load.toFixed(1)} Ton`;
        percentWeight.textContent = `${percentage}%`;

        // Update gauge fill
        weightFill.style.height = `${percentage}%`;

        // Update needle rotation (-90 to 90 degrees)
        const needleRotation = (percentage / 100) * 180 - 90;
        weightNeedle.style.transform = `translateX(-50%) rotate(${needleRotation}deg)`;

        // Update color based on percentage
        if (percentage < 70) {
            percentWeight.style.color = '#4CAF50';
            weightFill.style.background = 'linear-gradient(180deg, #4CAF50 0%, #8BC34A 100%)';
        } else if (percentage < 90) {
            percentWeight.style.color = '#FF9800';
            weightFill.style.background = 'linear-gradient(180deg, #FF9800 0%, #FFB74D 100%)';
        } else {
            percentWeight.style.color = '#f44336';
            weightFill.style.background = 'linear-gradient(180deg, #f44336 0%, #EF5350 100%)';
        }
    }
}

// Update Cargo display
function updateCargo() {
    const cargoFill = document.getElementById('cargo-fill');
    const cargoPercentage = document.getElementById('cargo-percentage');
    const cargoType = document.getElementById('cargo-type');
    const cargoVolume = document.getElementById('cargo-volume');
    const cargoDistribution = document.getElementById('cargo-distribution');
    const cargoTime = document.getElementById('cargo-time');

    if (cargoFill && cargoPercentage && cargoType && cargoVolume && cargoDistribution && cargoTime) {
        const percentage = simulationData.cargo.percentage;
        
        cargoFill.style.height = `${percentage}%`;
        cargoPercentage.textContent = `${percentage}%`;
        cargoType.textContent = simulationData.cargo.type;
        cargoVolume.textContent = `${simulationData.cargo.volume} m³`;
        cargoTime.textContent = `${simulationData.cargo.loadTime} min`;

        // Update cargo fill color based on percentage
        if (percentage < 70) {
            cargoFill.style.background = 'linear-gradient(180deg, #4CAF50 0%, #66BB6A 100%)';
            cargoDistribution.textContent = 'BALANCEADO';
            cargoDistribution.style.color = '#4CAF50';
        } else if (percentage < 90) {
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
    const miniGPS = document.getElementById('mini-gps');
    const miniSpeed = document.getElementById('mini-speed');
    const miniWeight = document.getElementById('mini-weight');
    const miniCargo = document.getElementById('mini-cargo');

    if (miniGPS && miniSpeed && miniWeight && miniCargo) {
        miniGPS.textContent = simulationData.gps.location.split(' - ')[0];
        miniSpeed.textContent = `${simulationData.speed.current} km/h`;
        miniWeight.textContent = `${simulationData.weight.current.toFixed(1)} Ton`;
        miniCargo.textContent = `${simulationData.cargo.percentage}%`;
    }
}

// Update timestamp
function updateTimestamp() {
    const lastUpdate = document.getElementById('last-update');
    if (lastUpdate) {
        const now = new Date();
        lastUpdate.textContent = `Última actualización: ${now.toLocaleTimeString()}`;
    }
}

// Start simulation with random variations
function startSimulation() {
    setInterval(() => {
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
        
        // Update load time
        simulationData.cargo.loadTime += 1;
        if (simulationData.cargo.percentage >= 95) {
            simulationData.cargo.loadTime = 0;
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
