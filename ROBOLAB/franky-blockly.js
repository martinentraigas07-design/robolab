// RoboLab — FRANKY Blockly Integration Module
// Source: extracted from esp32c3_franky_SPIFFS/data/bloques.html
// Real Blockly (bly_core_*.js) must be loaded as script tags before this runs.

(function(window) {

var OP = {
  FIN:0, ADE:1, ATR:2, IZQ:3, DER:4, STOP:5, ESP:6,
  LED_ON:7, LED_OFF:8, IF_DIST:9, FRENO:11,
  DOUT:20, PWM_OUT:22, PWM_MOTOR_CH:23, ADC_READ:30, SERVO:40,
  VAR_SET:60, VAR_ADD:61, VAR_SUB:62,
  IF_GT:70, IF_LT:71, REPEAT:74
};

var TOOLBOX = `<xml xmlns="https://developers.google.com/blockly/xml">
<category name="Motores" colour="#e05a00">
  <block type="f_adelante"><field name="VEL">200</field></block>
  <block type="f_atras"><field name="VEL">200</field></block>
  <block type="f_izq"><field name="VEL">180</field></block>
  <block type="f_der"><field name="VEL">180</field></block>
  <block type="f_stop"></block>
  <block type="f_freno"></block>
  <block type="f_pwm_motor"><field name="CH">A</field><field name="DUTY">200</field></block>
</category>
<category name="Servo" colour="#ff7043">
  <block type="f_servo"><field name="GPIO">3</field><field name="ANG">90</field></block>
  <block type="f_servo_sweep"><field name="GPIO">3</field><field name="A1">0</field><field name="A2">180</field><field name="VEL">5</field></block>
</category>
<category name="GPIO / Salidas" colour="#ff9800">
  <block type="f_dout"><field name="VAL">HIGH</field></block>
  <block type="f_pwm_out"><field name="FREQ">1000</field><field name="DUTY">128</field></block>
  <block type="f_led_on"></block>
  <block type="f_led_off"></block>
</category>
<category name="Sensores" colour="#00897b">
  <block type="f_adc"><field name="N">1</field></block>
  <block type="f_din"></block>
  <block type="f_ultrasonic"></block>
  <block type="f_dht_temp"></block>
  <block type="f_dht_hum"></block>
  <block type="f_millis"></block>
</category>
<category name="PID *" colour="#ad1457">
  <block type="f_pid_set"><field name="KP">2.0</field><field name="KI">0.5</field><field name="KD">1.0</field></block>
  <block type="f_pid_start"><field name="SP">0</field></block>
  <block type="f_pid_stop"></block>
</category>
<category name="OLED I2C *" colour="#6a1b9a">
  <block type="f_oled_clear"></block>
  <block type="f_oled_text"><field name="COL">0</field><field name="FILA">0</field><field name="TXT">Hola</field></block>
  <block type="f_oled_show"></block>
</category>
<category name="Decision" colour="#1565c0">
  <block type="f_if_gt"><field name="UMBRAL">2000</field></block>
  <block type="f_if_lt"><field name="UMBRAL">1000</field></block>
  <block type="controls_if"></block>
  <block type="logic_compare"></block>
  <block type="logic_operation"></block>
  <block type="logic_negate"></block>
</category>
<category name="Control" colour="#01579b">
  <block type="f_repeat"><field name="N">3</field></block>
  <block type="f_while_gt"><field name="UMBRAL">2000</field></block>
  <block type="controls_repeat_ext"><value name="TIMES"><block type="math_number"><field name="NUM">5</field></block></value></block>
  <block type="controls_whileUntil"></block>
</category>
<category name="Variables" colour="#2e7d32">
  <block type="f_var_set"><field name="VAR">contador</field><field name="VAL">0</field></block>
  <block type="f_var_add"><field name="VAR">contador</field><field name="VAL">1</field></block>
  <block type="variables_get"></block>
  <block type="variables_set"></block>
</category>
<category name="Matematicas" colour="#388e3c">
  <block type="f_map"></block>
  <block type="f_constrain"><field name="MIN">0</field><field name="MAX">255</field></block>
  <block type="math_arithmetic"></block>
  <block type="math_number"></block>
  <block type="math_single"></block>
</category>
<category name="Tiempo" colour="#f57f17">
  <block type="f_esperar"><field name="MS">500</field></block>
  <block type="f_esperar_us"><field name="US">100</field></block>
</category>
<category name="Serial" colour="#546e7a">
  <block type="f_serial_print"><field name="MSG">Hola Franky</field></block>
</category>
</xml>`;

function defBlocks() {
  Blockly.defineBlocksWithJsonArray([
    // Motores
    {type:"f_adelante",message0:"Adelante vel %1",args0:[{type:"field_number",name:"VEL",value:200,min:0,max:255}],previousStatement:null,nextStatement:null,colour:"#e05a00"},
    {type:"f_atras",message0:"Atras vel %1",args0:[{type:"field_number",name:"VEL",value:200,min:0,max:255}],previousStatement:null,nextStatement:null,colour:"#c62828"},
    {type:"f_izq",message0:"Girar izquierda vel %1",args0:[{type:"field_number",name:"VEL",value:180,min:0,max:255}],previousStatement:null,nextStatement:null,colour:"#1565c0"},
    {type:"f_der",message0:"Girar derecha vel %1",args0:[{type:"field_number",name:"VEL",value:180,min:0,max:255}],previousStatement:null,nextStatement:null,colour:"#1565c0"},
    {type:"f_stop",message0:"Parar motores",previousStatement:null,nextStatement:null,colour:"#616161"},
    {type:"f_freno",message0:"Freno activo",previousStatement:null,nextStatement:null,colour:"#b71c1c"},
    {type:"f_pwm_motor",message0:"PWM motor %1 duty %2",args0:[{type:"field_dropdown",name:"CH",options:[["A","A"],["B","B"],["A+B","AB"]]},{type:"field_number",name:"DUTY",value:200,min:0,max:255}],previousStatement:null,nextStatement:null,colour:"#e65100"},
    // Servo
    {type:"f_servo",message0:"Servo GPIO %1 angulo %2 deg",args0:[{type:"field_dropdown",name:"GPIO",options:mkPinOpts()},{type:"field_number",name:"ANG",value:90,min:0,max:180}],previousStatement:null,nextStatement:null,colour:"#ff7043",tooltip:"Requiere ESP32Servo *"},
    {type:"f_servo_sweep",message0:"Servo GPIO %1 de %2 a %3 paso %4",args0:[{type:"field_dropdown",name:"GPIO",options:mkPinOpts()},{type:"field_number",name:"A1",value:0},{type:"field_number",name:"A2",value:180},{type:"field_number",name:"VEL",value:5}],previousStatement:null,nextStatement:null,colour:"#ff7043"},
    // GPIO
    {type:"f_dout",message0:"GPIO %1 digital %2",args0:[{type:"field_dropdown",name:"GPIO",options:mkPinOpts()},{type:"field_dropdown",name:"VAL",options:[["HIGH","HIGH"],["LOW","LOW"]]}],previousStatement:null,nextStatement:null,colour:"#ff9800"},
    {type:"f_pwm_out",message0:"PWM GPIO %1 freq %2 Hz duty %3",args0:[{type:"field_dropdown",name:"GPIO",options:mkPinOpts()},{type:"field_number",name:"FREQ",value:1000},{type:"field_number",name:"DUTY",value:128,min:0,max:255}],previousStatement:null,nextStatement:null,colour:"#f57c00"},
    {type:"f_led_on",message0:"LED encender (GPIO8)",previousStatement:null,nextStatement:null,colour:"#fdd835"},
    {type:"f_led_off",message0:"LED apagar (GPIO8)",previousStatement:null,nextStatement:null,colour:"#fdd835"},
    // Sensores
    {type:"f_adc",message0:"Leer ADC %1 prom %2",args0:[{type:"field_dropdown",name:"GPIO",options:[["GPIO0","0"],["GPIO1","1"]]},{type:"field_number",name:"N",value:1,min:1,max:16}],output:"Number",colour:"#00897b"},
    {type:"f_din",message0:"Leer digital %1",args0:[{type:"field_dropdown",name:"GPIO",options:mkPinOpts()}],output:"Boolean",colour:"#00897b"},
    {type:"f_ultrasonic",message0:"Sonar TRIG %1 ECHO %2 (cm)",args0:[{type:"field_dropdown",name:"TRIG",options:mkPinOpts()},{type:"field_dropdown",name:"ECHO",options:mkPinOpts()}],output:"Number",colour:"#00838f",tooltip:"Requiere NewPing"},
    {type:"f_dht_temp",message0:"DHT22 temperatura GPIO %1",args0:[{type:"field_dropdown",name:"GPIO",options:mkPinOpts()}],output:"Number",colour:"#00796b"},
    {type:"f_dht_hum",message0:"DHT22 humedad GPIO %1",args0:[{type:"field_dropdown",name:"GPIO",options:mkPinOpts()}],output:"Number",colour:"#00796b"},
    {type:"f_millis",message0:"millis()",output:"Number",colour:"#f57f17"},
    // PID (solo C++)
    {type:"f_pid_set",message0:"* PID Kp %1 Ki %2 Kd %3",args0:[{type:"field_number",name:"KP",value:2.0},{type:"field_number",name:"KI",value:0.5},{type:"field_number",name:"KD",value:1.0}],previousStatement:null,nextStatement:null,colour:"#ad1457",tooltip:"Solo codigo C++ — instalar PID Library"},
    {type:"f_pid_start",message0:"* PID iniciar setpoint %1",args0:[{type:"field_number",name:"SP",value:0}],previousStatement:null,nextStatement:null,colour:"#ad1457"},
    {type:"f_pid_stop",message0:"* PID detener",previousStatement:null,nextStatement:null,colour:"#c2185b"},
    // OLED (solo C++)
    {type:"f_oled_clear",message0:"* OLED limpiar",previousStatement:null,nextStatement:null,colour:"#6a1b9a",tooltip:"Solo codigo C++ — instalar Adafruit SSD1306"},
    {type:"f_oled_text",message0:"* OLED texto col %1 fila %2 texto %3",args0:[{type:"field_number",name:"COL",value:0},{type:"field_number",name:"FILA",value:0},{type:"field_input",name:"TXT",text:"Hola"}],previousStatement:null,nextStatement:null,colour:"#6a1b9a"},
    {type:"f_oled_show",message0:"* OLED mostrar",previousStatement:null,nextStatement:null,colour:"#6a1b9a"},
    // Decision
    {type:"f_if_gt",message0:"Si ADC0 > %1 entonces",args0:[{type:"field_number",name:"UMBRAL",value:2000}],message1:"%1",args1:[{type:"input_statement",name:"DO"}],previousStatement:null,nextStatement:null,colour:"#1565c0"},
    {type:"f_if_lt",message0:"Si ADC0 < %1 entonces",args0:[{type:"field_number",name:"UMBRAL",value:1000}],message1:"%1",args1:[{type:"input_statement",name:"DO"}],previousStatement:null,nextStatement:null,colour:"#1565c0"},
    // Control
    {type:"f_repeat",message0:"Repetir %1 veces",args0:[{type:"field_number",name:"N",value:3,min:1,max:100}],message1:"%1",args1:[{type:"input_statement",name:"DO"}],previousStatement:null,nextStatement:null,colour:"#01579b"},
    {type:"f_while_gt",message0:"Mientras ADC0 > %1",args0:[{type:"field_number",name:"UMBRAL",value:500}],message1:"%1",args1:[{type:"input_statement",name:"DO"}],previousStatement:null,nextStatement:null,colour:"#0277bd"},
    // Variables
    {type:"f_var_set",message0:"Variable %1 = %2",args0:[{type:"field_input",name:"VAR",text:"mi_var"},{type:"field_number",name:"VAL",value:0}],previousStatement:null,nextStatement:null,colour:"#2e7d32"},
    {type:"f_var_add",message0:"Variable %1 += %2",args0:[{type:"field_input",name:"VAR",text:"mi_var"},{type:"field_number",name:"VAL",value:1}],previousStatement:null,nextStatement:null,colour:"#388e3c"},
    // Math
    {type:"f_map",message0:"map ADC0 [0..4095] a [0..255]",output:"Number",colour:"#388e3c"},
    {type:"f_constrain",message0:"constrain %1 entre %2 y %3",args0:[{type:"input_value",name:"VAL",check:"Number"},{type:"field_number",name:"MIN",value:0},{type:"field_number",name:"MAX",value:255}],output:"Number",colour:"#2e7d32"},
    // Tiempo
    {type:"f_esperar",message0:"Esperar %1 ms",args0:[{type:"field_number",name:"MS",value:500,min:1}],previousStatement:null,nextStatement:null,colour:"#f57f17"},
    {type:"f_esperar_us",message0:"Esperar %1 us",args0:[{type:"field_number",name:"US",value:100,min:1}],previousStatement:null,nextStatement:null,colour:"#e65100"},
    // Serial
    {type:"f_serial_print",message0:"Serial println %1",args0:[{type:"field_input",name:"MSG",text:"Hola"}],previousStatement:null,nextStatement:null,colour:"#546e7a"}
  ]);
}

function defGenerators() {
  // Compatibilidad: API moderna (forBlock) y API vieja (G["..."]) simultaneamente
  var G = Blockly.JavaScript;
  var FB = (G && G.forBlock) ? G.forBlock : null;
  var n = "\n";

  function reg(type, fn) {
    if (FB) FB[type] = fn;       // API moderna Blockly v9+
    if (G)  G[type]  = fn;       // API vieja (fallback)
  }

  reg("f_adelante",   function(b) { return 'move("f",' + b.getFieldValue("VEL") + ');' + n; });
  reg("f_atras",      function(b) { return 'move("b",' + b.getFieldValue("VEL") + ');' + n; });
  reg("f_izq",        function(b) { return 'move("l",' + b.getFieldValue("VEL") + ');' + n; });
  reg("f_der",        function(b) { return 'move("r",' + b.getFieldValue("VEL") + ');' + n; });
  reg("f_stop",       function(b) { return 'stopMotors();' + n; });
  reg("f_freno",      function(b) { return 'ledcWrite(CH_A1,255);ledcWrite(CH_A2,255);ledcWrite(CH_B1,255);ledcWrite(CH_B2,255);' + n; });
  reg("f_pwm_motor",  function(b) {
    var ch = b.getFieldValue("CH"), d = b.getFieldValue("DUTY");
    if (ch === "A")  return 'ledcWrite(CH_A1,' + d + ');ledcWrite(CH_A2,0);' + n;
    if (ch === "B")  return 'ledcWrite(CH_B1,' + d + ');ledcWrite(CH_B2,0);' + n;
    return 'ledcWrite(CH_A1,' + d + ');ledcWrite(CH_B1,' + d + ');' + n;
  });
  reg("f_servo",      function(b) { return 'servo' + b.getFieldValue("GPIO") + '.write(' + b.getFieldValue("ANG") + ');' + n; });
  reg("f_servo_sweep",function(b) { return 'for(int _a=' + b.getFieldValue("A1") + ';_a<=' + b.getFieldValue("A2") + ';_a+=' + b.getFieldValue("VEL") + '){servo' + b.getFieldValue("GPIO") + '.write(_a);delay(15);}' + n; });
  reg("f_dout",       function(b) {
    var gpio = b.getFieldValue("GPIO");
    var val  = b.getFieldValue("VAL"); // "HIGH" o "LOW"
    return 'pinMode(' + gpio + ',OUTPUT);digitalWrite(' + gpio + ',' + val + ');' + n;
  });
  reg("f_pwm_out",    function(b) { return 'ledcSetup(8,' + b.getFieldValue("FREQ") + ',8);ledcAttachPin(' + b.getFieldValue("GPIO") + ',8);ledcWrite(8,' + b.getFieldValue("DUTY") + ');' + n; });
  reg("f_led_on",     function(b) { return 'digitalWrite(PIN_LED,LOW);' + n; });
  reg("f_led_off",    function(b) { return 'digitalWrite(PIN_LED,HIGH);' + n; });
  reg("f_adc",        function(b) { return ['analogRead(' + b.getFieldValue("GPIO") + ')', 0]; });
  reg("f_din",        function(b) { return ['digitalRead(' + b.getFieldValue("GPIO") + ')', 0]; });
  reg("f_ultrasonic", function(b) { return ['([&](){NewPing _s(' + b.getFieldValue("TRIG") + ',' + b.getFieldValue("ECHO") + ',400);return(int)_s.ping_cm();})()', 0]; });
  reg("f_dht_temp",   function(b) { return ['dht.readTemperature()', 0]; });
  reg("f_dht_hum",    function(b) { return ['dht.readHumidity()', 0]; });
  reg("f_millis",     function(b) { return ['millis()', 0]; });
  reg("f_pid_set",    function(b) { return 'double _kp=' + b.getFieldValue("KP") + ',_ki=' + b.getFieldValue("KI") + ',_kd=' + b.getFieldValue("KD") + ';' + n; });
  reg("f_pid_start",  function(b) { return 'double _sp=' + b.getFieldValue("SP") + ',_in,_out;' + n + 'PID _pid(&_in,&_out,&_sp,_kp,_ki,_kd,DIRECT);' + n + '_pid.SetMode(AUTOMATIC);' + n; });
  reg("f_pid_stop",   function(b) { return '_pid.SetMode(MANUAL);' + n; });
  reg("f_oled_clear", function(b) { return 'display.clearDisplay();' + n; });
  reg("f_oled_text",  function(b) { return 'display.setCursor(' + b.getFieldValue("COL") * 6 + ',' + b.getFieldValue("FILA") * 8 + ');display.print("' + b.getFieldValue("TXT") + '");' + n; });
  reg("f_oled_show",  function(b) { return 'display.display();' + n; });
  reg("f_if_gt",      function(b) { var c = G.statementToCode(b, "DO"); return 'if(analogRead(PIN_ADC0)>' + b.getFieldValue("UMBRAL") + '){' + n + c + '}' + n; });
  reg("f_if_lt",      function(b) { var c = G.statementToCode(b, "DO"); return 'if(analogRead(PIN_ADC0)<' + b.getFieldValue("UMBRAL") + '){' + n + c + '}' + n; });
  reg("f_repeat",     function(b) { var c = G.statementToCode(b, "DO"); return 'for(int _i=0;_i<' + b.getFieldValue("N") + ';_i++){' + n + c + '}' + n; });
  reg("f_while_gt",   function(b) { var c = G.statementToCode(b, "DO"); return 'while(analogRead(PIN_ADC0)>' + b.getFieldValue("UMBRAL") + '){' + n + c + 'delay(10);' + n + '}' + n; });
  reg("f_var_set",    function(b) { return 'static float ' + b.getFieldValue("VAR") + '=0;' + n + b.getFieldValue("VAR") + '=' + b.getFieldValue("VAL") + ';' + n; });
  reg("f_var_add",    function(b) { return b.getFieldValue("VAR") + '+=' + b.getFieldValue("VAL") + ';' + n; });
  reg("f_map",        function(b) { return ['map(analogRead(PIN_ADC0),0,4095,0,255)', 0]; });
  reg("f_constrain",  function(b) { var v = G.valueToCode(b, "VAL", 0) || "0"; return ['constrain(' + v + ',' + b.getFieldValue("MIN") + ',' + b.getFieldValue("MAX") + ')', 0]; });
  reg("f_esperar",    function(b) { return 'delay(' + b.getFieldValue("MS") + ');' + n; });
  reg("f_esperar_us", function(b) { return 'delayMicroseconds(' + b.getFieldValue("US") + ');' + n; });
  reg("f_serial_print",function(b){ return 'Serial.println("' + b.getFieldValue("MSG") + '");' + n; });
}

function parseBlock(b,insts){
  if(!b||insts.length>=200) return;
  switch(b.type){
    case "f_adelante": insts.push({op:OP.ADE,val:+b.getFieldValue("VEL")}); break;
    case "f_atras":    insts.push({op:OP.ATR,val:+b.getFieldValue("VEL")}); break;
    case "f_izq":      insts.push({op:OP.IZQ,val:+b.getFieldValue("VEL")}); break;
    case "f_der":      insts.push({op:OP.DER,val:+b.getFieldValue("VEL")}); break;
    case "f_stop":     insts.push({op:OP.STOP,val:0}); break;
    case "f_freno":    insts.push({op:OP.FRENO,val:0}); break;
    case "f_esperar":  insts.push({op:OP.ESP,val:+b.getFieldValue("MS")}); break;
    case "f_led_on":   insts.push({op:OP.LED_ON,val:0}); break;
        case "f_adc":      { insts.push({op:OP.ADC_READ,val:+b.getFieldValue("GPIO")||0}); break; }
    case "f_din":      { insts.push({op:OP.ADC_READ,val:+b.getFieldValue("GPIO")||0}); break; }
    case "f_led_off":  insts.push({op:OP.LED_OFF,val:0}); break;
    case "f_dout":     insts.push({op:OP.DOUT,val:+b.getFieldValue("GPIO")*10+(b.getFieldValue("VAL")==="HIGH"?1:0)}); break;
    case "f_servo":    insts.push({op:OP.SERVO,val:(+b.getFieldValue("GPIO"))*1000+(+b.getFieldValue("ANG"))}); break;
    case "f_var_set":  insts.push({op:OP.VAR_SET,val:+b.getFieldValue("VAL")}); break;
    case "f_var_add":  insts.push({op:OP.VAR_ADD,val:+b.getFieldValue("VAL")}); break;
    case "f_if_gt":    { var _ci=insts.length; insts.push({op:OP.IF_GT,val:+b.getFieldValue("UMBRAL"),skip:1}); var _pre=insts.length; var db=b.getInputTargetBlock("DO"); if(db)parseBlock(db,insts); insts[_ci].skip=Math.max(1,insts.length-_pre)+1; break; }
    case "f_if_lt":    { var _ci=insts.length; insts.push({op:OP.IF_LT,val:+b.getFieldValue("UMBRAL"),skip:1}); var _pre=insts.length; var db=b.getInputTargetBlock("DO"); if(db)parseBlock(db,insts); insts[_ci].skip=Math.max(1,insts.length-_pre)+1; break; }
    case "f_repeat":   { var n=Math.min(+b.getFieldValue("N"),50); var db=b.getInputTargetBlock("DO"); for(var i=0;i<n;i++) if(db)parseBlock(db,insts); break; }
    case "controls_repeat_ext": { var tv=b.getInputTargetBlock("TIMES"); var n=tv&&tv.type==="math_number"?Math.min(+tv.getFieldValue("NUM"),8):3; var db=b.getInputTargetBlock("DO"); for(var i=0;i<n;i++) if(db)parseBlock(db,insts); break; }
    case "f_while_gt":  { var _n=32; var db=b.getInputTargetBlock("DO"); for(var _wi=0;_wi<_n;_wi++){insts.push({op:OP.ADC_READ,val:0});insts.push({op:OP.IF_GT,val:+b.getFieldValue("UMBRAL"),skip:2});if(db){var _pre=insts.length;parseBlock(db,insts);}insts.push({op:OP.ESP,val:30});}break; }
    case "f_serial_print": { /* Serial.print — no VM equivalent, skip */ break; }
    case "f_pwm_motor": {
      // val = canal * 1000 + duty  (canal: 0=A, 1=B, 2=AB)
      var _ch   = b.getFieldValue("CH");  // "A", "B", "AB"
      var _duty = +b.getFieldValue("DUTY");
      var _chCode = _ch === "A" ? 0 : _ch === "B" ? 1 : 2;
      insts.push({op:OP.PWM_MOTOR_CH, val: _chCode * 1000 + _duty});
      break;
    }
    case "f_pwm_out":    {
      // f_pwm_out: GPIO dropdown (e.g. 'GPIO8'), FREQ (ignored in sim), DUTY (0-255)
      var _gpioKey = b.getFieldValue("GPIO") || 'GPIO8'; // e.g. 'GPIO8'
      var _gpioNum = parseInt(_gpioKey.replace('GPIO',''), 10) || 8;
      var _duty = Math.min(255, Math.max(0, +b.getFieldValue("DUTY") || 0));
      insts.push({op:OP.PWM_OUT, val: _gpioNum * 256 + _duty});
      break;
    }
    default: break;
  }
  var next=b.getNextBlock(); if(next)parseBlock(next,insts);
}

function wsToInstructions() {
  var insts=[];
  if (!_workspace) return insts;
  _workspace.getTopBlocks(true).forEach(b=>parseBlock(b,insts));
  if(insts.length>0) insts.push({op:OP.FIN,val:0});
  return insts;
}

var _workspace = null;
var _onProgramChange = null;  // callback(instructions[])


// V1 TOOLBOX — minimal pedagogic set for E1-E4 (E5+ unlocks full toolbox)
var V1_TOOLBOX = `<xml>
  <category name="Motores" colour="#e53935">
    <block type="f_adelante"><field name="VEL">200</field></block>
    <block type="f_atras"><field name="VEL">200</field></block>
    <block type="f_izq"><field name="VEL">200</field></block>
    <block type="f_der"><field name="VEL">200</field></block>
    <block type="f_stop"></block>
    <block type="f_esperar"><field name="MS">500</field></block>
  </category>
  <category name="Sensores" colour="#00897b">
    <block type="f_if_gt"><field name="UMBRAL">2000</field></block>
    <block type="f_if_lt"><field name="UMBRAL">2000</field></block>
    <block type="f_adc"></block>
  </category>
  <category name="LED" colour="#f57f17">
    <block type="f_led_on"></block>
    <block type="f_led_off"></block>
  </category>
  <category name="Control" colour="#7b1fa2">
    <block type="f_repeat"><field name="N">4</field></block>
  </category>
</xml>`;

// E0 Extendida toolbox — E0.7 to E0.16
// Adds PWM, GPIO/Salidas, Variables, while_gt to V1 baseline
var E0_EXT_TOOLBOX = `<xml>
  <category name="Motores" colour="#e53935">
    <block type="f_adelante"><field name="VEL">200</field></block>
    <block type="f_atras"><field name="VEL">200</field></block>
    <block type="f_izq"><field name="VEL">200</field></block>
    <block type="f_der"><field name="VEL">200</field></block>
    <block type="f_stop"></block>
    <block type="f_freno"></block>
    <block type="f_pwm_motor"><field name="CH">A</field><field name="DUTY">200</field></block>
  </category>
  <category name="Tiempo" colour="#e53935">
    <block type="f_esperar"><field name="MS">500</field></block>
  </category>
  <category name="LED / GPIO" colour="#f57f17">
    <block type="f_led_on"></block>
    <block type="f_led_off"></block>
    <block type="f_dout"><field name="GPIO">GPIO8</field><field name="VAL">HIGH</field></block>
    <block type="f_pwm_out"><field name="GPIO">GPIO8</field><field name="FREQ">1000</field><field name="DUTY">200</field></block>
  </category>
  <category name="Sensores" colour="#00897b">
    <block type="f_adc"><field name="GPIO">GPIO0</field></block>
    <block type="f_if_gt"><field name="UMBRAL">1400</field></block>
    <block type="f_if_lt"><field name="UMBRAL">1400</field></block>
    <block type="f_while_gt"><field name="UMBRAL">1400</field></block>
  </category>
  <category name="Variables" colour="#ab47bc">
    <block type="f_var_set"><field name="VAL">0</field></block>
    <block type="f_var_add"><field name="VAL">1</field></block>
  </category>
  <category name="Control" colour="#7b1fa2">
    <block type="f_repeat"><field name="N">4</field></block>
    <block type="controls_repeat_ext">
      <value name="TIMES"><block type="math_number"><field name="NUM">4</field></block></value>
    </block>
  </category>
</xml>`;


function initBlocklyWorkspace(containerId, onChangeCallback, opts) {
  if (!window.Blockly) {
    console.error('Blockly not loaded');
    return false;
  }
  if (_workspace) {
    _workspace.dispose();
    _workspace = null;
  }
  try {
    defBlocks();
    defGenerators();
    var frankyTheme = Blockly.Theme.defineTheme('franky', {
      'base': Blockly.Themes.Classic,
      'componentStyles': {
        'workspaceBackgroundColour': '#0d1220',
        'toolboxBackgroundColour': '#090d16',
        'toolboxForegroundColour': '#bdd4e8',
        'flyoutBackgroundColour': '#07090f',
        'flyoutForegroundColour': '#bdd4e8',
        'flyoutOpacity': 0.97,
        'scrollbarColour': '#2e424f',
        'insertionMarkerColour': '#00cdb3',
        'cursorColour': '#00cdb3',
        'scrollbarOpacity': 0.5,
      }
    });
    var activeToolbox = (opts && opts.v1) ? V1_TOOLBOX : (opts && opts.e0ext) ? E0_EXT_TOOLBOX : TOOLBOX;
    _workspace = Blockly.inject(containerId, {
      toolbox: activeToolbox,
      scrollbars: true,
      trashcan: true,
      zoom: {controls:true, wheel:true, startScale:0.85, maxScale:2.5, minScale:0.3},
      grid: {spacing:20, length:3, colour:'#1a2030', snap:true},
      theme: frankyTheme,
      renderer: 'geras',
    });
    _onProgramChange = onChangeCallback;
    _workspace.addChangeListener(function(e) {
      var ignore = [
        Blockly.Events.VIEWPORT_CHANGE, Blockly.Events.THEME_CHANGE,
        Blockly.Events.CLICK, Blockly.Events.SELECTED,
        Blockly.Events.TOOLBOX_ITEM_SELECT
      ];
      if (ignore.indexOf(e.type) !== -1) return;
      var insts = wsToInstructions();
      if (_onProgramChange) _onProgramChange(insts);
    });
    return true;
  } catch(e) {
    console.error('initBlocklyWorkspace error:', e.message);
    return false;
  }
}

function getWorkspace() { return _workspace; }

function getInstructions() { return _workspace ? wsToInstructions() : []; }

function clearWorkspace() {
  if (_workspace) _workspace.clear();
}

function resizeWorkspace() {
  if (_workspace) Blockly.svgResize(_workspace);
}

// Expose to window
window.FrankyBlockly = {
  initV1: function(containerId, onChangeCallback) {
    return initBlocklyWorkspace(containerId, onChangeCallback, {v1: true});
  },
  initE0ext: function(containerId, onChangeCallback) {
    return initBlocklyWorkspace(containerId, onChangeCallback, {e0ext: true});
  },
  init: initBlocklyWorkspace,
  getWorkspace: getWorkspace,
  getInstructions: getInstructions,
  clear: clearWorkspace,
  resize: resizeWorkspace,
};

})(window);
