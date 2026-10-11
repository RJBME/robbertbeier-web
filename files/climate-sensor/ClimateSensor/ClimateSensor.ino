// Garage / basement climate sensor
// D1 Mini (ESP8266) + BME280 -> Google Sheet (via Apps Script), with a live page at http://<DEVICE_NAME>.local
// Guide: https://www.robertbeier.com/climate-sensor.html
//
// Wiring:  BME280 VIN -> 3V3   GND -> G   SCL -> D1   SDA -> D2
// Leak probe (basement only): D5 -> 1 kOhm resistor -> probe wire 1;  probe wire 2 -> A0
// Sump float switch (basement only): one wire -> D6, other wire -> D7

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include <Wire.h>
#include <Adafruit_BME280.h>

// ===================== YOUR SETTINGS =====================
const char* WIFI_SSID     = "YourWiFiName";
const char* WIFI_PASS     = "YourWiFiPassword";
const char* SCRIPT_URL    = "https://script.google.com/macros/s/PASTE-YOUR-ID-HERE/exec";
const char* SECRET        = "PickALongSecret123";   // letters and numbers only; must match the Apps Script
const char* DEVICE_NAME   = "garage";               // "garage" or "basement" (lowercase, no spaces)
const float TEMP_OFFSET_F = 0.0;                    // e.g. -1.5 if it reads 1.5 °F high
const unsigned long SEND_EVERY_MINUTES = 10;
const bool HAS_LEAK_SENSOR = false;                 // true on the basement unit with the leak puck
const int  LEAK_THRESHOLD  = 80;                    // A0 reading above this = wet (dry is ~0-10)
const bool HAS_SUMP_FLOAT  = false;                 // true on the basement unit with the sump float switch
const bool FLOAT_IS_NORMALLY_OPEN = true;           // "normally open" float: closes when water rises
// =========================================================

const unsigned long READ_EVERY_MS = 30UL * 1000UL;
const unsigned long SEND_EVERY_MS = SEND_EVERY_MINUTES * 60UL * 1000UL;
const unsigned long WIFI_GIVE_UP_MS = 5UL * 60UL * 1000UL;   // restart if Wi-Fi is gone this long
const unsigned long LEAK_CHECK_MS = 5000;
const unsigned long WET_RESEND_MS = 2UL * 60UL * 1000UL;     // keep reporting every 2 min while wet
const uint8_t LEAK_DRIVE_PIN = D5;
const uint8_t FLOAT_PIN = D6;        // reads the float switch (internal pull-up)
const uint8_t FLOAT_GND_PIN = D7;    // held LOW, acts as the float switch's ground

Adafruit_BME280 bme;
ESP8266WebServer server(80);

bool sensorOk = false;
uint8_t sensorAddr = 0;
float tempF = NAN, humidity = NAN, pressureInHg = NAN;
unsigned long lastRead = 0, lastSend = 0, wifiLostAt = 0;
bool firstSendDone = false;
String lastResult = "not sent yet";
int leakRaw = 0;
bool leakWet = false;
uint8_t leakVotes = 0;
unsigned long lastLeakCheck = 0;
bool sumpHigh = false;
uint8_t sumpVotes = 0;

uint8_t readChipId(uint8_t addr) {
  Wire.beginTransmission(addr);
  Wire.write(0xD0);
  if (Wire.endTransmission() != 0) return 0;
  Wire.requestFrom(addr, (uint8_t)1);
  return Wire.available() ? Wire.read() : 0;
}

void startSensor() {
  Wire.begin();  // D2 = SDA, D1 = SCL
  const uint8_t addrs[] = {0x76, 0x77};
  for (uint8_t a : addrs) {
    if (bme.begin(a, &Wire)) {
      sensorOk = true;
      sensorAddr = a;
      // Forced mode: measure only when asked, so the sensor doesn't warm itself up
      bme.setSampling(Adafruit_BME280::MODE_FORCED,
                      Adafruit_BME280::SAMPLING_X1, Adafruit_BME280::SAMPLING_X1,
                      Adafruit_BME280::SAMPLING_X1, Adafruit_BME280::FILTER_OFF);
      Serial.printf("BME280 found at 0x%02X\n", a);
      return;
    }
  }
  Serial.println("BME280 NOT found. Check the 4 wires (SCL->D1, SDA->D2).");
  for (uint8_t a : addrs) {
    uint8_t id = readChipId(a);
    if (id == 0x58) Serial.printf("  Chip at 0x%02X is a BMP280: temperature + pressure only, NO humidity. The seller sent the wrong part.\n", a);
    else if (id) Serial.printf("  Something answered at 0x%02X with chip ID 0x%02X (BME280 should be 0x60).\n", a, id);
  }
}

void readSensor() {
  if (!sensorOk) return;
  bme.takeForcedMeasurement();
  tempF = bme.readTemperature() * 9.0 / 5.0 + 32.0 + TEMP_OFFSET_F;
  humidity = bme.readHumidity();
  pressureInHg = bme.readPressure() / 3386.389;
  Serial.printf("%.1f F  %.1f %%RH  %.2f inHg\n", tempF, humidity, pressureInHg);
}

void blink(int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_BUILTIN, LOW);  delay(60);
    digitalWrite(LED_BUILTIN, HIGH); delay(120);
  }
}

void sendReading() {
  if (!sensorOk) { lastResult = "sensor not found"; return; }
  if (WiFi.status() != WL_CONNECTED) { lastResult = "no Wi-Fi"; return; }

  std::unique_ptr<BearSSL::WiFiClientSecure> client(new BearSSL::WiFiClientSecure);
  client->setInsecure();  // skip certificate check; fine for a hobby logger
  HTTPClient https;
  https.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);  // Google answers with a redirect
  https.setTimeout(15000);

  String url = String(SCRIPT_URL) +
               "?secret=" + SECRET +
               "&device=" + DEVICE_NAME +
               "&tempF=" + String(tempF, 1) +
               "&humidity=" + String(humidity, 1) +
               "&pressure=" + String(pressureInHg, 2) +
               "&rssi=" + String(WiFi.RSSI());
  if (HAS_LEAK_SENSOR) url += "&leak=" + String(leakWet ? 1 : 0) + "&leakRaw=" + String(leakRaw);
  if (HAS_SUMP_FLOAT) url += "&sump=" + String(sumpHigh ? 1 : 0);

  if (!https.begin(*client, url)) { lastResult = "could not start request"; return; }
  int code = https.GET();
  String body = code > 0 ? https.getString() : HTTPClient::errorToString(code);
  https.end();
  body.trim();
  if (body.length() > 80) body = body.substring(0, 80) + "...";
  lastResult = String(code) + " " + body;
  Serial.println("Sent -> " + lastResult);
  blink(code == 200 && body == "ok" ? 1 : 3);
}

// Power the probe only for a few milliseconds per check, so the screws don't corrode
void checkLeak() {
  digitalWrite(LEAK_DRIVE_PIN, HIGH);
  delay(5);
  leakRaw = analogRead(A0);
  digitalWrite(LEAK_DRIVE_PIN, LOW);
  bool wetNow = leakRaw > LEAK_THRESHOLD;
  // two readings in a row must agree before the state changes
  if (wetNow != leakWet) leakVotes++; else leakVotes = 0;
  if (leakVotes >= 2) {
    leakVotes = 0;
    leakWet = wetNow;
    Serial.printf("LEAK SENSOR: %s (A0 = %d)\n", leakWet ? "WET" : "dry", leakRaw);
    readSensor();
    lastSend = millis();
    sendReading();  // report the change right away
  }
}

void checkSump() {
  bool closed = digitalRead(FLOAT_PIN) == LOW;
  bool highNow = FLOAT_IS_NORMALLY_OPEN ? closed : !closed;
  // three readings in a row (15 s) must agree, so sloshing doesn't flap the alarm
  if (highNow != sumpHigh) sumpVotes++; else sumpVotes = 0;
  if (sumpVotes >= 3) {
    sumpVotes = 0;
    sumpHigh = highNow;
    Serial.printf("SUMP FLOAT: %s\n", sumpHigh ? "HIGH WATER" : "normal");
    readSensor();
    lastSend = millis();
    sendReading();
  }
}

String fmt(float v, int digits) { return isnan(v) ? String("--") : String(v, digits); }

void handleRoot() {
  String html = F("<!doctype html><meta name=viewport content='width=device-width,initial-scale=1'>"
                  "<meta http-equiv=refresh content=30><title>Climate sensor</title>"
                  "<body style='font-family:system-ui;max-width:420px;margin:24px auto;padding:0 16px'>");
  html += "<h2 style='margin:0 0 4px'>" + String(DEVICE_NAME) + "</h2>";
  html += "<p style='font-size:44px;margin:8px 0'>" + fmt(tempF, 1) + " &deg;F</p>";
  html += "<p style='font-size:22px;margin:0'>" + fmt(humidity, 0) + " % humidity &middot; " + fmt(pressureInHg, 2) + " inHg</p>";
  html += "<p style='color:#666'>Sensor: " + String(sensorOk ? "BME280 OK" : "NOT FOUND") +
          (HAS_LEAK_SENSOR ? "<br>Leak sensor: <b>" + String(leakWet ? "WET" : "dry") + "</b> (A0 = " + String(leakRaw) + ")" : String("")) +
          (HAS_SUMP_FLOAT ? "<br>Sump float: <b>" + String(sumpHigh ? "HIGH WATER" : "normal") + "</b>" : String("")) +
          "<br>Wi-Fi: " + String(WiFi.RSSI()) + " dBm<br>Last upload: " + lastResult +
          "<br>Uptime: " + String(millis() / 60000) + " min</p>";
  server.send(200, "text/html", html);
}

void handleJson() {
  server.send(200, "application/json",
              "{\"device\":\"" + String(DEVICE_NAME) + "\",\"tempF\":" + fmt(tempF, 1) +
              ",\"humidity\":" + fmt(humidity, 1) + ",\"pressureInHg\":" + fmt(pressureInHg, 2) +
              (HAS_LEAK_SENSOR ? ",\"leak\":" + String(leakWet ? "true" : "false") + ",\"leakRaw\":" + String(leakRaw) : String("")) +
              (HAS_SUMP_FLOAT ? ",\"sumpHigh\":" + String(sumpHigh ? "true" : "false") : String("")) + "}");
}

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, HIGH);  // off (the D1 Mini LED is on when LOW)
  pinMode(LEAK_DRIVE_PIN, OUTPUT);
  digitalWrite(LEAK_DRIVE_PIN, LOW);
  if (HAS_SUMP_FLOAT) {
    pinMode(FLOAT_GND_PIN, OUTPUT);
    digitalWrite(FLOAT_GND_PIN, LOW);
    pinMode(FLOAT_PIN, INPUT_PULLUP);
  }
  Serial.begin(115200);
  delay(200);
  Serial.printf("\n\nClimate sensor \"%s\" starting\n", DEVICE_NAME);

  startSensor();
  readSensor();

  WiFi.mode(WIFI_STA);
  WiFi.hostname(DEVICE_NAME);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting to Wi-Fi");
  for (int i = 0; i < 40 && WiFi.status() != WL_CONNECTED; i++) { delay(500); Serial.print("."); }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("\nConnected. Open http://");
    Serial.print(WiFi.localIP());
    Serial.printf("  or  http://%s.local\n", DEVICE_NAME);
  } else {
    Serial.println("\nWi-Fi not connected yet (check name/password, 2.4 GHz only). Will keep trying.");
  }

  MDNS.begin(DEVICE_NAME);
  server.on("/", handleRoot);
  server.on("/json", handleJson);
  server.begin();
}

void loop() {
  server.handleClient();
  MDNS.update();
  unsigned long now = millis();

  if (now - lastRead >= READ_EVERY_MS) { lastRead = now; readSensor(); }
  if (now - lastLeakCheck >= LEAK_CHECK_MS) {
    lastLeakCheck = now;
    if (HAS_LEAK_SENSOR) checkLeak();
    if (HAS_SUMP_FLOAT) checkSump();
  }

  if (WiFi.status() == WL_CONNECTED) {
    wifiLostAt = 0;
    unsigned long every = (leakWet || sumpHigh) ? WET_RESEND_MS : SEND_EVERY_MS;
    if (!firstSendDone || now - lastSend >= every) {
      firstSendDone = true;
      lastSend = now;
      sendReading();
    }
  } else {
    if (wifiLostAt == 0) wifiLostAt = now;
    if (now - wifiLostAt > WIFI_GIVE_UP_MS) { Serial.println("Wi-Fi lost too long, restarting"); ESP.restart(); }
  }
}
