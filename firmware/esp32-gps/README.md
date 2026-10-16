# Rastreador propio · prototipo ESP32 + GNSS

Primera versión de banco: ESP32 DevKit/WROOM + receptor GNSS con salida NMEA UART
compatible con TinyGPSPlus + Wi-Fi + servidor HTTPS. No incluye módem celular,
PCB, carcasa, alimentación automotriz ni instalación validada en un vehículo.

## Preparación

1. Elegir un receptor GNSS y confirmar su alimentación y niveles UART en su
   ficha técnica. Configurar RX/TX y baudios según la placa y el receptor reales.
   Los GPIO 16/17 son sólo valores iniciales para el ESP32 DevKit de referencia.
2. Copiar `include/tracker_config.example.h` a `include/tracker_config.h` (ignorado por Git).
3. Configurar SSID y contraseña, la dirección HTTPS del servidor, su certificado
   CA raíz PEM y la credencial creada para esa unidad en `/gps.html`.
4. Compilar con PlatformIO: `pio run`. Conectar la placa y cargar con
   `pio run --target upload`. Abrir el monitor con `pio device monitor`.
5. Obtener señal GNSS, Wi-Fi y hora NTP. El equipo envía una posición reciente
   cada 15 segundos; no transmite cuando pierde la señal. El monitor sólo
   imprime estados y códigos de respuesta, no claves ni coordenadas.

El receptor aporta posición y fecha UTC. La precisión en metros se deja nula
cuando el módulo no la informa: HDOP no se convierte arbitrariamente a metros.
Los paquetes rechazados por credencial inválida detienen el envío hasta
reconfigurar y reiniciar. Las posiciones viejas no se acumulan para reenvío.
No se deshabilita la validación TLS. La configuración vacía permite compilar,
pero **no es una configuración funcional de un equipo**.

## Validación de software

Compilación verificada con PlatformIO 6.1.18, espressif32 6.9.0 y TinyGPSPlus
1.0.3 para esp32dev. La imagen usa aproximadamente 747 kB de flash y 46 kB de
RAM estática. No se ha cargado en una placa ni probado un receptor físico.

## Prueba de banco pendiente

Confirmar señal válida, pérdida/recuperación de Wi-Fi y GNSS, revocación de la
credencial y representación de las coordenadas del equipo en el mapa. Hasta
completar estas pruebas, el firmware es un prototipo de software.

## Ampliación a sensores

La siguiente etapa puede agregar combustible, temperatura, batería, carga o
presión, una vez elegidos los modelos, interfaces (UART/I²C/ADC/CAN), unidades,
calibración y frecuencia. Este prototipo no lee esos sensores y no inventa
valores de combustible ni alarmas de gas. La base prevista es:

```text
GNSS + sensores → ESP32 → Wi-Fi / futuro módem LTE → recepción autenticada
               → unidad + fecha + origen + medidas → mapa y ficha
```

Para combustible y presión de gas hay que definir primero qué se mide y con qué
sensor. No conectar líneas de combustible, tensión de batería ni redes CAN
directamente a GPIO: requieren interfaces eléctricas y una instalación diseñadas
para el componente y vehículo elegidos.

## Fuentes técnicas

- [UART de Arduino ESP32](https://docs.espressif.com/projects/arduino-esp32/en/latest/api/serial.html)
- [TinyGPSPlus](https://github.com/mikalhart/TinyGPSPlus)
- [ADC y rangos por chip](https://docs.espressif.com/projects/arduino-esp32/en/latest/api/adc.html)
