# 🚛 Tractocamión 4.0 - Sistema Integral de Gestión Logística

## 🎯 Visión

Un ecosistema logístico revolucionario que optimiza el flujo de tractocamiones desde la raíz, eliminando cuellos de botella, burocracia y tiempos muertos, mientras garantiza descanso digno para operadores y maximiza throughput.

## 🔥 El Problema

En puertos y patios logísticos tradicionales:
- ⏱️ Tiempo promedio por ciclo: 3.5-8 horas
- 📉 Tiempo productivo real: ~30%
- 😴 Operadores cansados: 80%+ manejan con fatiga
- 📄 Burocracia manual: 70% del tiempo total
- 💰 Pago retrasado: 3-7 días

## ✨ La Solución

Un sistema de 10 capas integradas:

1. **Diseño Geométrico Optimizado** - Patio pensado para radios de giro reales
2. **Identificación Sin Fricción** - NFC/RFID, cero papeleo
3. **Cerebro del Patio** - Asignación inteligente en tiempo real
4. **Módulo de Relevo** - Operadores descansan, tractores siguen trabajando
5. **Infraestructura Humana** - Regaderas, camas, comedor, dignidad
6. **Economía del Ciclo** - Pago inmediato por ciclo, no por hora
7. **Automatización** - Maniobras asistidas/autónomas
8. **Políticas de Dignidad** - Descanso obligatorio, transparencia total
9. **API Abierta** - Integración con toda la cadena logística
10. **Aprendizaje Continuo** - El sistema optimiza solo

## 📊 Resultados Esperados

| Métrica | Actual | Con Tractocamión 4.0 |
|---------|--------|---------------------|
| Tiempo por ciclo | 5 horas | 55 min |
| Throughput | 6 cam/día | 20 cam/día |
| ROI | - | <1 mes |

## 🚀 Estado del Proyecto

🟡 **Yard OS Alpha — prototipo técnico, no listo para producción**

La primera fase incluye un motor de ciclos, API y dashboard funcionales. Requiere PostgreSQL, configuración segura y validación del flujo completo antes de un piloto operativo.

### 🎉 Características Implementadas

- ✅ **Dashboard en Tiempo Real** - Monitoreo de tractores, operadores y procesos
- ✅ **API REST Completa** - Endpoints para integración con sistemas externos
- 🧪 **Cross-Platform** - Código portable; falta validación completa por plataforma y no se incluye un DMG
- ✅ **Monitoreo Automatizado** - Scripts para chequeo automático de procesos
- ✅ **Interfaz Responsiva** - Funciona en desktop y móvil
- 🟡 **Documentación de Alpha** - Guías iniciales de instalación, API y seguridad
- ✅ **Autenticación JWT** - Sistema completo de autenticación con roles y tokens
- ✅ **Base de Datos PostgreSQL** - Integración con base de datos real con migraciones
- ✅ **Gestión Completa de Ciclos** - Crear, rastrear, y completar ciclos con earnings automáticos
- ✅ **Sistema NFC/RFID** - Registro y verificación de operadores sin fricción
- ✅ **Analytics Inteligentes** - Dashboard con KPIs, métricas de performance y eficiencia
- ✅ **Alertas Proactivas** - Detección de riesgos de fatiga, demoras y anomalías
- ✅ **Rastreo de Ubicación** - Actualizaciones de ubicación en tiempo real para ciclos activos

### 🚀 Empezar Ahora

```bash
# Instalar dependencias
npm install

# Configurar base de datos (PostgreSQL)
# Copiar .env.example a .env y configurar DATABASE_URL
cp .env.example .env
# Sustituir ambos secretos JWT con valores generados por `openssl rand -hex 32`

# Opción reproducible si Docker está instalado
docker compose up -d postgres

# Ejecutar migraciones
npm run db:migrate

# Poblar base de datos con datos de prueba
npm run db:seed

# Iniciar aplicación
npm start

# O usar los scripts de inicio
./start.sh      # Linux/macOS/Termux
start.bat       # Windows
```

**Acceder al Dashboard:** http://localhost:3000

**Credenciales de prueba:**
- Admin: `admin` / `Admin123!`
- Gerente: `gerente1` / `Gerente123!`
- Operador: `operador1` / `Operador123!`

⚠️ **IMPORTANTE:** Cambiar todas las contraseñas en producción

### 📚 Documentación

- **[QUICKSTART.md](QUICKSTART.md)** - Guía rápida de inicio
- **[INSTALL.md](INSTALL.md)** - Instalación detallada para todas las plataformas
- **[API.md](API.md)** - Documentación completa de la API REST
- **[SECURITY.md](SECURITY.md)** - Consideraciones de seguridad para producción
- **[docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md)** - Límites comprobados de la versión alpha

### 🛠️ Próximos Pasos

- [x] Integración con base de datos real
- [x] Sistema de autenticación JWT
- [x] Integración NFC/RFID ✨ **NUEVO**
- [x] Sistema de ciclos completo con cálculo de earnings ✨ **NUEVO**
- [x] Analytics e insights inteligentes ✨ **NUEVO**
- [x] Alertas y detección de anomalías ✨ **NUEVO**
- [ ] Módulo de pagos inmediatos
- [ ] Machine Learning para optimización
- [ ] Aplicación móvil nativa
- [ ] WebSockets para actualizaciones en tiempo real

### 🔥 Nuevas Integraciones - Más Consciencia y Absolutismo

**Consciencia (Inteligencia & Awareness):**
- ✅ **Analytics Dashboard** - Métricas comprehensivas en tiempo real
- ✅ **Sistema de Alertas** - Detección proactiva de riesgos de fatiga y demoras
- ✅ **Métricas de Performance** - Análisis de operadores y tractores
- ✅ **Cálculo Automático de Earnings** - $50/hora + $20 bonus por eficiencia

**Absolutismo (Completitud & Exhaustividad):**
- ✅ **Ciclo de Vida Completo** - Crear → Rastrear → Completar
- ✅ **Integración NFC/RFID** - Identificación sin fricción de operadores
- ✅ **Rastreo de Ubicación** - Actualizaciones en tiempo real
- ✅ **Validaciones Robustas** - Integridad de datos en cada paso

Ver la [documentación completa de API](API.md) para detalles de todos los endpoints.

### 🌟 Para Desarrolladores

Todos los que contribuyan al proyecto tendrán trabajo automático. El sistema maneja los procesos - tu trabajo es monitorearlo y mejorarlo.

**Workflow Automatizado:**
1. `npm run monitor` - Monitoreo automático de procesos
2. Dashboard muestra estado en tiempo real
3. Solo necesitas verificar y optimizar


## 📄 Licencia

Proyecto open-source con visión comercial

---

**Revolucionando la logística latinoamericana, un ciclo a la vez.** 🔥
