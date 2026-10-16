#pragma once
// Copiar a tracker_config.h; ese archivo queda fuera de Git.
#define WIFI_SSID ""
#define WIFI_PASSWORD ""
#define GPS_ENDPOINT "https://tu-dominio.example/api/gps/ingest"
#define GPS_TOKEN "" // Credencial creada en /gps.html
// Certificado CA raíz PEM que valida el certificado de tu servidor.
// No usar setInsecure().
static const char ROOT_CA[] = R"PEM(
)PEM";
// Sólo ESP32 DevKit/WROOM de referencia; confirmar pines del módulo real.
#define GNSS_RX_PIN 16
#define GNSS_TX_PIN 17
#define GNSS_BAUD 9600
