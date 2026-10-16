# 🚛 Tractocamión 4.0 + BlackMamba Vehicle Platform

Sistema operativo para logística vehicular que ahora evoluciona hacia una plataforma común para tractocamiones, autobuses y futuras unidades de servicio.

La base existente —operadores, vehículos, ciclos, ubicación, alertas, analytics, NFC/RFID y API— se conserva. La nueva línea **BM-BUS-001** añade simulación, gemelo digital y una arquitectura de seguridad separada del servidor web.

> **Estado físico actual:** simulación y diseño. Este repositorio no implementa control directo de actuadores de un vehículo real.

## 🎯 Visión

El núcleo no es el dashboard. Es el motor operacional:

```text
operador → vehículo → misión/ciclo → ubicación/estado → eventos → analytics → mejora
```

En logística, esa misión es un ciclo de patio. En movilidad, puede ser un viaje de pasajeros, reposicionamiento, mantenimiento o apoyo de evacuación.

## 🧠 Dos dominios, una plataforma

### Tractocamión / Yard OS

Optimiza patios y ciclos logísticos:

- identificación NFC/RFID,
- asignación de tractor/operador,
- seguimiento de ciclos,
- descanso y relevo,
- detección de demoras,
- earnings,
- analytics,
- reducción de tiempo muerto.

### BlackMamba Mobility / BM-BUS-001

Extiende la misma base hacia transporte de pasajeros:

- simulación de vehículo,
- estado de seguridad,
- validación de comandos,
- gemelo digital,
- telemetría,
- black-box/replay,
- asistencia al operador,
- futura teleoperación limitada y validada,
- investigación de transporte modular y demanda adaptativa.

## 🚌 BM-BUS-001

La primera meta NO es autonomía total.

La meta es demostrar, por etapas:

```text
SIMULAR
  ↓
VALIDAR
  ↓
INSTRUMENTAR
  ↓
OBSERVAR
  ↓
ASISTIR
  ↓
PRUEBA CERRADA A MUY BAJA VELOCIDAD
  ↓
MEDIR + REPLAY
```

La primera prueba física futura se plantea únicamente en recinto cerrado, sin pasajeros públicos, con operador local de seguridad, parada de emergencia independiente y límite de velocidad independiente.

Ver: **[docs/BM_BUS_001.md](docs/BM_BUS_001.md)**

## 🛡️ Regla de arquitectura

La aplicación web **no controla directamente un vehículo**.

```text
Dashboard / API
      ↓
command request
      ↓
vehicle gateway
      ↓
local safety controller
      ↓
simulator / interfaz física validada por separado
```

La red puede pedir. La capa local decide.

Ver:

- **[Vehicle Platform Architecture](docs/VEHICLE_PLATFORM_ARCHITECTURE.md)**
- **[BM-BUS-001 Safety Case](docs/SAFETY_CASE_BM_BUS_001.md)**
- **[Mobility Roadmap](docs/MOBILITY_ROADMAP.md)**

## 🧪 Simulador BM-BUS-001

La rama de fundación incluye un simulador pequeño y determinista.

Prueba:

- límite experimental de 10 km/h,
- pérdida de enlace,
- parada segura,
- E-STOP,
- rechazo de comandos obsoletos.

```bash
npm run sim:bus
npm run test:bus
```

No realiza I/O físico.

## ✨ Capacidades existentes

- Dashboard operacional
- API REST
- Autenticación JWT y roles
- PostgreSQL + Sequelize
- Gestión de ciclos
- Modelos de tractores y operadores
- NFC/RFID
- Analytics
- Alertas proactivas
- Rastreo de ubicación
- Monitoreo de procesos
- UI responsive
- Linux / macOS / Windows / Termux

## 🔥 Flujo logístico actual

```text
Truck arrives
      ↓
Operator check-in
      ↓
NFC/RFID
      ↓
Cycle created
      ↓
Yard assignment
      ↓
Location/status
      ↓
Delay/fatigue monitoring
      ↓
Cycle completed
      ↓
Earnings / rest / next optimization
```

Ver: **[docs/YARD_OPERATING_MODEL.md](docs/YARD_OPERATING_MODEL.md)**

## 🚀 Inicio rápido

```bash
npm install
cp .env.example .env
# Sustituir ambos secretos JWT con valores generados por `openssl rand -hex 32`

# Opción reproducible si Docker está instalado
docker compose up -d postgres

# configurar DATABASE_URL
npm run db:migrate
npm run db:seed

npm start
```

Dashboard local:

```text
http://localhost:3000
```

### Entorno local preparado en macOS

En este checkout, PostgreSQL 16 guarda sus datos en `.local/postgres` y escucha
únicamente en `127.0.0.1:55432`. El archivo `.env` contiene secretos locales
generados y queda excluido de Git, al igual que los datos. Para reiniciar:

```bash
# Sólo si PostgreSQL está detenido:
/opt/homebrew/opt/postgresql@16/bin/pg_ctl -D .local/postgres -l .local/postgres.log -o '-h 127.0.0.1 -p 55432' start
npm run preflight
npm start
```

Este clúster usa autenticación local de confianza para demostración; no se debe
exponer a la red. Para detenerlo:

```bash
/opt/homebrew/opt/postgresql@16/bin/pg_ctl -D .local/postgres stop
```

Validación: `npm test`, `npm run check`, `npm run test:bus` y, con el servidor
encendido y los datos demo, `npm run test:integration`.

### Datos demo

- Admin: `admin` / `Admin123!`
- Gerente: `gerente1` / `Gerente123!`
- Operador: `operador1` / `Operador123!`

⚠️ Son credenciales de demostración. Deben deshabilitarse o rotarse en cualquier despliegue real.

### Mapa de unidades

El dashboard incluye mapa con zoom, búsqueda por ID/placa/operador, filtros de
estado, selección de unidad y ajuste de la vista a las posiciones visibles.
Administradores y gerentes pueden ver el mapa y registrar latitud/longitud desde
la ficha de cada unidad. La posición queda guardada con fecha y origen manual.
Las posiciones con más de 15 minutos se señalan como antiguas.

La vista inicial **Registradas** sólo representa unidades con coordenadas.
Las unidades sin coordenadas siguen en la lista. **Demostración** muestra cinco
posiciones ficticias en el centro de México, identificadas como tales, sin
guardarlas en la base ni mezclarlas con las registradas. Todavía no existe una
conexión a rastreadores GPS ni historial de recorridos.

El límite general admite 1000 consultas por IP cada 15 minutos: un panel visible
realiza unas 720 en ese tiempo. Se configura con `RATE_LIMIT_MAX_REQUESTS` y
`RATE_LIMIT_WINDOW_MS`; dimensionarlo según los paneles que compartan IP.
Los intentos fallidos de inicio de sesión conservan su límite independiente.

Antes de iniciar una instalación existente, ejecutar `npm run db:migrate`.
Leaflet 1.9.4 se sirve localmente desde `src/public/vendor/leaflet`, con su
licencia. Al actualizar esa dependencia, copiar nuevamente `dist/leaflet.js`,
`dist/leaflet.css` y `dist/images` a esa carpeta. El mapa base requiere Internet
y usa los mosaicos de OpenStreetMap, con atribución y caché del navegador;
no descarga áreas para uso sin conexión. Consultar la
[política del servicio](https://operations.osmfoundation.org/policies/tiles/)
antes de un despliegue con tráfico elevado.

## 📚 Documentación

### Plataforma

- [BM-BUS-001](docs/BM_BUS_001.md)
- [Vehicle Platform Architecture](docs/VEHICLE_PLATFORM_ARCHITECTURE.md)
- [BM-BUS-001 Safety Case](docs/SAFETY_CASE_BM_BUS_001.md)
- [Mobility Roadmap](docs/MOBILITY_ROADMAP.md)
- [Product Maturity](docs/PRODUCT_MATURITY.md)

### Operación existente

- [Yard Operating Model](docs/YARD_OPERATING_MODEL.md)
- [API](API.md)
- [Quickstart](QUICKSTART.md)
- [Install](INSTALL.md)
- [Security](SECURITY.md)
- [Security Best Practices](SECURITY_BEST_PRACTICES.md)

## 🗺️ Roadmap

### Ya implementado

- [x] PostgreSQL
- [x] JWT + roles
- [x] NFC/RFID
- [x] cycle engine
- [x] analytics
- [x] alertas
- [x] ubicación
- [x] BM-BUS-001 simulator foundation
- [x] safety-envelope simulation
- [x] smoke tests de fail-safe

### Siguiente capa

- [ ] abstracción persistente `Vehicle`
- [ ] `Mission/Trip` sin romper `Cycle`
- [ ] WebSockets para gemelo digital
- [ ] black-box persistente
- [ ] replay de runs
- [ ] dashboard de BM-BUS-001
- [ ] hardware-in-the-loop
- [ ] staff learning passport
- [ ] simulación de demanda y unidades modulares
- [ ] observer/anomaly engine

### Más adelante

- [ ] instrumentación de un bus real
- [ ] conducción humana + asistencia
- [ ] bench rig
- [ ] closed-course remote crawl
- [ ] evaluación independiente antes de cualquier discusión de vía pública

## 👥 Filosofía de trabajo

La automatización no debe convertir al equipo en espectadores.

La plataforma busca que las personas recorran múltiples áreas:

```text
servicio → inspección → mantenimiento → telemetría → diagnóstico
        → simulación → emergencia → mentoría
```

La experiencia se documenta. Las tareas reguladas siguen requiriendo las certificaciones correspondientes.

## 🚨 Emergencias

La función primaria es transporte.

La red puede diseñarse para **apoyar** evacuaciones, transporte de suministros, energía o comunicaciones cuando exista capacidad y coordinación adecuada.

No sustituye ambulancias, bomberos, policía ni protección civil.

## 🧭 North Star

> Mover personas y carga bien primero. Ganar confianza mediante servicio consistente. Agregar responsabilidad sólo cuando la capacidad esté demostrada.

## 📄 Licencia

MIT / proyecto open-source con visión comercial.
