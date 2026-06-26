'use strict';
/**
 * franky-blockly-helpers.js
 * Globals required by franky-blockly.js that were originally defined
 * inside the <script> tags of bloques.html in the FRANKY firmware.
 * Must be loaded BEFORE franky-blockly.js.
 */
(function() {

  // ── GPIO pin map ─────────────────────────────────────────────
  window.FRANKY_PINS = {
    GPIO0: 'ADC0',
    GPIO1: 'ADC1',
    GPIO2: 'MB_IN2',
    GPIO3: 'MB_IN1',
    GPIO4: 'MA_IN2',
    GPIO5: 'MA_IN1',
    GPIO6: 'SDA',
    GPIO7: 'SCL',
    GPIO8: 'LED',
    GPIO9: 'BTN',
  };

  // ── Dropdown options for GPIO pin selectors ──────────────────
  window.mkPinOpts = function() {
    return Object.entries(window.FRANKY_PINS).map(function(e) {
      return [e[1] + ' (' + e[0] + ')', e[0]];
    });
  };

  // ── Human-readable pin label ─────────────────────────────────
  window.pinLabel = function(pin) {
    return window.FRANKY_PINS[pin] ? window.FRANKY_PINS[pin] + ' (' + pin + ')' : pin;
  };

  // ── Opcode table (mirrors firmware OP enum) ──────────────────
  window.FRANKY_OPCODES = {
    0: 'FIN', 1: 'ADE', 2: 'ATR', 3: 'IZQ', 4: 'DER',
    5: 'STOP', 6: 'ESP', 7: 'LED_ON', 8: 'LED_OFF',
    9: 'IF_DIST', 11: 'FRENO',
    20: 'DOUT', 22: 'PWM_OUT', 30: 'ADC_READ', 40: 'SERVO',
    60: 'VAR_SET', 61: 'VAR_ADD', 62: 'VAR_SUB',
    70: 'IF_GT', 71: 'IF_LT', 74: 'REPEAT',
  };

  // ── Opcode name helper ───────────────────────────────────────
  window.opName = function(op) {
    return window.FRANKY_OPCODES[op] || ('OP' + op);
  };

  // ── Value label helper ───────────────────────────────────────
  window.valLabel = function(op, val) {
    if (op >= 1 && op <= 6) return val + 'ms';
    if (op === 30) return 'GPIO' + val;
    if (op === 70 || op === 71) return '' + val;
    if (op === 74) return 'línea ' + val;
    return '' + val;
  };

  // ── Arduino function stubs (used in generated C++ strings only) ─
  // These appear in franky-blockly.js as strings inside code generators,
  // not as actual JS function calls. They do NOT need JS implementations.
  // Listed here for documentation only:
  // analogRead, digitalWrite, digitalRead, pinMode, analogWrite,
  // ledcSetup, ledcAttachPin, ledcWrite, delay, delayMicroseconds,
  // millis, constrain, map, min, Serial.println

})();
