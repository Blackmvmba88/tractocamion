# Piloto de campo — Empresa logística

## Objetivo

Validar Tractocamión 4.0 dentro de una operación logística real antes de ampliar el desarrollo o presentar una propuesta comercial.

El piloto debe responder tres preguntas:

1. ¿Dónde se pierde tiempo durante un ciclo real?
2. ¿Qué parte del flujo puede digitalizarse sin frenar la operación?
3. ¿Qué mejora medible puede demostrar Tractocamión 4.0 en 30 días?

## Regla principal

No iniciar vendiendo el sistema completo. Primero observar, medir y ejecutar una prueba acotada, reversible y sin afectar la operación principal.

## Alcance recomendado

Seleccionar solamente uno de estos flujos para el primer piloto:

- registro de entrada y salida;
- asignación de patio o andén;
- seguimiento de tiempos por ciclo;
- identificación de operador mediante NFC/RFID;
- alertas de demora;
- control de remolques o unidades disponibles.

No incluir pagos, automatización física ni decisiones autónomas durante la primera prueba.

## Participantes mínimos

- patrocinador interno de la empresa;
- responsable de operaciones o patio;
- uno o dos operadores;
- personal de caseta o tráfico;
- responsable técnico de Tractocamión 4.0.

## Fase 0 — Autorización

Antes de recopilar información:

- obtener permiso del responsable de la empresa;
- acordar qué datos pueden observarse;
- evitar nombres, documentos o datos personales innecesarios;
- no conectar el sistema a producción sin autorización escrita;
- trabajar inicialmente en modo observación o dry-run.

## Fase 1 — Observación de campo

Observar al menos un turno completo sin cambiar el proceso.

Registrar cada etapa:

| Etapa | Inicio | Fin | Responsable | Sistema usado | Espera | Incidencia |
|---|---:|---:|---|---|---:|---|
| Llegada | | | | | | |
| Caseta | | | | | | |
| Registro | | | | | | |
| Pesaje | | | | | | |
| Asignación | | | | | | |
| Maniobra | | | | | | |
| Carga/descarga | | | | | | |
| Liberación | | | | | | |
| Salida | | | | | | |

### Preguntas de campo

- ¿Qué evento inicia y termina formalmente un ciclo?
- ¿Dónde se forma la fila más larga?
- ¿Qué dato se captura más de una vez?
- ¿Qué proceso depende de llamadas, mensajes o papel?
- ¿Quién toma las decisiones de asignación?
- ¿Qué sucede cuando una unidad llega fuera de horario?
- ¿Cómo se detecta una demora?
- ¿Cómo se identifica una unidad, remolque y operador?
- ¿Qué información necesita gerencia y no obtiene a tiempo?
- ¿Qué cambio pequeño aliviaría más trabajo mañana?

## Fase 2 — Línea base

Medir entre 20 y 50 ciclos, según el volumen disponible.

### KPIs obligatorios

| KPI | Definición |
|---|---|
| Tiempo total de ciclo | salida menos llegada |
| Tiempo de espera | minutos sin actividad operativa |
| Tiempo de registro | llegada a liberación de caseta |
| Tiempo de asignación | registro completo a asignación confirmada |
| Tiempo de maniobra | inicio a fin de maniobra |
| Throughput | ciclos completados por turno o día |
| Reprocesos | capturas, validaciones o movimientos repetidos |
| Incidencias | ciclos con excepción, demora o dato faltante |
| Adopción | porcentaje de usuarios que completan el flujo digital |

### Segmentación mínima

Separar resultados por:

- turno;
- tipo de operación;
- cliente o ruta, cuando esté permitido;
- unidad propia o externa;
- operación normal o con incidencia.

## Fase 3 — Hipótesis del piloto

Ejemplo inicial:

> Al digitalizar el registro y marcar automáticamente los eventos del ciclo, la empresa podrá reducir al menos 20% el tiempo administrativo y obtener trazabilidad completa de 90% de los ciclos piloto.

La hipótesis final debe incluir:

- flujo intervenido;
- métrica primaria;
- mejora esperada;
- periodo de medición;
- criterio de éxito y de aborto.

## Fase 4 — Configuración técnica

### Modo inicial

- entorno separado de producción;
- datos anonimizados o sintéticos para configuración;
- usuarios con roles mínimos;
- logs de todas las acciones;
- respaldo antes de importar o modificar datos;
- capacidad de volver al proceso anterior inmediatamente.

### Integraciones permitidas inicialmente

- captura manual asistida;
- importación CSV controlada;
- lector NFC/RFID aislado;
- dashboard local;
- API de lectura con credenciales temporales.

### Integraciones no permitidas en la primera prueba

- escritura directa en ERP/TMS productivo;
- decisiones autónomas de despacho;
- bloqueo de accesos;
- pagos automáticos;
- control físico de barreras, maquinaria o vehículos.

## Fase 5 — Ejecución controlada

Duración sugerida: 2 a 4 semanas.

### Semana 1

- observar;
- medir línea base;
- confirmar definiciones;
- capacitar usuarios del piloto.

### Semana 2

- activar registro digital paralelo;
- comparar sistema actual contra Tractocamión 4.0;
- corregir fricciones sin ampliar alcance.

### Semana 3

- operar el flujo piloto completo;
- revisar métricas diariamente;
- documentar excepciones.

### Semana 4

- consolidar resultados;
- entrevistar usuarios;
- estimar ahorro y siguiente fase.

## Criterios de éxito

El piloto se considera exitoso cuando cumple al menos tres de los siguientes puntos y no genera un incidente crítico:

- reducción mínima de 20% en la métrica primaria;
- trazabilidad completa de al menos 90% de los ciclos piloto;
- reducción de capturas duplicadas;
- adopción superior a 80% entre usuarios seleccionados;
- disponibilidad del sistema superior a 99% durante el horario piloto;
- ninguna pérdida o corrupción de datos;
- aceptación del responsable operativo para una segunda fase.

## Criterios de aborto

Detener o volver a modo observación cuando ocurra cualquiera:

- riesgo para personas, unidades o infraestructura;
- información incorrecta que afecte decisiones operativas;
- pérdida de datos;
- indisponibilidad recurrente;
- rechazo operativo generalizado;
- cambio de alcance sin autorización.

## Entregables

1. Mapa del flujo real.
2. Línea base de KPIs.
3. Lista priorizada de cuellos de botella.
4. Configuración reproducible del piloto.
5. Comparativo antes/después.
6. Registro de incidencias y aprendizajes.
7. Recomendación: detener, iterar o escalar.

## Conversación inicial sugerida

> Estamos desarrollando una herramienta para medir y reducir tiempos muertos en patios logísticos. No queremos venderles algo a ciegas. Nos gustaría observar un turno, entender su flujo y preparar una prueba pequeña que no interfiera con su operación. Antes de conectar cualquier cosa, les presentaríamos el alcance, los datos utilizados y las métricas de éxito para su autorización.

## Resultado esperado

La relación con la empresa debe convertirse en acceso responsable a operación real, evidencia y aprendizaje. El valor principal no es el contacto comercial: es validar si Tractocamión 4.0 resuelve un problema suficientemente importante como para justificar una implementación mayor.
