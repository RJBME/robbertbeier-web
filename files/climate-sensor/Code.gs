/**
 * Garage / basement climate log — Google Apps Script
 * Receives readings from the D1 Mini sensors, logs them to this Sheet,
 * keeps a "Latest" tab, and emails you about a high sump pit, water on the floor, freezing, heat, damp or a sensor going offline.
 * Guide: https://www.robertbeier.com/climate-sensor.html
 */

// ===================== YOUR SETTINGS =====================
const SECRET = 'PickALongSecret123';          // must match SECRET in the D1 Mini sketch
const ALERT_EMAIL = 'you@example.com';        // where alerts go

// Alert limits per sensor. Leave a limit out to skip it.
const ALERTS = {
  garage:   { minF: 35, maxF: 100 },
  basement: { minF: 45, maxHumidity: 60 },
};
const OFFLINE_MINUTES = 60;      // email if a sensor is silent this long
const ALERT_REPEAT_HOURS = 6;    // don't repeat the same alert more often than this
const LEAK_REPEAT_MINUTES = 30;  // while water is detected (floor or sump), remind you this often
// =========================================================

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.secret !== SECRET) return reply_('bad secret');

  const device = String(p.device || 'unknown').toLowerCase().trim();
  const tempF = num_(p.tempF);
  const humidity = num_(p.humidity);
  const pressure = num_(p.pressure);
  const rssi = num_(p.rssi);
  const leak = p.leak === undefined ? '' : (p.leak === '1' ? 'WET' : 'dry');
  const sump = p.sump === undefined ? '' : (p.sump === '1' ? 'HIGH' : 'normal');
  if (tempF === '') return reply_('missing tempF');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActive();
    const now = new Date();
    const log = sheet_(ss, 'Readings', ['Time', 'Device', 'Temp (°F)', 'Humidity (%)', 'Pressure (inHg)', 'Wi-Fi (dBm)', 'Floor leak', 'Sump']);
    log.appendRow([now, device, tempF, humidity, pressure, rssi, leak, sump]);
    updateLatest_(ss, [device, now, tempF, humidity, pressure, leak, sump]);
  } finally {
    lock.releaseLock();
  }
  checkLimits_(device, tempF, humidity);
  if (leak) checkWater_(device, 'leak', leak === 'WET', 'WATER ON THE FLOOR at the', 'floor leak sensor is dry again');
  if (sump) checkWater_(device, 'sump', sump === 'HIGH', 'SUMP PIT WATER IS HIGH at the', 'sump pit is back to normal');
  return reply_('ok');
}

/** Run once from the editor: creates the hourly "is everything still reporting?" check. */
function installTriggers() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'checkOffline')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('checkOffline').timeBased().everyHours(1).create();
  MailApp.sendEmail(ALERT_EMAIL, 'Climate sensors: alerts are set up',
    'You will get an email here if a sensor goes outside its limits or stops reporting.\n\n' + SpreadsheetApp.getActive().getUrl());
}

function checkOffline() {
  const latest = SpreadsheetApp.getActive().getSheetByName('Latest');
  if (!latest || latest.getLastRow() < 2) return;
  const rows = latest.getRange(2, 1, latest.getLastRow() - 1, 2).getValues();
  const now = Date.now();
  rows.forEach(([device, lastSeen]) => {
    if (!device || !(lastSeen instanceof Date)) return;
    const minutes = Math.round((now - lastSeen.getTime()) / 60000);
    if (minutes > OFFLINE_MINUTES) {
      alert_(device, 'offline', `${device} sensor has not reported for ${minutes} minutes (last: ${lastSeen.toLocaleString()}). Check its power and Wi-Fi.`);
    }
  });
}

function checkLimits_(device, tempF, humidity) {
  const lim = ALERTS[device];
  if (!lim) return;
  if (lim.minF != null && tempF < lim.minF) alert_(device, 'cold', `${device} is ${tempF} °F, below your ${lim.minF} °F limit.`);
  if (lim.maxF != null && tempF > lim.maxF) alert_(device, 'hot', `${device} is ${tempF} °F, above your ${lim.maxF} °F limit.`);
  if (lim.maxHumidity != null && humidity !== '' && humidity > lim.maxHumidity) {
    alert_(device, 'damp', `${device} humidity is ${humidity}%, above your ${lim.maxHumidity}% limit.`);
  }
}

function checkWater_(device, kind, wet, alarmText, clearText) {
  const props = PropertiesService.getScriptProperties();
  const stateKey = `${kind}_${device}`;
  const wasWet = props.getProperty(stateKey) === 'WET';
  if (wet) {
    alert_(device, kind, `${alarmText} ${device} unit!`, LEAK_REPEAT_MINUTES / 60);
  } else if (wasWet) {
    MailApp.sendEmail(ALERT_EMAIL, `Climate: ${device} ${clearText}`,
      `The ${device} ${clearText}.\n\n${SpreadsheetApp.getActive().getUrl()}`);
    props.deleteProperty(`alert_${device}_${kind}`);
  }
  props.setProperty(stateKey, wet ? 'WET' : 'dry');
}

function alert_(device, kind, message, repeatHours) {
  const props = PropertiesService.getScriptProperties();
  const key = `alert_${device}_${kind}`;
  const last = Number(props.getProperty(key) || 0);
  if (Date.now() - last < (repeatHours || ALERT_REPEAT_HOURS) * 3600 * 1000) return;
  MailApp.sendEmail(ALERT_EMAIL, `Climate alert: ${message}`, `${message}\n\n${SpreadsheetApp.getActive().getUrl()}`);
  props.setProperty(key, String(Date.now()));
}

function updateLatest_(ss, row) {
  const sh = sheet_(ss, 'Latest', ['Device', 'Last seen', 'Temp (°F)', 'Humidity (%)', 'Pressure (inHg)', 'Floor leak', 'Sump']);
  const n = sh.getLastRow();
  const names = n > 1 ? sh.getRange(2, 1, n - 1, 1).getValues().map(r => r[0]) : [];
  const i = names.indexOf(row[0]);
  if (i === -1) sh.appendRow(row);
  else sh.getRange(i + 2, 1, 1, row.length).setValues([row]);
}

function sheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sh;
}

function num_(v) {
  const n = Number(v);
  return v === undefined || v === '' || !isFinite(n) ? '' : n;
}

function reply_(text) {
  return ContentService.createTextOutput(text);
}
