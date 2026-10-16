#include <Arduino.h>
#include <TinyGPS++.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <time.h>
#if __has_include("tracker_config.h")
#include "tracker_config.h"
#else
#include "tracker_config.example.h"
#endif

TinyGPSPlus gps;
HardwareSerial gnss(2);
unsigned long lastAttempt = 0;
bool credentialsRejected = false;

void setup() {
  Serial.begin(115200);
  gnss.begin(GNSS_BAUD, SERIAL_8N1, GNSS_RX_PIN, GNSS_TX_PIN);
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.println("GPS iniciado. Esperando Wi-Fi, reloj y señal GNSS.");
}

void loop() {
  while (gnss.available()) gps.encode(gnss.read());
  if (millis() - lastAttempt < 15000 || credentialsRejected) { delay(2); return; }
  lastAttempt = millis();
  if (!strlen(WIFI_SSID) || !strlen(GPS_TOKEN) || strlen(ROOT_CA) < 100 || !String(GPS_ENDPOINT).startsWith("https://")) {
    Serial.println("Configurar Wi-Fi, endpoint HTTPS, credencial y certificado CA en tracker_config.h.");
    return;
  }
  if (WiFi.status() != WL_CONNECTED || time(nullptr) < 1700000000) {
    Serial.println("Sin red o reloj: no se transmite.");
    return;
  }
  if (!gps.location.isValid() || gps.location.age() > 2000 || !gps.date.isValid() || !gps.time.isValid() || gps.time.age() > 2000) {
    Serial.println("Esperando una posición GNSS reciente; no se envían coordenadas ficticias.");
    return;
  }
  char timestamp[25], speed[24], heading[24], payload[384];
  snprintf(timestamp, sizeof(timestamp), "%04d-%02d-%02dT%02d:%02d:%02dZ", gps.date.year(), gps.date.month(), gps.date.day(), gps.time.hour(), gps.time.minute(), gps.time.second());
  if (gps.speed.isValid() && gps.speed.age() < 2000) snprintf(speed, sizeof(speed), "%.3f", gps.speed.mps());
  else strcpy(speed, "null");
  if (gps.course.isValid() && gps.course.age() < 2000) snprintf(heading, sizeof(heading), "%.2f", gps.course.deg());
  else strcpy(heading, "null");
  // NMEA básico no da precisión horizontal en metros. HDOP no equivale a metros.
  snprintf(payload, sizeof(payload), "{\"latitude\":%.7f,\"longitude\":%.7f,\"accuracy\":null,\"speed\":%s,\"heading\":%s,\"observed_at\":\"%s\"}", gps.location.lat(), gps.location.lng(), speed, heading, timestamp);
  WiFiClientSecure client;
  client.setCACert(ROOT_CA);
  HTTPClient http;
  http.setConnectTimeout(5000);
  http.setTimeout(5000);
  if (!http.begin(client, GPS_ENDPOINT)) { Serial.println("No se pudo abrir HTTPS."); return; }
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + GPS_TOKEN);
  const int status = http.POST(String(payload));
  // Sólo se registra estado, nunca credenciales ni coordenadas.
  Serial.printf("Recepción del servidor: %d\n", status);
  if (status == 401 || status == 403) { credentialsRejected = true; Serial.println("Credencial rechazada: configurar una válida y reiniciar."); }
  http.end();
  // No se acumulan paquetes para reenviar posiciones viejas al recuperar la red.
}
