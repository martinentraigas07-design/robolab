"use strict";(()=>{var m=(o,e)=>()=>(e||o((e={exports:{}}).exports,e),e.exports);var Ze=m((qo,Qe)=>{"use strict";var re=class{constructor(e={}){this._handlers={},this._wildcards=[],this._middleware=[],this._history=[],this._histLimit=e.historyLimit||2e3,this._debug=e.debug||!1,this._name=e.name||"bus",this._paused=!1,this._pendingPause=[]}on(e,t){if(e==="*"){let r={fn:t,once:!1};return this._wildcards.push(r),()=>{this._wildcards=this._wildcards.filter(a=>a!==r)}}this._handlers[e]||(this._handlers[e]=new Set);let i={fn:t,once:!1};return this._handlers[e].add(i),()=>this._handlers[e]&&this._handlers[e].delete(i)}once(e,t){this._handlers[e]||(this._handlers[e]=new Set);let i={fn:t,once:!0};return this._handlers[e].add(i),()=>this._handlers[e]&&this._handlers[e].delete(i)}off(e,t){if(e==="*"){this._wildcards=this._wildcards.filter(r=>r.fn!==t);return}let i=this._handlers[e];if(i){for(let r of i)if(r.fn===t){i.delete(r);break}}}emit(e){if(e.ts||(e.ts=Date.now()),e.source||(e.source="unknown"),this._paused){this._pendingPause.push(e);return}this._middleware.length>0?this._runMiddleware(e,0,()=>this._dispatch(e)):this._dispatch(e)}use(e){return this._middleware.push(e),()=>{this._middleware=this._middleware.filter(t=>t!==e)}}_runMiddleware(e,t,i){if(t>=this._middleware.length){i();return}this._middleware[t](e,()=>this._runMiddleware(e,t+1,i))}namespace(e){return new U(this,e)}getHistory(e={}){let t=[...this._history];return e.type&&(t=t.filter(i=>i.type===e.type)),e.source&&(t=t.filter(i=>i.source===e.source)),e.since&&(t=t.filter(i=>i.ts>=e.since)),e.until&&(t=t.filter(i=>i.ts<=e.until)),e.limit&&(t=t.slice(-e.limit)),t}clearHistory(){this._history=[]}replay(e,t,i){let r=i||this,a=this.getHistory({since:e,until:t});for(let n of a)r.emit({...n,replayed:!0,originalTs:n.ts,ts:Date.now()});return a.length}pause(){this._paused=!0,this._pendingPause=[]}resume(){this._paused=!1;let e=[...this._pendingPause];this._pendingPause=[];for(let t of e)this.emit(t)}_dispatch(e){this._history.push(e),this._history.length>this._histLimit&&this._history.shift(),this._debug&&console.log(`[${this._name}] ${e.type}`,e.payload);let t=this._handlers[e.type];if(t&&t.size>0){let r=[];for(let a of t){try{a.fn(e)}catch{}a.once&&r.push(a)}for(let a of r)t.delete(a)}for(let r of[...this._wildcards]){try{r.fn(e)}catch{}r.once&&(this._wildcards=this._wildcards.filter(a=>a!==r))}let i=e.type.indexOf(":");if(i>0){let r=e.type.slice(0,i+1)+"*",a=this._handlers[r];if(a&&a.size>0)for(let n of[...a]){try{n.fn(e)}catch{}n.once&&a.delete(n)}}}stats(){let e=Object.keys(this._handlers).length,t=Object.values(this._handlers).reduce((i,r)=>i+r.size,0);return{name:this._name,subscriptions:t+this._wildcards.length,eventTypes:e,historySize:this._history.length,middlewareCount:this._middleware.length}}},U=class{constructor(e,t){this._parent=e,this._prefix=t+":"}emit(e){this._parent.emit({...e,type:this._prefix+e.type})}on(e,t){let i=e==="*"?this._prefix+"*":this._prefix+e;return this._parent.on(i,t)}once(e,t){let i=this._prefix+e;return this._parent.once(i,t)}off(e,t){this._parent.off(this._prefix+e,t)}getHistory(e={}){let t={...e,type:e.type?this._prefix+e.type:void 0};return this._parent.getHistory(t).map(i=>({...i,type:i.type.replace(this._prefix,"")}))}};function Pi(o){return(e,t)=>{(!o||o(e))&&console.log(`[EVENT] ${e.type}`,JSON.stringify(e.payload).slice(0,100)),t()}}function Ci(o){return(e,t)=>{t();try{o(e)}catch{}}}function Ni(o){let e={};return(t,i)=>{let r=o[t.type];if(r){let a=Date.now(),n=e[t.type]||0;if(a-n<r)return;e[t.type]=a}i()}}Qe.exports={EventBus:re,ScopedBus:U,loggingMiddleware:Pi,analyticsMiddleware:Ci,rateLimiterMiddleware:Ni}});var H=m((Bo,Xe)=>{"use strict";var ae=class{constructor(e,t){if(typeof e=="string")throw new Error("Pass platform object, not id string. Use getPlatform(id) first.");this._platform=e,this._bus=t,this._gpio={},this._ledc={},this._buses=new Set,this._init()}_init(){for(let[e,t]of Object.entries(this._platform.pins))this._gpio[e]={mode:null,value:0,pwmDuty:0,isPWM:!1,def:t,busReserved:null,analogImplicit:!1}}_pd(e){if(typeof e=="string"&&/^[A-Za-z]/.test(e))return e;let t=Number(e);return isNaN(t)?String(e):"D"+t}_pa(e){if(typeof e=="string"&&/^A[0-7]$/.test(e))return e;let t=Number(e);return!isNaN(t)&&t>=0&&t<=7?"A"+t:this._pd(e)}pinMode(e,t){e=this._pd(e);let i=this._gpio[e];if(!i)return this._err(e,"INVALID_PIN",`El pin '${e}' no existe en ${this._platform.name}.`);if(i.def.analogOnly&&t==="OUTPUT")return this._perr(e,"ANALOG_ONLY",`${e} es solo anal\xF3gico. No puede usarse como OUTPUT.`);let r=i.mode;return i.mode=t,(t==="INPUT"||t==="INPUT_PULLUP")&&(i.value=t==="INPUT_PULLUP"?1:0),this._emit("GPIO_MODE",{pin:e,mode:t,prev:r}),{ok:!0}}digitalWrite(e,t){e=this._pd(e);let i=this._gpio[e];if(!i)return this._err(e,"INVALID_PIN",`El pin '${e}' no existe en ${this._platform.name}.`);if(i.def.analogOnly)return this._perr(e,"ANALOG_ONLY",`${e} es solo anal\xF3gico. Us\xE1 analogRead().`);if(i.mode===null)return this._perr(e,"MODE_NOT_SET",`Usaste digitalWrite(${e}) sin pinMode(${e}, OUTPUT) antes.`);if(i.mode==="INPUT"||i.mode==="INPUT_PULLUP")return this._perr(e,"NOT_OUTPUT",`${e} est\xE1 configurado como INPUT. Cambi\xE1 a OUTPUT primero.`);if(i.busReserved)return this._perr(e,"BUS_RESERVED",`${e} est\xE1 reservado por el bus ${i.busReserved}.`);if(i.def.exclusive)return this._err(e,"PIN_EXCLUSIVE",`${e} es exclusivo para ${i.def.motor||"driver"} en ${this._platform.name}.`);let r=t===1||t===!0||t==="HIGH"?1:0,a=i.def.logicInverted?1-r:r,n=i.value;return i.value=r,i.isPWM=!1,this._emit("GPIO_WRITE",{pin:e,value:r,physical:a,prev:n}),{ok:!0}}digitalRead(e){e=this._pd(e);let t=this._gpio[e];return t?(t.mode===null&&this._emit("HAL_WARN",{pin:e,code:"MODE_NOT_SET",msg:`Le\xEDste ${e} sin pinMode().`}),t.value):0}analogRead(e){e=this._pa(e);let t=this._gpio[e];return t?(t.mode===null&&(t.def.analog||t.def.analogOnly)&&(t.mode="ANALOG_IMPLICIT",t.analogImplicit=!0,this._emit("GPIO_ANALOG_IMPLICIT",{pin:e,msg:`${e} configurado impl\xEDcitamente como entrada anal\xF3gica. analogRead() no requiere pinMode() en Arduino.`})),t.value):0}analogWrite(e,t){e=this._pd(e);let i=this._gpio[e];if(!i)return this._err(e,"INVALID_PIN",`El pin '${e}' no existe.`);if(!i.def.pwm)return this._perr(e,"NOT_PWM",`${e} no tiene PWM en ${this._platform.name}. Pines PWM: D3, D9.`);let r=Math.max(0,Math.min(255,Math.floor(t))),a=i.pwmDuty;return i.value=r,i.pwmDuty=r,i.isPWM=!0,this._emit("GPIO_PWM",{pin:e,duty:r,prev:a}),{ok:!0}}ledcSetup(e,t,i){return this._ledc[e]={freq:t,res:i,max:(1<<i)-1,pin:null,duty:0},this._emit("LEDC_SETUP",{ch:e,freq:t,res:i}),{ok:!0}}ledcAttachPin(e,t){e=this._pd(e);let i=this._gpio[e];if(i)return this._ledc[t]&&(this._ledc[t].pin=e),i.isPWM=!0,this._emit("LEDC_ATTACH",{pin:e,ch:t}),{ok:!0}}ledcWrite(e,t){let i=this._ledc[e];if(!i)return this._perr("LEDC","CH_NOT_CONFIGURED",`Canal LEDC ${e} no configurado. Llam\xE1 ledcSetup primero.`);let r=Math.max(0,Math.min(i.max,Math.floor(t)));if(i.duty=r,i.pin){let a=this._gpio[i.pin];if(a){let n=a.def&&a.def.logicInverted?i.max-r:r;a.value=n,a.pwmDuty=n,a.isPWM=!0}}return this._emit("LEDC_WRITE",{ch:e,duty:r}),{ok:!0}}setSensorValue(e,t){e=this._pa(e);let i=this._gpio[e];i&&(i.def.analog||i.def.analogOnly||i.def.industrial==="ANALOG")&&(i.mode===null&&(i.mode="ANALOG_IMPLICIT",i.analogImplicit=!0),i.value=Math.max(0,Math.min(this._platform.mcu.adcMax||1023,Math.floor(t))))}getMotorPinValues(){let e=this._platform.driver;if(!e||!e.pins)return{};let t={};for(let[i,r]of Object.entries(e.pins))t[i]=this._gpio[r]?.value??0;return t}getAllPins(){return this._gpio}getPin(e){return this._gpio[this._pd(e)]||this._gpio[this._pa(e)]||null}getConflicts(){return[]}reset(){for(let e of Object.values(this._gpio))e.mode=null,e.value=0,e.pwmDuty=0,e.isPWM=!1,e.busReserved=null,e.analogImplicit=!1;this._ledc={},this._buses.clear(),this._emit("HAL_RESET",{platform:this._platform.id})}wireBegin(){this._buses.add("I2C");let e=Object.entries(this._platform.pins).find(([,i])=>i.i2c==="SDA")?.[0],t=Object.entries(this._platform.pins).find(([,i])=>i.i2c==="SCL")?.[0];e&&this._gpio[e]&&(this._gpio[e].busReserved="I2C"),t&&this._gpio[t]&&(this._gpio[t].busReserved="I2C"),this._emit("BUS_ACTIVATED",{bus:"I2C",pins:[e,t]})}setPulseInValue(e,t){e=this._pd(e);let i=this._gpio[e];i&&(i.pulseInValue=Math.max(0,Math.floor(t||0)))}_emit(e,t){this._bus&&this._bus.emit({type:e,payload:t,source:"HAL"})}_err(e,t,i){let r={ok:!1,code:t,pin:e,msg:i};return this._emit("HAL_ERROR",r),r}_perr(e,t,i){let r={ok:!1,code:t,pin:e,msg:i,pedagogical:!0};return this._emit("HAL_PERR",r),r}},q=class{evaluate(e){return e.STBY?{motorA:{direction:this._dir(e.AIN1,e.AIN2),pwm:e.PWMA},motorB:{direction:this._dir(e.BIN1,e.BIN2),pwm:e.PWMB}}:{motorA:{direction:"DISABLED",pwm:0},motorB:{direction:"DISABLED",pwm:0}}}_dir(e,t){return e&&!t?"FORWARD":!e&&t?"REVERSE":e&&t?"BRAKE":"COAST"}},B=class{evaluate(e){return{motorA:this._ch(e.A_IN1,e.A_IN2),motorB:this._ch(e.B_IN1,e.B_IN2)}}_ch(e,t){return e>0&&t===0?{direction:"FORWARD",pwm:e}:e===0&&t>0?{direction:"REVERSE",pwm:t}:e>0&&t>0?{direction:"BRAKE",pwm:0}:{direction:"COAST",pwm:0}}};function Li(o){let e=o.driver;return e?e.id==="TB6612FNG"?new q:e.id==="RZ7899"?new B:null:null}var oe=class{constructor(){this._h={},this._log=[]}emit(e){this._log.push(e),this._log.length>2e3&&this._log.shift();for(let t of this._h[e.type]||[])try{t(e)}catch{}for(let t of this._h["*"]||[])try{t(e)}catch{}}on(e,t){return(this._h[e]||(this._h[e]=[])).push(t),()=>this.off(e,t)}off(e,t){this._h[e]&&(this._h[e]=this._h[e].filter(i=>i!==t))}getLog(){return[...this._log]}clearLog(){this._log=[]}};Xe.exports={VirtualHAL:ae,TB6612FNG:q,RZ7899:B,createDriver:Li,EventBus:oe}});var W=m((Ho,it)=>{"use strict";var Je={id:"ROBOARD",name:"ROBOARD",family:"Arduino",mcu:{chip:"ATmega328P",mhz:16,logic:5,adcBits:10,adcMax:1023},pwmStrategy:"analogWrite",pins:{D0:{pwm:!1,uart:!0,label:"RX/HC-05"},D1:{pwm:!1,uart:!0,label:"TX/HC-05"},D2:{pwm:!1,label:"DIP2/INT0"},D3:{pwm:!0,motor:"A_PWM",label:"PWMA"},D4:{pwm:!1,motor:"A_IN2",label:"AIN2"},D5:{pwm:!1,motor:"A_IN1",label:"AIN1"},D6:{pwm:!1,motor:"STBY",label:"STBY"},D7:{pwm:!1,motor:"B_IN1",label:"BIN1"},D8:{pwm:!1,motor:"B_IN2",label:"BIN2"},D9:{pwm:!0,motor:"B_PWM",label:"PWMB"},D10:{pwm:!1,label:"LED"},D11:{pwm:!1,label:"DIP1"},D12:{pwm:!1,label:"Pulsador"},D13:{pwm:!1,label:"DIP3"},A0:{analog:!0,label:"Sensor/Servo"},A1:{analog:!0,label:"Sensor/Servo"},A2:{analog:!0,label:"Sensor/Servo"},A3:{analog:!0,label:"Sensor/Servo"},A4:{analog:!0,i2c:"SDA",label:"SDA"},A5:{analog:!0,i2c:"SCL",label:"SCL"},A6:{analog:!0,analogOnly:!0,label:"Anal.Only"},A7:{analog:!0,analogOnly:!0,label:"Anal.Only"}},driver:{id:"TB6612FNG",pins:{PWMA:"D3",AIN1:"D5",AIN2:"D4",STBY:"D6",PWMB:"D9",BIN1:"D7",BIN2:"D8"},truth:{"0,0":"COAST","1,0":"FORWARD","0,1":"REVERSE","1,1":"BRAKE"},stbyActiveHigh:!0},pedagogicPins:["D3","D4","D5","D6","D7","D8","D9","D10","D12","A0","A1"]},et={id:"FRANKY",name:"FRANKY 4.0",family:"ESP32",mcu:{chip:"ESP32-C3",mhz:160,logic:3.3,adcBits:12,adcMax:4095},pwmStrategy:"LEDC",pins:{GPIO0:{analog:!0,label:"ADC0"},GPIO1:{analog:!0,sharedWith:"SPI_MISO",label:"ADC1/MISO"},GPIO2:{pwm:!0,motor:"B_IN2",exclusive:!0,ledcCh:3,label:"MB_IN2"},GPIO3:{pwm:!0,motor:"B_IN1",exclusive:!0,ledcCh:2,label:"MB_IN1"},GPIO4:{pwm:!0,motor:"A_IN2",exclusive:!0,ledcCh:1,label:"MA_IN2"},GPIO5:{pwm:!0,motor:"A_IN1",exclusive:!0,ledcCh:0,label:"MA_IN1"},GPIO6:{i2c:"SDA",label:"SDA"},GPIO7:{i2c:"SCL",label:"SCL"},GPIO8:{logicInverted:!0,ledcCh:4,label:"LED (inv)"},GPIO9:{strappingPin:!0,label:"BTN/Boot"}},driver:{id:"RZ7899",pins:{A_IN1:"GPIO5",A_IN2:"GPIO4",B_IN1:"GPIO3",B_IN2:"GPIO2"},ledcChs:{A_IN1:0,A_IN2:1,B_IN1:2,B_IN2:3}},pedagogicPins:["GPIO5","GPIO4","GPIO3","GPIO2","GPIO8","GPIO9","GPIO0"]},tt={id:"PLC_CORE_MDE",name:"PLC-CORE-MDE",family:"ESP32-Industrial",mcu:{chip:"ESP32",mhz:240,logic:3.3,adcBits:12,adcMax:4095,cores:2},pwmStrategy:"LEDC",pins:{GPIO21:{industrial:"IN",label:"IN1 (5-24V)"},GPIO19:{industrial:"IN",label:"IN2 (5-24V)"},GPIO14:{industrial:"OUT",label:"OUT1 10A"},GPIO27:{industrial:"OUT",label:"OUT2 10A"},GPIO26:{industrial:"OUT",label:"OUT3 10A"},GPIO25:{industrial:"OUT",label:"OUT4 10A"},GPIO36:{industrial:"ANALOG",label:"AI1 0-10V"},GPIO4:{rs485:!0,label:"RS-485"}},driver:null,pedagogicPins:["GPIO21","GPIO19","GPIO14","GPIO27","GPIO26","GPIO25","GPIO36"]},ne={ROBOARD:Je,FRANKY:et,PLC_CORE_MDE:tt};function wi(o){return ne[o]||null}function Ui(){return Object.values(ne).map(o=>({id:o.id,name:o.name,family:o.family}))}it.exports={ROBOARD:Je,FRANKY:et,PLC_CORE:tt,PLATFORMS:ne,getPlatform:wi,listPlatforms:Ui}});var z=m((Wo,le)=>{"use strict";function rt(o){let e={};o=o.replace(/\/\*[\s\S]*?\*\//g,""),o=o.replace(/#define\s+(\w+)\s+([^\r\n]+)/g,(t,i,r)=>(r=r.replace(/\/\/.*$/,"").trim(),e[i]=r.trim(),"")),o=o.replace(/\/\/[^\r\n]*/g,"");for(let t=0;t<3;t++)for(let[i,r]of Object.entries(e)){let a=new RegExp(`\\b${i}\\b`,"g");o=o.replace(a,r);for(let n of Object.keys(e))e[n]=e[n].replace(a,r)}return{code:o,defines:e}}var d={KW:"KW",IDENT:"IDENT",NUM:"NUM",STR:"STR",OP:"OP",PUNCT:"PUNCT",EOF:"EOF"},qi=new Set(["void","int","bool","float","long","char","byte","return","if","else","while","for","do","break","continue","true","false","HIGH","LOW","INPUT","OUTPUT","INPUT_PULLUP","A0","A1","A2","A3","A4","A5","A6","A7","static","unsigned","const","LEDC_TIMER_8_BIT","LEDC_TIMER_10_BIT","LEDC_TIMER_12_BIT"]);function at(o){let e=[],t=0,i=o.length;for(;t<i;){if(/\s/.test(o[t])){t++;continue}if(o[t]==='"'){let n="";for(t++;t<i&&o[t]!=='"';)o[t]==="\\"?(n+=o[t]+o[t+1],t+=2):n+=o[t++];t++,e.push({type:d.STR,value:n});continue}if(/[0-9]/.test(o[t])||o[t]==="."&&/[0-9]/.test(o[t+1])){let n="";if(o[t]==="0"&&o[t+1]==="x")for(n="0x",t+=2;t<i&&/[0-9a-fA-F]/.test(o[t]);)n+=o[t++];else{for(;t<i&&/[0-9.]/.test(o[t]);)n+=o[t++];t<i&&/[fFuUlL]/.test(o[t])&&t++}e.push({type:d.NUM,value:n});continue}if(/[a-zA-Z_]/.test(o[t])){let n="";for(;t<i&&/[a-zA-Z0-9_]/.test(o[t]);)n+=o[t++];let s=qi.has(n)?d.KW:d.IDENT;e.push({type:s,value:n});continue}let r=o.slice(t,t+2);if(["==","!=","<=",">=","&&","||","++","--","+=","-=","*=","/=","::"].includes(r)){e.push({type:d.OP,value:r}),t+=2;continue}let a=o[t];if("=<>!+-*/%".includes(a)){e.push({type:d.OP,value:a}),t++;continue}if(";{}()[],".includes(a)){e.push({type:d.PUNCT,value:a}),t++;continue}t++}return e.push({type:d.EOF,value:""}),e}var x=class{constructor(e){this.tokens=e,this.pos=0,this.errors=[]}peek(){return this.tokens[this.pos]}next(){return this.tokens[this.pos++]}expect(e,t){let i=this.next();return(i.type!==e||t&&i.value!==t)&&this.errors.push({msg:`Se esperaba '${t||e}' pero se encontr\xF3 '${i.value}'`,token:i}),i}match(e,t){let i=this.peek();return!(i.type!==e||t!==void 0&&i.value!==t)}consume(e,t){return this.match(e,t)?(this.next(),!0):!1}isTypeName(){let e=this.peek().value;return["void","int","bool","float","long","char","byte","uint8_t","uint16_t","uint32_t"].includes(e)||e==="unsigned"||e==="static"||e==="const"}parseTypeName(){let e="";for(;this.isTypeName()&&this.peek().type!==d.EOF;)if(e+=(e?" ":"")+this.next().value,this.peek().value==="long"||this.peek().value==="int"){["long","int","char"].includes(this.peek().value)&&(e+=" "+this.next().value);break}return e}parseProgram(){let e=[];for(;!this.match(d.EOF);)try{let t=this.parseTopLevel();t&&e.push(t)}catch(t){for(this.errors.push({msg:t.message});!this.match(d.EOF)&&!this.match(d.PUNCT,"}");)this.next();this.match(d.PUNCT,"}")&&this.next()}return{type:"Program",body:e}}parseTopLevel(){if(!this.isTypeName())return this.next(),null;let e=this.parseTypeName(),t=this.expect(d.IDENT).value;return this.match(d.PUNCT,"(")?this.parseFunctionDecl(e,t):this.parseVarDecl(e,t,!0)}parseFunctionDecl(e,t){this.expect(d.PUNCT,"(");let i=[];for(;!this.match(d.PUNCT,")")&&!this.match(d.EOF);)if(this.isTypeName()){let a=this.parseTypeName(),n=this.next().value;i.push({type:a,name:n}),this.consume(d.PUNCT,",")}else this.next();this.expect(d.PUNCT,")");let r=this.parseBlock();return{type:"FunctionDecl",returnType:e,name:t,params:i,body:r}}parseBlock(){this.expect(d.PUNCT,"{");let e=[];for(;!this.match(d.PUNCT,"}")&&!this.match(d.EOF);){let t=this.parseStatement();t&&e.push(t)}return this.expect(d.PUNCT,"}"),{type:"Block",body:e}}parseStatement(){let e=this.peek();if(e.type===d.KW&&e.value==="if"){this.next(),this.expect(d.PUNCT,"(");let i=this.parseExpression();this.expect(d.PUNCT,")");let r=this.match(d.PUNCT,"{")?this.parseBlock():this.parseStatementSingle(),a=null;return this.match(d.KW,"else")&&(this.next(),a=this.match(d.PUNCT,"{")?this.parseBlock():this.match(d.KW,"if")?this.parseStatement():this.parseStatementSingle()),{type:"IfStatement",test:i,consequent:r,alternate:a}}if(e.type===d.KW&&e.value==="while"){this.next(),this.expect(d.PUNCT,"(");let i=this.parseExpression();this.expect(d.PUNCT,")");let r=this.match(d.PUNCT,"{")?this.parseBlock():this.parseStatementSingle();return{type:"WhileStatement",test:i,body:r}}if(e.type===d.KW&&e.value==="for"){this.next(),this.expect(d.PUNCT,"(");let i=null;if(this.match(d.PUNCT,";"))this.next();else if(this.isTypeName()){let s=this.parseTypeName(),l=this.next().value;i=this.parseVarDecl(s,l,!1)}else{let s=this.parseExpression();this.consume(d.PUNCT,";"),i={type:"ExprStatement",expr:s}}let r=null;this.match(d.PUNCT,";")||(r=this.parseExpression()),this.expect(d.PUNCT,";");let a=null;this.match(d.PUNCT,")")||(a=this.parseExpression()),this.expect(d.PUNCT,")");let n=this.match(d.PUNCT,"{")?this.parseBlock():this.parseStatementSingle();return{type:"ForStatement",init:i,condition:r,update:a,body:n}}if(e.type===d.KW&&e.value==="return"){this.next();let i=this.match(d.PUNCT,";")?null:this.parseExpression();return this.consume(d.PUNCT,";"),{type:"ReturnStatement",value:i}}if(e.type===d.KW&&(e.value==="break"||e.value==="continue")){let i=this.next().value;return this.consume(d.PUNCT,";"),{type:i==="break"?"BreakStatement":"ContinueStatement"}}if(this.isTypeName()){let i=this.parseTypeName();if(!this.match(d.IDENT)&&!this.match(d.KW)){let a=this.parseExpression();return this.consume(d.PUNCT,";"),{type:"ExprStatement",expr:a}}let r=this.next().value;return this.parseVarDecl(i,r,!1)}let t=this.parseExpression();return this.consume(d.PUNCT,";"),{type:"ExprStatement",expr:t}}parseStatementSingle(){return{type:"Block",body:[this.parseStatement()]}}parseVarDecl(e,t,i){let r=null;if(this.consume(d.OP,"=")&&(r=this.parseExpression()),this.match(d.PUNCT,"[")){for(;!this.match(d.PUNCT,"]")&&!this.match(d.EOF);)this.next();this.next()}return this.consume(d.PUNCT,";"),{type:"VarDecl",typeName:e,name:t,init:r,isGlobal:i}}parseExpression(){return this.parseAssignment()}parseAssignment(){let e=this.parseLogicalOr(),t=this.peek();if(t.type===d.OP&&["=","+=","-=","*=","/="].includes(t.value)){let i=this.next().value,r=this.parseAssignment();return{type:"Assignment",op:i,left:e,right:r}}return e}parseLogicalOr(){let e=this.parseLogicalAnd();for(;this.match(d.OP,"||");){this.next();let t=this.parseLogicalAnd();e={type:"BinaryOp",op:"||",left:e,right:t}}return e}parseLogicalAnd(){let e=this.parseEquality();for(;this.match(d.OP,"&&");){this.next();let t=this.parseEquality();e={type:"BinaryOp",op:"&&",left:e,right:t}}return e}parseEquality(){let e=this.parseRelational();for(;this.match(d.OP,"==")||this.match(d.OP,"!=");)e={type:"BinaryOp",op:this.next().value,left:e,right:this.parseRelational()};return e}parseRelational(){let e=this.parseAdditive();for(;["<",">","<=",">="].includes(this.peek().value);)e={type:"BinaryOp",op:this.next().value,left:e,right:this.parseAdditive()};return e}parseAdditive(){let e=this.parseMultiplicative();for(;this.match(d.OP,"+")||this.match(d.OP,"-");)e={type:"BinaryOp",op:this.next().value,left:e,right:this.parseMultiplicative()};return e}parseMultiplicative(){let e=this.parseUnary();for(;["*","/","%"].includes(this.peek().value);)e={type:"BinaryOp",op:this.next().value,left:e,right:this.parseUnary()};return e}parseUnary(){return this.match(d.OP,"!")?(this.next(),{type:"UnaryOp",op:"!",expr:this.parseUnary()}):this.match(d.OP,"-")?(this.next(),{type:"UnaryOp",op:"-",expr:this.parseUnary()}):this.parsePostfix()}parsePostfix(){let e=this.parsePrimary();return this.match(d.OP,"++")||this.match(d.OP,"--")?{type:"PostfixOp",op:this.next().value,expr:e}:e}parsePrimary(){let e=this.peek();if(e.type===d.NUM)return this.next(),{type:"Literal",value:parseFloat(e.value),raw:e.value};if(e.type===d.STR)return this.next(),{type:"StringLiteral",value:e.value};if(e.type===d.KW){if(e.value==="true")return this.next(),{type:"Literal",value:1};if(e.value==="false")return this.next(),{type:"Literal",value:0};if(e.value==="HIGH")return this.next(),{type:"Literal",value:1};if(e.value==="LOW")return this.next(),{type:"Literal",value:0};if(e.value==="INPUT")return this.next(),{type:"Literal",value:"INPUT"};if(e.value==="OUTPUT")return this.next(),{type:"Literal",value:"OUTPUT"};if(e.value==="INPUT_PULLUP")return this.next(),{type:"Literal",value:"INPUT_PULLUP"};if(/^A[0-7]$/.test(e.value))return this.next(),{type:"Identifier",name:e.value}}if(e.type===d.PUNCT&&e.value==="("){this.next();let t=this.parseExpression();return this.expect(d.PUNCT,")"),t}if(e.type===d.IDENT||e.type===d.KW){let t=this.next().value;if(this.match(d.OP,"++")||this.match(d.OP,"--"))return{type:"PostfixOp",op:this.next().value,expr:{type:"Identifier",name:t}};if(t==="Serial"&&this.match(d.PUNCT,".")){this.next();let i=this.next().value;this.expect(d.PUNCT,"(");let r=this.parseArgList();return this.expect(d.PUNCT,")"),{type:"SerialCall",method:i,args:r}}if(this.match(d.PUNCT,"(")){this.next();let i=this.parseArgList();return this.expect(d.PUNCT,")"),{type:"CallExpression",callee:t,args:i}}return{type:"Identifier",name:t}}return this.next(),{type:"Literal",value:0}}parseArgList(){let e=[];for(;!this.match(d.PUNCT,")")&&!this.match(d.EOF);)e.push(this.parseExpression()),this.consume(d.PUNCT,",");return e}},se=class{constructor(e,t){this._hal=e,this._bus=t,this._globals={},this._functions={},this._firmwareTime=0,this._instructionCount=0,this._MAX_INSTRUCTIONS=2e5,this._currentLine=0,this._running=!1,this._serialBuffer=[]}get _api(){let e=this._hal,t=this,i=a=>{if(a==null)return String(a);if(typeof a=="string"&&/^[A-Za-z]/.test(a))return a;let n=Number(a);return isNaN(n)?String(a):"D"+n},r=a=>{if(typeof a=="string"&&/^A[0-7]$/.test(a))return a;if(typeof a=="string"&&/^[0-7]$/.test(a))return"A"+a;let n=Number(a);return!isNaN(n)&&n>=0&&n<=7?"A"+n:i(a)};return{pinMode:(a,n)=>e.pinMode(i(a),String(n))?.ok,digitalWrite:(a,n)=>e.digitalWrite(i(a),n)?.ok,digitalRead:a=>e.digitalRead(i(a)),analogRead:a=>e.analogRead(r(a)),analogWrite:(a,n)=>e.analogWrite(i(a),n)?.ok,ledcSetup:(a,n,s)=>e.ledcSetup(a,n,s)?.ok,ledcAttachPin:(a,n)=>e.ledcAttachPin(String(a),n)?.ok,ledcWrite:(a,n)=>e.ledcWrite(a,n)?.ok,delay:a=>({__delay:!0,ms:Math.max(0,Number(a))}),delayMicroseconds:a=>({__delay:!0,ms:Number(a)/1e3}),millis:()=>Math.floor(t._firmwareTime),micros:()=>Math.floor(t._firmwareTime*1e3),constrain:(a,n,s)=>Math.max(n,Math.min(s,a)),map:(a,n,s,l,u)=>l+(a-n)*(u-l)/(s-n),abs:a=>Math.abs(a),min:(a,n)=>Math.min(a,n),max:(a,n)=>Math.max(a,n),sqrt:a=>Math.sqrt(a),pow:(a,n)=>Math.pow(a,n),random:(a,n)=>Math.floor(n!==void 0?Math.random()*(n-a)+a:Math.random()*a),pulseIn:(a,n,s)=>{let l=String(a);return e.getPin(l)?.pulseInValue??0},Serial:{begin:a=>{t._emit("SERIAL_BEGIN",{baud:a})},print:a=>{t._serialPrint(String(a),!1)},println:a=>{t._serialPrint(String(a===void 0?"":a),!0)},available:()=>t._serialBuffer.length,read:()=>t._serialBuffer.shift()??-1},Wire:{begin:(a,n)=>e.wireBegin(String(a),String(n)),beginTransmission:a=>{},write:a=>{},endTransmission:()=>0,requestFrom:(a,n)=>0,read:()=>0,available:()=>0}}}_serialPrint(e,t){let i=t?e+`
`:e;this._emit("SERIAL_OUTPUT",{message:i,newline:t})}_emit(e,t){this._bus&&this._bus.emit({type:e,payload:t,source:"VM",ts:Date.now()})}_evalExpr(e,t){if(!e)return 0;switch(e.type){case"Literal":return e.value;case"StringLiteral":return e.value;case"Identifier":{let i=e.name;return t&&i in t?t[i]:i in this._globals?this._globals[i]:/^A[0-7]$/.test(i)||/^D\d+$/.test(i)?i:0}case"UnaryOp":{let i=this._evalExpr(e.expr,t);return e.op==="!"?i?0:1:e.op==="-"?-i:i}case"BinaryOp":{let i=this._evalExpr(e.left,t);if(e.op==="&&"&&!i)return 0;if(e.op==="||"&&i)return 1;let r=this._evalExpr(e.right,t);switch(e.op){case"+":return i+r;case"-":return i-r;case"*":return i*r;case"/":return r!==0?i/r:0;case"%":return r!==0?i%r:0;case"==":return i==r?1:0;case"!=":return i!=r?1:0;case"<":return i<r?1:0;case">":return i>r?1:0;case"<=":return i<=r?1:0;case">=":return i>=r?1:0;case"&&":return i&&r?1:0;case"||":return i||r?1:0}return 0}case"Assignment":{let i=this._evalExpr(e.right,t),r=e.left.name,a=t&&r in t?t[r]:this._globals[r]??0,n;switch(e.op){case"=":n=i;break;case"+=":n=a+i;break;case"-=":n=a-i;break;case"*=":n=a*i;break;case"/=":n=i!==0?a/i:0;break;default:n=i}return t&&r in t?t[r]=n:this._globals[r]=n,n}case"PostfixOp":{let i=e.expr.name,r=t&&i in t?t[i]:this._globals[i]??0,a=e.op==="++"?r+1:r-1;return t&&i in t?t[i]=a:this._globals[i]=a,r}case"CallExpression":return this._callFunction(e,t);case"SerialCall":return this._callSerial(e,t)}return 0}_callSerial(e,t){let i=e.args.map(a=>this._evalExpr(a,t)),r=this._api;switch(e.method){case"begin":r.Serial.begin(i[0]);break;case"print":r.Serial.print(i[0]);break;case"println":r.Serial.println(i[0]);break;case"available":return r.Serial.available();case"read":return r.Serial.read()}return 0}_callFunction(e,t){let i=e.callee,r=e.args.map(s=>this._evalExpr(s,t)),a=this._api;if(i in a){let s=a[i];if(typeof s=="function")return s(...r)}let n=this._functions[i];return n?this._executeFunction(n,r):0}*_executeNode(e,t){if(this._instructionCount++,this._instructionCount>this._MAX_INSTRUCTIONS)throw new G("INFINITE_LOOP","El programa ejecut\xF3 demasiadas instrucciones sin delay(). \xBFHay un while() sin condici\xF3n de salida? Agreg\xE1 delay(50) para que el sistema funcione correctamente.");if(this._instructionCount%500===0&&(yield{kind:"YIELD_CPU"}),!!e)switch(e.type){case"Block":for(let i of e.body){let r=yield*this._executeNode(i,t);if(r&&r.__return||r&&r.__break)return r}break;case"VarDecl":{let i=e.init?this._evalExpr(e.init,t):0;e.isGlobal?this._globals[e.name]=i:t&&(t[e.name]=i);break}case"ExprStatement":{let i=this._evalExpr(e.expr,t);if(i&&i.__delay){let r=this._firmwareTime+i.ms;for(;this._firmwareTime<r;)yield{kind:"DELAY",remainingMs:r-this._firmwareTime}}break}case"IfStatement":{let i=this._evalExpr(e.test,t);if(this._emit("EXECUTION_DECISION",{cond:!!i}),i){let r=yield*this._executeNode(e.consequent,t);if(r?.__return||r?.__break)return r}else if(e.alternate){let r=yield*this._executeNode(e.alternate,t);if(r?.__return||r?.__break)return r}break}case"WhileStatement":{let i=0;for(;this._evalExpr(e.test,t);){let r=yield*this._executeNode(e.body,t);if(r?.__return)return r;if(r?.__break)break;i++,i%10===0&&(yield{kind:"YIELD_CPU"})}break}case"ForStatement":{let i={...t};e.init&&(yield*this._executeNode(e.init,i));let r=0;for(;!e.condition||this._evalExpr(e.condition,i);){let a=yield*this._executeNode(e.body,i);if(a?.__return)return a;if(a?.__break)break;e.update&&this._evalExpr(e.update,i),r++,r%10===0&&(yield{kind:"YIELD_CPU"})}break}case"ReturnStatement":return{__return:!0,value:e.value?this._evalExpr(e.value,t):void 0};case"BreakStatement":return{__break:!0};case"FunctionDecl":break}}_executeFunction(e,t){let i={};e.params.forEach((s,l)=>{i[s.name]=t[l]??0});let r=this._executeNode(e.body,i),a,n;do n=r.next();while(!n.done);return n.value?.__return?n.value.value:0}compile(e){let{code:t}=rt(e),i=at(t),r=new x(i),a=r.parseProgram(),n=[...r.errors],s=a.body.filter(l=>l.type==="FunctionDecl").map(l=>l.name);return s.includes("setup")||n.push({msg:"Falta void setup(). Todo sketch Arduino necesita setup() y loop()."}),s.includes("loop")||n.push({msg:"Falta void loop(). El bucle principal loop() ejecuta continuamente."}),{ok:n.length===0,errors:n,ast:a}}load(e){let t=this.compile(e);if(!t.ok)return t;this._functions={};for(let i of t.ast.body)i.type==="FunctionDecl"&&(this._functions[i.name]=i);this._globals={};for(let i of t.ast.body)i.type==="VarDecl"&&i.isGlobal&&(this._globals[i.name]=i.init?this._evalExpr(i.init,{}):0);return this._ast=t.ast,{ok:!0,errors:[]}}*createExecutor(){this._instructionCount=0,this._running=!0;let e=this._functions.setup;e&&(yield*this._executeNode(e.body,{}),yield{kind:"SETUP_DONE"});let t=this._functions.loop;if(t)for(;this._running;)this._instructionCount=0,yield{kind:"LOOP_START"},yield*this._executeNode(t.body,{})}advanceFirmwareTime(e){this._firmwareTime+=e}stop(){this._running=!1}getVariables(){return{...this._globals}}},G=class extends Error{constructor(e,t,i){super(t),this.code=e,this.lineHint=i,this.recoverable=!0}};typeof le<"u"&&(le.exports={preprocess:rt,tokenize:at,Parser:x,PedagogicalVM:se,RuntimeError:G})});var k=m((xo,ot)=>{"use strict";var de=class{constructor(e={}){this.wheelbase=e.wheelbase??30,this.maxSpeed=e.maxSpeed??2.2,this.accel=e.accel??.14,this.robotW=e.robotW??36,this.robotH=e.robotH??28,this.cw=e.cw??800,this.ch=e.ch??500,this.robot=this._init(),this.obstacles=[]}_init(){return{x:this.cw/2,y:this.ch/2,angle:0,vL:0,vR:0,trail:[]}}reset(){this.robot=this._init()}setCanvas(e,t){this.cw=e,this.ch=t}step(e,t){let i=this.robot,r=this._spd(e.motorA),a=this._spd(e.motorB),n=Math.min(1,this.accel*(t/16.67));i.vL+=(r-i.vL)*n,i.vR+=(a-i.vR)*n;let s=(i.vL+i.vR)/2,l=(i.vR-i.vL)/this.wheelbase,u=t/16.67;i.angle+=l*u*.8,i.x+=Math.cos(i.angle)*s*u,i.y+=Math.sin(i.angle)*s*u;let c=14;i.x<c&&(i.x=c,i.angle=Math.PI-i.angle),i.y<c&&(i.y=c,i.angle=-i.angle),i.x>this.cw-c&&(i.x=this.cw-c,i.angle=Math.PI-i.angle),i.y>this.ch-c&&(i.y=this.ch-c,i.angle=-i.angle);for(let p of this.obstacles)i.x>p.x&&i.x<p.x+p.w&&i.y>p.y&&i.y<p.y+p.h&&(i.x-=Math.cos(i.angle)*s*u*2,i.y-=Math.sin(i.angle)*s*u*2,i.angle+=Math.PI*.5,i.vL=0,i.vR=0);i.trail.push({x:i.x,y:i.y}),i.trail.length>80&&i.trail.shift()}getRobotState(){return{...this.robot,trail:[...this.robot.trail]}}getRobot(){return this.robot}setObstacles(e){this.obstacles=e}_spd(e){if(!e||e.direction==="DISABLED"||e.direction==="BRAKE")return 0;if(e.direction==="COAST")return this.robot.vL*.92;let t=e.pwm/255*this.maxSpeed;return e.direction==="FORWARD"?t:-t}};ot.exports={DifferentialDrive:de}});var ue=m((Go,nt)=>{"use strict";var ce={HC_SR04:{id:"HC_SR04",name:"HC-SR04 Ultras\xF3nico",category:"distance",interface:"trigger_echo",outputUnit:"us",adcResolution:null,rangeMin:2,rangeMax:400,halfAngleDeg:15,noiseModel:"gaussian",noiseParam:.3,sampleRateHz:40,description:"Sensor ultras\xF3nico de distancia. Usa trigger/echo con pulseIn(). Zona muerta < 2cm. Rango \xFAtil 2\u2013400cm.",datasheet:"HC-SR04 product specification",physics:{speedOfSound:.0343,minEchoUs:116,maxEchoUs:23324,saturationUs:38e3}},SHARP_2Y0A21:{id:"SHARP_2Y0A21",name:"Sharp 2Y0A21 IR",category:"distance",interface:"analog",outputUnit:"adc",adcResolution:10,rangeMin:10,rangeMax:80,noiseModel:"gaussian",noiseParam:15,sampleRateHz:50,description:"Sensor IR anal\xF3gico de distancia. Lectura inversa: cercano \u2192 ADC alto. Zona muerta < 10cm (saturaci\xF3n). Rango \xFAtil 10\u201380cm.",physics:{curveA:18,curveB:-1,vMax:3.1,vMin:.4}},SHARP_GP2Y0A02:{id:"SHARP_GP2Y0A02",name:"Sharp GP2Y0A02 IR (largo alcance)",category:"distance",interface:"analog",outputUnit:"adc",adcResolution:10,rangeMin:20,rangeMax:150,noiseModel:"gaussian",noiseParam:12,sampleRateHz:40,description:"Sensor IR largo alcance 20\u2013150cm. Ideal para minisumo.",physics:{curveA:60,curveB:-5,vMax:2.8,vMin:.3}},VL53L0X:{id:"VL53L0X",name:"VL53L0X ToF (I\xB2C)",category:"distance",interface:"i2c",outputUnit:"mm",adcResolution:null,rangeMin:30,rangeMax:2e3,noiseModel:"gaussian",noiseParam:3,sampleRateHz:50,description:"Sensor Time-of-Flight I\xB2C. Retorna distancia en mm. Alta precisi\xF3n, requiere Wire.begin().",phase:2},QTR_REFLECTIVE:{id:"QTR_REFLECTIVE",name:"QTR Reflectivo (an\xE1logico)",category:"reflectance",interface:"analog",outputUnit:"adc",adcResolution:10,rangeMin:0,rangeMax:1023,noiseModel:"gaussian",noiseParam:20,sampleRateHz:100,description:"Sensor reflectivo para seguidor de l\xEDnea. Superficie blanca \u2192 ADC bajo. Superficie negra \u2192 ADC alto. Ruido mayor en zona de transici\xF3n.",physics:{sensorFootprintMm:3,lineWidthMm:15}},QTR_8A:{id:"QTR_8A",name:"QTR-8A Array (8 sensores)",category:"reflectance",interface:"analog",outputUnit:"adc",adcResolution:10,rangeMin:0,rangeMax:1023,noiseModel:"gaussian",noiseParam:20,sampleRateHz:100,description:"Array de 8 sensores reflectivos. Cada uno en un pin anal\xF3gico separado.",physics:{count:8,spacingMm:4,sensorFootprintMm:3}},BUTTON:{id:"BUTTON",name:"Pulsador / Bumper",category:"digital",interface:"digital",outputUnit:"boolean",adcResolution:null,rangeMin:0,rangeMax:1,noiseModel:"none",noiseParam:0,sampleRateHz:1e3,description:"Pulsador o bumper de contacto. INPUT_PULLUP t\xEDpico.",physics:{contactRadius:5}},POTENTIOMETER:{id:"POTENTIOMETER",name:"Potenci\xF3metro",category:"analog",interface:"analog",outputUnit:"adc",adcResolution:10,rangeMin:0,rangeMax:1023,noiseModel:"none",noiseParam:0,sampleRateHz:1e3,description:"Potenci\xF3metro rotativo. Valor ADC configurable por el docente."},MPU6050:{id:"MPU6050",name:"MPU-6050 IMU (I\xB2C)",category:"imu",interface:"i2c",outputUnit:"raw",adcResolution:16,noiseModel:"gaussian",noiseParam:5,sampleRateHz:100,description:"Aceler\xF3metro + giroscopio 6DOF. Requiere Wire.begin(). Direcci\xF3n I\xB2C: 0x68.",i2cAddress:104,phase:2},OPTOCOUPLE_PC817:{id:"OPTOCOUPLE_PC817",name:"Entrada optoaislada PC817",category:"industrial",interface:"digital",outputUnit:"boolean",adcResolution:null,rangeMin:0,rangeMax:1,noiseModel:"none",noiseParam:0,sampleRateHz:1e3,description:"Entrada digital optoaislada 5\u201324V DC (PLC-CORE-MDE). L\xF3gica negativa: +24V \u2192 GPIO LOW.",voltageRange:{min:5,max:24}},ANALOG_0_10V:{id:"ANALOG_0_10V",name:"Entrada anal\xF3gica 0\u201310V industrial",category:"industrial",interface:"analog",outputUnit:"adc",adcResolution:12,rangeMin:0,rangeMax:4095,noiseModel:"gaussian",noiseParam:5,sampleRateHz:100,description:"Entrada anal\xF3gica industrial 0\u201310V DC (PLC-CORE-MDE). ADC 12-bit: 0V\u21920, 10V\u21924095."}};function Bi(o){return ce[o]||null}function Hi(o){let e=Object.values(ce);return o?e.filter(t=>t.category===o):e}nt.exports={SENSOR_TYPES:ce,getSensorType:Bi,listSensorTypes:Hi}});var lt=m((zo,st)=>{"use strict";var{getSensorType:Wi}=ue(),pe=class{constructor(e,t){this.id=e.id,this.typeId=e.typeId,this.mount=e,this.rng=t;let i=Wi(e.typeId);if(!i)throw new Error("Unknown sensor type: "+e.typeId);this.type=i,this._lastSampleTime=-999,this._lastValue=0,this._minIntervalMs=1e3/(i.sampleRateHz||60)}sample(e,t,i,r){if(i-this._lastSampleTime<this._minIntervalMs)return{value:this._lastValue,raw:this._lastValue,cached:!0};this._lastSampleTime=i;let a;switch(this.type.interface){case"analog":a=this._sampleAnalog(e,t,r);break;case"trigger_echo":a=this._sampleTriggerEcho(e,t);break;case"digital":a=this._sampleDigital(e,t);break;case"i2c":a=this._sampleI2C(e);break;default:a={value:0,raw:0}}return a=this._applyNoise(a),this.mount.config&&this.mount.config.inverted&&(a.value=this.type.adcResolution?(this.type.adcResolution===12?4095:1023)-a.value:a.value===0?1:0),this._lastValue=a.value,a}_sampleAnalog(e,t,i){let r=this._worldPosition(e);switch(this.typeId){case"QTR_REFLECTIVE":case"QTR_8A":return this._sampleReflectance(r,i);case"SHARP_2Y0A21":case"SHARP_GP2Y0A02":{let a=this._raycastDistance(e,r,t);return this._sharpDistToADC(a,this.type.physics)}default:{let a=this._raycastDistance(e,r,t),n=Math.min(1023,Math.max(0,a/280*1023));return{value:Math.floor(n),raw:n,unit:"adc"}}}}_sampleTriggerEcho(e,t){let i=this._worldPosition(e),r=e.angle+(this.mount.mountPosition.angle||0),a=this._raycastCone(i,r,t,this.type.halfAngleDeg||15),n=this.type.physics;if(a===1/0||a>this._cmToPixels(this.type.rangeMax))return{value:n.saturationUs,raw:n.saturationUs,unit:"us",detected:!1};let s=this._pixelsToCm(a),l=Math.max(this.type.rangeMin,Math.min(this.type.rangeMax,s)),u=l*2/n.speedOfSound;return{value:Math.floor(u),raw:u,unit:"us",distCm:l,detected:s<=this.type.rangeMax}}_sampleDigital(e,t){let i=this._worldPosition(e),r=this.type.physics?this.type.physics.contactRadius:8,a=!1;for(let s of t){let l=s.x+s.w/2,u=s.y+s.h/2;if(Math.sqrt((i.x-l)**2+(i.y-u)**2)<r+s.w/2){a=!0;break}}let n=a?0:1;return{value:n,raw:n,unit:"boolean",contact:a}}_sampleI2C(e){return{value:0,raw:0,unit:this.type.outputUnit}}_sampleReflectance(e,t){if(!t)return{value:50,raw:50,unit:"adc",surface:"white"};try{let i=t.getContext("2d"),r=Math.round(e.x),a=Math.round(e.y);if(r<0||a<0||r>=t.width||a>=t.height)return{value:50,raw:50,unit:"adc"};let n=i.getImageData(r,a,1,1).data,s=(n[0]*.299+n[1]*.587+n[2]*.114)/255,l=Math.floor((1-s)*1023);return{value:l,raw:l,unit:"adc",luminance:s}}catch{return{value:512,raw:512,unit:"adc"}}}_sharpDistToADC(e,t){if(e===1/0)return{value:Math.floor(t.vMin/5*1023),raw:0,unit:"adc",detected:!1};let i=this._pixelsToCm(e),r=Math.max(this.type.rangeMin,Math.min(this.type.rangeMax,i)),a=t.curveA/(r+t.curveB),n=Math.max(t.vMin,Math.min(t.vMax,a)),s=Math.floor(n/5*1023);return{value:s,raw:s,unit:"adc",distCm:r,detected:i<=this.type.rangeMax}}_applyNoise(e){if(!this.rng||this.type.noiseModel==="none")return e;if(this.type.interface==="trigger_echo"){let r=this.rng.gauss(this.type.noiseParam*60),a=this.type.physics,n=Math.max(a.minEchoUs,Math.min(a.saturationUs,Math.round(e.value+r)));return{...e,value:e.detected===!1?a.saturationUs:n}}let t=0;this.type.noiseModel==="gaussian"?t=this.rng.gauss(this.type.noiseParam):this.type.noiseModel==="uniform"&&(t=(this.rng.next()-.5)*2*this.type.noiseParam);let i=this.type.adcResolution===12?4095:1023;return{...e,value:Math.max(0,Math.min(i,Math.round(e.value+t)))}}_worldPosition(e){let t=this.mount.mountPosition,i=e.angle,r=t.x*Math.cos(i)-t.y*Math.sin(i),a=t.x*Math.sin(i)+t.y*Math.cos(i);return{x:e.x+r,y:e.y+a}}_raycastCone(e,t,i,r){let n=r*Math.PI/180,s=1/0;for(let l=0;l<5;l++){let u=t-n+l/4*n*2,c=this._castSingleRay(e,u,i);c<s&&(s=c)}return s}_raycastDistance(e,t,i){let r=e.angle+(this.mount.mountPosition.angle||0);return this._castSingleRay(t,r,i)}_castSingleRay(e,t,i){let r={x:Math.cos(t),y:Math.sin(t)},a=1/0;for(let n of i){let s=r.x!==0?1/r.x:1/0,l=r.y!==0?1/r.y:1/0,u=(n.x-e.x)*s,c=(n.x+n.w-e.x)*s,p=(n.y-e.y)*l,E=(n.y+n.h-e.y)*l,h=Math.max(Math.min(u,c),Math.min(p,E)),y=Math.min(Math.max(u,c),Math.max(p,E));y>=0&&h<=y&&h<a&&(a=h)}return a===1/0?1/0:a}_pixelsToCm(e){return e/280*80}_cmToPixels(e){return e/80*280}};st.exports={SensorInstance:pe}});var he=m((ko,dt)=>{"use strict";var I={SIMULATED:"SIMULATED",REAL:"REAL",HYBRID:"HYBRID"},me=class{constructor(e,t={}){this._sim=e,this._id=e.id,this._pins=e.mount.pins,this._mode=t.mode||I.SIMULATED,this._realAdapter=null,this._calibOffset=t.calibOffset||0,this._calibScale=t.calibScale||1,this._lastSim=null,this._lastReal=null,this._lastTs=0}setMode(e){if(!Object.values(I).includes(e))throw new Error("Invalid sensor mode: "+e);this._mode=e}getMode(){return this._mode}connectHardware(e){this._realAdapter=e,this._mode===I.SIMULATED&&(this._mode=I.HYBRID)}disconnectHardware(){this._realAdapter=null,this._mode=I.SIMULATED}isHardwareConnected(){return this._realAdapter!==null}calibrate(e,t){this._calibOffset=e??this._calibOffset,this._calibScale=t??this._calibScale}applyCalibration(e){return e*this._calibScale+this._calibOffset}sample(e,t,i,r){let a=Date.now(),n=this._sim.sample(e,t,i,r);n.cached||(this._lastSim=n);let s=(this._lastSim||n).value,l=null,u=0;if(this._realAdapter&&(this._mode===I.REAL||this._mode===I.HYBRID))try{let h=this._realAdapter.read();if(h!=null&&!isNaN(h))l=this.applyCalibration(h),u=1,this._lastReal={value:l,ts:a};else if(this._lastReal){l=this._lastReal.value;let y=(a-this._lastReal.ts)/1e3;u=Math.max(0,1-y/2)}}catch{u=0}let c,p;switch(this._mode){case I.REAL:c=l!==null?l:s,p=l!==null?"REAL":"SIM";break;case I.HYBRID:c=l!==null&&u>.5?l:s,p="HYBRID";break;case I.SIMULATED:default:c=s,p="SIM"}let E=s!==null&&l!==null?Math.abs(s-l):null;return{value:c,simValue:s,realValue:l,source:p,cached:n.cached&&l===null,delta:E,confidence:u,unit:n.unit||"adc",simTime:i,ts:a,sensorId:this._id,mode:this._mode,pins:this._pins}}getComparisonData(){return{sensorId:this._id,mode:this._mode,simValue:this._lastSim?.value??null,realValue:this._lastReal?.value??null,delta:this._lastSim&&this._lastReal?Math.abs(this._lastSim.value-this._lastReal.value):null,calibOffset:this._calibOffset,calibScale:this._calibScale,hwConnected:this.isHardwareConnected()}}};dt.exports={SensorChannel:me,SENSOR_MODE:I}});var P=m((Vo,ct)=>{"use strict";var ge=class{constructor(e=42){this._s=e>>>0,this._seed=e>>>0}next(){return this._s^=this._s<<13,this._s^=this._s>>17,this._s^=this._s<<5,(this._s>>>0)/4294967295}gauss(e){let t=this.next()||1e-9,i=this.next();return e*Math.sqrt(-2*Math.log(t))*Math.cos(2*Math.PI*i)}reset(e){this._s=(e!==void 0?e:this._seed)>>>0}};ct.exports={SeededRNG:ge}});var V=m((Fo,pt)=>{"use strict";function ut(o={}){return{x:o.x??0,y:o.y??0,z:o.z??0,yaw:o.yaw??o.angle??0,pitch:o.pitch??0,roll:o.roll??0}}function xi(o,e){let t=o.angle||0,i=e.x,r=e.y,a=o.x+i*Math.cos(t)-r*Math.sin(t),n=o.y+i*Math.sin(t)+r*Math.cos(t),s=t+e.yaw;return{x:a,y:n,z:e.z,worldYaw:s,pitch:e.pitch,roll:e.roll}}function Gi(o){let e=ut(o);return Math.abs(e.pitch+Math.PI/2)<.3||e.z<-8?"downward":Math.abs(e.yaw)>2.5?"rearward":"forward"}pt.exports={normalizePosition:ut,worldPosition:xi,getSensorOrientation:Gi}});var F=m((jo,ht)=>{"use strict";var{SensorInstance:zi}=lt(),{SensorChannel:ki,SENSOR_MODE:mt}=he(),{SeededRNG:Vi}=P(),{normalizePosition:Fi}=V(),fe=class{constructor(e,t={}){this._physics=e,this._rng=new Vi(t.seed||42),this._channels=[],this._canvas=null,this._hal=null}setHAL(e){return this._hal=e,this}setCanvas(e){return this._canvas=e,this}configure(e){return this._channels=e.map(t=>{let i={...t,mountPosition:Fi(t.mountPosition)},r=new zi(i,this._rng);return new ki(r,{mode:mt.SIMULATED})}),this}configureFromRobotProfile(e){return e&&e.sensors&&this.configure(e.sensors),this}setChannelMode(e,t){let i=this._channels.find(r=>r._id===e);i&&i.setMode(t)}setAllMode(e){for(let t of this._channels)t.setMode(e)}connectHardware(e,t){let i=this._channels.find(r=>r._id===e);i&&i.connectHardware(t)}calibrateChannel(e,t,i){let r=this._channels.find(a=>a._id===e);r&&r.calibrate(t,i)}sample(e){let t=this._physics.getRobot?this._physics.getRobot():this._physics.robot,i=this._physics.obstacles||[],r=[];for(let a of this._channels){let n=a.sample(t,i,e,this._canvas);if(r.push(n),this._hal&&n.pins){let s=n.pins;s.analog&&this._hal.setSensorValue(s.analog,n.value),s.echo&&this._injectPulseIn(s.echo,n.value),s.digital&&this._hal.setDigitalInput(s.digital,n.value)}}return r}_injectPulseIn(e,t){this._hal&&this._hal.setPulseInValue&&this._hal.setPulseInValue(e,t)}getComparisonSnapshot(){return this._channels.map(e=>e.getComparisonData())}getChannels(){return this._channels.map(e=>({id:e._id,mode:e.getMode(),hwConnected:e.isHardwareConnected(),pins:e._pins}))}reset(){this._rng.reset();for(let e of this._channels)e._sim._lastSampleTime=-999,e._sim._lastValue=0,e._lastSim=null,e._lastReal=null}};ht.exports={SensorEngine:fe,SENSOR_MODE:mt}});var j=m((Yo,gt)=>{"use strict";var C=class{constructor(e){this._cap=e,this._buf=new Array(e),this._head=0,this._size=0}push(e){this._buf[this._head]=e,this._head=(this._head+1)%this._cap,this._size<this._cap&&this._size++}toArray(){if(this._size===0)return[];let e=[],t=this._size<this._cap?0:this._head;for(let i=0;i<this._size;i++)e.push(this._buf[(t+i)%this._cap]);return e}last(){return this._size>0?this._buf[(this._head-1+this._cap)%this._cap]:null}size(){return this._size}clear(){this._head=0,this._size=0}},_e=class{constructor(e={}){this._capacity=e.capacity||300,this._maxSignals=e.maxSignals||50,this._signals=new Map,this._meta=new Map}registerSignal(e,t){return this._signals.has(e)||this._signals.set(e,new C(this._capacity)),this._meta.set(e,t),this}record(e,t,i){let r=this._signals.get(e);if(!r){if(this._signals.size>=this._maxSignals)return;r=new C(this._capacity),this._signals.set(e,r)}let a=r.last(),n=this._meta.get(e);n&&(n.type==="digital"||n.type==="boolean")&&a&&a.v===t||r.push({t:i,v:t})}recordTick(e){let t=e.simTime||0;if(e.gpio)for(let[i,r]of Object.entries(e.gpio)){if(r.mode===null)continue;let a="gpio."+i;if(!this._meta.has(a)){let n=r.def&&(r.def.analog||r.def.analogOnly)||r.mode==="ANALOG_IMPLICIT";this._meta.set(a,{label:i,type:n?"analog":"digital",unit:n?"adc":"binary",group:"gpio",analogImplicit:r.analogImplicit||!1})}this.record(a,r.isPWM?r.pwmDuty:r.value,t)}if(e.motorCmds){let i={FORWARD:1,REVERSE:-1,BRAKE:0,COAST:0,DISABLED:0};for(let[r,a]of Object.entries(e.motorCmds)){let n="motor."+r+".dir",s="motor."+r+".pwm";this._meta.has(n)||(this._meta.set(n,{label:r+" dir",type:"direction",unit:"",group:"motor"}),this._meta.set(s,{label:r+" PWM",type:"analog",unit:"0-255",group:"motor"})),this.record(n,i[a.direction]||0,t),this.record(s,a.pwm,t)}}if(e.variables)for(let[i,r]of Object.entries(e.variables)){if(typeof r!="number")continue;let a="var."+i;this._meta.has(a)||this._meta.set(a,{label:i,type:"analog",unit:"",group:"vars"}),this.record(a,r,t)}}getHistory(e,t,i){let r=this._signals.get(e);if(!r)return[];let a=r.toArray();return t===void 0?a:a.filter(n=>n.t>=(t||0)&&(!i||n.t<=i))}getLatest(e){let t=this._signals.get(e);return t?t.last():null}listSignals(e){let t=[];for(let[i,r]of this._meta.entries())(!e||r.group===e)&&t.push({id:i,...r});return t}getSparklineData(e,t=60){let i=this._signals.get(e);if(!i||i.size()===0)return[];let r=i.toArray();if(r.length<=t)return r;let a=r.length/t;return Array.from({length:t},(n,s)=>r[Math.floor(s*a)])}reset(){for(let e of this._signals.values())e.clear()}resetFull(){this._signals.clear(),this._meta.clear()}};gt.exports={SignalRecorder:_e,CircularBuffer:C}});var Y=m((Ko,ft)=>{"use strict";var{SignalRecorder:ji}=j(),Yi={gpio:66,motors:66,robot:33,sensors:66,variables:100,history:200},be=class{constructor(){this._subs={},this._last={},this._pending={},this._serial=[],this._errors=[],this.recorder=new ji({capacity:600}),this._running=!1,this._flushId=null,this._simTime=0}start(){return this._running?this:(this._running=!0,this._flush(),this)}stop(){return this._running=!1,this._flushId&&(clearTimeout(this._flushId),this._flushId=null),this}startLazy(){return this._lazyMode=!0,this}on(e,t){return this._subs[e]||(this._subs[e]=new Set),this._subs[e].add(t),()=>this._subs[e].delete(t)}processTick(e){if(e&&(this._simTime=e.simTime||0,this.recorder.recordTick(e),e.gpio&&(this._pending.gpio=e.gpio),e.motorCmds&&(this._pending.motors=e.motorCmds),e.robotState&&(this._pending.robot=e.robotState),e.variables&&(this._pending.variables=e.variables),e.gpio)){let t={};for(let[i,r]of Object.entries(e.gpio))r.def&&r.def.analog&&r.mode!=="OUTPUT"&&(t[i]=r.value);this._pending.sensors=t}}emitSerial(e,t="FW"){let i={message:e,source:t,t:this._simTime,ts:Date.now()};this._serial.push(i),this._serial.length>500&&this._serial.shift(),this._publish("serial",i),this._publish("serial_dot",{active:!0})}emitError(e){let t={...e,t:this._simTime,ts:Date.now()};this._errors.push(t),this._errors.length>50&&this._errors.shift(),this._publish("errors",t)}emitMilestone(e){this._publish("milestones",{...e,t:this._simTime})}emitValidation(e){this._publish("validation",e)}getSparkline(e,t=60){return this.recorder.getSparklineData(e,t)}getHistory(e,t,i){return this.recorder.getHistory(e,t,i)}listSignals(e){return this.recorder.listSignals(e)}getSerialHistory(){return[...this._serial]}getErrorHistory(){return[...this._errors]}getCurrentTime(){return this._simTime}reset(){this._serial=[],this._errors=[],this._pending={},this._last={},this._simTime=0,this.recorder.reset(),this.emitSerial("[SYS] Sistema reseteado.","SYS")}_flush(){if(!this._running)return;let e=Date.now();for(let[t,i]of Object.entries(Yi)){let r=this._pending[t];if(!r)continue;let a=this._last[t]||0;e-a>=i&&(this._publish(t,r),this._last[t]=e,this._pending[t]=null)}e-(this._last._history||0)>=200&&(this._last._history=e,this._publish("history",{recorder:this.recorder,simTime:this._simTime})),this._running&&(this._flushId=setTimeout(()=>this._flush(),16))}_publish(e,t){let i=this._subs[e];if(!(!i||i.size===0))for(let r of i)try{r(t)}catch{}}};function Ki(o,e,t,i){return{gpio:o.gpio||{},motorCmds:o.motorCmds||null,robotState:o.robotState||null,obstacles:o.obstacles||[],variables:o.variables||{},simTime:o.simTime||0,serialHistory:e||[],sketchCode:t||"",hasRuntimeError:i||!1}}ft.exports={TelemetryBus:be,buildSnapshot:Ki}});var Ae=m((Qo,_t)=>{"use strict";var{getPlatform:$i}=W(),{VirtualHAL:Qi,createDriver:Zi,EventBus:Xi}=H(),{PedagogicalVM:Ji}=z(),{DifferentialDrive:er}=k(),{SensorEngine:tr}=F(),{buildSnapshot:$o}=Y(),N=16.67,ir=5,A={IDLE:"IDLE",RUNNING:"RUNNING",PAUSED:"PAUSED",ERROR:"ERROR",STEPPING:"STEPPING"},ve=class{constructor(e){let t=$i(e);if(!t)throw new Error("Unknown platform: "+e);this._bus=new Xi,this.hal=new Qi(t,this._bus),this.vm=new Ji(this.hal,this._bus),this.physics=new er({cw:800,ch:500}),this.sensors=new tr(this.physics),this.sensors.setHAL(this.hal),this.driver=Zi(t),this._platform=t,this._state=A.IDLE,this._speed=1,this._simTime=0,this._accum=0,this._lastTs=0,this._rafId=null,this._gen=null,this._pending=null,this._sketchCode=""}setEventBus(e){this._bus=e,this.hal._bus=e,this.vm._bus=e}setCanvas(e){this.physics.cw=e.width,this.physics.ch=e.height,this.sensors.setCanvas(e)}loadSketch(e){this._state===A.RUNNING&&this.pause(),this._sketchCode=e;let t=this.vm.load(e);return t.ok?(this._gen=null,this._pending=null,this._emit("SKETCH_LOADED",{})):this._emit("SKETCH_ERROR",{errors:t.errors}),t}play(){this._state!==A.RUNNING&&(this._gen||(this._gen=this.vm.createExecutor(),this._pending=null),this._state=A.RUNNING,this._lastTs=this._now(),this._scheduleNext(),this._emit("SIM_PLAYING",{simTime:this._simTime}))}pause(){this._state===A.RUNNING&&(this._state=A.PAUSED,this._cancelNext(),this._emit("SIM_PAUSED",{simTime:this._simTime}))}step(){this._state===A.RUNNING&&this.pause(),this._gen||(this._gen=this.vm.createExecutor()),this._state=A.STEPPING;try{this._runStep(N)}catch(e){this._handleError(e);return}this._state=A.PAUSED,this._emit("SIM_STEPPED",{simTime:this._simTime})}reset(){this._state===A.RUNNING&&this.pause(),this._gen=null,this._pending=null,this.vm.stop(),this.vm._globals={},this.vm._firmwareTime=0,this.vm._instructionCount=0,this.hal.reset(),this.sensors.reset(),this.physics.reset(),this._simTime=0,this._accum=0,this._state=A.IDLE,this._emit("SIM_RESET",{})}setSpeed(e){this._speed=Math.max(.1,Math.min(10,e))}getState(){return this._state}getSimTime(){return this._simTime}getPlatform(){return this._platform}getSketch(){return this._sketchCode}getEventBus(){return this._bus}_loop(e){if(this._state!==A.RUNNING)return;let t=e!==void 0?e:this._now(),i=Math.min(t-this._lastTs,100);this._lastTs=t,this._accum+=i*this._speed;let r=0;for(;this._accum>=N&&r<ir;){try{this._runStep(N)}catch(a){this._handleError(a);return}this._accum-=N,r++}this._scheduleNext()}_runStep(e){this._simTime+=e,this.vm.advanceFirmwareTime(e/this._speed),this._stepFirmware();let t=this.hal.getMotorPinValues(),i=this.driver?this.driver.evaluate(t):null,r=this.sensors.sample(this._simTime);i&&this.physics.step(i,e),this._emit("SIM_TICK",{tick:Math.floor(this._simTime/e),simTime:this._simTime,motorCmds:i,motorPins:t,robotState:this.physics.getRobotState?this.physics.getRobotState():this.physics.getRobot(),obstacles:this.physics.obstacles,gpio:this.hal.getAllPins(),variables:this.vm.getVariables(),sensorReadings:r})}_stepFirmware(){if(this._gen){if(this._pending){if(this.vm._firmwareTime<this._pending.t)return;this._pending=null}for(let e=0;e<2e3;e++){let t;try{t=this._gen.next()}catch(r){throw r}if(t.done){this._gen=null;return}let i=t.value;if(i){if(i.kind==="DELAY"){this._pending={t:this.vm._firmwareTime+i.remainingMs};return}if(i.kind==="YIELD_CPU")return;if(i.kind==="SETUP_DONE"){this._emit("SETUP_COMPLETE",{simTime:this._simTime});return}if(i.kind==="LOOP_START")return}}}}_handleError(e){this._state=A.ERROR,this._cancelNext(),this._emit("RUNTIME_ERROR",{code:e.code||"UNKNOWN",message:e.message,recoverable:e.recoverable!==!1})}_now(){return typeof performance<"u"?performance.now():Date.now()}_scheduleNext(){typeof requestAnimationFrame<"u"?this._rafId=requestAnimationFrame(e=>this._loop(e)):this._rafId=setTimeout(()=>this._loop(),N)}_cancelNext(){this._rafId!==null&&(typeof cancelAnimationFrame<"u"?cancelAnimationFrame(this._rafId):clearTimeout(this._rafId),this._rafId=null)}_emit(e,t){this._bus.emit({type:e,payload:t,source:"SIM",ts:Date.now()})}};_t.exports={SimSystem:ve,State:A}});var It=m((Zo,yt)=>{"use strict";var g={cyan:"#00d4bc",amber:"#f0a000",red:"#ff3050",green:"#18d464",purple:"#9b72f0",blue:"#3b82f6",dim:"#3a5060",mid:"#6088a0",bg:"#06080d",bg2:"#10151f",grid:"rgba(255,255,255,0.04)"};function K(o,e,t,i,r={}){if(!i||i.length<2){o.fillStyle=g.dim,o.font="8px monospace",o.textAlign="center",o.fillText("\u2014",e/2,t/2+3);return}let a=r.color||g.cyan,n=i.map(h=>h.v),s=r.minVal!==void 0?r.minVal:Math.min(...n),u=(r.maxVal!==void 0?r.maxVal:Math.max(...n))-s||1,c=2,p=h=>c+h/(i.length-1)*(e-c*2),E=h=>t-c-(h-s)/u*(t-c*2);if(r.fillAlpha&&(o.beginPath(),o.moveTo(p(0),t),i.forEach((h,y)=>o.lineTo(p(y),E(h.v))),o.lineTo(p(i.length-1),t),o.closePath(),o.fillStyle=a.replace(")",`,${r.fillAlpha})`).replace("rgb(","rgba(")||a+"20",o.fill()),o.beginPath(),o.strokeStyle=a,o.lineWidth=1.5,o.lineJoin="round",i.forEach((h,y)=>{let L=p(y),w=E(h.v);y===0?o.moveTo(L,w):o.lineTo(L,w)}),o.stroke(),i.length>0){let h=i[i.length-1];o.beginPath(),o.arc(p(i.length-1),E(h.v),2.5,0,Math.PI*2),o.fillStyle=a,o.fill()}}function bt(o,e,t,i,r={}){if(!i||i.length<1)return;let a=r.color||g.cyan,n=4,s=t-4,l=i.length>1&&i[i.length-1].t-i[0].t||1,u=p=>(p-i[0].t)/l*e;o.beginPath(),o.strokeStyle=a,o.lineWidth=1.5;let c=i[0].v?n:s;o.moveTo(0,c);for(let p=0;p<i.length;p++){let E=u(i[p].t),h=i[p].v?n:s;h!==c&&(o.lineTo(E,c),o.lineTo(E,h)),o.lineTo(p===i.length-1?e:u((i[p+1]||i[p]).t),h),c=h}o.stroke(),r.showLabel!==!1&&(o.fillStyle=a,o.font="7px monospace",o.textAlign="right",o.globalAlpha=.5,o.fillText("H",e-2,n+6),o.fillText("L",e-2,s+1),o.globalAlpha=1)}function vt(o,e,t,i,r={}){let a=r.min!==void 0?r.min:0,n=r.max!==void 0?r.max:1023,s=Math.max(0,Math.min(1,(i-a)/(n-a))),l=r.threshold!==void 0&&i<r.threshold?r.thresholdColor||g.red:r.color||g.amber,u=4,c=t-u-2;o.fillStyle=g.bg2,o.fillRect(0,c,e,u),o.fillStyle=l,o.fillRect(0,c,s*e,u),o.fillStyle=l,o.font="bold 11px monospace",o.textAlign="left",o.fillText(Math.floor(i),2,t-u-6),r.unit&&(o.fillStyle=g.mid,o.font="8px monospace",o.fillText(r.unit,2+o.measureText(Math.floor(i)).width+3,t-u-6)),r.label&&(o.fillStyle=g.dim,o.font="7px monospace",o.textAlign="right",o.fillText(r.label,e-2,t-u-6))}function rr(o,e,t,i,r={}){if(!i)return;let{direction:a,pwm:n}=i,l={FORWARD:g.green,REVERSE:g.amber,BRAKE:g.red,DISABLED:g.dim,COAST:g.dim}[a]||g.dim,u=a==="FORWARD"||a==="REVERSE"?n/255:0;if(o.fillStyle=g.bg2,o.fillRect(0,t-5,e,4),o.fillStyle=l,o.fillRect(0,t-5,u*e,4),o.fillStyle=l,o.font="bold 10px monospace",o.textAlign="left",o.fillText(a.slice(0,3),2,t-10),o.fillStyle=g.mid,o.font="9px monospace",o.textAlign="right",o.fillText(n,e-2,t-10),a==="FORWARD"||a==="REVERSE"){let c=e/2,p=t/2-4;o.fillStyle=l,o.beginPath(),a==="FORWARD"?(o.moveTo(c-6,p+4),o.lineTo(c+6,p+4),o.lineTo(c,p-4)):(o.moveTo(c-6,p-4),o.lineTo(c+6,p-4),o.lineTo(c,p+4)),o.fill()}r.label&&(o.fillStyle=g.dim,o.font="7px monospace",o.textAlign="center",o.fillText(r.label,e/2,9))}function At(o,e,t,i,r,a={}){let n=r&&r.length>0;i&&i.length>1&&K(o,e,t,i,{color:g.cyan,fillAlpha:.08,minVal:a.min||0,maxVal:a.max||1023}),n&&r.length>1&&K(o,e,t,r,{color:g.amber,fillAlpha:.06,minVal:a.min||0,maxVal:a.max||1023}),o.font="7px monospace",o.textAlign="right",o.fillStyle=g.cyan,o.fillText("SIM",e-2,9),n&&(o.fillStyle=g.amber,o.fillText("HW",e-2,18))}function Et(o,e,t,i={}){o.strokeStyle=g.grid,o.lineWidth=.5;let r=i.cols||4,a=i.rows||2;for(let n=1;n<r;n++)o.beginPath(),o.moveTo(n/r*e,0),o.lineTo(n/r*e,t),o.stroke();for(let n=1;n<a;n++)o.beginPath(),o.moveTo(0,n/a*t),o.lineTo(e,n/a*t),o.stroke()}var Ee=class{constructor(e){this._bus=e,this._slots=[],this._canvases={},this._unsubs=[],this._raf=null,this._dirty=new Set}addSparkline(e,t,i={}){return this._slots.push({type:"sparkline",canvasId:e,signalId:t,opts:i}),this}addTimeline(e,t,i={}){return this._slots.push({type:"timeline",canvasId:e,signalId:t,opts:i}),this}addGauge(e,t,i={}){return this._slots.push({type:"gauge",canvasId:e,signalId:t,opts:i}),this}addMotor(e,t,i={}){return this._slots.push({type:"motor",canvasId:e,motorKey:t,opts:i}),this}addComparison(e,t,i={}){return this._slots.push({type:"comparison",canvasId:e,signalId:t,opts:i}),this}start(e){this._canvases=e;let t=()=>this._slots.forEach(r=>this._dirty.add(r.canvasId));this._unsubs.push(this._bus.on("gpio",()=>t()),this._bus.on("motors",()=>t()),this._bus.on("sensors",()=>t()),this._bus.on("history",()=>t()));let i=()=>{this._renderDirty(),this._raf=requestAnimationFrame(i)};return this._raf=requestAnimationFrame(i),this}stop(){for(let e of this._unsubs)e();this._unsubs=[],this._raf&&(cancelAnimationFrame(this._raf),this._raf=null)}_renderDirty(){for(let e of this._dirty){let t=this._canvases[e];if(!t)continue;let i=this._slots.filter(r=>r.canvasId===e);for(let r of i)this._renderSlot(t,r)}this._dirty.clear()}_renderSlot(e,t){let i=e.getContext("2d"),r=e.width,a=e.height;switch(i.clearRect(0,0,r,a),t.type){case"sparkline":{let n=this._bus.getSparkline(t.signalId,t.opts.points||80);Et(i,r,a),K(i,r,a,n,t.opts);break}case"timeline":{let n=this._bus.getHistory(t.signalId);bt(i,r,a,n,t.opts);break}case"gauge":{let n=this._bus.recorder&&this._bus.recorder.latest("gpio."+t.signalId);n&&vt(i,r,a,n.v,t.opts);break}case"motor":{let n=this._bus.recorder&&this._bus.recorder.latest("motor."+t.motorKey+".pwm");break}case"comparison":{let n=this._bus.getHistory(t.signalId+".sim"),s=this._bus.getHistory(t.signalId+".real");At(i,r,a,n,s,t.opts);break}}}};yt.exports={drawSparkline:K,drawGPIOTimeline:bt,drawAnalogGauge:vt,drawMotorState:rr,drawSensorComparison:At,drawGrid:Et,TelemetryPanel:Ee,CLR:g}});var Ie=m((Xo,Ot)=>{"use strict";var ye=class{constructor(){this._registry=new Map,this._active=null,this._physics=null,this._sensors=null,this._bus=null}register(e){let t=this._validate(e);if(t.length>0)throw new Error('Invalid scenario "'+e.id+'": '+t.join("; "));return this._registry.set(e.id,e),this}registerMany(e){for(let t of e)this.register(t);return this}list(e={}){let t=[...this._registry.values()];return e.platformId&&(t=t.filter(i=>i.platformId===e.platformId||i.platformId==="any")),e.tag&&(t=t.filter(i=>i.tags&&i.tags.includes(e.tag))),t.map(i=>({id:i.id,name:i.name,description:i.description,tags:i.tags||[],platformId:i.platformId}))}get(e){return this._registry.get(e)||null}load(e,t,i,r,a){let n=this._registry.get(e);if(!n)throw new Error("Scenario not found: "+e);this._active=n,this._physics=t,this._sensors=i,this._bus=r;let s=a?a.width:n.canvas.width||800,l=a?a.height:n.canvas.height||500;if(t.cw=s,t.ch=l,t.reset(),n.robot&&n.robot.start){let c=n.robot.start;t.robot.x=c.x<=1?c.x*s:c.x,t.robot.y=c.y<=1?c.y*l:c.y,t.robot.angle=c.angle||0}let u=(n.obstacles||[]).map(c=>({x:c.x<=1?c.x*s:c.x,y:c.y<=1?c.y*l:c.y,w:c.w<=1?c.w*s:c.w,h:c.h<=1?c.h*l:c.h,draggable:c.draggable!==!1,label:c.label||"",id:c.id||Math.random().toString(36).slice(2)}));return t.setObstacles(u),r&&r.emit({type:"SCENARIO_LOADED",payload:{id:e,name:n.name,obstacles:u.length},source:"SCENARIO"}),{def:n,W:s,H:l,obstacles:u}}moveObstacle(e,t,i){if(!this._physics)return;let r=this._physics.obstacles.find(a=>a.id===e);r&&r.draggable&&(r.x=t,r.y=i)}addObstacle(e){this._physics&&this._physics.obstacles.push({x:e.x,y:e.y,w:e.w||50,h:e.h||50,draggable:!0,id:e.id||Math.random().toString(36).slice(2),label:e.label||""})}removeObstacle(e){this._physics&&(this._physics.obstacles=this._physics.obstacles.filter(t=>t.id!==e))}_validate(e){let t=[];return(!e.id||typeof e.id!="string")&&t.push("id required"),(!e.name||typeof e.name!="string")&&t.push("name required"),e.platformId||t.push("platformId required"),e.obstacles&&e.obstacles.forEach((i,r)=>{(i.x===void 0||i.y===void 0)&&t.push("obstacle["+r+"] needs x,y"),(i.w===void 0||i.h===void 0)&&t.push("obstacle["+r+"] needs w,h")}),t}getActive(){return this._active}};Ot.exports={ScenarioEngine:ye}});var Te=m((Jo,Tt)=>{"use strict";var Oe=class{constructor(){this._registry=new Map,this._active=null,this._state=null,this._bus=null,this._evaluators=new Map,this._registerBuiltinEvaluators()}register(e){if(!e.id)throw new Error("Challenge needs id");if(!e.objectives||!e.objectives.length)throw new Error("Challenge needs objectives");return this._registry.set(e.id,e),this}registerMany(e){for(let t of e)this.register(t);return this}list(e={}){let t=[...this._registry.values()];return e.platformId&&(t=t.filter(i=>i.platformId===e.platformId||i.platformId==="any")),e.tag&&(t=t.filter(i=>i.tags&&i.tags.includes(e.tag))),e.scenarioId&&(t=t.filter(i=>i.scenarioId===e.scenarioId)),t.map(i=>({id:i.id,name:i.name,description:i.description,tags:i.tags||[],platformId:i.platformId}))}get(e){return this._registry.get(e)||null}start(e,t){let i=this._registry.get(e);if(!i)throw new Error("Challenge not found: "+e);return this._active=i,this._bus=t,this._state={challengeId:e,startTime:Date.now(),objectives:i.objectives.map(r=>({...r,completed:!1,completedAt:null})),completed:!1,failed:!1,score:0},t&&t.emit({type:"CHALLENGE_STARTED",payload:{id:e,name:i.name},source:"CHALLENGE"}),this._state}evaluate(e){if(!this._state||this._state.completed||this._state.failed||!e)return;let t=!1,i=!0;for(let a of this._state.objectives){if(a.completed)continue;let n=this._evaluators.get(a.type);if(!n)continue;n(a.params||{},e)&&(a.completed=!0,a.completedAt=e.simTime,t=!0,this._bus&&this._bus.emit({type:"OBJECTIVE_COMPLETED",payload:{objectiveId:a.id,label:a.label,simTime:e.simTime},source:"CHALLENGE"}))}for(let a of this._state.objectives)if(a.required!==!1&&!a.completed){i=!1;break}i&&!this._state.completed&&(this._state.completed=!0,this._state.score=this._calcScore(),this._bus&&this._bus.emit({type:"CHALLENGE_COMPLETED",payload:{score:this._state.score,time:Date.now()-this._state.startTime},source:"CHALLENGE"}));let r=this._active;r.timeLimit&&!this._state.completed&&e.simTime>r.timeLimit&&(this._state.failed=!0,this._bus&&this._bus.emit({type:"CHALLENGE_FAILED",payload:{reason:"timeout"},source:"CHALLENGE"}))}getState(){return this._state}getActive(){return this._active}getVisibleObjectives(){if(!this._state)return[];let e=this._state.objectives,t=e.findIndex(i=>!i.completed);return e.map((i,r)=>({...i,visible:!i.hidden||r<=t+1}))}_calcScore(){let e=(Date.now()-this._state.startTime)/1e3,t=100,i=Math.min(50,Math.floor(e/30));return Math.max(0,t-i)}_registerBuiltinEvaluators(){let e=this._evaluators;e.set("gpio_high",(t,i)=>{let r=i.gpio[t.pin];return r&&r.value===1}),e.set("gpio_low",(t,i)=>{let r=i.gpio[t.pin];return r&&r.value===0&&r.mode!==null}),e.set("motor_forward",(t,i)=>{if(!i.motorCmds)return!1;let r=t.motor==="B"?i.motorCmds.motorB:i.motorCmds.motorA;return r&&r.direction==="FORWARD"&&r.pwm>0}),e.set("motor_stop",(t,i)=>{if(!i.motorCmds)return!1;let{motorA:r,motorB:a}=i.motorCmds;return(r.direction==="BRAKE"||r.direction==="DISABLED"||r.pwm===0)&&(a.direction==="BRAKE"||a.direction==="DISABLED"||a.pwm===0)}),e.set("sensor_below",(t,i)=>{let r=i.gpio[t.pin||"A0"];return r&&r.value<t.threshold}),e.set("sensor_above",(t,i)=>{let r=i.gpio[t.pin||"A0"];return r&&r.value>=t.threshold}),e.set("robot_moved",(t,i)=>{if(!i.robotState)return!1;let r=t.minDistance||30,a=i.robotState.trail||[];if(a.length<2)return!1;let n=a[0],s=a[a.length-1];return Math.sqrt((s.x-n.x)**2+(s.y-n.y)**2)>=r}),e.set("robot_near_obstacle",(t,i)=>{if(!i.robotState||!i.obstacles)return!1;let r=i.robotState,a=t.maxDistance||80;return i.obstacles.some(n=>{let s=n.x+n.w/2,l=n.y+n.h/2;return Math.sqrt((r.x-s)**2+(r.y-l)**2)<a})}),e.set("robot_stopped",(t,i)=>{if(!i.robotState)return!1;let r=i.robotState;return Math.abs(r.vL)<.05&&Math.abs(r.vR)<.05}),e.set("serial_printed",(t,i)=>i.serialHistory&&i.serialHistory.some(r=>r.includes(t.contains))),e.set("code_contains",(t,i)=>i.sketchCode&&i.sketchCode.includes(t.substring)),e.set("no_runtime_error",(t,i)=>!i.hasRuntimeError),e.set("custom",(t,i)=>typeof t.fn=="function"?t.fn(i):!1)}registerEvaluator(e,t){this._evaluators.set(e,t)}};Tt.exports={ChallengeEngine:Oe}});var Rt=m((en,St)=>{"use strict";var _=class{constructor(e,t={}){this._type=e,this._params=t,this._label=e,this._required=!0,this._hidden=!1,this._id=null,this._hint=null}label(e){return this._label=e,this}id(e){return this._id=e,this}optional(){return this._required=!1,this}hidden(){return this._hidden=!0,this}hint(e){return this._hint=e,this}toDefinition(){return{id:this._id||this._type+"_"+Math.random().toString(36).slice(2,6),label:this._label,type:this._type,params:this._params,required:this._required,hidden:this._hidden,_hint:this._hint}}evaluate(e){return R[this._type]?R[this._type](this._params,e):!1}},$=class{constructor(e){this._steps=e.map(t=>(t instanceof _,t)),this._label="Secuencia",this._required=!0,this._id=null}label(e){return this._label=e,this}id(e){return this._id=e,this}optional(){return this._required=!1,this}toDefinition(){let e=this._id||"seq_"+Math.random().toString(36).slice(2,6),t=this._steps.map(r=>r.toDefinition?r.toDefinition():r),i=0;return{id:e,label:this._label,type:"custom",params:{fn:r=>{if(i>=t.length)return!0;let a=t[i],n=R[a.type];return n&&n(a.params,r)&&i++,i>=t.length},description:`Secuencia: ${t.map(r=>r.label).join(" \u2192 ")}`},required:this._required,hidden:!1}}},R={gpio_high:(o,e)=>{let t=e.gpio&&e.gpio[o.pin];return!!(t&&t.value===1)},gpio_low:(o,e)=>{let t=e.gpio&&e.gpio[o.pin];return!!(t&&t.value===0&&t.mode)},motor_forward:(o,e)=>{if(!e.motorCmds)return!1;let t=o.motor==="B"?e.motorCmds.motorB:e.motorCmds.motorA;return!!(t&&t.direction==="FORWARD"&&t.pwm>0)},motor_stop:(o,e)=>{if(!e.motorCmds)return!1;let{motorA:t,motorB:i}=e.motorCmds;return(t.direction==="BRAKE"||t.pwm===0)&&(i.direction==="BRAKE"||i.pwm===0)},motor_reverse:(o,e)=>{if(!e.motorCmds)return!1;let t=o.motor==="B"?e.motorCmds.motorB:e.motorCmds.motorA;return!!(t&&t.direction==="REVERSE"&&t.pwm>0)},sensor_below:(o,e)=>{let t=e.gpio&&e.gpio[o.pin||"A0"];return!!(t&&t.value<o.threshold)},sensor_above:(o,e)=>{let t=e.gpio&&e.gpio[o.pin||"A0"];return!!(t&&t.value>=o.threshold)},robot_moved:(o,e)=>{if(!e.robotState)return!1;let t=e.robotState.trail||[];if(t.length<2)return!1;let i=t[0],r=t[t.length-1];return Math.sqrt((r.x-i.x)**2+(r.y-i.y)**2)>=(o.minDistance||30)},robot_stopped:(o,e)=>{let t=e.robotState;return!!(t&&Math.abs(t.vL)<.05&&Math.abs(t.vR)<.05)},robot_near_obstacle:(o,e)=>{if(!e.robotState||!e.obstacles)return!1;let t=e.robotState,i=o.maxDistance||80;return e.obstacles.some(r=>{let a=r.x+r.w/2,n=r.y+r.h/2;return Math.sqrt((t.x-a)**2+(t.y-n)**2)<i})},serial_printed:(o,e)=>!!(e.serialHistory&&e.serialHistory.some(t=>t.includes(o.contains))),code_contains:(o,e)=>!!(e.sketchCode&&e.sketchCode.includes(o.substring)),no_runtime_error:(o,e)=>!e.hasRuntimeError,custom:(o,e)=>{try{return typeof o.fn=="function"?o.fn(e):!1}catch{return!1}}},Se={gpio(o,e="HIGH"){return new _(e==="HIGH"?"gpio_high":"gpio_low",{pin:o})},motor(o,e){if(e==="STOP"||o==="stop")return new _("motor_stop",{});let t=e==="REVERSE"?"motor_reverse":"motor_forward";return new _(t,{motor:o==="B"?"B":"A"})},sensor(o,e,t){let i=e==="<"||e==="below"?"sensor_below":"sensor_above";return new _(i,{pin:o,threshold:t})},robotMoved(o=50){return new _("robot_moved",{minDistance:o})},robotStopped(){return new _("robot_stopped",{})},robotNear(o=80){return new _("robot_near_obstacle",{maxDistance:o})},serialPrinted(o){return new _("serial_printed",{contains:o})},codeContains(o){return new _("code_contains",{substring:o})},noError(){return new _("no_runtime_error",{})},custom(o,e){return new _("custom",{fn:e}).label(o)},led(o="ON"){return Se.gpio("D10",o==="ON"?"HIGH":"LOW").label("LED D10 "+o)},stby(){return Se.gpio("D6","HIGH").label("Driver TB6612FNG habilitado (STBY=HIGH)")}};function ar(o){return new $(o)}function or(o){return new _("custom",{fn:e=>o.every(t=>{let i=t.toDefinition?t.toDefinition():t;return R[i.type]&&R[i.type](i.params,e)})})}function nr(o){return new _("custom",{fn:e=>o.some(t=>{let i=t.toDefinition?t.toDefinition():t;return R[i.type]&&R[i.type](i.params,e)})})}function sr(o,e,t={}){let i=(t.objectives||[]).map(a=>a instanceof _||a instanceof $?a.toDefinition():a),r={};return(t.objectives||[]).forEach(a=>{a._hint&&a._id&&(r[a._id]=[a._hint])}),{id:o,name:e,description:t.description||"",scenarioId:t.scenarioId||"",platformId:t.platformId||"ROBOARD",sketch:t.sketch||null,timeLimit:t.timeLimit||null,tags:t.tags||[],objectives:i,hints:{...r,...t.hints||{}}}}St.exports={obj:Se,seq:ar,all:or,any:nr,buildChallenge:sr,EVALUATORS:R,ObjectiveBuilder:_}});var Me=m((tn,Mt)=>{"use strict";var M={CANVAS:"CANVAS",SENSOR_HUD:"SENSOR_HUD",SIGNAL_CARDS:"SIGNAL_CARDS",CODE_VIEW:"CODE_VIEW",CODE_EDITOR:"CODE_EDITOR",GPIO_INSPECTOR:"GPIO_INSPECTOR",MOTOR_PANEL:"MOTOR_PANEL",SERIAL:"SERIAL",VARIABLE_MONITOR:"VARIABLE_MONITOR",TELEMETRY_CHART:"TELEMETRY_CHART",VALIDATION_PANEL:"VALIDATION_PANEL",CHALLENGE_PANEL:"CHALLENGE_PANEL",THEORY_BLOCK:"THEORY_BLOCK",HARDWARE_VIEW:"HARDWARE_VIEW",COMPARISON_VIEW:"COMPARISON_VIEW"},b={SHOW:"SHOW",HIDE:"HIDE",HIGHLIGHT:"HIGHLIGHT",MILESTONE:"MILESTONE",HINT:"HINT",ADVANCE:"ADVANCE",THEORY:"THEORY"},v={ROBOT_MOVED:"ROBOT_MOVED",ROBOT_STOPPED:"ROBOT_STOPPED",ROBOT_COLLIDED:"ROBOT_COLLIDED",OBSTACLE_MOVED:"OBSTACLE_MOVED",CODE_MODIFIED:"CODE_MODIFIED",CODE_LOADED:"CODE_LOADED",PARAM_CHANGED:"PARAM_CHANGED",SERIAL_OPENED:"SERIAL_OPENED",BUG_FIXED:"BUG_FIXED",CHALLENGE_ATTEMPTED:"CHALLENGE_ATTEMPTED",OBJECTIVE_COMPLETED:"OBJECTIVE_COMPLETED",CHALLENGE_COMPLETED:"CHALLENGE_COMPLETED",TELEMETRY_VIEWED:"TELEMETRY_VIEWED",GPIO_INSPECTED:"GPIO_INSPECTED",SENSOR_READING_SEEN:"SENSOR_READING_SEEN",RUNTIME_ERROR:"RUNTIME_ERROR",PLAY_PRESSED:"PLAY_PRESSED",RESET_PRESSED:"RESET_PRESSED"},Re=class{constructor(){this._rules=[],this._revealed=new Set,this._visible=new Set,this._obs=[],this._moments=[],this._moment=0,this._bus=null,this._milestones=[]}setBus(e){return this._bus=e,this}configure(e){this._moments=e.moments||[],this._moment=0,this._rules=[],this._revealed.clear(),this._visible.clear(),this._obs=[],this._milestones=[];let t=this._moments[0];if(t&&t.revealComponents)for(let i of t.revealComponents)this._visible.add(i);return this._buildMomentRules(),this}addRule(e){return this._rules.push({once:!0,...e}),this}addRules(e){for(let t of e)this.addRule(t);return this}observe(e,t={}){let i={type:e,payload:t,ts:Date.now(),moment:this._moment};this._obs.push(i),this._obs.length>1e3&&this._obs.shift();let r=this._evaluate();for(let a of r)this._fire(a);return this._bus&&this._bus.emit({type:"PEDAGOGY_OBSERVED",payload:{obs:i,actions:r},source:"REVELATION"}),r}isVisible(e){return this._visible.has(e)}isRevealed(e){return this._revealed.has(e)}getVisibleComponents(){return[...this._visible]}getCurrentMoment(){return this._moments[this._moment]||null}getMomentIndex(){return this._moment}getMoments(){return this._moments.map((e,t)=>({...e,active:t===this._moment,done:t<this._moment}))}getMilestones(){return[...this._milestones]}countObs(e){return this._obs.filter(t=>t.type===e).length}getObsLog(){return[...this._obs]}advanceMoment(){if(this._moment<this._moments.length-1){this._moment++;let e=this._moments[this._moment];if(e&&e.revealComponents)for(let t of e.revealComponents)this._visible.add(t);this._bus&&this._bus.emit({type:"MOMENT_ADVANCED",payload:{index:this._moment,moment:e},source:"REVELATION"})}}reset(){this._obs=[],this._revealed.clear(),this._milestones=[],this._moment=0,this._visible.clear();let e=this._moments[0];if(e&&e.revealComponents)for(let t of e.revealComponents)this._visible.add(t);this._bus&&this._bus.emit({type:"REVELATION_RESET",payload:{},source:"REVELATION"})}_evaluate(){let e=[],t={moment:this._moment,revealed:this._revealed,counts:this._buildCounts(),obs:this._obs};for(let i of this._rules)if(!(i.once&&this._revealed.has(i.id)))try{i.trigger(this._obs,t)&&(e.push(i.action),i.once&&this._revealed.add(i.id))}catch{}return e}_buildCounts(){let e={};for(let t of this._obs)e[t.type]=(e[t.type]||0)+1;return e}_fire(e){switch(e.type){case b.SHOW:this._visible.add(e.componentId);break;case b.HIDE:this._visible.delete(e.componentId);break;case b.ADVANCE:this.advanceMoment();break;case b.MILESTONE:this._milestones.push({...e,ts:Date.now()});break}this._bus&&this._bus.emit({type:"REVELATION_ACTION",payload:e,source:"REVELATION"})}_buildMomentRules(){this._moments.length>1&&this._rules.push({id:"__moment_0_to_1",once:!0,trigger:(e,t)=>t.moment===0&&t.counts[v.ROBOT_STOPPED]>=1&&t.counts[v.OBSTACLE_MOVED]>=2,action:{type:b.ADVANCE}}),this._moments.length>2&&this._rules.push({id:"__moment_1_to_2",once:!0,trigger:(e,t)=>t.moment===1&&(t.counts[v.TELEMETRY_VIEWED]>=4||t.counts[v.SENSOR_READING_SEEN]>=6),action:{type:b.ADVANCE}}),this._moments.length>3&&this._rules.push({id:"__moment_2_to_3",once:!0,trigger:(e,t)=>t.moment===2&&t.counts[v.BUG_FIXED]>=1,action:{type:b.ADVANCE}}),this._rules.push({id:"reveal_sensor_hud",once:!0,trigger:e=>e.some(t=>t.type===v.ROBOT_STOPPED),action:{type:b.SHOW,componentId:M.SENSOR_HUD}},{id:"reveal_gpio",once:!0,trigger:e=>e.some(t=>t.type===v.CODE_MODIFIED||t.type===v.CODE_LOADED),action:{type:b.SHOW,componentId:M.GPIO_INSPECTOR}},{id:"reveal_serial",once:!0,trigger:e=>e.some(t=>t.type===v.CODE_LOADED&&t.payload&&t.payload.hasSerial),action:{type:b.SHOW,componentId:M.SERIAL}},{id:"reveal_vars",once:!0,trigger:(e,t)=>t.counts[v.PLAY_PRESSED]>=1,action:{type:b.SHOW,componentId:M.VARIABLE_MONITOR}},{id:"reveal_validation",once:!0,trigger:e=>e.some(t=>t.type===v.RUNTIME_ERROR),action:{type:b.SHOW,componentId:M.VALIDATION_PANEL}},{id:"milestone_first_run",once:!0,trigger:e=>e.some(t=>t.type===v.ROBOT_MOVED),action:{type:b.MILESTONE,text:"\u2713 Robot en movimiento",duration:3e3}},{id:"milestone_bug_fix",once:!0,trigger:e=>e.some(t=>t.type===v.BUG_FIXED),action:{type:b.MILESTONE,text:"\u2713 Primer debugging completado",duration:4e3}},{id:"milestone_challenge",once:!0,trigger:e=>e.some(t=>t.type===v.CHALLENGE_COMPLETED),action:{type:b.MILESTONE,text:"\u2713 \xA1Desaf\xEDo completado!",duration:5e3}})}};function lr(){return[]}Mt.exports={RevelationEngine:Re,COMPONENT:M,REVEAL_TYPE:b,OBS:v,buildStandardRules:lr}});var Q=m((rn,Dt)=>{"use strict";var De=class{constructor(){this._blocks=new Map,this._shown=new Set,this._queue=[],this._bus=null}setBus(e){return this._bus=e,this}register(e){if(!e.id)throw new Error("Theory block needs id");return this._blocks.set(e.id,e),this}registerMany(e){for(let t of e)this.register(t);return this}trigger(e,t={}){let i=this._blocks.get(e);if(!i||this._shown.has(e)&&!i.repeatable)return;this._shown.add(e);let r={...i,context:t,shownAt:Date.now()};this._queue.push(r),this._bus&&this._bus.emit({type:"THEORY_TRIGGERED",payload:r,source:"THEORY"})}triggerForObservation(e,t){let r={ROBOT_STOPPED:"concept_sensor_threshold",GPIO_ANALOG_IMPLICIT:"concept_analog_vs_digital",RUNTIME_ERROR:"concept_infinite_loop",OBJECTIVE_COMPLETED:null,OBSTACLE_MOVED:"concept_sensor_distance"}[e.type];r&&this.trigger(r,{obs:e})}getQueue(){return[...this._queue]}clearQueue(){this._queue=[]}reset(){this._shown.clear(),this._queue=[]}},dr=[{id:"concept_sensor_threshold",type:"text",title:"\xBFQu\xE9 es un umbral de sensor?",content:{body:`El sensor IR retorna un n\xFAmero entre 0 y 1023. Cuando ese n\xFAmero baja de tu umbral (UMBRAL), hay algo cerca. El umbral es la "frontera" entre "detectado" y "no detectado".

Experiment\xE1: mov\xE9 el obst\xE1culo y observ\xE1 c\xF3mo cambia el n\xFAmero en A0.`},trigger:{event:"ROBOT_STOPPED"},displayMode:"tooltip",duration:6e3,linkedConcepts:["adc","threshold","reactive_control"]},{id:"concept_analog_vs_digital",type:"comparison",title:"Anal\xF3gico vs Digital en Arduino",content:{items:[{label:"Digital (D0-D13)",value:"Solo HIGH o LOW. Necesita pinMode(pin, OUTPUT/INPUT) antes de usarlo."},{label:"Anal\xF3gico (A0-A7)",value:"0 a 1023. analogRead() funciona sin pinMode(). Arduino lo configura autom\xE1ticamente."}],note:"A6 y A7 en el Arduino Nano son SOLO anal\xF3gicos \u2014 no pueden usarse como digitales."},trigger:{event:"GPIO_ANALOG_IMPLICIT"},displayMode:"panel",linkedConcepts:["adc","gpio","arduino_nano"]},{id:"concept_sensor_distance",type:"analogy",title:"C\xF3mo funciona el sensor IR",content:{analogy:"El sensor IR es como una linterna: emite luz infrarroja y mide cu\xE1nta rebota de vuelta. Cerca = mucho rebote = voltaje alto = ADC alto. Lejos = poco rebote = voltaje bajo = ADC bajo.",realBehavior:"Sharp 2Y0A21: 10cm \u2192 ADC ~800. 50cm \u2192 ADC ~200. Sin obst\xE1culo \u2192 ADC ~80.",warning:"Zona muerta: objetos a menos de 10cm pueden dar lecturas incorrectas."},trigger:{event:"OBSTACLE_MOVED",minCount:3},displayMode:"tooltip",duration:8e3,linkedConcepts:["ir_sensor","adc","voltage_divider"]},{id:"concept_tb6612fng",type:"diagram",title:"C\xF3mo funciona el TB6612FNG",content:{description:"El TB6612FNG es un driver de motores DC. Permite controlar velocidad y direcci\xF3n.",keyPoints:["STBY=HIGH: habilita el driver (obligatorio)","AIN1=H, AIN2=L: Motor A hacia adelante","AIN1=L, AIN2=H: Motor A hacia atr\xE1s","AIN1=H, AIN2=H: Freno activo (m\xE1s eficiente que coast)","PWMA: velocidad 0-255 con analogWrite()"],pinout:{PWMA:"D3",AIN1:"D5",AIN2:"D4",STBY:"D6",BIN1:"D7",BIN2:"D8",PWMB:"D9"}},trigger:{event:"PLAY_PRESSED",once:!0},displayMode:"panel",linkedConcepts:["h_bridge","pwm","motor_control","tb6612fng"]},{id:"concept_infinite_loop",type:"code_example",title:"El problema del loop infinito",content:{bad:`void loop() {
  // Sin delay \u2014 ejecuta miles de veces por segundo
  analogWrite(PWMA, 200);
}`,good:`void loop() {
  analogWrite(PWMA, 200);
  delay(20); // Pausa 20ms \u2014 permite al sistema respirar
}`,explanation:"Sin delay(), el microcontrolador ejecuta loop() miles de veces por segundo. Esto puede causar comportamiento err\xE1tico y consumo excesivo de CPU."},trigger:{event:"RUNTIME_ERROR"},displayMode:"panel",linkedConcepts:["loop","delay","timing"]},{id:"concept_pwm",type:"formula",title:"Control de velocidad con PWM",content:{formula:"Velocidad \u221D Duty Cycle = (tiempo HIGH / per\xEDodo) \xD7 100%",examples:["analogWrite(PWMA, 0)   \u2192 0%  \u2192 motor detenido","analogWrite(PWMA, 128) \u2192 50% \u2192 media velocidad","analogWrite(PWMA, 255) \u2192 100% \u2192 velocidad m\xE1xima"],note:"En ROBOARD: pines PWM son D3 (PWMA) y D9 (PWMB)"},trigger:{event:"CODE_MODIFIED"},displayMode:"tooltip",duration:7e3,linkedConcepts:["pwm","duty_cycle","motor_speed"]}];Dt.exports={TheoryEngine:De,ROBOARD_THEORY:dr}});var Le=m((an,Pt)=>{"use strict";var D={SYNTAX:"SYNTAX",HARDWARE:"HARDWARE",LOGIC:"LOGIC",RUNTIME:"RUNTIME",TIMING:"TIMING"},Pe={BLOCKING:"BLOCKING",CORRECTIBLE:"CORRECTIBLE",ADVISORY:"ADVISORY"},Ce=class{constructor(e){this._platform=e,this._history=[]}diagnose(e,t,i){let r=this._classify(e),a=e.recoverable===!1?Pe.BLOCKING:Pe.CORRECTIBLE,n={id:Date.now().toString(36),classification:r,severity:a,originalCode:e.code,title:this._title(e),explanation:this._explain(e,i),suggestion:this._suggest(e,t,i),affectedLine:e.lineHint||null,affectedPin:e.pin||null,pedagogicalValue:this._pedagogicalValue(e),recoverable:e.recoverable!==!1,timestamp:Date.now()};return this._history.push(n),this._history.length>50&&this._history.shift(),n}diagnoseHALError(e,t){let i={code:e.code,message:e.msg,pin:e.pin,recoverable:!0},r=this.diagnose(i,"",t);if(e.pin&&t&&t.gpio){let a=t.gpio[e.pin];r.pinState=a?{mode:a.mode,value:a.value}:null}return r}getHistory(e=10){return this._history.slice(-e)}getRecurringErrors(){let e={};for(let t of this._history)e[t.originalCode]=(e[t.originalCode]||0)+1;return Object.entries(e).filter(([,t])=>t>=2).sort(([,t],[,i])=>i-t).map(([t,i])=>({code:t,count:i}))}_classify(e){let t=e.code||"";return["E010","E011","E020","E021"].includes(t)?D.SYNTAX:["INVALID_PIN","PIN_NOT_PWM","ANALOG_ONLY","NOT_OUTPUT","BUS_RESERVED","PIN_EXCLUSIVE"].includes(t)?D.HARDWARE:t==="INFINITE_LOOP"||t==="STACK_OVERFLOW"?D.RUNTIME:t==="MODE_NOT_SET"?D.HARDWARE:D.LOGIC}_title(e){return{INVALID_PIN:"Pin no existe en ROBOARD",PIN_NOT_PWM:"Este pin no tiene PWM",ANALOG_ONLY:"Pin solo anal\xF3gico",NOT_OUTPUT:"Pin configurado como INPUT",MODE_NOT_SET:"Pin sin configurar",BUS_RESERVED:"Pin reservado por bus I\xB2C",PIN_EXCLUSIVE:"Pin exclusivo del driver",INFINITE_LOOP:"Loop infinito detectado",STACK_OVERFLOW:"Recursi\xF3n infinita detectada"}[e.code]||"Error en el firmware"}_explain(e,t){let r={INVALID_PIN:a=>`El pin '${a.pin}' no existe en ROBOARD. Los pines disponibles son D0-D13 (digitales) y A0-A7 (anal\xF3gicos). Verific\xE1 si el n\xFAmero de pin es correcto o si necesit\xE1s un #define.`,PIN_NOT_PWM:a=>`analogWrite() necesita un pin con capacidad PWM. En ROBOARD, solo D3 (PWMA) y D9 (PWMB) tienen PWM. Si us\xE1s ${a.pin} para otra funci\xF3n, no pod\xE9s controlarlo con analogWrite().`,ANALOG_ONLY:a=>`${a.pin} es un pin SOLO ANAL\xD3GICO en el Arduino Nano. Solo puede usarse con analogRead(). En SOLID-4R, A6 se usa para el QTR porque solo necesita analogRead().`,MODE_NOT_SET:a=>`Llamaste a digitalWrite(${a.pin}) sin configurar el pin antes. En Arduino, los pines digitales necesitan pinMode(${a.pin}, OUTPUT) en setup(). Los pines anal\xF3gicos (A0-A7) NO necesitan pinMode() para analogRead().`,NOT_OUTPUT:a=>`${a.pin} est\xE1 configurado como INPUT pero est\xE1s intentando escribirle. Cambi\xE1 a pinMode(${a.pin}, OUTPUT) en setup().`,BUS_RESERVED:a=>`${a.pin} est\xE1 siendo usado por el bus I\xB2C (Wire). Con Wire.begin() activo, A4(SDA) y A5(SCL) no pueden usarse como GPIO.`,INFINITE_LOOP:()=>"El programa ejecut\xF3 demasiadas instrucciones sin delay(). Esto pasa cuando un while() o el mismo loop() corre sin pausa. Agreg\xE1 delay(20) al final de loop() para que el sistema pueda procesar otras tareas."}[e.code];return r?r(e):e.message||"Error desconocido."}_suggest(e,t,i){return{INVALID_PIN:"Revis\xE1 el n\xFAmero de pin. Si us\xE1s #define, verific\xE1 que el valor sea correcto para ROBOARD.",PIN_NOT_PWM:"Para controlar velocidad, us\xE1 analogWrite(PWMA, vel) donde PWMA=3, o analogWrite(PWMB, vel) donde PWMB=9.",ANALOG_ONLY:"Us\xE1 analogRead(A6) para leer el QTR. No intentes digitalWrite ni digitalRead en A6 o A7.",MODE_NOT_SET:`Agreg\xE1 pinMode(${e.pin||"pin"}, OUTPUT) en setup() antes de usar digitalWrite().`,NOT_OUTPUT:`Cambi\xE1 a pinMode(${e.pin||"pin"}, OUTPUT) si quer\xE9s escribir en ese pin.`,INFINITE_LOOP:"Agreg\xE1 delay(20); al final de loop(). Tambi\xE9n revis\xE1 si hay while() sin condici\xF3n de salida.",BUS_RESERVED:"Si necesit\xE1s I\xB2C, no uses A4 ni A5 como GPIO. Si no us\xE1s I\xB2C, remov\xE9 Wire.begin()."}[e.code]||"Revis\xE1 el c\xF3digo y consult\xE1 la referencia de ROBOARD."}_pedagogicalValue(e){let t=["MODE_NOT_SET","PIN_NOT_PWM","ANALOG_ONLY","INFINITE_LOOP"],i=["INVALID_PIN","NOT_OUTPUT","BUS_RESERVED"];return t.includes(e.code)?"high":i.includes(e.code)?"medium":"low"}},Ne=class{generateForChallenge(e,t,i){if(!e||!e.hints)return null;let r=(e.objectives||[]).filter(l=>l.required!==!1).find(l=>!i.has(l.id));if(!r)return null;let a=e.hints[r.id];if(!a||a.length===0)return null;let n=t&&t.runCount||0,s=Math.min(n,a.length-1);return{objectiveId:r.id,objectiveLabel:r.label,hint:a[s],moreHints:a.length>s+1}}};Pt.exports={DiagnosticEngine:Ce,HintGenerator:Ne,ERROR_CLASS:D,SEVERITY:Pe}});var Ue=m((on,Ct)=>{"use strict";var we=class{constructor(e){this._platform=e}validate(e){let t={ok:!0,errors:[],warnings:[],hints:[],metrics:{}};if(!e||!e.trim())return t.ok=!1,t.errors.push(this._issue("E001","error","El sketch est\xE1 vac\xEDo.")),t;let i=e.split(`
`),r=this._extractMetrics(e,i);return t.metrics=r,this._checkSyntax(e,i,t),t.errors.length>0?(t.ok=!1,t):(this._checkStructure(r,t),this._checkHardware(r,i,t),this._checkPedagogy(r,t),t.ok=t.errors.length===0,t)}_extractMetrics(e,t){let i=this._removeComments(e),r=this._extractCalls(i),a=r.filter(f=>f.fn==="digitalWrite"),n=r.filter(f=>f.fn==="pinMode"),s=r.filter(f=>f.fn==="analogWrite"),l=r.filter(f=>f.fn==="analogRead"),u=r.filter(f=>f.fn==="delay"||f.fn==="delayMicroseconds"),c=r.filter(f=>f.fn.startsWith("Serial")),p=r.filter(f=>f.fn==="Wire.begin"||f.fn==="Wire"),E=r.filter(f=>f.fn==="pulseIn"),h=i.match(/void\s+loop\s*\(\s*\)([\s\S]*?)\n}/),y=h?h[1]:"",L=/\bdelay\s*\(/.test(y)||/\bdelayMicroseconds\s*\(/.test(y),w=/while\s*\(\s*(1|true)\s*\)/.test(i)||/for\s*\(\s*;;\s*\)/.test(i),ie={};for(let f of e.matchAll(/#define\s+(\w+)\s+([\d.]+)/g))ie[f[1]]=parseFloat(f[2]);return{hasSetup:/void\s+setup\s*\(/.test(i),hasLoop:/void\s+loop\s*\(/.test(i),loopHasDelay:L,hasInfiniteLoop:w,pinModeCalls:n,digitalWriteCalls:a,analogWriteCalls:s,analogReadCalls:l,delayCalls:u,serialCalls:c,i2cCalls:p,pulseInCalls:E,usesSerial:c.length>0,usesI2C:p.length>0,defineCount:Object.keys(ie).length,defines:ie,functionCount:(i.match(/\bvoid\s+\w+\s*\(/g)||[]).length,allCalls:r}}_extractCalls(e){let t=[],i=/\b([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_]+)?)\s*\(([^)]*)\)/g,r;for(;(r=i.exec(e))!==null;){let a=r[2].split(",").map(n=>n.trim()).filter(Boolean);t.push({fn:r[1],args:a,pos:r.index})}return t}_removeComments(e){return e.replace(/\/\*[\s\S]*?\*\//g,"").replace(/\/\/[^\r\n]*/g,"")}_checkSyntax(e,t,i){let r=0,a=0;for(let l of e)l==="{"?r++:l==="}"&&a++;r!==a&&i.errors.push(this._issue("E010","error",`Llaves desbalanceadas: ${r} '{' y ${a} '}'. Revis\xE1 que cada bloque if/for/while/funci\xF3n est\xE9 correctamente cerrado.`));let n=0,s=0;for(let l of e)l==="("?n++:l===")"&&s++;n!==s&&i.errors.push(this._issue("E011","error",`Par\xE9ntesis desbalanceados: ${n} '(' y ${s} ')'. Revis\xE1 las llamadas a funciones y condiciones.`))}_checkStructure(e,t){e.hasSetup||t.errors.push(this._issue("E020","error","Falta la funci\xF3n void setup(). Todo sketch Arduino necesita setup() para configurar los pines.")),e.hasLoop||t.errors.push(this._issue("E021","error","Falta la funci\xF3n void loop(). El bucle principal loop() es donde va la l\xF3gica continua del robot."))}_checkHardware(e,t,i){let r=this._platform;if(r){for(let a of e.pinModeCalls){let n=this._resolvePinArg(a.args[0],e.defines,r);n&&!r.pins[n]&&i.warnings.push(this._issue("W010","warning",`El pin '${a.args[0]}' (${n}) no existe en ${r.name}. Verific\xE1 el pinout de la placa.`,{pin:n}))}for(let a of e.analogWriteCalls){let n=this._resolvePinArg(a.args[0],e.defines,r);if(n){let s=r.pins[n];s&&!s.pwm&&i.warnings.push(this._issue("W020","warning",`analogWrite(${a.args[0]}) \u2192 pin ${n} no tiene capacidad PWM en ${r.name}. En ROBOARD los pines PWM son D3 y D9 (motores). analogWrite en pin digital no hace nada \xFAtil.`,{pin:n}))}}for(let a of e.analogReadCalls){let n=a.args[0],s=this._resolvePinArgAnalog(n,e.defines,r);s&&r.pins[s]&&!r.pins[s].analog&&i.warnings.push(this._issue("W021","warning",`analogRead(${n}) \u2192 pin ${s} no es anal\xF3gico. En ROBOARD us\xE1 los pines A0\u2013A7 para leer sensores anal\xF3gicos.`,{pin:s}))}if(r.id==="ROBOARD"){let n=e.digitalWriteCalls.filter(l=>this._resolvePinArg(l.args[0],e.defines,r)==="D6").some(l=>{let u=l.args[1];return u==="1"||u==="HIGH"||u==="true"});(e.digitalWriteCalls.some(l=>{let u=this._resolvePinArg(l.args[0],e.defines,r);return["D4","D5","D7","D8"].includes(u)})||e.analogWriteCalls.some(l=>{let u=this._resolvePinArg(l.args[0],e.defines,r);return["D3","D9"].includes(u)}))&&!n&&i.warnings.push(this._issue("W030","warning","Us\xE1s los pines de motor (D3-D9) pero nunca activ\xE1s STBY (D6) con HIGH. El TB6612FNG necesita digitalWrite(STBY_PIN, HIGH) para habilitar los motores. Sin STBY=HIGH los motores no van a responder."))}if(e.usesI2C){let a=["A4","A5"];for(let n of[...e.digitalWriteCalls,...e.analogWriteCalls]){let s=this._resolvePinArg(n.args[0],e.defines,r);a.includes(s)&&i.warnings.push(this._issue("W040","warning",`Pin ${s} est\xE1 siendo usado como GPIO pero tambi\xE9n como bus I\xB2C. Con Wire.begin() activo, A4(SDA) y A5(SCL) quedan reservados.`,{pin:s}))}}for(let a of[...e.digitalWriteCalls,...e.pinModeCalls.filter(n=>n.args[1]==="OUTPUT")]){let n=this._resolvePinArg(a.args[0],e.defines,r);["A6","A7"].includes(n)&&i.warnings.push(this._issue("W050","warning","A6 y A7 en el Arduino Nano son SOLO anal\xF3gicos. No se pueden usar con digitalWrite() ni como OUTPUT. En SOLID-4R, el QTR est\xE1 en A6 precisamente porque solo necesita analogRead().",{pin:n}))}}}_checkPedagogy(e,t){!e.loopHasDelay&&!e.hasInfiniteLoop&&t.hints.push(this._issue("H001","hint","El bucle loop() no tiene delay(). El microcontrolador ejecutar\xE1 el c\xF3digo miles de veces por segundo. Consider\xE1 agregar delay(10) al final de loop() para dar tiempo al sistema a procesar otras tareas."));let i=e.delayCalls.filter(a=>{let n=parseFloat(a.args[0]);return!isNaN(n)&&n>2e3});i.length>0&&t.hints.push(this._issue("H002","hint",`delay(${i[0].args[0]}) bloquea el microcontrolador por ${i[0].args[0]}ms. Durante ese tiempo el robot no puede leer sensores. Para comportamiento reactivo, us\xE1 delays cortos (20\u2013100ms) o el patr\xF3n millis().`)),e.usesSerial===!1&&e.functionCount>0&&t.hints.push(this._issue("H003","hint","Tu sketch no usa Serial.println(). Agregar Serial.println(analogRead(A0)) en loop() te permite ver los valores del sensor en tiempo real en el Serial Monitor."));let r=this._findMagicPinNumbers(e);r.length>0&&t.hints.push(this._issue("H004","hint",`Us\xE1s n\xFAmeros directamente para pines (${r.join(", ")}). Es mejor definirlos con #define: #define LED 10. As\xED el c\xF3digo es m\xE1s claro y f\xE1cil de modificar.`)),e.defineCount===0&&e.allCalls.length>3&&t.hints.push(this._issue("H005","hint","Tu sketch no usa #define para constantes. Definir los n\xFAmeros m\xE1gicos como constantes hace el c\xF3digo m\xE1s legible y mantenible."))}_resolvePinArg(e,t,i){if(!e)return null;let r=e.trim();if(i.pins[r])return r;if(t&&r in t){let s="D"+t[r];if(i.pins[s])return s}let a=parseInt(r);return isNaN(a)?null:"D"+a}_resolvePinArgAnalog(e,t,i){if(!e)return null;let r=e.trim();if(i.pins[r])return r;if(t&&r in t){let a=t[r];if(!isNaN(a)&&a<=7)return"A"+a}return null}_findMagicPinNumbers(e){let t=new Set,i=new Set(Object.keys(e.defines||{}));for(let r of e.allCalls)if(["pinMode","digitalWrite","digitalRead","analogRead","analogWrite"].includes(r.fn)){let a=(r.args[0]||"").trim();/^\d+$/.test(a)&&!i.has(a)&&t.add(a)}return[...t]}_issue(e,t,i,r={}){return{code:e,severity:t,message:i,...r}}};Ct.exports={RuntimeValidator:we}});var Z=m((nn,wt)=>{"use strict";var Nt={ScenarioDefinition:{required:["id","name","platformId"],optional:["description","canvas","robot","obstacles","track","boundaries","tags","sensorProfile"],fields:{id:{type:"string",pattern:/^[a-z][a-z0-9-]*$/},name:{type:"string",minLen:3},platformId:{type:"string",enum:["ROBOARD","FRANKY","PLC_CORE_MDE","any"]},description:{type:"string"},canvas:{type:"object",fields:{width:{type:"number",min:400,max:2e3},height:{type:"number",min:300,max:1200}}},robot:{type:"object",fields:{start:{type:"object",fields:{x:{type:"number",min:0,max:1,note:"fraction of canvas width"},y:{type:"number",min:0,max:1},angle:{type:"number"}}}}},obstacles:{type:"array",itemFields:{id:{type:"string"},x:{type:"number",min:0,max:1},y:{type:"number",min:0,max:1},w:{type:"number",min:.01,max:.5},h:{type:"number",min:.01,max:.5},draggable:{type:"boolean"},label:{type:"string"}}},track:{type:"object",fields:{type:{type:"string",enum:["line","arena","grid","none"]},image:{type:"string"}}},boundaries:{type:"string",enum:["wall","wrap","none"]},tags:{type:"array",itemType:"string"}}},ChallengeDefinition:{required:["id","name","scenarioId","platformId","objectives"],optional:["description","sketch","timeLimit","tags","hints","theory"],fields:{id:{type:"string",pattern:/^[a-z][a-z0-9-]*$/},name:{type:"string",minLen:3},scenarioId:{type:"string"},platformId:{type:"string",enum:["ROBOARD","FRANKY","PLC_CORE_MDE","any"]},description:{type:"string"},sketch:{type:"string",note:"Starting sketch (null=blank)"},timeLimit:{type:"number",min:0,note:"ms, null=unlimited"},tags:{type:"array",itemType:"string"},objectives:{type:"array",minItems:1,itemFields:{id:{type:"string",required:!0},label:{type:"string",required:!0},type:{type:"string",required:!0,enum:["gpio_high","gpio_low","motor_forward","motor_stop","motor_reverse","sensor_below","sensor_above","robot_moved","robot_stopped","robot_near_obstacle","serial_printed","code_contains","no_runtime_error","led_on","led_off","custom"]},params:{type:"object"},required:{type:"boolean"},hidden:{type:"boolean"},order:{type:"number"}}},hints:{type:"object",note:"{ objectiveId: string[] }"}}},LessonDefinition:{required:["id","name","platformId","moments"],optional:["description","duration","tags","startChallenge","startScenario"],fields:{id:{type:"string",pattern:/^[a-z][a-z0-9-]*$/},name:{type:"string",minLen:3},platformId:{type:"string"},description:{type:"string"},duration:{type:"string",note:'e.g. "4 m\xF3dulos \xD7 40 min"'},moments:{type:"array",minItems:1,itemFields:{id:{type:"string",required:!0},label:{type:"string",required:!0},description:{type:"string"},challenge:{type:"string",note:"challengeId"},scenario:{type:"string",note:"scenarioId"},revealComponents:{type:"array",itemType:"string"},brokenSketch:{type:"boolean",note:"Inject a deliberate bug for debugging pedagogy"}}},startChallenge:{type:"string"},startScenario:{type:"string"},tags:{type:"array",itemType:"string"}}},TheoryBlockDefinition:{required:["id","type","content"],optional:["title","trigger","displayMode","linkedConcepts"],fields:{id:{type:"string"},type:{type:"string",enum:["text","formula","diagram","animation","comparison","code_example"]},title:{type:"string"},content:{type:"object",note:"type-specific content payload"},trigger:{type:"object",note:"when to show this block { event, condition }"},displayMode:{type:"string",enum:["inline","tooltip","panel","modal"]},linkedConcepts:{type:"array",itemType:"string",note:"concept IDs for future knowledge graph"}}}};function Lt(o,e){let t=Nt[o];if(!t)return{ok:!1,errors:["Unknown schema: "+o],warnings:[]};let i=[],r=[];for(let a of t.required)(e[a]===void 0||e[a]===null||e[a]==="")&&i.push(`Campo requerido faltante: '${a}'`);if(t.fields)for(let[a,n]of Object.entries(t.fields)){let s=e[a];s!=null&&(n.type==="string"&&typeof s!="string"&&i.push(`'${a}' debe ser string`),n.type==="number"&&typeof s!="number"&&i.push(`'${a}' debe ser n\xFAmero`),n.type==="boolean"&&typeof s!="boolean"&&r.push(`'${a}' deber\xEDa ser boolean`),n.type==="array"&&!Array.isArray(s)&&i.push(`'${a}' debe ser array`),n.type==="string"&&n.pattern&&!n.pattern.test(s)&&i.push(`'${a}': formato inv\xE1lido. Usar kebab-case (ej: mi-desafio-1)`),n.type==="string"&&n.minLen&&s.length<n.minLen&&i.push(`'${a}' muy corto (m\xEDnimo ${n.minLen} caracteres)`),n.type==="string"&&n.enum&&!n.enum.includes(s)&&i.push(`'${a}' debe ser uno de: ${n.enum.join(", ")}`),n.type==="number"&&n.min!==void 0&&s<n.min&&i.push(`'${a}' debe ser >= ${n.min}`),n.type==="number"&&n.max!==void 0&&s>n.max&&i.push(`'${a}' debe ser <= ${n.max}`),n.type==="array"&&n.minItems&&s.length<n.minItems&&i.push(`'${a}' debe tener al menos ${n.minItems} elementos`),n.type==="array"&&n.itemFields&&Array.isArray(s)&&s.forEach((l,u)=>{for(let[c,p]of Object.entries(n.itemFields))p.required&&(l[c]===void 0||l[c]===null)&&i.push(`'${a}[${u}].${c}' es requerido`),p.enum&&l[c]!==void 0&&!p.enum.includes(l[c])&&i.push(`'${a}[${u}].${c}' debe ser uno de: ${p.enum.join(", ")}`)}))}if(o==="ChallengeDefinition"&&e.objectives){let a=e.objectives.map(l=>l.id),n=new Set(a);a.length!==n.size&&i.push("Los objectives deben tener IDs \xFAnicos"),e.objectives.filter(l=>l.required!==!1).length===0&&r.push("Ning\xFAn objective es requerido. El desaf\xEDo nunca se completar\xE1 autom\xE1ticamente.")}if(o==="ScenarioDefinition"&&e.obstacles)for(let a of e.obstacles)a.x+a.w>1.1&&r.push(`Obst\xE1culo '${a.id}' puede salirse del canvas (x+w=${(a.x+a.w).toFixed(2)})`),a.y+a.h>1.1&&r.push(`Obst\xE1culo '${a.id}' puede salirse del canvas (y+h=${(a.y+a.h).toFixed(2)})`);return{ok:i.length===0,errors:i,warnings:r}}function cr(o,e){let t=e.map(i=>({id:i.id,...Lt(o,i)}));return{ok:t.every(i=>i.ok),results:t}}wt.exports={SCHEMAS:Nt,validate:Lt,validateMany:cr}});var qe=m((ln,Ut)=>{"use strict";var{validate:ur,validateMany:sn}=Z(),X=class{constructor(){this._scenarios=new Map,this._challenges=new Map,this._lessons=new Map,this._theory=new Map,this._loadErrors=[],this._loadWarnings=[]}load(e){return this._loadErrors=[],this._loadWarnings=[],e.scenarios&&this._loadItems("ScenarioDefinition",e.scenarios,this._scenarios),e.challenges&&this._loadItems("ChallengeDefinition",e.challenges,this._challenges),e.lessons&&this._loadItems("LessonDefinition",e.lessons,this._lessons),e.theory&&this._loadItems("TheoryBlockDefinition",e.theory,this._theory),this._validateCrossRefs(),{ok:this._loadErrors.length===0,errors:[...this._loadErrors],warnings:[...this._loadWarnings]}}_loadItems(e,t,i){for(let r of t){if(!r.id){this._loadErrors.push(`[${e}] Item sin id: ${JSON.stringify(r).slice(0,50)}`);continue}let a=ur(e,r);a.ok?(this._loadWarnings.push(...a.warnings.map(n=>`[${e}:${r.id}] \u26A0 ${n}`)),i.set(r.id,r)):this._loadErrors.push(...a.errors.map(n=>`[${e}:${r.id}] ${n}`))}}_validateCrossRefs(){for(let[e,t]of this._challenges)t.scenarioId&&!this._scenarios.has(t.scenarioId)&&this._loadWarnings.push(`[ChallengeDefinition:${e}] scenarioId '${t.scenarioId}' no encontrado en scenarios`);for(let[e,t]of this._lessons)for(let i of t.moments||[])i.challenge&&!this._challenges.has(i.challenge)&&this._loadWarnings.push(`[LessonDefinition:${e}] momento '${i.id}' referencia challenge '${i.challenge}' no encontrado`),i.scenario&&!this._scenarios.has(i.scenario)&&this._loadWarnings.push(`[LessonDefinition:${e}] momento '${i.id}' referencia scenario '${i.scenario}' no encontrado`)}getScenario(e){return this._scenarios.get(e)||null}getChallenge(e){return this._challenges.get(e)||null}getLesson(e){return this._lessons.get(e)||null}getTheory(e){return this._theory.get(e)||null}listScenarios(e={}){return this._filtered(this._scenarios,e)}listChallenges(e={}){return this._filtered(this._challenges,e)}listLessons(e={}){return this._filtered(this._lessons,e)}_filtered(e,t){let i=[...e.values()];return t.platformId&&(i=i.filter(r=>r.platformId===t.platformId||r.platformId==="any")),t.tag&&(i=i.filter(r=>Array.isArray(r.tags)&&r.tags.includes(t.tag))),t.scenarioId&&(i=i.filter(r=>r.scenarioId===t.scenarioId)),i.map(r=>({id:r.id,name:r.name,description:r.description||"",platformId:r.platformId,tags:r.tags||[]}))}getStats(){return{scenarios:this._scenarios.size,challenges:this._challenges.size,lessons:this._lessons.size,theory:this._theory.size,errors:this._loadErrors.length,warnings:this._loadWarnings.length}}getLoadReport(){return{errors:[...this._loadErrors],warnings:[...this._loadWarnings]}}},pr=new X;Ut.exports={ContentRegistry:X,defaultRegistry:pr}});var Be=m((dn,qt)=>{"use strict";var{SeededRNG:mr}=P(),hr=new mr(Date.now());function T(o){let e=Math.floor(hr.next()*9e3+1e3);return`${o}-${e}`}var gr={scenario:{openArena(o={}){let e=o.obstacles??2,t=Array.from({length:e},(i,r)=>({id:`obs-${r+1}`,x:.3+r*.25,y:.3+r%2*.3,w:.07,h:.12,draggable:!0,label:`Obst\xE1culo ${r+1}`}));return{id:o.id||T("scenario"),name:o.name||"Arena Abierta",description:o.description||"Campo abierto con obst\xE1culos m\xF3viles.",platformId:o.platformId||"ROBOARD",canvas:{width:o.width||800,height:o.height||500},robot:{start:{x:o.robotX||.2,y:.5,angle:0}},obstacles:t,track:{type:"none"},boundaries:"wall",tags:o.tags||[]}},lineFollower(o={}){return{id:o.id||T("scenario"),name:o.name||"Pista Seguidor de L\xEDnea",description:"Arena con pista para seguidor de l\xEDnea.",platformId:o.platformId||"ROBOARD",canvas:{width:800,height:500},robot:{start:{x:.1,y:.5,angle:0}},obstacles:[],track:{type:"line",image:o.trackImage||null},boundaries:"wall",tags:[...o.tags||[],"line-following"]}},sumoRing(o={}){return{id:o.id||T("scenario"),name:o.name||"Ring de Minisumo",description:"Ring circular para minisumo. El robot debe mantenerse dentro del ring.",platformId:o.platformId||"ROBOARD",canvas:{width:600,height:600},robot:{start:{x:.35,y:.5,angle:0}},obstacles:[{id:"opponent",x:.55,y:.42,w:.08,h:.08,draggable:!0,label:"Oponente"}],track:{type:"arena"},boundaries:"wall",tags:[...o.tags||[],"minisumo","lnr"]}}},challenge:{detectAndStop(o={}){let e=o.threshold||350;return{id:o.id||T("challenge"),name:o.name||"Detectar y Parar",description:o.description||`El robot debe detenerse al detectar un obst\xE1culo (sensor < ${e}).`,scenarioId:o.scenarioId||"single-obstacle",platformId:o.platformId||"ROBOARD",sketch:o.sketch||null,timeLimit:o.timeLimit||null,tags:o.tags||["reactive"],objectives:[{id:"motors-enabled",label:"Driver TB6612FNG habilitado (STBY=HIGH)",type:"gpio_high",params:{pin:"D6"},required:!0,hidden:!1},{id:"robot-moves",label:"Robot avanza hacia adelante",type:"motor_forward",params:{motor:"A"},required:!0,hidden:!1},{id:"robot-stops",label:"Robot se detiene al detectar obst\xE1culo",type:"motor_stop",params:{},required:!0,hidden:!1}],hints:{"motors-enabled":["Us\xE1 digitalWrite(STBY, HIGH) en setup() para habilitar el TB6612FNG."],"robot-moves":["Configur\xE1 AIN1=HIGH, AIN2=LOW y analogWrite(PWMA, velocidad)."],"robot-stops":[`Le\xE9 el sensor con analogRead(A0). Si es menor que ${e}, deten\xE9 los motores.`]}}},exploration(o={}){return{id:o.id||T("challenge"),name:o.name||"Exploraci\xF3n Libre",description:o.description||"Sin objetivo fijo. Experiment\xE1 con el hardware.",scenarioId:o.scenarioId||"empty-arena",platformId:o.platformId||"ROBOARD",sketch:o.sketch||null,timeLimit:null,tags:[...o.tags||[],"exploration"],objectives:[{id:"robot-moves",label:"Robot se mueve",type:"motor_forward",params:{motor:"A"},required:!0,hidden:!1}],hints:{}}}},lesson:{reactiveRobot(o={}){return{id:o.id||T("lesson"),name:o.name||"Robot Reactivo",description:o.description||"El estudiante descubre la causalidad sensor\u2192decisi\xF3n\u2192acci\xF3n.",platformId:o.platformId||"ROBOARD",duration:o.duration||"4 m\xF3dulos \xD7 40 min",tags:o.tags||["unit1","foundations"],startChallenge:o.startChallenge||null,startScenario:o.startScenario||"single-obstacle",moments:[{id:"observe",label:"Observar",description:"El robot ya funciona. Observ\xE1 c\xF3mo reacciona al entorno.",revealComponents:["CANVAS","SENSOR_HUD"],scenario:o.startScenario||"single-obstacle"},{id:"discover",label:"Descubrir se\xF1ales",description:"Explor\xE1 los valores del sensor al mover obst\xE1culos.",revealComponents:["CANVAS","SENSOR_HUD","SIGNAL_CARDS"],scenario:o.startScenario||"single-obstacle"},{id:"understand",label:"Entender el c\xF3digo",description:"El robot tiene un bug. Encontralo y corregilo.",revealComponents:["CANVAS","SENSOR_HUD","CODE_VIEW","GPIO_INSPECTOR"],brokenSketch:!0},{id:"create",label:"Crear",description:"Modific\xE1 el sketch para que el robot gire en lugar de parar.",revealComponents:["CANVAS","CODE_EDITOR","GPIO_INSPECTOR","SERIAL","MOTOR_PANEL"],challenge:o.startChallenge||null,scenario:o.extendedScenario||"obstacle-arena"}]}}},toJSON(o){return JSON.stringify(o,null,2)},generatePackage(o,e={}){let t=e.platformId||"ROBOARD",i=e.scenarioId||T("scenario"),r=e.challengeId||T("challenge"),a=e.lessonId||T("lesson"),n=this.scenario.openArena({id:i,name:o+" \u2014 Arena",platformId:t}),s=this.challenge.detectAndStop({id:r,name:o,scenarioId:i,platformId:t}),l=this.lesson.reactiveRobot({id:a,name:o,startChallenge:r,startScenario:i,platformId:t});return{scenarios:[n],challenges:[s],lessons:[l]}}};qt.exports={TemplateEngine:gr}});var We=m((cn,Bt)=>{"use strict";var J=class{constructor(){this._stores={}}_store(e){return this._stores[e]||(this._stores[e]=new Map)}get(e,t){return this._store(e).get(t)??null}set(e,t,i){this._store(e).set(t,JSON.parse(JSON.stringify(i)))}delete(e,t){this._store(e).delete(t)}list(e,t){let i=[...this._store(e).values()];return t?i.filter(r=>Object.entries(t).every(([a,n])=>r[a]===n)):i}clear(e){this._store(e).clear()}},ee=class{constructor(e="robolab",t=1){this._dbName=e,this._version=t,this._db=null,this._stores=["students","projects","progress"]}async _open(){return this._db?this._db:new Promise((e,t)=>{let i=indexedDB.open(this._dbName,this._version);i.onupgradeneeded=r=>{let a=r.target.result;for(let n of this._stores)a.objectStoreNames.contains(n)||a.createObjectStore(n,{keyPath:"id"})},i.onsuccess=r=>{this._db=r.target.result,e(this._db)},i.onerror=r=>t(r.target.error)})}async get(e,t){let i=await this._open();return new Promise((r,a)=>{let s=i.transaction(e,"readonly").objectStore(e).get(t);s.onsuccess=()=>r(s.result??null),s.onerror=()=>a(s.error)})}async set(e,t,i){let r=await this._open();return new Promise((a,n)=>{let l=r.transaction(e,"readwrite").objectStore(e).put({...i,id:t});l.onsuccess=()=>a(),l.onerror=()=>n(l.error)})}async delete(e,t){let i=await this._open();return new Promise((r,a)=>{let s=i.transaction(e,"readwrite").objectStore(e).delete(t);s.onsuccess=()=>r(),s.onerror=()=>a(s.error)})}async list(e,t){let i=await this._open();return new Promise((r,a)=>{let s=i.transaction(e,"readonly").objectStore(e).getAll();s.onsuccess=()=>{let l=s.result;t&&(l=l.filter(u=>Object.entries(t).every(([c,p])=>u[c]===p))),r(l)},s.onerror=()=>a(s.error)})}async clear(e){let t=await this._open();return new Promise((i,r)=>{let n=t.transaction(e,"readwrite").objectStore(e).clear();n.onsuccess=()=>i(),n.onerror=()=>r(n.error)})}},He=class{constructor(e){this._db=e||(typeof indexedDB<"u"?new ee:new J),this._currentStudent=null}async createStudent(e,t,i){let r="s_"+Date.now()+"_"+Math.random().toString(36).slice(2,6),a={id:r,name:e,alias:t||e,color:i||this._randomColor(),createdAt:Date.now(),lastActiveAt:Date.now(),version:1};return await this._db.set("students",r,a),a}async getStudent(e){return await this._db.get("students",e)}async listStudents(){return await this._db.list("students")}async setCurrentStudent(e){let t=await this.getStudent(e);if(!t)throw new Error("Student not found: "+e);return this._currentStudent=t,t.lastActiveAt=Date.now(),await this._db.set("students",e,t),t}getCurrentStudent(){return this._currentStudent}requireStudent(){if(!this._currentStudent)throw new Error("No student selected. Call setCurrentStudent() first.");return this._currentStudent}async saveProject(e,t,i,r={}){let a=this.requireStudent(),n=`proj_${a.id}_${e}_${Date.now()}`,s={id:n,studentId:a.id,challengeId:e,scenarioId:t,sketchCode:i,savedAt:Date.now(),runCount:r.runCount||0,lastRunAt:r.lastRunAt||null,simTimeTotalMs:r.simTimeTotalMs||0,platformId:r.platformId||"ROBOARD",title:r.title||`${e} \u2014 ${new Date().toLocaleDateString()}`};return await this._db.set("projects",n,s),s}async getLatestProject(e){let t=this.requireStudent(),i=await this._db.list("projects",{studentId:t.id,challengeId:e});return i.length?i.sort((r,a)=>a.savedAt-r.savedAt)[0]:null}async listProjects(e={}){let t=this.requireStudent();return await this._db.list("projects",{studentId:t.id,...e})}async recordObjectiveCompletion(e,t,i){let r=this.requireStudent(),a=`prog_${r.id}_${e}_${t}`,n=await this._db.get("progress",a)||{},s={id:a,studentId:r.id,challengeId:e,objectiveId:t,completedAt:Date.now(),firstCompletedAt:n.firstCompletedAt||Date.now(),attempts:(n.attempts||0)+1,simTime:i};return await this._db.set("progress",a,s),s}async recordChallengeCompletion(e,t,i){return this.recordObjectiveCompletion(e,"__challenge_complete__",t)}async getProgress(e){let t=this.requireStudent();return await this._db.list("progress",{studentId:t.id,challengeId:e})}async getAllProgress(){let e=this.requireStudent();return await this._db.list("progress",{studentId:e.id})}async exportBundle(){let e=this.requireStudent(),t=await this.listProjects(),i=await this.getAllProgress(),r={version:1,exportedAt:Date.now(),student:{...e},projects:t.map(a=>({challengeId:a.challengeId,title:a.title,savedAt:a.savedAt,runCount:a.runCount,simTimeTotalMs:a.simTimeTotalMs,sketchCode:a.sketchCode})),progress:i.map(a=>({challengeId:a.challengeId,objectiveId:a.objectiveId,completedAt:a.completedAt,attempts:a.attempts,simTime:a.simTime}))};return JSON.stringify(r,null,2)}async importBundle(e){let t;try{t=JSON.parse(e)}catch(a){return{ok:!1,error:"JSON inv\xE1lido: "+a.message}}if(!t.student||!t.version)return{ok:!1,error:"Bundle inv\xE1lido o corrupto."};let i=await this.createStudent(t.student.name,t.student.alias,t.student.color);await this.setCurrentStudent(i.id);let r={projects:0,progress:0};for(let a of t.projects||[])await this.saveProject(a.challengeId,null,a.sketchCode,{runCount:a.runCount,simTimeTotalMs:a.simTimeTotalMs,title:a.title}),r.projects++;for(let a of t.progress||[])await this.recordObjectiveCompletion(a.challengeId,a.objectiveId,a.simTime),r.progress++;return{ok:!0,student:i,imported:r}}async generateTeacherSummary(){let e=await this.listStudents(),t=[];for(let i of e){this._currentStudent=i;let r=await this.getAllProgress(),a=await this.listProjects(),n=r.filter(s=>s.objectiveId==="__challenge_complete__");t.push({studentId:i.id,name:i.name,alias:i.alias,lastActiveAt:i.lastActiveAt,challengesCompleted:n.length,totalProjects:a.length,totalRuntime:a.reduce((s,l)=>s+(l.simTimeTotalMs||0),0),recentActivity:r.sort((s,l)=>l.completedAt-s.completedAt).slice(0,3)})}return this._currentStudent=null,t.sort((i,r)=>r.lastActiveAt-i.lastActiveAt)}_randomColor(){let e=["#00d4bc","#f0a000","#ff3050","#18d464","#9b72f0","#3b82f6","#f97316"];return e[Math.floor(Math.random()*e.length)]}};Bt.exports={PersistenceEngine:He,MemoryStorage:J,IndexedDBStorage:ee}});var xt=m((un,Wt)=>{"use strict";var{TemplateEngine:O}=Be(),{validate:Ht}=Z(),xe=class o{constructor(e="ROBOARD"){this._p=e,this._sc=null,this._ch=null,this._sensors=[],this._hist=[],this._dirty=!1}setArenaType(e){this._push("sc",this._sc);let t={open:i=>O.scenario.openArena(i),corridor:i=>O.scenario.openArena({...i,obstacles:[{id:"wt",x:0,y:.05,w:1,h:.05,draggable:!1,label:"Pared"},{id:"wb",x:0,y:.9,w:1,h:.05,draggable:!1,label:"Pared"}]}),sumo_ring:i=>O.scenario.sumoRing(i),line_track:i=>O.scenario.lineFollower(i)}[e]||(i=>O.scenario.openArena(i));return this._sc=t({platformId:this._p}),this._dirty=!0,this}setObstacleCount(e){return this._sc||this.setArenaType("open"),this._push("sc",this._sc),this._sc={...this._sc,...O.scenario.openArena({platformId:this._p,obstacles:e})},this._dirty=!0,this}setRobotStart(e,t,i=0){return this._sc||this.setArenaType("open"),this._push("sc",this._sc),this._sc={...this._sc,robot:{start:{x:Math.max(.05,Math.min(.95,e)),y:Math.max(.05,Math.min(.95,t)),angle:i*Math.PI/180}}},this._dirty=!0,this}addObstacle(e,t,i=.07,r=.12,a=""){return this._sc||this.setArenaType("open"),this._push("sc",this._sc),this._sc={...this._sc,obstacles:[...this._sc.obstacles||[],{id:"obs_"+Date.now(),x:e,y:t,w:i,h:r,draggable:!0,label:a}]},this._dirty=!0,this}removeObstacle(e){return this._sc?(this._push("sc",this._sc),this._sc={...this._sc,obstacles:(this._sc.obstacles||[]).filter(t=>t.id!==e)},this._dirty=!0,this):this}addSensor(e,t,i={}){this._push("se",[...this._sensors]);let{normalizePosition:r}=V();return this._sensors=[...this._sensors,{id:`sensor_${t}_${e.toLowerCase()}`,typeId:e,mountPosition:r({x:i.x||18,y:i.y||0,z:i.z||0,yaw:i.yaw||i.angleOffset||0,pitch:i.pitch||0,roll:i.roll||0}),pins:e==="HC_SR04"?{trigger:i.trigger||"D13",echo:t}:{analog:t},config:i.config||{}}],this._dirty=!0,this}removeSensor(e){return this._push("se",[...this._sensors]),this._sensors=this._sensors.filter(t=>t.id!==e),this}clearSensors(){return this._push("se",[...this._sensors]),this._sensors=[],this}setChallengeName(e){return this._ensureCh(),this._push("ch",this._ch),this._ch={...this._ch,name:e},this}setThreshold(e){return this._ensureCh(),this._push("ch",this._ch),this._ch=O.challenge.detectAndStop({...this._ch,threshold:e,platformId:this._p}),this._dirty=!0,this}addObjective(e,t,i){this._ensureCh(),this._push("ch",this._ch);let r={id:"obj_"+Date.now(),label:i||e,type:e,params:t||{},required:!0,hidden:!1};return this._ch={...this._ch,objectives:[...this._ch.objectives||[],r]},this._dirty=!0,this}undo(){if(!this._hist.length)return!1;let{k:e,v:t}=this._hist.pop();return e==="sc"&&(this._sc=t),e==="ch"&&(this._ch=t),e==="se"&&(this._sensors=t),!0}validate(){let e=[],t=[];if(this._sc){let i=Ht("ScenarioDefinition",this._sc);e.push(...i.errors),t.push(...i.warnings)}if(this._ch){let i=Ht("ChallengeDefinition",this._ch);e.push(...i.errors),t.push(...i.warnings)}return this._sensors.length>6&&t.push("Muchos sensores pueden afectar el rendimiento."),{ok:e.length===0,errors:e,warnings:t}}build(){let e=this.validate();if(!e.ok)throw new Error("Sandbox inv\xE1lido: "+e.errors[0]);let t=this._sc||O.scenario.openArena({platformId:this._p}),i=this._ch||O.challenge.exploration({scenarioId:t.id,platformId:this._p});return{scenario:t,challenge:{...i,scenarioId:t.id},sensorProfile:{id:"sandbox_profile",name:"Sandbox",sensors:this._sensors},valid:!0,warnings:e.warnings}}export(){return JSON.stringify({version:1,platformId:this._p,scenario:this._sc,challenge:this._ch,sensorMounts:this._sensors,exportedAt:Date.now()},null,2)}static import(e){let t=JSON.parse(e),i=new o(t.platformId||"ROBOARD");return i._sc=t.scenario||null,i._ch=t.challenge||null,i._sensors=t.sensorMounts||[],i}static preset(e,t="ROBOARD"){let i={basic_obstacle:()=>new o(t).setArenaType("open").setObstacleCount(1).setThreshold(350),two_obstacles:()=>new o(t).setArenaType("open").setObstacleCount(2),corridor:()=>new o(t).setArenaType("corridor"),minisumo:()=>new o(t).setArenaType("sumo_ring")};if(!i[e])throw new Error("Unknown preset: "+e);return i[e]()}_push(e,t){this._hist.push({k:e,v:t}),this._hist.length>20&&this._hist.shift()}_ensureCh(){this._ch||(this._ch=O.challenge.exploration({platformId:this._p,scenarioId:this._sc?.id||"sandbox"}))}};Wt.exports={SandboxSession:xe}});var zt=m((pn,Gt)=>{"use strict";var Ge=class{constructor(){this._ticks=[],this._steps=[],this._errors=[],this._start=null,this._lastTickTs=null,this._maxSamples=300}attach(e){return this._start=Date.now(),this._unsubs=[],this._unsubs.push(e.on("SIM_TICK",t=>{let i=Date.now(),r=t.payload;this._lastTickTs&&(this._ticks.push({interval:i-this._lastTickTs,simTime:r.simTime}),this._ticks.length>this._maxSamples&&this._ticks.shift()),this._lastTickTs=i,r.metrics&&(this._steps.push({vmUs:r.metrics.vmUs||0,physUs:r.metrics.physUs||0,frameMs:r.metrics.frameMs||0}),this._steps.length>this._maxSamples&&this._steps.shift())})),this._unsubs.push(e.on("RUNTIME_ERROR",t=>this._errors.push({...t.payload,ts:Date.now()}))),this}detach(){for(let e of this._unsubs||[])e()}report(){let e=Date.now()-(this._start||Date.now()),t=this._ticks.map(u=>u.interval),i=this._avg(t),r=this._pct(t,95),a=i>0?1e3/i:0,n=this._ticks.length>0?this._ticks[this._ticks.length-1].simTime:0,s=this._steps.map(u=>u.vmUs),l=this._steps.map(u=>u.physUs);return{wallMs:e,simTimeTotal:n,speedRatio:e>0?n/e:0,observedFps:Math.round(a*10)/10,avgTickMs:Math.round(i*100)/100,p95TickMs:Math.round(r*100)/100,avgVmUs:Math.round(this._avg(s)),avgPhysUs:Math.round(this._avg(l)),avgFrameMs:Math.round(this._avg(this._steps.map(u=>u.frameMs))*100)/100,errorCount:this._errors.length,errors:[...this._errors],budget:{tickRateOk:a>45,vmBudgetOk:this._avg(s)<2e3,physBudgetOk:this._avg(l)<500}}}summary(e){let t=i=>i?"\u2713":"\u2717";return["\u2500\u2500 SimProfiler \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500",`Wall: ${(e.wallMs/1e3).toFixed(1)}s  Sim: ${(e.simTimeTotal/1e3).toFixed(1)}s  Ratio: ${e.speedRatio.toFixed(2)}\xD7`,`FPS: ${e.observedFps} (avg ${e.avgTickMs}ms, p95 ${e.p95TickMs}ms) ${t(e.budget.tickRateOk)}`,`VM/tick: ${e.avgVmUs}\xB5s ${t(e.budget.vmBudgetOk)}  Phys/tick: ${e.avgPhysUs}\xB5s ${t(e.budget.physBudgetOk)}`,`Errors: ${e.errorCount}`,"\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500"].join(`
`)}_avg(e){return e.length?e.reduce((t,i)=>t+i,0)/e.length:0}_pct(e,t){if(!e.length)return 0;let i=[...e].sort((r,a)=>r-a);return i[Math.min(Math.floor(t/100*i.length),i.length-1)]}},ze=class{constructor(){this._state="UNINITIALIZED",this._events=[],this._issues=[]}attach(e){let t=(i,r)=>e.on(i,a=>{this._events.push({type:i,ts:Date.now()}),r&&r(a),this._check()});return t("CONTENT_LOADED",()=>this._s("CONTENT_LOADED")),t("CHALLENGE_SELECTED",()=>this._s("CHALLENGE_SELECTED")),t("SKETCH_LOADED",()=>this._s("SKETCH_READY")),t("SIM_PLAYING",()=>this._s("RUNNING")),t("SIM_PAUSED",()=>this._s("PAUSED")),t("SIM_RESET",()=>this._s("IDLE")),t("RUNTIME_ERROR",i=>this._issues.push({ts:Date.now(),type:"RUNTIME_ERROR",code:i.payload.code})),t("SKETCH_ERROR",i=>this._issues.push({ts:Date.now(),type:"SKETCH_ERROR",errors:i.payload.errors})),this}_s(e){this._state=e}_check(){this._state==="RUNNING"&&!this._events.some(e=>e.type==="CONTENT_LOADED")&&this._issues.push({type:"LIFECYCLE_WARNING",msg:"Simulation started without loadContent()"})}getState(){return this._state}getIssues(){return[...this._issues]}getLog(){return[...this._events]}};Gt.exports={SimProfiler:Ge,LifecycleMonitor:ze}});var ke=m((mn,kt)=>{"use strict";var fr={id:"roboard-default",name:"ROBOARD \u2014 Configuraci\xF3n est\xE1ndar",sensors:[{id:"ir-front",typeId:"SHARP_2Y0A21",mountPosition:{x:18,y:0,angle:0},pins:{analog:"A0"},config:{}},{id:"ir-side",typeId:"SHARP_2Y0A21",mountPosition:{x:14,y:6,angle:.44},pins:{analog:"A1"},config:{}},{id:"qtr-center",typeId:"QTR_REFLECTIVE",mountPosition:{x:0,y:0,angle:0},pins:{analog:"A2"},config:{}}]},_r={id:"roboard-minisumo",name:"ROBOARD \u2014 Minisumo (HC-SR04)",sensors:[{id:"us-front",typeId:"HC_SR04",mountPosition:{x:18,y:0,angle:0},pins:{trigger:"D13",echo:"A3"},config:{}},{id:"us-right",typeId:"HC_SR04",mountPosition:{x:0,y:16,angle:1.5708},pins:{trigger:"D11",echo:"A1"},config:{}},{id:"qtr-edge",typeId:"QTR_REFLECTIVE",mountPosition:{x:0,y:0,angle:0},pins:{analog:"A6"},config:{}}]};kt.exports={ROBOARD_ROBOT_PROFILE:fr,ROBOARD_MINISUMO_PROFILE:_r}});var Ft=m((An,Vt)=>{"use strict";var{getPlatform:br}=W(),{VirtualHAL:hn,createDriver:gn,EventBus:vr}=H(),{PedagogicalVM:fn}=z(),{DifferentialDrive:_n}=k(),{SensorEngine:Ar,SENSOR_MODE:bn}=F(),{SeededRNG:Er}=P(),{TelemetryBus:yr,buildSnapshot:Ir}=Y(),{SignalRecorder:vn}=j(),{ScenarioEngine:Or}=Ie(),{ChallengeEngine:Tr}=Te(),{RevelationEngine:Sr,OBS:S,COMPONENT:Rr}=Me(),{TheoryEngine:Mr}=Q(),{DiagnosticEngine:Dr,HintGenerator:Pr}=Le(),{RuntimeValidator:Cr}=Ue(),{ContentRegistry:Nr}=qe(),{PersistenceEngine:Lr,MemoryStorage:wr}=We(),{SimSystem:Ur}=Ae(),Ve=class o{constructor(e,t={}){let i=br(e);if(!i)throw new Error("Unknown platform: "+e);this.eventBus=new vr,this.sim=new Ur(e),this._wireSimBus(this.sim),this.hal=this.sim.hal,this.vm=this.sim.vm,this.physics=this.sim.physics,this.driver=this.sim.driver;let r=new Er(t.rngSeed||42);this.sensors=new Ar(this.physics,{seed:t.rngSeed||42}),this.sensors.setHAL(this.hal),this.sim.sensors=this.sensors,this.sim._se=this.sensors,this.telemetry=new yr,this.content=new Nr,this.scenarios=new Or,this.challenges=new Tr,this.revelation=new Sr,this.revelation.setBus(this.eventBus),this.theory=new Mr,this.theory.setBus(this.eventBus),this.diagnostics=new Dr(i),this.hints=new Pr,this.validator=new Cr(i);let a=t.storage||(typeof indexedDB<"u"?void 0:new wr);this.persistence=new Lr(a),this._platformId=e,this._platform=i,this._activeChallenge=null,this._activeLesson=null,this._sketchCode="",this._serialHistory=[],this._hasError=!1,this._completedObjs=new Set,this._wireEvents()}static create(e,t={}){return new o(e,t)}loadContent(e=[],t=[],i=[],r=[]){let a=this.content.load({scenarios:e,challenges:t,lessons:i}),n=e.filter(l=>this.content.getScenario(l.id)),s=t.filter(l=>this.content.getChallenge(l.id));return this.scenarios.registerMany(n),this.challenges.registerMany(s),r.length>0&&this.theory.registerMany(r),this.eventBus.emit({type:"CONTENT_LOADED",payload:this.content.getStats(),source:"ASSEMBLER"}),a}selectLesson(e){let t=this.content.getLesson(e);if(!t)throw new Error("Lesson not found: "+e);return this._activeLesson=t,this.revelation.configure(t),this.eventBus.emit({type:"LESSON_SELECTED",payload:{id:e,name:t.name},source:"ASSEMBLER"}),t}selectChallenge(e){let t=this.content.getChallenge(e);if(!t)throw new Error("Challenge not found: "+e);return this._activeChallenge=t,this._completedObjs=new Set,t.scenarioId&&this._canvasEl&&this._loadScenarioForCanvas(t.scenarioId),t.sketch&&(this._sketchCode=t.sketch),this.challenges.start(e,this.eventBus),this._configureSensorsForPlatform(),this.eventBus.emit({type:"CHALLENGE_SELECTED",payload:{id:e,name:t.name},source:"ASSEMBLER"}),this._sketchCode&&this._validateAndReport(this._sketchCode),t}setCanvas(e){return this._canvasEl=e,this.sim.setCanvas(e),this.sensors.setCanvas(e),this.physics.setCanvas?this.physics.setCanvas(e.width,e.height):(this.physics.cw=e.width,this.physics.ch=e.height),this._activeChallenge&&this._activeChallenge.scenarioId&&this._loadScenarioForCanvas(this._activeChallenge.scenarioId),this}async createStudent(e,t,i){let r=await this.persistence.createStudent(e,t,i);return await this.persistence.setCurrentStudent(r.id),this.eventBus.emit({type:"STUDENT_CREATED",payload:{id:r.id,name:e},source:"ASSEMBLER"}),r}async selectStudent(e){let t=await this.persistence.setCurrentStudent(e);return this.eventBus.emit({type:"STUDENT_SELECTED",payload:{id:e,name:t.name},source:"ASSEMBLER"}),t}loadSketch(e){this._sketchCode=e;let t=this._validateAndReport(e);if(t.ok){let i=this.sim.loadSketch(e);return this.revelation.observe(S.CODE_LOADED,{hasSerial:e.includes("Serial.begin")}),i}return{ok:!1,errors:t.errors}}start(){return this.telemetry.start(),this}play(){this.sim.play(),this.revelation.observe(S.PLAY_PRESSED,{}),this.theory.trigger("concept_tb6612fng")}pause(){this.sim.pause()}step(){this.sim.step()}async reset(){await this.sim.reset(),this.revelation.reset(),this.theory.reset(),this._completedObjs=new Set,this._serialHistory=[],this._hasError=!1,this.telemetry.reset(),this._configureSensorsForPlatform(),this._activeChallenge&&this._activeChallenge.scenarioId&&this._canvasEl&&this._loadScenarioForCanvas(this._activeChallenge.scenarioId),this._activeChallenge&&this.challenges.start(this._activeChallenge.id,this.eventBus),this.eventBus.emit({type:"ECO_RESET",payload:{},source:"ASSEMBLER"})}setSpeed(e){this.sim.setSpeed(e)}setSensorMode(e,t){this.sensors.setChannelMode(e,t)}connectHardwareSensor(e,t){this.sensors.connectHardware(e,t)}getHint(){return this._activeChallenge?this.hints.generateForChallenge(this._activeChallenge,{runCount:this.sim.getState()==="ERROR"?2:0},this._completedObjs):null}observeStudentAction(e,t){this.revelation.observe(e,t),this.theory.triggerForObservation({type:e,payload:t},{})}addObstacle(e){this.physics.obstacles&&this.physics.obstacles.push({...e,id:e.id||"obs_"+Date.now(),draggable:e.draggable!==!1})}moveObstacle(e,t,i){let r=(this.physics.obstacles||[]).find(a=>a.id===e);r&&(r.x=t,r.y=i),this.revelation.observe(S.OBSTACLE_MOVED,{id:e,x:t,y:i})}getObstacles(){return this.physics.obstacles||[]}async saveProgress(){return!this.persistence.getCurrentStudent()||!this._activeChallenge?null:this.persistence.saveProject(this._activeChallenge.id,this._activeChallenge.scenarioId,this._sketchCode,{runCount:1,simTimeTotalMs:this.sim.getSimTime(),platformId:this._platformId})}async exportStudentData(){return this.persistence.exportBundle()}async importStudentData(e){return this.persistence.importBundle(e)}async getTeacherSummary(){return this.persistence.generateTeacherSummary()}getState(){return this.sim.getState()}getSimTime(){return this.sim.getSimTime()}getPlatformId(){return this._platformId}getPlatform(){return this._platform}getActiveChallenge(){return this._activeChallenge}getActiveLesson(){return this._activeLesson}getSketchCode(){return this._sketchCode}getSerialHistory(){return[...this._serialHistory]}isVisible(e){return this.revelation.isVisible(e)}getVisibleComponents(){return this.revelation.getVisibleComponents()}_wireEvents(){let e=this.eventBus;e.on("SIM_TICK",t=>{let i=t.payload;if(this.telemetry.processTick(i),this._activeChallenge){let r=Ir(i,this._serialHistory,this._sketchCode,this._hasError);r.obstacles=this.physics.obstacles||[];let a=new Set(this._completedObjs);this.challenges.evaluate(r);let n=this.challenges.getState();if(n)for(let s of n.objectives)s.completed&&!a.has(s.id)&&(this._completedObjs.add(s.id),this.revelation.observe(S.OBJECTIVE_COMPLETED,{objectiveId:s.id}))}}),e.on("SERIAL_OUTPUT",t=>{this._serialHistory.push(t.payload.message),this._serialHistory.length>500&&this._serialHistory.shift(),this.telemetry.emitSerial(t.payload.message,"FW")}),e.on("HAL_PERR",t=>{let i=this.diagnostics.diagnoseHALError(t.payload,null);this.telemetry.emitSerial("[HAL] "+t.payload.msg,"SYS"),e.emit({type:"DIAGNOSTIC_REPORT",payload:i,source:"ASSEMBLER"})}),e.on("RUNTIME_ERROR",t=>{this._hasError=!0;let i=this.diagnostics.diagnose(t.payload,this._sketchCode,null);this.telemetry.emitError(t.payload),this.revelation.observe(S.RUNTIME_ERROR,{code:t.payload.code}),e.emit({type:"DIAGNOSTIC_REPORT",payload:i,source:"ASSEMBLER"})}),e.on("CHALLENGE_COMPLETED",async t=>{this.revelation.observe(S.CHALLENGE_COMPLETED,{}),this.persistence.getCurrentStudent()&&(await this.persistence.recordChallengeCompletion(this._activeChallenge?.id,this.sim.getSimTime(),t.payload.score||0).catch(()=>{}),await this.saveProgress().catch(()=>{}))}),e.on("OBJECTIVE_COMPLETED",async t=>{this.persistence.getCurrentStudent()&&this._activeChallenge&&await this.persistence.recordObjectiveCompletion(this._activeChallenge.id,t.payload.objectiveId,this.sim.getSimTime()).catch(()=>{})}),e.on("SIM_TICK",t=>{let i=t.payload.robotState;if(!i)return;let r=Math.sqrt((i.vL||0)**2+(i.vR||0)**2);r>.1&&this.revelation.observe(S.ROBOT_MOVED,{}),r<.05&&i.vL!==void 0&&this.revelation.observe(S.ROBOT_STOPPED,{})}),e.on("GPIO_ANALOG_IMPLICIT",t=>{this.theory.trigger("concept_analog_vs_digital",{pin:t.payload.pin})}),e.on("REVELATION_ACTION",t=>{t.payload.type==="MILESTONE"&&this.telemetry.emitMilestone(t.payload)}),e.on("THEORY_TRIGGERED",t=>{this.telemetry.emitSerial("[CONCEPTO] "+t.payload.title,"SYS")}),e.on("VALIDATION_REPORT",t=>{this.telemetry.emitValidation(t.payload)})}_wireSimBus(e){e.setEventBus(this.eventBus)}_validateAndReport(e){let t=this.validator.validate(e);return this.eventBus.emit({type:"VALIDATION_REPORT",payload:t,source:"ASSEMBLER"}),t}_loadScenarioForCanvas(e){try{this.scenarios.load(e,this.physics,this.sensors,this.eventBus,this._canvasEl)}catch{}}_configureSensorsForPlatform(){let{ROBOARD_ROBOT_PROFILE:e}=ke(),i={ROBOARD:e}[this._platformId];i&&this.sensors.configureFromRobotProfile(i)}};Vt.exports={EcosystemAssembler:Ve,COMPONENT:Rr,OBS:S}});var Yt=m((En,jt)=>{"use strict";var qr=[{id:"obstacle-arena",name:"Arena de Obst\xE1culos",description:"Un campo abierto con dos obst\xE1culos m\xF3viles. Ideal para robot reactivo.",platformId:"ROBOARD",canvas:{width:800,height:500},robot:{start:{x:.35,y:.5,angle:0}},obstacles:[{id:"obs-1",x:.62,y:.35,w:.07,h:.12,draggable:!0,label:"Obst\xE1culo A"},{id:"obs-2",x:.25,y:.68,w:.06,h:.1,draggable:!0,label:"Obst\xE1culo B"}],track:{type:"none"},boundaries:"wall",tags:["reactive","obstacle","unit1"]},{id:"single-obstacle",name:"Obst\xE1culo Simple",description:"Un solo obst\xE1culo centrado. Para primeros experimentos de detecci\xF3n.",platformId:"ROBOARD",canvas:{width:800,height:500},robot:{start:{x:.25,y:.5,angle:0}},obstacles:[{id:"obs-1",x:.55,y:.4,w:.08,h:.2,draggable:!0,label:"Obst\xE1culo"}],track:{type:"none"},boundaries:"wall",tags:["simple","obstacle","unit1","first-contact"]},{id:"corridor",name:"Corredor",description:"Dos paredes laterales forman un corredor. El robot debe avanzar sin chocar.",platformId:"ROBOARD",canvas:{width:800,height:500},robot:{start:{x:.12,y:.5,angle:0}},obstacles:[{id:"wall-top",x:0,y:.1,w:1,h:.05,draggable:!1,label:"Pared superior"},{id:"wall-bottom",x:0,y:.85,w:1,h:.05,draggable:!1,label:"Pared inferior"},{id:"block-1",x:.4,y:.25,w:.08,h:.5,draggable:!0,label:"Bloque central"}],track:{type:"none"},boundaries:"wall",tags:["corridor","navigation","unit2"]},{id:"empty-arena",name:"Arena Libre",description:"Sin obst\xE1culos. Para experimentar con control de motores libremente.",platformId:"ROBOARD",canvas:{width:800,height:500},robot:{start:{x:.5,y:.5,angle:0}},obstacles:[],track:{type:"none"},boundaries:"wall",tags:["free","motors","unit1"]},{id:"multi-obstacle",name:"Campo de Obst\xE1culos",description:"Varios obst\xE1culos distribuidos. Para robots con esquiva avanzada.",platformId:"ROBOARD",canvas:{width:800,height:500},robot:{start:{x:.1,y:.5,angle:0}},obstacles:[{id:"o1",x:.3,y:.15,w:.07,h:.12,draggable:!0},{id:"o2",x:.3,y:.7,w:.07,h:.12,draggable:!0},{id:"o3",x:.55,y:.35,w:.07,h:.12,draggable:!0},{id:"o4",x:.55,y:.6,w:.07,h:.12,draggable:!0},{id:"o5",x:.78,y:.45,w:.07,h:.12,draggable:!0}],track:{type:"none"},boundaries:"wall",tags:["advanced","obstacle","unit3"]}];jt.exports={ROBOARD_SCENARIOS:qr}});var Zt=m((yn,Qt)=>{"use strict";var Kt=`// ROBOARD \u2014 Robot Reactivo
// Desaf\xEDo: el robot debe detenerse al detectar un obst\xE1culo.

#define Mizq_pwm  3
#define Mizq1     5
#define Mizq2     4
#define pinSTBY   6
#define Mder1     7
#define Mder2     8
#define Mder_pwm  9
#define LED      10
#define UMBRAL  350

void setup() {
  // Configur\xE1 los pines necesarios aqu\xED
  pinMode(pinSTBY, OUTPUT);
  pinMode(Mizq1, OUTPUT); pinMode(Mizq2, OUTPUT); pinMode(Mizq_pwm, OUTPUT);
  pinMode(Mder1, OUTPUT); pinMode(Mder2, OUTPUT); pinMode(Mder_pwm, OUTPUT);
  pinMode(LED, OUTPUT);
  digitalWrite(pinSTBY, HIGH);
}

void loop() {
  int sensor = analogRead(0);
  
  // \xBFC\xF3mo us\xE1s el sensor para decidir qu\xE9 hacer?
  // Complet\xE1 el c\xF3digo aqu\xED:
  
}
`,$t=`// ROBOARD \u2014 Robot que Evita
// Desaf\xEDo: el robot debe girar al detectar un obst\xE1culo, no solo parar.

#define Mizq_pwm  3
#define Mizq1     5
#define Mizq2     4
#define pinSTBY   6
#define Mder1     7
#define Mder2     8
#define Mder_pwm  9
#define LED      10
#define UMBRAL  350
#define VEL     200

void setup() {
  pinMode(pinSTBY, OUTPUT); digitalWrite(pinSTBY, HIGH);
  pinMode(Mizq1, OUTPUT); pinMode(Mizq2, OUTPUT); pinMode(Mizq_pwm, OUTPUT);
  pinMode(Mder1, OUTPUT); pinMode(Mder2, OUTPUT); pinMode(Mder_pwm, OUTPUT);
  pinMode(LED, OUTPUT);
}

void loop() {
  int sensor = analogRead(0);
  
  if (sensor < UMBRAL) {
    // Modific\xE1 esto para que gire en lugar de parar:
    digitalWrite(Mizq1, LOW); digitalWrite(Mizq2, LOW);
    digitalWrite(Mder1, LOW); digitalWrite(Mder2, LOW);
    analogWrite(Mizq_pwm, 0); analogWrite(Mder_pwm, 0);
    digitalWrite(LED, HIGH);
  } else {
    digitalWrite(Mizq1, HIGH); digitalWrite(Mizq2, LOW);
    digitalWrite(Mder1, HIGH); digitalWrite(Mder2, LOW);
    analogWrite(Mizq_pwm, VEL); analogWrite(Mder_pwm, VEL);
    digitalWrite(LED, LOW);
  }
  delay(20);
}
`,Br=[{id:"robot-reactivo-1",name:"Robot Reactivo \u2014 Nivel 1",description:"Hac\xE9 que el robot se detenga cuando detecta un obst\xE1culo.",scenarioId:"single-obstacle",platformId:"ROBOARD",sketch:Kt,timeLimit:null,tags:["unit1","sensor","basic"],objectives:[{id:"motors-configured",label:"Configurar los pines del motor con pinMode()",type:"gpio_high",params:{pin:"D6"},required:!0,hidden:!1},{id:"robot-moves",label:"El robot se mueve hacia adelante",type:"motor_forward",params:{motor:"A"},required:!0,hidden:!1},{id:"robot-stops-on-detection",label:"El robot para al detectar el obst\xE1culo",type:"motor_stop",params:{},required:!0,hidden:!1},{id:"led-on-detection",label:"El LED D10 enciende cuando hay obst\xE1culo (bonus)",type:"gpio_high",params:{pin:"D10"},required:!1,hidden:!0}],hints:{"motors-configured":["\xBFConfiguraste STBY como OUTPUT? El TB6612FNG necesita STBY=HIGH para funcionar."],"robot-moves":["Revis\xE1 que AIN1=HIGH y AIN2=LOW con analogWrite(PWMA, velocidad)."],"robot-stops-on-detection":["Us\xE1 analogRead(0) para leer el sensor. Si es menor que UMBRAL, hay un obst\xE1culo."]}},{id:"robot-reactivo-2",name:"Robot Reactivo \u2014 Nivel 2",description:"El robot debe girar para evitar el obst\xE1culo, no solo parar.",scenarioId:"obstacle-arena",platformId:"ROBOARD",sketch:$t,timeLimit:null,tags:["unit1","sensor","avoidance"],objectives:[{id:"robot-moves-forward",label:"El robot avanza en terreno libre",type:"motor_forward",params:{motor:"A"},required:!0,hidden:!1},{id:"robot-turns",label:"El robot gira al detectar obst\xE1culo (motores asim\xE9tricos)",type:"custom",params:{fn:o=>{if(!o.motorCmds)return!1;let{motorA:e,motorB:t}=o.motorCmds,i=e.direction!==t.direction||Math.abs(e.pwm-t.pwm)>50;return o.gpio.A0&&o.gpio.A0.value<350&&i}},required:!0,hidden:!1}],hints:{"robot-turns":["Para girar, un motor va adelante y el otro atr\xE1s.","Prob\xE1: Mizq1=LOW, Mizq2=HIGH (motor izq atr\xE1s) y Mder1=HIGH, Mder2=LOW (motor der adelante)."]}},{id:"explorar-motores",name:"Explorar: Control de Motores",description:"Experiment\xE1 con diferentes velocidades y direcciones. Sin objetivo fijo.",scenarioId:"empty-arena",platformId:"ROBOARD",sketch:null,timeLimit:null,tags:["unit1","motors","exploration"],objectives:[{id:"motors-forward",label:"Ambos motores avanzan",type:"motor_forward",params:{motor:"A"},required:!0,hidden:!1},{id:"robot-traveled",label:"Robot recorri\xF3 al menos 100px",type:"robot_moved",params:{minDistance:100},required:!0,hidden:!1}],hints:{}}];Qt.exports={ROBOARD_CHALLENGES:Br,SKETCH_ROBOT_REACTIVO:Kt,SKETCH_GIRO:$t}});var Jt=m((In,Xt)=>{"use strict";var Hr={id:"unit-1",name:"Unidad 1 \u2014 Sistemas Rob\xF3ticos",description:"El estudiante descubre la causalidad sensor \u2192 decisi\xF3n \u2192 acci\xF3n en un robot diferencial.",platformId:"ROBOARD",duration:"4 m\xF3dulos \xD7 40 min",tags:["unit1","roboard","foundations"],moments:[{id:"observe",label:"Observar",description:"El robot ya funciona. Observ\xE1 c\xF3mo reacciona al entorno.",revealComponents:["CANVAS","SENSOR_HUD"],challenge:"robot-reactivo-1",scenario:"single-obstacle"},{id:"discover",label:"Descubrir se\xF1ales",description:"Explor\xE1 qu\xE9 valores produce el sensor cuando mov\xE9s el obst\xE1culo.",revealComponents:["CANVAS","SENSOR_HUD","SIGNAL_CARDS"],challenge:"robot-reactivo-1",scenario:"single-obstacle"},{id:"understand",label:"Entender el c\xF3digo",description:"El c\xF3digo del robot tiene un bug. Encontralo y corregilo.",revealComponents:["CANVAS","SENSOR_HUD","CODE_VIEW","GPIO_INSPECTOR"],challenge:"robot-reactivo-1",scenario:"single-obstacle",brokenSketch:!0},{id:"create",label:"Crear",description:"Modific\xE1 el sketch para que el robot gire en lugar de parar.",revealComponents:["CANVAS","CODE_EDITOR","GPIO_INSPECTOR","SERIAL","MOTOR_PANEL"],challenge:"robot-reactivo-2",scenario:"obstacle-arena"}],startChallenge:"robot-reactivo-1",startScenario:"single-obstacle"};Xt.exports={UNIT_1:Hr}});var ti=m((On,ei)=>{"use strict";var te={"empty-arena":{id:"empty-arena",name:"Arena vac\xEDa",type:"arena",layers:[{type:"surface",color:"#06080d"}],spawnPoints:{robot:{xf:.15,yf:.5,angle:0},obstacles:[]},renderHints:{showGrid:!0}},"single-obstacle":{id:"single-obstacle",name:"Obst\xE1culo \xFAnico",type:"arena",layers:[{type:"surface",color:"#06080d"},{type:"zone",id:"start",label:"Inicio",xf:.05,yf:.35,wf:.1,hf:.3,color:"rgba(0,205,179,.06)",border:"rgba(0,205,179,.15)"}],spawnPoints:{robot:{xf:.15,yf:.5,angle:0},obstacles:[{id:"o1",xf:.55,yf:.35,wf:.07,hf:.22,drag:!0}]},renderHints:{showGrid:!0}},"obstacle-arena":{id:"obstacle-arena",name:"Arena con obst\xE1culos",type:"arena",layers:[{type:"surface",color:"#06080d"}],spawnPoints:{robot:{xf:.2,yf:.5,angle:0},obstacles:[{id:"o1",xf:.6,yf:.28,wf:.07,hf:.14,drag:!0},{id:"o2",xf:.2,yf:.64,wf:.07,hf:.14,drag:!0}]},renderHints:{showGrid:!0}},corridor:{id:"corridor",name:"Corredor \u2014 seguir pared",type:"corridor",layers:[{type:"surface",color:"#06080d"},{type:"boundary",id:"wall-top",xf:0,yf:.05,wf:1,hf:.05,color:"rgba(59,120,236,.3)",border:"rgba(59,120,236,.6)",solid:!0},{type:"boundary",id:"wall-bottom",xf:0,yf:.9,wf:1,hf:.05,color:"rgba(59,120,236,.3)",border:"rgba(59,120,236,.6)",solid:!0},{type:"zone",id:"target-dist",label:"Distancia objetivo (A1 \u2248 400)",xf:.02,yf:.22,wf:.96,hf:.02,color:"rgba(240,150,0,.12)",border:"rgba(240,150,0,.3)"}],spawnPoints:{robot:{xf:.1,yf:.5,angle:0},obstacles:[]},renderHints:{showGrid:!1}},"minisumo-practice":{id:"minisumo-practice",name:"Tatami Minisumo \u2014 Pr\xE1ctica",type:"minisumo",layers:[{type:"surface",color:"#06080d"},{type:"ring",id:"tatami",shape:"circle",xf:.5,yf:.5,rf:.38,fillColor:"#0a0a0a",strokeColor:"rgba(255,255,255,.9)",strokeWidth:6,label:"Ring"},{type:"ring",id:"border-warn",shape:"circle",xf:.5,yf:.5,rf:.4,fillColor:"transparent",strokeColor:"rgba(240,40,64,.15)",strokeWidth:2,label:""},{type:"zone",id:"start",label:"Inicio",shape:"circle",xf:.35,yf:.5,rf:.05,color:"rgba(0,205,179,.12)",border:"rgba(0,205,179,.3)"}],spawnPoints:{robot:{xf:.35,yf:.5,angle:0},obstacles:[]},renderHints:{showGrid:!1,ringRadius:!0}},"minisumo-ring":{id:"minisumo-ring",name:"Tatami Minisumo \u2014 Combate",type:"minisumo",layers:[{type:"surface",color:"#06080d"},{type:"ring",id:"tatami",shape:"circle",xf:.5,yf:.5,rf:.38,fillColor:"#0a0a0a",strokeColor:"rgba(255,255,255,.9)",strokeWidth:6},{type:"ring",id:"border-warn",shape:"circle",xf:.5,yf:.5,rf:.4,fillColor:"transparent",strokeColor:"rgba(240,40,64,.15)",strokeWidth:2},{type:"zone",id:"start",label:"Tu robot",shape:"circle",xf:.3,yf:.5,rf:.04,color:"rgba(0,205,179,.15)",border:"rgba(0,205,179,.4)"},{type:"zone",id:"opponent-start",label:"Oponente",shape:"circle",xf:.7,yf:.5,rf:.04,color:"rgba(240,40,64,.1)",border:"rgba(240,40,64,.3)"}],spawnPoints:{robot:{xf:.3,yf:.5,angle:0},obstacles:[{id:"op",xf:.7,yf:.5,wf:.06,hf:.06,drag:!0}]},renderHints:{showGrid:!1}},"linea-recta":{id:"linea-recta",name:"Pista \u2014 L\xEDnea recta",type:"line-follower",layers:[{type:"surface",color:"#e8e8e8"},{type:"line",id:"track",points:[{xf:.05,yf:.5},{xf:.3,yf:.5},{xf:.55,yf:.5},{xf:.75,yf:.5},{xf:.9,yf:.5}],lineWidth:18,color:"#111111",label:"L\xEDnea QTR",qtrDetectable:!0},{type:"zone",id:"start",label:"Inicio",xf:.05,yf:.42,wf:.03,hf:.16,color:"rgba(0,205,179,.3)",border:"rgba(0,205,179,.8)"},{type:"zone",id:"finish",label:"Meta",xf:.88,yf:.42,wf:.03,hf:.16,color:"rgba(240,150,0,.3)",border:"rgba(240,150,0,.8)"}],spawnPoints:{robot:{xf:.08,yf:.5,angle:0},obstacles:[]},renderHints:{showGrid:!1}},"lf-pista-recta":{id:"lf-pista-recta",name:"Pista LNR \u2014 Recta",type:"line-follower",layers:[{type:"surface",color:"#e0e0e0"},{type:"line",id:"track",points:[{xf:.05,yf:.5},{xf:.15,yf:.5},{xf:.3,yf:.5},{xf:.5,yf:.5},{xf:.7,yf:.5},{xf:.85,yf:.5},{xf:.95,yf:.5}],lineWidth:18,color:"#0d0d0d",label:"L\xEDnea LNR",qtrDetectable:!0},{type:"zone",id:"start",label:"Inicio",xf:.03,yf:.42,wf:.03,hf:.16,color:"rgba(0,205,179,.3)",border:"rgba(0,205,179,.8)"},{type:"zone",id:"finish",label:"Meta",xf:.93,yf:.42,wf:.03,hf:.16,color:"rgba(240,150,0,.3)",border:"rgba(240,150,0,.8)"}],spawnPoints:{robot:{xf:.04,yf:.5,angle:0},obstacles:[]},renderHints:{showGrid:!1}},"lf-curvas":{id:"lf-curvas",name:"Pista LNR \u2014 \xD3valo con curvas",type:"line-follower",layers:[{type:"surface",color:"#dcdcdc"},{type:"line",id:"track",points:[{xf:.15,yf:.72},{xf:.25,yf:.72},{xf:.35,yf:.72},{xf:.45,yf:.72},{xf:.55,yf:.72},{xf:.65,yf:.72},{xf:.76,yf:.7},{xf:.82,yf:.64},{xf:.84,yf:.56},{xf:.84,yf:.48},{xf:.84,yf:.38},{xf:.82,yf:.3},{xf:.76,yf:.24},{xf:.65,yf:.22},{xf:.55,yf:.22},{xf:.45,yf:.22},{xf:.35,yf:.22},{xf:.25,yf:.22},{xf:.18,yf:.24},{xf:.12,yf:.3},{xf:.1,yf:.38},{xf:.1,yf:.48},{xf:.1,yf:.56},{xf:.12,yf:.64},{xf:.18,yf:.7},{xf:.15,yf:.72}],lineWidth:20,color:"#111111",label:"Pista oval",qtrDetectable:!0,closed:!0},{type:"zone",id:"start-arrow",label:"\u25B6 Inicio",shape:"circle",xf:.15,yf:.72,rf:.025,color:"rgba(0,205,179,.25)",border:"rgba(0,205,179,.7)"}],spawnPoints:{robot:{xf:.18,yf:.72,angle:0},obstacles:[]},renderHints:{showGrid:!1,trackClosed:!0}},"ms-mantenerse-en-ring":{id:"ms-mantenerse-en-ring",name:"Tatami Minisumo",type:"minisumo",layers:[{type:"surface",color:"#06080d"},{type:"ring",id:"tatami",shape:"circle",xf:.5,yf:.5,rf:.38,fillColor:"#0a0a0a",strokeColor:"rgba(255,255,255,.9)",strokeWidth:6},{type:"ring",id:"border-warn",shape:"circle",xf:.5,yf:.5,rf:.4,fillColor:"transparent",strokeColor:"rgba(240,40,64,.15)",strokeWidth:2},{type:"zone",id:"start",label:"Inicio",shape:"circle",xf:.35,yf:.5,rf:.05,color:"rgba(0,205,179,.12)",border:"rgba(0,205,179,.3)"}],spawnPoints:{robot:{xf:.35,yf:.5,angle:0},obstacles:[]},renderHints:{showGrid:!1}},"ms-buscar-atacar":{id:"ms-buscar-atacar",name:"Tatami Minisumo \u2014 Combate",type:"minisumo",layers:[{type:"surface",color:"#06080d"},{type:"ring",id:"tatami",shape:"circle",xf:.5,yf:.5,rf:.38,fillColor:"#0a0a0a",strokeColor:"rgba(255,255,255,.9)",strokeWidth:6},{type:"ring",id:"border-warn",shape:"circle",xf:.5,yf:.5,rf:.4,fillColor:"transparent",strokeColor:"rgba(240,40,64,.15)",strokeWidth:2},{type:"zone",id:"start",label:"Tu robot",shape:"circle",xf:.3,yf:.5,rf:.04,color:"rgba(0,205,179,.15)",border:"rgba(0,205,179,.4)"},{type:"zone",id:"opp",label:"Oponente",shape:"circle",xf:.7,yf:.5,rf:.04,color:"rgba(240,40,64,.1)",border:"rgba(240,40,64,.3)"}],spawnPoints:{robot:{xf:.3,yf:.5,angle:0},obstacles:[{id:"op",xf:.7,yf:.5,wf:.06,hf:.06,drag:!0}]},renderHints:{showGrid:!1}},"franky-arena":{id:"franky-arena",name:"Arena FRANKY",type:"arena",layers:[{type:"surface",color:"#06080d"},{type:"zone",id:"start",label:"FRANKY",xf:.1,yf:.4,wf:.08,hf:.2,color:"rgba(240,150,0,.08)",border:"rgba(240,150,0,.2)"}],spawnPoints:{robot:{xf:.15,yf:.5,angle:0},obstacles:[{id:"o1",xf:.55,yf:.35,wf:.07,hf:.22,drag:!0}]},renderHints:{showGrid:!0}},"franky-obstacle":{id:"franky-obstacle",name:"Arena FRANKY \u2014 Obst\xE1culos",type:"arena",layers:[{type:"surface",color:"#06080d"}],spawnPoints:{robot:{xf:.15,yf:.5,angle:0},obstacles:[{id:"o1",xf:.55,yf:.28,wf:.07,hf:.14,drag:!0},{id:"o2",xf:.7,yf:.55,wf:.07,hf:.14,drag:!0}]},renderHints:{showGrid:!0}},"franky-sumo":{id:"franky-sumo",name:"Tatami FRANKY Minisumo",type:"minisumo",layers:[{type:"surface",color:"#06080d"},{type:"ring",id:"tatami",shape:"circle",xf:.5,yf:.5,rf:.38,fillColor:"#0a0a0a",strokeColor:"rgba(255,255,255,.9)",strokeWidth:6},{type:"ring",id:"border-warn",shape:"circle",xf:.5,yf:.5,rf:.4,fillColor:"transparent",strokeColor:"rgba(240,150,0,.2)",strokeWidth:2},{type:"zone",id:"start",label:"FRANKY",shape:"circle",xf:.35,yf:.5,rf:.04,color:"rgba(240,150,0,.15)",border:"rgba(240,150,0,.4)"}],spawnPoints:{robot:{xf:.35,yf:.5,angle:0},obstacles:[{id:"op",xf:.65,yf:.5,wf:.06,hf:.06,drag:!0}]},renderHints:{showGrid:!1}},default:{id:"default",name:"Arena est\xE1ndar",type:"arena",layers:[{type:"surface",color:"#06080d"}],spawnPoints:{robot:{xf:.2,yf:.5,angle:0},obstacles:[{id:"o1",xf:.55,yf:.35,wf:.07,hf:.22,drag:!0}]},renderHints:{showGrid:!0}}};function Wr(o){return te[o]||te.default}function xr(){return Object.keys(te)}ei.exports={SCENES:te,getScene:Wr,listScenes:xr}});var Fe=m((Tn,ii)=>{"use strict";var Gr={id:"FRANKY",name:"FRANKY ESP32-C3",mcu:"ESP32-C3",description:"Robot educativo IoT con WiFi/BLE, servidor web embebido y modos aut\xF3nomos.",connectivity:["WiFi","BLE"],pins:{GPIO2:{label:"MB_IN2",motor:"B",role:"dir2",digital:!0,pwm:!1},GPIO3:{label:"MB_IN1",motor:"B",role:"dir1",digital:!0,pwm:!1},GPIO4:{label:"MA_IN2",motor:"A",role:"dir2",digital:!0,pwm:!1},GPIO5:{label:"MA_IN1",motor:"A",role:"dir1",digital:!0,pwm:!1},CH_A1:{label:"CH_A1",motor:"A",role:"pwm_fwd",pwm:!0,virtual:!0},CH_A2:{label:"CH_A2",motor:"A",role:"pwm_rev",pwm:!0,virtual:!0},CH_B1:{label:"CH_B1",motor:"B",role:"pwm_fwd",pwm:!0,virtual:!0},CH_B2:{label:"CH_B2",motor:"B",role:"pwm_rev",pwm:!0,virtual:!0},GPIO6:{label:"I2C_SDA",digital:!0,i2c:"SDA"},GPIO7:{label:"I2C_SCL",digital:!0,i2c:"SCL"},GPIO8:{label:"LED",digital:!0,output:!0,activeLow:!0},GPIO9:{label:"BTN",digital:!0,input:!0,activeLow:!0,pullup:!0},GPIO0:{label:"ADC0",analog:!0,analogOnly:!1,adc:!0},GPIO1:{label:"ADC1",analog:!0,analogOnly:!1,adc:!0},GPIO10:{label:"SPI_CS",digital:!0},GPIO20:{label:"SPI_CLK",digital:!0},GPIO21:{label:"SPI_MOSI",digital:!0}},pwm:{freq:2e4,resolution:8,maxDuty:255},motorDriver:"LEDC_DIRECT",defaults:{motorSpeed:200,trimA:255,trimB:255,ledState:!1},modes:{0:"IDLE",1:"MICRO",2:"MINI",3:"BLOQUES",4:"VIVERO",5:"METEO",6:"ALARMA",7:"ACCESO"},apiSchema:{a0:"number",a1:"number",btn:"number",temp:"number",hum:"number",mode:"number",running:"number",proglen:"number",i2c:"number",spi:"number",dht:"number",pwmA:"number",pwmB:"number",trimA:"number",trimB:"number",motorSpeed:"number"},routes:{"GET  /api":"Full state JSON","GET  /debug":"SPIFFS + debug info","POST /mv":"Move: ?d=f|b|l|r[&val=speed]","POST /st":"Stop motors","POST /spd":"Set speed: ?val=0-255","POST /stopall":"Stop + redirect to /","POST /sumo/config":"Configure sumo params","POST /sumo/trim":"Set motor trim: ?ma=0-255&mb=0-255","POST /sumo/micro":"Start microsumo mode","POST /sumo/mini":"Start minisumo mode","POST /sumo/stop":"Stop sumo","POST /sumo/umbral":"Set detection threshold","GET  /bloques/list":"Get bytecode program","POST /bloques/add":"Add instruction: ?op=N&val=M","POST /bloques/del":"Delete instruction: ?idx=N","POST /bloques/run":"Run bytecode program","POST /bloques/stop":"Stop bytecode program","POST /bloques/clear":"Clear bytecode program","POST /auto/vivero":"Start vivero mode","POST /auto/meteo":"Start meteo mode","POST /auto/alarma":"Start alarma mode","POST /auto/acceso":"Start acceso mode","POST /auto/stop":"Stop auto mode","POST /led/on":"LED on (GPIO8 LOW)","POST /led/off":"LED off (GPIO8 HIGH)","POST /led/brillo":"LED PWM: ?val=0-255","POST /gpio/out":"GPIO output: ?pin=N&val=0|1","GET  /gpio/read":"GPIO read: ?pin=N","GET  /sonar/read":"HC-SR04 read: ?trig=N&echo=M","POST /sonar/stop":"Stop sonar","POST /dht/pin":"Configure DHT22 pin","POST /panel/save":"Save panel config"},pages:[{path:"/",file:"index.html",label:"Inicio",icon:"\u{1F3E0}"},{path:"/gamepad",file:"gamepad.html",label:"Gamepad",icon:"\u{1F3AE}"},{path:"/sumo",file:"sumo.html",label:"Sumo",icon:"\u{1F916}"},{path:"/bloques",file:"bloques.html",label:"Bloques",icon:"\u{1F9E9}"},{path:"/auto",file:"auto.html",label:"Autom\xE1tico",icon:"\u2699\uFE0F"},{path:"/panel",file:"panel.html",label:"Panel",icon:"\u{1F4CA}"},{path:"/manual",file:"manual.html",label:"Manual",icon:"\u{1F4CB}"}],opcodes:{0:"FIN",1:"ADE",2:"ATR",3:"IZQ",4:"DER",5:"STOP",6:"ESP",7:"LED_ON",8:"LED_OFF",9:"IF_DIST",11:"FRENO",20:"DOUT",22:"PWM_OUT",30:"ADC_READ",40:"SERVO",60:"VAR_SET",61:"VAR_ADD",62:"VAR_SUB",70:"IF_GT",71:"IF_LT",74:"REPEAT"}};ii.exports={FRANKY_PLATFORM:Gr}});var ai=m((Sn,ri)=>{"use strict";var zr=[{id:"pinmode",title:"pinMode() \u2014 Configurar pines",tags:["fundam","gpio","output","input"],platform:"both",concept:"Antes de usar cualquier pin digital, ten\xE9s que decirle al microcontrolador si va a ser entrada (INPUT) o salida (OUTPUT). Sin esto, el comportamiento es impredecible.",hardware:"Cada pin f\xEDsico puede conducir corriente (OUTPUT) o medirla (INPUT). El microcontrolador tiene registros internos que configuran esto \u2014 pinMode() escribe en esos registros.",example:`void setup() {
  pinMode(6, OUTPUT);   // Pin 6 como salida \u2014 para controlar algo
  pinMode(9, INPUT);    // Pin 9 como entrada \u2014 para leer algo
  pinMode(2, INPUT_PULLUP); // Entrada con resistencia pull-up interna
}`,applied:`// Desaf\xEDo: habilit\xE1 el TB6612FNG
void setup() {
  // Estos pines controlan el driver de motores
  pinMode(6, OUTPUT);   // STBY \u2014 debe estar HIGH para activar el driver
  pinMode(5, OUTPUT);   // AIN1 \u2014 direcci\xF3n motor A
  pinMode(4, OUTPUT);   // AIN2 \u2014 direcci\xF3n motor A
  pinMode(3, OUTPUT);   // PWMA \u2014 velocidad motor A (pin PWM ~)
  
  digitalWrite(6, HIGH); // Activar driver
}`,lines:[{line:"pinMode(6, OUTPUT)",note:"El pin 6 ahora puede dar o quitar tensi\xF3n al circuito externo"},{line:"pinMode(9, INPUT)",note:'El pin 9 ahora lee si hay tensi\xF3n externa. Riesgo: si no hay pull-up, puede "flotar" entre HIGH y LOW'},{line:"INPUT_PULLUP",note:"Activa una resistencia interna de ~20k\u03A9 conectada a 5V. El bot\xF3n conectado a GND lee LOW cuando se presiona, HIGH cuando no"}],errors:[{symptom:"El motor no gira aunque todo parece correcto",cause:"Olvidaste pinMode() en alg\xFAn pin de motor",fix:"Revis\xE1 que TODOS los pines (AIN1, AIN2, PWMA, BIN1, BIN2, PWMB, STBY) tengan pinMode() en setup()"},{symptom:"El pin lee valores aleatorios",cause:'Pin INPUT sin pull-up, el pin "flota"',fix:"Us\xE1 INPUT_PULLUP o conect\xE1 una resistencia f\xEDsica de 10k\u03A9 a 5V"}],variants:"INPUT_PULLDOWN (ESP32 solamente): pull-down interno de ~45k\u03A9 a GND. \xDAtil cuando el sensor entrega HIGH en activo.",experiment:"Coment\xE1 el pinMode(6, OUTPUT) de STBY. \xBFQu\xE9 pasa? El driver permanece en standby aunque pongas HIGH despu\xE9s."},{id:"digitalwrite",title:"digitalWrite() \u2014 Controlar salidas digitales",tags:["fundam","gpio","output","motor","led"],platform:"both",concept:"Pone un pin de salida en HIGH (5V) o LOW (0V). Se usa para: activar drivers de motor, LEDs, rel\xE9s, y cualquier cosa que s\xF3lo necesite encendido/apagado.",hardware:"Cuando escrib\xEDs HIGH, el microcontrolador conecta internamente el pin a VCC (5V en Arduino, 3.3V en ESP32). Cuando escrib\xEDs LOW, lo conecta a GND. Pod\xE9s entregar hasta ~40mA por pin.",example:`void setup() {
  pinMode(8, OUTPUT);
}

void loop() {
  digitalWrite(8, HIGH);  // LED encendido
  delay(500);
  digitalWrite(8, LOW);   // LED apagado
  delay(500);
  // Resultado: LED parpadea cada 500ms
}`,applied:`// Desaf\xEDo: controlar direcci\xF3n del motor A (TB6612FNG)
// Para avanzar:
digitalWrite(5, HIGH);  // AIN1 = HIGH
digitalWrite(4, LOW);   // AIN2 = LOW
// Para retroceder:
digitalWrite(5, LOW);   // AIN1 = LOW
digitalWrite(4, HIGH);  // AIN2 = HIGH
// Para frenar (BRAKE activo):
digitalWrite(5, HIGH);  // AIN1 = HIGH
digitalWrite(4, HIGH);  // AIN2 = HIGH`,lines:[{line:"digitalWrite(5, HIGH)",note:"Pin 5 sube a 5V \u2014 activa AIN1 del TB6612FNG"},{line:"digitalWrite(4, LOW)",note:"Pin 4 baja a 0V \u2014 desactiva AIN2"},{line:"HIGH+LOW en IN1+IN2",note:"Esta combinaci\xF3n pone el motor en modo FORWARD seg\xFAn la tabla del datasheet del TB6612FNG"}],errors:[{symptom:"El motor gira al rev\xE9s",cause:"Invertiste AIN1 y AIN2, o invertiste los cables del motor",fix:"Intercambi\xE1 los valores de HIGH y LOW, o intercambi\xE1 los cables del motor"},{symptom:"Nada sucede",cause:"No hiciste pinMode(OUTPUT) antes, o STBY no est\xE1 en HIGH",fix:"Verific\xE1 setup()"}],variants:"Para un LED activo LOW (como el GPIO8 del ESP32-C3 FRANKY): LOW = encendido, HIGH = apagado.",experiment:"Cambiar AIN1=HIGH,AIN2=HIGH. \xBFEl motor frena bruscamente o gira libremente? Compar\xE1 con AIN1=LOW,AIN2=LOW."},{id:"analogwrite",title:"analogWrite() \u2014 PWM para velocidad y brillo",tags:["fundam","pwm","motor","led","franky"],platform:"both",concept:'analogWrite() genera una se\xF1al PWM: el pin oscila entre HIGH y LOW a ~490Hz. El valor (0-255) controla el duty cycle \u2014 cu\xE1nto tiempo est\xE1 encendido. El motor o LED "promedia" esta se\xF1al como si fuera un voltaje reducido.',hardware:"Solo funcionan en pines marcados con ~ (tilde): en Arduino Nano son D3, D5, D6, D9, D10, D11. En el simulador, cualquier pin puede recibir PWM. La frecuencia real en Arduino var\xEDa seg\xFAn el pin: D5/D6 a 980Hz, el resto a 490Hz.",example:`void setup() {
  pinMode(3, OUTPUT); // Pin 3 es PWM (~3 en Arduino Nano)
}

void loop() {
  analogWrite(3, 0);    // 0%  duty \u2192 motor parado
  delay(1000);
  analogWrite(3, 64);   // 25% duty \u2192 motor lento
  delay(1000);
  analogWrite(3, 128);  // 50% duty \u2192 media velocidad
  delay(1000);
  analogWrite(3, 255);  // 100% duty \u2192 velocidad m\xE1xima
  delay(1000);
}`,applied:`// Desaf\xEDo: motor A a velocidad controlada
#define Mizq_pwm 3
#define VEL_LENTO  100
#define VEL_NORMAL 180
#define VEL_RAPIDO 255

// En loop():
analogWrite(Mizq_pwm, VEL_NORMAL); // Motor izq a 180/255 = 70% vel.

// Para parar: 
analogWrite(Mizq_pwm, 0); // 0% duty \u2192 sin corriente \u2192 motor libre`,lines:[{line:"analogWrite(3, 128)",note:"128/255 \u2248 50% duty cycle. El motor recibe tensi\xF3n promedio de 5V\xD70.5 = 2.5V"},{line:"analogWrite(3, 0)",note:"0% duty \u2014 el pin siempre est\xE1 LOW \u2014 motor no recibe corriente \u2014 gira libremente"},{line:"analogWrite(3, 255)",note:"100% duty \u2014 el pin siempre HIGH \u2014 motor recibe tensi\xF3n completa \u2014 velocidad m\xE1xima"}],errors:[{symptom:"Motor no var\xEDa velocidad, siempre igual",cause:"Est\xE1s usando un pin que NO es PWM (sin ~)",fix:"Verific\xE1 que el pin tiene ~ en el esquema. En Arduino Nano: 3,5,6,9,10,11"},{symptom:"Velocidades distintas al usar el mismo valor en ambos motores",cause:"Los motores tienen tolerancias mec\xE1nicas distintas",fix:"Us\xE1 trim: motorA=VEL, motorB=VEL-10 (ajust\xE1 experimentando)"}],variants:"Para LED con brillo: analogWrite(ledPin, map(distancia, 10, 80, 255, 0)) \u2014 m\xE1s cerca = m\xE1s brillante.",experiment:"Prob\xE1 valores intermedios: 50, 100, 150, 200. \xBFEl robot acelera linealmente o hay un umbral donde reci\xE9n empieza a moverse? \xBFPor qu\xE9?"},{id:"analogread",title:"analogRead() \u2014 Leer sensores anal\xF3gicos",tags:["fundam","sensor","adc","ir","qtr","franky"],platform:"both",concept:"Lee un voltaje anal\xF3gico (0V a VREF) y lo convierte a un n\xFAmero entero. Arduino 10-bit: 0-1023. ESP32 12-bit: 0-4095. No requiere pinMode() \u2014 se configura autom\xE1ticamente.",hardware:"El ADC (Analog to Digital Converter) muestrea el voltaje en el pin cada vez que llam\xE1s analogRead(). En Arduino es blocking (~100\xB5s). En ESP32 hay ruido en el ADC \u2014 se recomienda promediar varias lecturas para mayor precisi\xF3n.",example:`void setup() {
  Serial.begin(9600);
  // No necesita pinMode() para pines anal\xF3gicos
}

void loop() {
  int valor = analogRead(A0); // 0 = 0V, 1023 = 5V (Arduino)
  
  // Convertir a voltaje:
  float voltaje = valor * (5.0 / 1023.0);
  
  Serial.print("ADC: "); Serial.print(valor);
  Serial.print(" | Voltaje: "); Serial.println(voltaje);
  delay(200);
}`,applied:`// Desaf\xEDo: leer Sharp IR para detectar obst\xE1culo
#define SENSOR A0
#define UMBRAL  350  // Experiment\xE1 con este valor

void loop() {
  int distancia = analogRead(SENSOR);
  
  // Sharp GP2Y0A21: valor ALTO = objeto CERCA
  // Calibraci\xF3n t\xEDpica:
  // >700: muy cerca (<10cm)
  // >350: cerca (10-25cm)
  // <150: lejos (>40cm)
  
  if (distancia > UMBRAL) {
    // Obst\xE1culo detectado
    Serial.print("CERCA: "); Serial.println(distancia);
  } else {
    Serial.print("LEJOS: "); Serial.println(distancia);
  }
  delay(20);
}`,lines:[{line:"analogRead(A0)",note:"Lee el pin anal\xF3gico A0. Retorna un entero 0-1023 (Arduino) o 0-4095 (ESP32)"},{line:"valor * (5.0 / 1023.0)",note:"Convierte el valor digital a voltaje. 1023 corresponde a 5V, entonces 512 \u2248 2.5V"},{line:"delay(20)",note:"Esper\xE1s 20ms entre lecturas. Para mayor estabilidad: promedi\xE1 3-5 lecturas consecutivas"}],errors:[{symptom:"Valores muy ruidosos, saltan mucho",cause:"Ruido en la alimentaci\xF3n o en el cable del sensor",fix:"Promedi\xE1: int s=0; for(int i=0;i<5;i++) s+=analogRead(A0); s/=5;"},{symptom:"Sensor siempre lee 0 o siempre 1023",cause:"Cable desconectado o sensor sin alimentaci\xF3n",fix:"Verific\xE1 GND y VCC del sensor. Un pin desconectado puede leer cualquier valor"}],variants:"Para ESP32 (FRANKY): analogRead() retorna 0-4095. El umbral debe multiplicarse por ~2.6 respecto a Arduino. Ejemplo: umbral Arduino=350 \u2192 umbral ESP32\u2248910.",experiment:"Cambi\xE1 el UMBRAL de 350 a 200 y a 600. Observ\xE1 cu\xE1ndo se detecta el obst\xE1culo en cada caso. \xBFCu\xE1l umbral es m\xE1s \xFAtil para minisumo?"},{id:"sharp-ir",title:"Sharp IR \u2014 Sensor de distancia anal\xF3gico",tags:["sensor","ir","sharp","minisumo","roboard"],platform:"ROBOARD",concept:"El GP2Y0A21YK mide distancia por triangulaci\xF3n \xF3ptica: emite IR y mide el \xE1ngulo con que regresa en un fotodetector lineal (PSD). La respuesta es NO lineal \u2014 a mayor distancia, menor voltaje, pero la curva no es una l\xEDnea recta.",hardware:"El sensor tiene 3 cables: VCC (5V), GND, y Vo (voltaje de salida anal\xF3gico). El Vo var\xEDa de ~0.4V (lejos) a ~3.1V (cerca de 10cm). Por debajo de 10cm la curva invierte \u2014 no usar a menos de 10cm.",example:`#define SENSOR_IR A0

void setup() {
  Serial.begin(9600);
  // No necesita pinMode
}

void loop() {
  int raw = analogRead(SENSOR_IR);
  
  // Interpretaci\xF3n para GP2Y0A21YK:
  if      (raw > 700) Serial.println("MUY CERCA (<10cm)");
  else if (raw > 400) Serial.println("CERCA (10-25cm)");
  else if (raw > 150) Serial.println("LEJOS (25-50cm)");
  else                Serial.println("FUERA DE RANGO");
  
  Serial.println(raw); // Imprim\xED el valor crudo para calibrar
  delay(100);
}`,applied:`// Desaf\xEDo: detectar obst\xE1culo y parar
#define SENSOR_IR A0
#define UMBRAL_PARAR 350  // Ajust\xE1 seg\xFAn tu sensor

void loop() {
  int distancia = analogRead(SENSOR_IR);
  
  if (distancia < UMBRAL_PARAR) {
    // Libre \u2014 avanzar
    avanzar(180);
  } else {
    // Obst\xE1culo \u2014 parar
    frenar();
    Serial.print("Obst\xE1culo detectado: ADC=");
    Serial.println(distancia);
  }
  delay(20); // 50 lecturas por segundo
}`,lines:[{line:"raw > 700",note:"Esto significa el objeto est\xE1 MUY cerca. El voltaje es alto (~3.1V). Cuidado: <10cm la curva se invierte"},{line:"raw > 400",note:"Distancia de trabajo \xFAtil para minisumo y detecci\xF3n de obst\xE1culos (~15-25cm)"},{line:"delay(100)",note:"A 10Hz (100ms) es suficiente para calibraci\xF3n. En operaci\xF3n real us\xE1 20ms (50Hz) para respuesta r\xE1pida"}],errors:[{symptom:"Sensor lee valores bajos aunque hay objeto cerca",cause:"El objeto est\xE1 a menos de 10cm \u2014 zona muerta del sensor",fix:"Asegurate de colocar el sensor a m\xE1s de 10cm del obst\xE1culo m\xEDnimo"},{symptom:"Umbral no funciona igual en el robot real vs simulador",cause:"Los sensores var\xEDan entre unidades, y la iluminaci\xF3n afecta el IR",fix:"Siempre calibr\xE1 con Serial.println() imprimiendo valores reales"}],variants:"Para calcular distancia en cm: dist_cm = 4800 / (raw - 20). Esta f\xF3rmula aproxima la curva del GP2Y0A21YK (solo v\xE1lida 10-80cm).",experiment:"Imprim\xED los valores mientras mov\xE9s el obst\xE1culo de 5cm a 50cm. Dibuj\xE1 la curva. \xBFEs lineal? \xBFPor qu\xE9 no? \xBFQu\xE9 implica eso para elegir el umbral?"},{id:"hcsr04",title:"HC-SR04 \u2014 Ultrasonido",tags:["sensor","hcsr04","minisumo","pulseIn","roboard"],platform:"ROBOARD",concept:"Mide distancia por tiempo de vuelo del sonido: emite un pulso ultras\xF3nico (40kHz) y mide cu\xE1nto tarda en volver. Es m\xE1s lento que el IR (~30ms por lectura) pero m\xE1s preciso a larga distancia y no le afecta el color del objeto.",hardware:"4 pines: VCC (5V), GND, TRIG (digital out), ECHO (digital in). TRIG dispara el pulso. ECHO se mantiene HIGH durante el tiempo del eco. El tiempo de ECHO en microsegundos dividido por 58 da la distancia en cm.",example:`#define TRIG 13
#define ECHO A3

void setup() {
  pinMode(TRIG, OUTPUT);
  Serial.begin(9600);
}

long medirDistancia() {
  digitalWrite(TRIG, LOW);   delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  return pulseIn(ECHO, HIGH, 30000); // microsegundos
}

void loop() {
  long us  = medirDistancia();
  long cm  = us / 58; // distancia en cent\xEDmetros
  Serial.print("us="); Serial.print(us);
  Serial.print(" cm="); Serial.println(cm);
  delay(200);
}`,applied:`// Desaf\xEDo: minisumo \u2014 detectar oponente
#define TRIG 13
#define ECHO A3
#define DIST_ATACAR 350  // \xB5s: <350\xB5s \u2248 oponente a <20cm

void loop() {
  long dist = medirDistancia();
  
  if (dist > 0 && dist < DIST_ATACAR) {
    // Oponente detectado \u2014 atacar
    avanzar(255); // Velocidad m\xE1xima
  } else {
    // Sin oponente \u2014 buscar girando
    girarDer(160);
  }
}`,lines:[{line:"delayMicroseconds(2)",note:"Tiempo m\xEDnimo para que TRIG est\xE9 estable en LOW antes del pulso"},{line:"delayMicroseconds(10)",note:"Duraci\xF3n del pulso de trigger: 10\xB5s activa el sonar del HC-SR04"},{line:"pulseIn(ECHO, HIGH, 30000)",note:"Espera hasta 30ms (30000\xB5s) para recibir el eco. Si no llega: retorna 0 (sin objeto en rango)"},{line:"tiempo_us / 58",note:"Distancia(cm) = tiempo(\xB5s) / 58. Derivado de: dist = velocidad\xD7tiempo/2 = 343m/s \xD7 t / 2"}],errors:[{symptom:"pulseIn() siempre retorna 0",cause:"Sin objeto en rango, o cables TRIG/ECHO invertidos",fix:"Verific\xE1 conexiones. Pon\xE9 algo a 20cm del sensor y comprob\xE1"},{symptom:"El robot se congela durante la medici\xF3n",cause:"pulseIn() es bloqueante \u2014 puede tardar hasta 30ms",fix:"Reduc\xED el timeout: pulseIn(ECHO, HIGH, 15000) para 2.5m m\xE1ximo"}],variants:"Para convertir \xB5s a cm: long dist_cm = tiempo_us / 58. Para minisumo es m\xE1s \xFAtil trabajar directamente en \xB5s y calibrar el umbral en esas unidades.",experiment:"\xBFCu\xE1nto mide pulseIn() con el oponente a 10cm? \xBFA 30cm? Calcul\xE1: \xBFcoincide con tiempo_us/58 cm? \xBFPor qu\xE9 puede haber diferencia?"},{id:"qtr",title:"Sensor QTR \u2014 Reflectivo de l\xEDnea y borde",tags:["sensor","qtr","minisumo","line-follower","roboard"],platform:"ROBOARD",concept:"El QTR emite IR hacia abajo y mide cu\xE1nta luz regresa. Superficie negra absorbe \u2192 valor bajo. Superficie blanca refleja \u2192 valor alto. Se usa para: detectar borde en minisumo, y seguir l\xEDnea negra sobre fondo blanco.",hardware:"En el simulador: A0-A7 se inyectan con valores QTR basados en la geometr\xEDa de la escena. En hardware real el QTR tiene un LED IR y un fototransistor. El umbral correcto depende de la distancia al suelo (normalmente 3-5mm).",example:`#define QTR_CENTRO A0
#define QTR_DERECHO A1
#define UMBRAL 500  // Ajust\xE1: >UMBRAL = negro (l\xEDnea o tatami)

void setup() {
  Serial.begin(9600);
}

void loop() {
  int c = analogRead(QTR_CENTRO);
  int r = analogRead(QTR_DERECHO);
  
  bool lineaCentro  = (c > UMBRAL); // true = detecta negro
  bool lineaDerecha = (r > UMBRAL);
  
  Serial.print("Centro:"); Serial.print(c);
  Serial.print(" Der:");   Serial.print(r);
  Serial.print(" | ");
  Serial.print(lineaCentro  ? "NEGRO " : "BLANCO ");
  Serial.println(lineaDerecha ? "NEGRO"  : "BLANCO");
  delay(100);
}`,applied:`// Desaf\xEDo: detectar borde en minisumo
#define QTR A6    // Sensor frontal-derecho
#define BORDE 600 // Alto = borde blanco detectado

void loop() {
  int qtr = analogRead(QTR);
  
  if (qtr > BORDE) {
    // Borde blanco \u2014 escapar
    retroceder(200);
    delay(150);
    girarDer(160);
    delay(300);
  } else {
    // Tatami negro \u2014 avanzar normal
    avanzar(160);
  }
  delay(10);
}`,lines:[{line:"analogRead(QTR_CENTRO)",note:"Lee el sensor. El QTR responde al color de la superficie BAJO el sensor"},{line:"c > UMBRAL",note:"Si el valor supera UMBRAL: superficie negra detectada. Si no: superficie blanca/clara"},{line:"qtr > BORDE",note:"En minisumo: si el QTR lee alto, el robot est\xE1 sobre el borde blanco del tatami. Debe escapar INMEDIATAMENTE"}],errors:[{symptom:"El robot no detecta el borde aunque est\xE1 encima",cause:"UMBRAL muy alto, o sensor muy lejos del suelo",fix:"Baj\xE1 el umbral o acerc\xE1 el sensor al suelo. Imprim\xED valores para calibrar"},{symptom:"Falsos positivos \u2014 detecta borde en el interior del tatami",cause:"UMBRAL muy bajo, la superficie del tatami var\xEDa",fix:"Sub\xED el umbral. El interior del tatami da t\xEDpicamente <200"}],variants:"QTR anal\xF3gico (como A6/A7 en Nano) vs QTR digital (con comparador): el digital solo da 0/1, el anal\xF3gico te da el valor completo para ajustar el umbral.",experiment:"Imprim\xED los valores QTR mientras mov\xE9s el robot del interior del tatami hacia el borde. \xBFEn qu\xE9 valor exacto cambia? Ese es tu umbral \xF3ptimo."},{id:"qtr8",title:"Array QTR-8 \u2014 Centro de masa y error de posici\xF3n",tags:["sensor","qtr8","array","control-p","control-pd","roboard"],platform:"ROBOARD",concept:"8 sensores QTR en fila dan m\xE1s informaci\xF3n que 2: no solo si est\xE1s en la l\xEDnea, sino D\xD3NDE est\xE1 la l\xEDnea relativa al robot. El error se calcula como centro de masa ponderado \u2014 n\xFAmero positivo = l\xEDnea a la derecha, negativo = l\xEDnea a la izquierda.",hardware:"Los 8 sensores leen A0-A7. Las posiciones relativas se codifican como -350 a +350 (de izquierda a derecha). Esto es un promedio pesado: cada sensor contribuye seg\xFAn su posici\xF3n multiplicada por su lectura.",example:`#define N 8
#define UMBRAL 500

const int POS[N] = {-350,-250,-150,-50,50,150,250,350};

void setup() { Serial.begin(9600); }

int calcularError() {
  long suma = 0, peso = 0;
  
  for (int i = 0; i < N; i++) {
    int v = analogRead(i); // Lee A0, A1, ..., A7
    if (v > UMBRAL) {
      suma += (long)POS[i] * v;
      peso += v;
    }
  }
  
  if (peso == 0) return 0; // L\xEDnea perdida \u2014 mantener \xFAltimo error
  return (int)(suma / peso);
  // Resultado: 0=centrado, +350=l\xEDnea lejos a la derecha
}`,applied:`// Desaf\xEDo: seguidor de l\xEDnea con control P
#define VEL_BASE 140
#define KP 0.35f

static int errorAnterior = 0;

void loop() {
  int error = calcularError();
  if (error == 0 && /* sin sensores activos */ true) error = errorAnterior;
  errorAnterior = error;
  
  int corr = (int)(KP * error);
  int velIzq = constrain(VEL_BASE - corr, 0, 255);
  int velDer = constrain(VEL_BASE + corr, 0, 255);
  
  avanzar(velIzq, velDer);
  delay(5);
}`,lines:[{line:"suma += (long)POS[i] * v",note:"Acumula: posici\xF3n del sensor \xD7 su lectura. El cast a long evita overflow (350 \xD7 1023 = 358050, supera el int de 16-bit en AVR)"},{line:"peso += v",note:'Acumula el total de "certeza". Sensores que ven m\xE1s negro tienen m\xE1s peso'},{line:"suma / peso",note:"Divisi\xF3n: da la posici\xF3n promedio ponderada. Con l\xEDnea centrada = ~0. Error grande = l\xEDnea lejos del centro"}],errors:[{symptom:"Error siempre 0 aunque la l\xEDnea est\xE1 descentrada",cause:"Ning\xFAn sensor supera UMBRAL \u2014 umbral demasiado alto",fix:'Baj\xE1 UMBRAL. Imprim\xED todos los valores crudos: for(int i=0;i<8;i++){Serial.print(analogRead(i));Serial.print(" ");}'},{symptom:"Robot oscila mucho con KP=0.35",cause:"KP demasiado alto para esa velocidad",fix:"Reduc\xED VEL_BASE a 120 o baj\xE1 KP a 0.2. La relaci\xF3n velocidad/KP requiere ajuste"}],variants:"Guardar el \xFAltimo error v\xE1lido: static int ult=0; int e=calcularError(); if(peso>0) ult=e; return ult; \u2014 para cuando la l\xEDnea se pierde temporalmente.",experiment:"\xBFQu\xE9 pasa con KP=0.1? \xBFCon KP=0.8? \xBFCon VEL_BASE=200 y KP=0.35? Observ\xE1 la diferencia entre subir velocidad vs subir KP."},{id:"millis",title:"millis() \u2014 Temporizaci\xF3n sin bloquear",tags:["millis","timing","state-machine","non-blocking","roboard","franky"],platform:"both",concept:'millis() retorna los milisegundos transcurridos desde que arranc\xF3 el programa. Al restarle un valor guardado obten\xE9s cu\xE1nto pas\xF3. A diferencia de delay(), NO bloquea \u2014 el robot sigue leyendo sensores mientras "espera".',hardware:"El timer de hardware del microcontrolador incrementa un contador interno cada milisegundo. millis() simplemente lee ese contador. Se desborda cada ~49 d\xEDas, pero la resta sigue funcionando correctamente por aritm\xE9tica de complemento a dos.",example:`unsigned long tInicio = 0;
bool esperando = false;

void setup() {
  tInicio = millis(); // Guardar momento de inicio
}

void loop() {
  unsigned long ahora = millis();
  
  // Verificar si pasaron 2000ms SIN bloquear:
  if (ahora - tInicio >= 2000) {
    // Han pasado 2 segundos
    tInicio = ahora; // Resetear para el pr\xF3ximo ciclo
    // hacer algo...
  }
  
  // El c\xF3digo aqu\xED se ejecuta SIEMPRE, incluso durante la "espera"
  int sensor = analogRead(A0); // Siempre lee
}`,applied:`// Desaf\xEDo: esquivar obst\xE1culo con estados sin delay()
#define AVANZANDO 0
#define GIRANDO   1

int estado = AVANZANDO;
unsigned long tEstado = 0;

void loop() {
  int sensor = analogRead(A0); // Siempre lee \u2014 nunca bloqueado
  unsigned long ahora = millis();
  
  if (estado == AVANZANDO) {
    if (sensor > 350) {
      // Obst\xE1culo: cambiar a GIRANDO
      estado = GIRANDO;
      tEstado = millis();
      Serial.println("Girando...");
    } else {
      avanzar(180); // Avanzar mientras libre
    }
  } else if (estado == GIRANDO) {
    if (ahora - tEstado < 600) {
      girarDer(160); // Girar por 600ms
    } else {
      estado = AVANZANDO; // Volver a avanzar
      tEstado = millis();
    }
  }
}`,lines:[{line:"ahora - tInicio >= 2000",note:"Cu\xE1nto pas\xF3 desde el \xFAltimo evento. Funciona aunque millis() se desborde (aritm\xE9tica unsigned)"},{line:"tEstado = millis()",note:"Guardar el momento del cambio de estado. La pr\xF3xima vez restamos contra este valor"},{line:"estado = GIRANDO",note:'Una variable de estado permite tener "memoria" de qu\xE9 est\xE1 haciendo el robot sin bloquear'}],errors:[{symptom:"El robot se congela por 2 segundos",cause:"Usaste delay(2000) en lugar de millis()",fix:"Reemplaz\xE1 delay() por el patr\xF3n de millis() con variable de tiempo"},{symptom:"Los tiempos no son exactos",cause:"Procesamiento entre iteraciones de loop() agrega latencia",fix:"Para mayor precisi\xF3n: reduc\xED lo que hac\xE9s en loop(), us\xE1 interrupciones para cosas cr\xEDticas"}],variants:"Para m\xFAltiples temporizadores independientes: us\xE1 m\xFAltiples variables tEstadoA, tEstadoB, etc. Cada una es independiente.",experiment:"Con delay(2000) en loop(): \xBFcu\xE1nto tarda el robot en reaccionar a un obst\xE1culo que aparece DURANTE el delay? Compar\xE1 con millis()."},{id:"control-diferencial",title:"Control Diferencial \u2014 Movimiento por velocidad",tags:["motor","control-diferencial","kinematics","roboard","franky"],platform:"both",concept:"Un robot diferencial se mueve cambiando la velocidad relativa de sus dos ruedas. Si ambas van igual: va recto. Si una va m\xE1s r\xE1pido que la otra: curva hacia el lado de la m\xE1s lenta. Si van en sentidos opuestos: gira sobre su eje.",hardware:'Dos motores DC independientes. La direcci\xF3n y velocidad de cada uno se controla por separado. No hay direcci\xF3n mec\xE1nica como en un auto \u2014 la "direcci\xF3n" emerge de la diferencia de velocidad.',example:`// Control diferencial b\xE1sico
void avanzar(int vel) {
  // Ambos motores igual \u2192 movimiento recto
  setMotorA(ADELANTE, vel);
  setMotorB(ADELANTE, vel);
}

void curvarDerecha(int vel, int intensidad) {
  // Motor izq m\xE1s r\xE1pido \u2192 curva a la derecha
  setMotorA(ADELANTE, vel + intensidad);  // Izq r\xE1pido
  setMotorB(ADELANTE, vel - intensidad);  // Der lento
}

void girarEnLugar(int vel) {
  // Motores opuestos \u2192 giro sobre el eje
  setMotorA(ADELANTE, vel);   // Izq adelante
  setMotorB(REVERSA,  vel);   // Der atr\xE1s
}`,applied:`// Desaf\xEDo: seguidor de l\xEDnea \u2014 control diferencial proporcional
// error = 0 \u2192 centrado \u2192 ambas velocidades iguales
// error > 0 \u2192 l\xEDnea a la derecha \u2192 corregir curveando derecha
// error < 0 \u2192 l\xEDnea a la izquierda \u2192 corregir curveando izquierda

int corr = (int)(KP * error);
// corr positivo: izq m\xE1s r\xE1pido (curva derecha)
// corr negativo: der m\xE1s r\xE1pido (curva izquierda)
int velIzq = constrain(VEL_BASE - corr, 0, 255);
int velDer = constrain(VEL_BASE + corr, 0, 255);`,lines:[{line:"vel + intensidad",note:"Motor izquierdo m\xE1s r\xE1pido hace que el robot curve a la derecha. Contraintuitivo pero correcto en diferencial"},{line:"constrain(VEL_BASE - corr, 0, 255)",note:"constrain() limita el valor entre 0 y 255. Sin esto: valores negativos dar\xEDan marcha atr\xE1s inesperada"},{line:"setMotorA(REVERSA, vel)",note:"Reversa en un motor + adelante en el otro = giro sobre el eje central del robot"}],errors:[{symptom:"El robot curva en la direcci\xF3n equivocada",cause:"Los motores est\xE1n invertidos (izq/der intercambiados) o los cables del motor",fix:"Intercambi\xE1 el signo del error: corr = -corr"},{symptom:"El robot oscila en zigzag con correcci\xF3n proporcional",cause:"KP muy alto",fix:"Reduc\xED KP a la mitad. Si sigue: reduc\xED tambi\xE9n VEL_BASE"}],variants:"Para giro continuo suave (circunferencias): setMotorA(vel+r); setMotorB(vel-r); donde r define el radio. r=vel \u2192 c\xEDrculo; r=0 \u2192 recto.",experiment:"\xBFQu\xE9 pasa si velIzq=200, velDer=100? \xBFY si velIzq=200, velDer=-100? Calcul\xE1 el radio de curvatura en cada caso."},{id:"control-p",title:"Control Proporcional (P) \u2014 Correcci\xF3n proporcional al error",tags:["control-p","pid","line-follower","proportional","roboard"],platform:"ROBOARD",concept:"El controlador P aplica una correcci\xF3n proporcional al error actual. Si el error es grande, la correcci\xF3n es grande. Si el error es peque\xF1o, la correcci\xF3n es peque\xF1a. KP es la ganancia: cu\xE1nta correcci\xF3n por unidad de error.",hardware:'En robots: el "error" es la diferencia entre d\xF3nde est\xE1s y d\xF3nde quer\xE9s estar. En seguidor de l\xEDnea: error = posici\xF3n de la l\xEDnea - centro del robot. La "correcci\xF3n" cambia las velocidades de los motores.',example:`// Control P para seguidor de l\xEDnea
#define KP 0.35f

void controlP() {
  int error = calcularError(); // Positivo: l\xEDnea a la derecha
  
  // Correcci\xF3n proporcional:
  int corr = (int)(KP * error);
  // error=0   \u2192 corr=0   \u2192 ambos motores igual \u2192 recto
  // error=100 \u2192 corr=35  \u2192 diferencia de 35/255 en velocidad
  // error=350 \u2192 corr=122 \u2192 diferencia grande \u2192 curva pronunciada
  
  int velIzq = constrain(VEL_BASE - corr, 0, 255);
  int velDer = constrain(VEL_BASE + corr, 0, 255);
  
  setMotorIzq(ADELANTE, velIzq);
  setMotorDer(ADELANTE, velDer);
}`,applied:`// S\xEDntomas y diagn\xF3stico del control P:
// KP muy bajo (0.1): corrige lento, sale de la l\xEDnea en curvas
// KP correcto (0.3-0.5): sigue la l\xEDnea con oscilaci\xF3n m\xEDnima
// KP muy alto (1.0): oscila agresivamente, puede perder la l\xEDnea

// Ajuste de KP:
// 1. Empezar con KP=0.1, VEL_BASE=120
// 2. Aumentar KP hasta que empiece a oscilar levemente
// 3. El \xF3ptimo es ~80% del KP que causa oscilaci\xF3n`,lines:[{line:"KP * error",note:"El tipo float es importante: (int)(0.35 * 100) = 35. Sin float: (0 * 100) = 0 (truncado a int)"},{line:"constrain(VEL_BASE - corr, 0, 255)",note:"Evita velocidades negativas (marcha atr\xE1s accidental) y superar el m\xE1ximo de 255"},{line:"VEL_BASE - corr",note:"Motor izquierdo: si error>0 (l\xEDnea a la derecha), reducir vel izq \u2192 curvar derecha para corregir"}],errors:[{symptom:"El robot no corrige en curvas pero va bien en rectas",cause:"KP insuficiente para el radio de curvatura",fix:"Aumentar KP o reducir VEL_BASE para darle m\xE1s tiempo de reacci\xF3n"},{symptom:"Correcci\xF3n correcta en rectas pero oscila en curvas",cause:"Solo necesit\xE1s PD: el t\xE9rmino D amortigua la oscilaci\xF3n",fix:"Agreg\xE1 t\xE9rmino derivativo \u2014 ver secci\xF3n Control PD"}],variants:"Para pared-siguiendo: error = sensorLateral - DIST_OBJETIVO. El mismo P se aplica igual que para la l\xEDnea.",experiment:"Prob\xE1 con KP=0.1, 0.3, 0.5, 0.8. En cada caso: \xBFEl robot completa el \xF3valo? \xBFEn cu\xE1ntos intentos sale de la pista? Anot\xE1 los resultados."},{id:"control-pd",title:"Control PD \u2014 Derivada: amortiguar oscilaciones",tags:["control-pd","pid","derivative","line-follower","minisumo","roboard"],platform:"ROBOARD",concept:"El t\xE9rmino D (derivativo) reacciona al CAMBIO del error, no al error en s\xED. Si el error est\xE1 disminuyendo r\xE1pido (volv\xE9s al centro), el t\xE9rmino D frena la correcci\xF3n. Esto previene sobrepasar el objetivo y oscilar.",hardware:'No requiere hardware adicional \u2014 es puramente de software. Necesita "memoria" del ciclo anterior: una variable est\xE1tica que guarda el error previo. La diferencia entre el error actual y el anterior es la derivada discreta.',example:`// Control PD para seguidor de l\xEDnea
#define KP 0.35f
#define KD 0.10f

static int errorAnterior = 0; // "static" persiste entre llamadas

void controlPD() {
  int error = calcularError();
  
  // Derivada discreta del error:
  int dError = error - errorAnterior;
  errorAnterior = error; // Guardar para pr\xF3ximo ciclo
  
  // Correcci\xF3n PD:
  int corr = (int)(KP * error + KD * dError);
  // Cuando error cae r\xE1pido: dError negativo \u2192 KD*dError reduce la correcci\xF3n
  // Cuando error sube r\xE1pido: dError positivo \u2192 KD*dError aumenta la correcci\xF3n
  
  int velIzq = constrain(VEL_BASE - corr, 0, 255);
  int velDer = constrain(VEL_BASE + corr, 0, 255);
  setMotores(velIzq, velDer);
}`,applied:`// Diagn\xF3stico visual PD:
// SIN D: el robot oscila como un p\xE9ndulo alrededor de la l\xEDnea
// CON D correcto: oscilaciones se amortiguan r\xE1pidamente
// CON D excesivo: el robot va lento en curvas (frena demasiado)

// Ajuste de KD:
// 1. Empezar con KD=0 (solo P)
// 2. Aumentar KD lentamente: 0.02, 0.05, 0.10, 0.15...
// 3. Parar cuando las oscilaciones desaparezcan
// 4. Si va muy lento en curvas: KD es demasiado alto`,lines:[{line:"static int errorAnterior = 0",note:'"static" en una funci\xF3n local equivale a variable global \u2014 persiste entre llamadas a loop(). Sin static: siempre ser\xEDa 0'},{line:"int dError = error - errorAnterior",note:"Derivada discreta: cambio del error entre este ciclo y el anterior. Positivo = error aumentando. Negativo = error disminuyendo"},{line:"KP * error + KD * dError",note:"La suma de ambos t\xE9rminos. P: correcci\xF3n base. D: correcci\xF3n adicional que amortigua el movimiento"}],errors:[{symptom:"Agregar KD empeora el comportamiento",cause:"El ciclo de loop() no tiene intervalo constante \u2014 el dError es inconsistente",fix:"Agreg\xE1 delay(5) al final de loop() para intervalo constante de 5ms"},{symptom:"Robot muy lento en curvas despu\xE9s de agregar KD",cause:"KD demasiado alto \u2014 frena el robot cuando el error cambia",fix:"Reducir KD. El rango \xFAtil suele ser KD = 0.1 a 0.5 \xD7 KP"}],variants:"Control PD con tiempo real: dError = (error - errorAnterior) / dt donde dt es el intervalo en segundos. M\xE1s preciso si el loop no es constante.",experiment:"Con KP=0.35 fijo: prob\xE1 KD=0, 0.05, 0.1, 0.2. \xBFEn qu\xE9 KD dejan de aparecer oscilaciones? \xBFQu\xE9 pasa con KD=0.5?"},{id:"control-pid",title:"Control PID \u2014 Integral: eliminar error estacionario",tags:["control-pid","pid","integral","roboard"],platform:"ROBOARD",concept:"El t\xE9rmino I (integral) acumula el error a lo largo del tiempo. Si el robot tiene un error peque\xF1o pero persistente (nunca llega exactamente al centro), el t\xE9rmino I crece hasta corregirlo. Completa el tri\xE1ngulo PID: P reacciona al error actual, D amortigua cambios, I elimina el error acumulado.",hardware:"Solo software. La integral necesita ser acotada (anti-windup) para evitar que se acumule indefinidamente y cause comportamiento err\xE1tico.",example:`#define KP 0.35f
#define KI 0.001f  // Integral \u2014 empieza peque\xF1o
#define KD 0.10f

static int errorAnterior = 0;
static long integralError = 0;  // long para acumular sin overflow
#define INTEGRAL_MAX 10000       // L\xEDmite anti-windup

void controlPID() {
  int error = calcularError();
  
  // Acumular integral (con anti-windup)
  integralError += error;
  integralError = constrain(integralError, -INTEGRAL_MAX, INTEGRAL_MAX);
  
  // Derivada
  int dError = error - errorAnterior;
  errorAnterior = error;
  
  // Correcci\xF3n PID
  int corr = (int)(KP * error + KI * integralError + KD * dError);
  
  int velIzq = constrain(VEL_BASE - corr, 0, 255);
  int velDer = constrain(VEL_BASE + corr, 0, 255);
  setMotores(velIzq, velDer);
}`,applied:`// \xBFCu\xE1ndo agregar integral (I)?
// El t\xE9rmino I es \xFAtil cuando:
// - El robot sigue la l\xEDnea pero con offset constante
// - En curvas siempre queda ligeramente desviado
// En seguidor de l\xEDnea simple: KI muy peque\xF1o (0.0005-0.002)
// Un KI muy alto causa oscilaciones de baja frecuencia

// Resetear la integral cuando se cambia de estado:
integralError = 0; // Al perder la l\xEDnea o al reiniciar`,lines:[{line:"integralError += error",note:"Suma el error actual al total acumulado. Si el error es siempre 5, despu\xE9s de 100 ciclos ser\xE1 500"},{line:"constrain(integralError, -MAX, MAX)",note:"Anti-windup: limita la integral. Sin esto, si el robot choca y queda bloqueado, la integral explota"},{line:"KI * integralError",note:"KI muy peque\xF1o (0.001) porque la integral puede ser grande. Su efecto es corregir el error residual lentamente"}],errors:[{symptom:"El robot oscila lentamente despu\xE9s de agregar I",cause:"KI demasiado alto o sin anti-windup",fix:"Reducir KI a 0.0005 o agregar/reducir INTEGRAL_MAX"},{symptom:"PID funciona en recta pero falla en curvas",cause:"La integral acumula error en curvas y sobrecorrige",fix:"Resetear integralError cuando el error cambia de signo: if(error*errorAnterior<0) integralError=0;"}],variants:"PID en minisumo para rastreo angular: error = sensorDer - sensorIzq. La integral corrige la deriva acumulada en la b\xFAsqueda.",experiment:"Compar\xE1 el comportamiento con KI=0 vs KI=0.001 en el \xF3valo cerrado. \xBFHay error estacionario (offset) con solo PD? \xBFEl t\xE9rmino I lo elimina?"},{id:"puente-h",title:"Puente H \u2014 TB6612FNG completo (ROBOARD)",tags:["motor","puente-h","tb6612fng","roboard"],platform:"ROBOARD",concept:"Un puente H permite invertir la polaridad de voltaje aplicada a un motor, y as\xED controlar la direcci\xF3n. El TB6612FNG tiene dos puentes H integrados (un chip para dos motores) con protecci\xF3n contra cortocircuito y modo standby.",hardware:`Conexiones en ROBOARD:
  Motor A: AIN1=D5, AIN2=D4, PWMA=D3
  Motor B: BIN1=D7, BIN2=D8, PWMB=D9
  STBY=D6 (debe ser HIGH para habilitar)
  GND del TB6612FNG comparte GND con Arduino y con la bater\xEDa.`,example:`// Configuraci\xF3n completa del TB6612FNG
#define AIN1  5   // Direcci\xF3n motor A
#define AIN2  4
#define PWMA  3   // Velocidad motor A (PWM ~)
#define BIN1  7   // Direcci\xF3n motor B
#define BIN2  8
#define PWMB  9   // Velocidad motor B (PWM ~)
#define STBY  6   // Habilitaci\xF3n del driver

void setup() {
  // Configurar todos los pines de motor
  pinMode(AIN1, OUTPUT); pinMode(AIN2, OUTPUT); pinMode(PWMA, OUTPUT);
  pinMode(BIN1, OUTPUT); pinMode(BIN2, OUTPUT); pinMode(PWMB, OUTPUT);
  pinMode(STBY, OUTPUT);
  
  // MUY IMPORTANTE: habilitar el driver
  digitalWrite(STBY, HIGH);
}

// Funciones de movimiento reutilizables:
void avanzar(int vel) {
  digitalWrite(AIN1,HIGH); digitalWrite(AIN2,LOW);  // Motor A adelante
  digitalWrite(BIN1,HIGH); digitalWrite(BIN2,LOW);  // Motor B adelante
  analogWrite(PWMA, vel);
  analogWrite(PWMB, vel);
}

void frenar() {
  analogWrite(PWMA, 0);
  analogWrite(PWMB, 0);
}`,applied:`// Template base para cualquier desaf\xEDo ROBOARD
// Copi\xE1 esto al inicio de cada sketch:
#define AIN1 5; #define AIN2 4; #define PWMA 3
#define BIN1 7; #define BIN2 8; #define PWMB 9
#define STBY 6

void setup() {
  pinMode(AIN1,OUTPUT);pinMode(AIN2,OUTPUT);pinMode(PWMA,OUTPUT);
  pinMode(BIN1,OUTPUT);pinMode(BIN2,OUTPUT);pinMode(PWMB,OUTPUT);
  pinMode(STBY,OUTPUT);
  digitalWrite(STBY, HIGH); // \u2190 NUNCA olvidar esto
}`,lines:[{line:"digitalWrite(STBY, HIGH)",note:"Activa el chip. Sin esto: los motores no responden aunque todo lo dem\xE1s est\xE9 bien. Es el error #1 en ROBOARD"},{line:"AIN1=HIGH, AIN2=LOW",note:"Tabla del puente H: esto pone el motor A en adelante. AIN1=LOW,AIN2=HIGH = reversa"},{line:"analogWrite(PWMA, vel)",note:"El duty cycle determina la velocidad. El pin PWMA debe ser un pin PWM (tiene ~ en el esquem\xE1tico)"}],errors:[{symptom:"Motores no giran en absoluto",cause:"STBY en LOW o no configurado",fix:"digitalWrite(STBY, HIGH) en setup()"},{symptom:"Solo un motor gira",cause:"Falta configurar los pines del segundo motor",fix:"Verificar que todos los pines tienen pinMode y est\xE1n en la lista setup()"}],variants:"Para freno activo (mejor que dejar libre): digitalWrite(AIN1,HIGH); digitalWrite(AIN2,HIGH); analogWrite(PWMA,0); \u2014 el motor resiste el movimiento.",experiment:"\xBFQu\xE9 diferencia hay entre frenar con analogWrite(PWMA,0) vs AIN1=HIGH,AIN2=HIGH,PWMA=0? Empuj\xE1 el robot despu\xE9s de cada tipo de frenada."},{id:"webserver",title:"WebServer ESP32 \u2014 Control IoT desde browser",tags:["webserver","iot","franky","esp32","rest"],platform:"FRANKY",concept:"FRANKY tiene un servidor HTTP corriendo en el ESP32-C3. Cuando te conect\xE1s al WiFi de FRANKY y abr\xEDs el browser, est\xE1s hablando con ese servidor. Cada bot\xF3n del panel web env\xEDa un HTTP POST o GET al robot.",hardware:'El ESP32-C3 tiene WiFi integrado. Al arrancar, crea un Access Point (red WiFi propia) con nombre "FRANKY-xxxx". El servidor escucha en el puerto 80 (HTTP est\xE1ndar).',example:`// Arquitectura cliente-servidor de FRANKY:

// En el BROWSER (cliente):
// fetch('/mv?d=f&val=200', {method:'POST'})
//   \u2192 env\xEDa: POST /mv?d=f&val=200 HTTP/1.1
//   \u2190 recibe: "OK"

// En el ESP32 (servidor):
// server.on("/mv", HTTP_POST, []() {
//   String d   = server.arg("d");   // "f"
//   int   val  = server.arg("val").toInt(); // 200
//   move(d, val);
//   server.send(200, "text/plain", "OK");
// });

// La funci\xF3n move() en firmware real:
// void move(String d, int spd) {
//   int sA = spd * trimA / 255;
//   int sB = spd * trimB / 255;
//   if(d=="f") { ledcWrite(CH_A1,sA); ledcWrite(CH_B1,sB); }
//   if(d=="b") { ledcWrite(CH_A2,sA); ledcWrite(CH_B2,sB); }
//   if(d=="l") { ledcWrite(CH_A2,sA); ledcWrite(CH_B1,sB); }
//   if(d=="r") { ledcWrite(CH_A1,sA); ledcWrite(CH_B2,sB); }
// }`,applied:`// En el simulador: el panel FRANKY env\xEDa los mismos comandos
// que enviar\xEDa el browser al robot real.
// Cuando presion\xE1s \u25B2 en el gamepad:
//   \u2192 A.fkMove('f')
//   \u2192 getFranky().handleRequest('POST', '/mv', {d:'f', val:200})
//   \u2192 FrankySimulator._move('f', 200)
//   \u2192 setea chA1=200, chB1=200
//   \u2192 eco.physics.step({motorA:FORWARD, motorB:FORWARD}, dt)
//   \u2192 robot se mueve en la simulaci\xF3n

// Diferencia hardware vs simulador:
// Hardware: fetch('/mv') \u2192 WiFi \u2192 TCP/IP \u2192 ESP32 \u2192 LEDC hardware
// Simulador: handleRequest() \u2192 FrankySimulator \u2192 physics engine`,lines:[{line:"server.arg('d')",note:'Lee el par\xE1metro "d" del query string. En POST /mv?d=f esto retorna "f"'},{line:"ledcWrite(CH_A1, sA)",note:"LEDC (LED Control) es el m\xF3dulo PWM del ESP32. Canal CH_A1 controla el motor A hacia adelante"},{line:"trimA / 255",note:"El trim compensa diferencias entre motores. trimA=255 = sin correcci\xF3n. trimA=200 = motor A al 78%"}],errors:[{symptom:"Los botones del panel no mueven el robot en el simulador",cause:"El simulador FRANKY no est\xE1 abierto o no hay challenge FRANKY activo",fix:"Navegar a un challenge FRANKY. El panel se abre autom\xE1ticamente"},{symptom:"En el hardware real: bot\xF3n funciona pero el robot no se mueve",cause:"Trim configurado en 0, o bater\xEDa baja",fix:"Verificar /sumo/trim con valores 200-255"}],variants:'El endpoint /api retorna JSON con el estado completo: {"pwmA":200,"pwmB":200,"mode":0,"a0":1500,...}. \xDAtil para telemetr\xEDa.',experiment:"En el panel Status, mov\xE9 el robot y observ\xE1 c\xF3mo cambian pwmA y pwmB. \xBFCambian al presionar \u25C0? \xBFAl presionar \u25B2? \xBFQu\xE9 diferencia hay entre ambos estados?"},{id:"blockly-codigo",title:"Blockly \u2192 Opcodes \u2192 Movimiento (FRANKY)",tags:["blockly","bloques","franky","bytecode","visual-programming"],platform:"FRANKY",concept:"Los bloques visuales de FRANKY se traducen a una secuencia de instrucciones num\xE9ricas (bytecode). Cada bloque corresponde a un opcode. La VM del ESP32 ejecuta esos opcodes en secuencia, controlando el robot.",hardware:"El ESP32 tiene una mini-VM (m\xE1quina virtual) en firmware que ejecuta el bytecode. Los opcodes se suben via /bloques/add y se ejecutan con /bloques/run. En el simulador, bloquesVMStep() reproduce el mismo comportamiento.",example:`// C\xF3mo los bloques se traducen a opcodes:

// Bloque "Adelante 800ms" \u2192 {op:1, val:800}
//   op=1 = ADE (adelante)
//   val=800 = duraci\xF3n en milisegundos

// Bloque "Girar izq 480ms" \u2192 {op:3, val:480}
//   op=3 = IZQ (izquierda)

// Bloque "LED ON" \u2192 {op:7, val:0}
// Bloque "Esperar 500ms" \u2192 {op:6, val:500}
// Bloque "FIN" \u2192 {op:0, val:0}

// Para un cuadrado de 4 lados:
// [{op:1,val:800}, {op:3,val:480},   // Lado 1
//  {op:1,val:800}, {op:3,val:480},   // Lado 2
//  {op:1,val:800}, {op:3,val:480},   // Lado 3
//  {op:1,val:800}, {op:3,val:480},   // Lado 4
//  {op:0,val:0}]                     // FIN`,applied:`// C\xF3mo depurar el programa Blockly:
// 1. Arrastr\xE1 los bloques en el panel Bloques
// 2. Cada cambio en el workspace actualiza el programa
// 3. Los opcodes aparecen en la lista de instrucciones
// 4. Al presionar \u25B6 Ejecutar:
//    - Los opcodes se env\xEDan al simulador
//    - bloquesVMStep() los ejecuta uno a uno
//    - Cada ADE/IZQ/DER mueve el robot durante val ms

// Para un LED reactivo:
// ADC_READ(0) \u2192 {op:30, val:0}  // leer ADC0
// IF_GT(2000) \u2192 {op:70, val:2000} // si varGlobal > 2000
// LED_ON      \u2192 {op:7, val:0}  // encender LED
// ESP(50)     \u2192 {op:6, val:50} // esperar 50ms
// REPEAT(0)   \u2192 {op:74, val:0} // volver al inicio`,lines:[{line:"{op:1, val:800}",note:"op=1 = ADE (opcode 1). val=800 = duraci\xF3n en ms. El robot avanza durante 800ms"},{line:"{op:70, val:2000}",note:"op=70 = IF_GT. Si varGlobal > 2000: ejecutar la SIGUIENTE instrucci\xF3n. Si no: saltarla"},{line:"{op:74, val:0}",note:"op=74 = REPEAT. Saltar a la instrucci\xF3n \xEDndice 0. Esto crea un loop infinito"}],errors:[{symptom:"El robot ejecuta algunas instrucciones pero se detiene en el medio",cause:"Lleg\xF3 a FIN (op=0) antes del esperado",fix:"Verificar que los bloques no tienen FIN adicional antes del final"},{symptom:"Blockly muestra bloques pero el robot no se mueve al ejecutar",cause:"El programa est\xE1 en el workspace pero no se subi\xF3 con \u25B6 Ejecutar",fix:"Presionar el bot\xF3n \u25B6 Ejecutar \u2014 esto sube los opcodes y activa el modo BLOQUES"}],variants:"El opcode ADC_READ(0) lee el sensor ADC0 en varGlobal. Combinado con IF_GT o IF_LT permite comportamiento reactivo desde Blockly.",experiment:"Constru\xED un programa: ADE(500) \u2192 IZQ(200) \u2192 REPEAT(0). \xBFEl robot hace un c\xEDrculo? \xBFCuadrado? \xBFDepende del valor de IZQ? Experiment\xE1 con val=300, 400, 500."},{id:"telemetria",title:"Telemetr\xEDa \u2014 Monitoreo de datos en tiempo real",tags:["telemetria","iot","franky","serial","debugging"],platform:"both",concept:"Telemetr\xEDa es leer, transmitir y visualizar datos del sistema en tiempo real. En ROBOARD: Serial Monitor. En FRANKY: panel web /api. La telemetr\xEDa es fundamental para depuraci\xF3n \u2014 no pod\xE9s mejorar lo que no pod\xE9s medir.",hardware:"ROBOARD: la comunicaci\xF3n serie (UART) transmite datos al PC via USB a 9600 baud. FRANKY: WiFi transmite JSON al browser via HTTP polling. En hardware real el polling tiene ~300ms de latencia; en el simulador es instant\xE1neo.",example:`// ROBOARD: telemetr\xEDa b\xE1sica via Serial
void setup() {
  Serial.begin(9600);
}

void loop() {
  int a0 = analogRead(A0);
  int a1 = analogRead(A1);
  
  // Formato CSV para graficar con Serial Plotter:
  Serial.print(a0);
  Serial.print(",");
  Serial.println(a1);
  
  // Formato legible para Serial Monitor:
  // Serial.print("A0="); Serial.print(a0);
  // Serial.print(" A1="); Serial.println(a1);
  
  delay(50); // 20 muestras por segundo
}`,applied:`// Telemetr\xEDa para depurar control PD:
void loop() {
  int error = calcularError();
  int dError = error - errorAnterior;
  int corr = (int)(KP*error + KD*dError);
  
  // Imprimir todo lo que necesit\xE1s ver:
  Serial.print("e="); Serial.print(error);
  Serial.print(" de="); Serial.print(dError);
  Serial.print(" c="); Serial.print(corr);
  Serial.print(" vL="); Serial.print(velIzq);
  Serial.print(" vR="); Serial.println(velDer);
  
  // En el simulador: aparece en la consola Serial del panel C\xF3digo`,lines:[{line:"Serial.begin(9600)",note:"Inicializa la comunicaci\xF3n serie a 9600 bits/segundo. Debe coincidir con la velocidad en el Serial Monitor"},{line:"Serial.print(a0)",note:"Imprime el valor sin salto de l\xEDnea. \xDAtil para imprimir m\xFAltiples valores en una l\xEDnea"},{line:"Serial.println(a1)",note:"Imprime el valor CON salto de l\xEDnea al final. El Serial Plotter de Arduino separa valores por coma"}],errors:[{symptom:"Serial Monitor muestra caracteres extra\xF1os",cause:"La velocidad (baud rate) no coincide",fix:"Serial.begin(9600) y en el Monitor tambi\xE9n elegir 9600"},{symptom:"Serial.print() ralentiza el robot",cause:"La transmisi\xF3n serie es lenta \u2014 delay impl\xEDcito al llenar el buffer",fix:"Reducir la cantidad de datos: imprimir cada 10 ciclos: if(millis()%100<20) Serial.println(...)"}],variants:"Para FRANKY en simulador: los datos de telemetr\xEDa se muestran en el panel Status. El endpoint /api actualiza autom\xE1ticamente a0, a1, pwmA, pwmB, temp cada 300ms.",experiment:"Imprim\xED el error en formato CSV mientras el robot sigue la l\xEDnea. Copi\xE1 los datos a una hoja de c\xE1lculo y grafic\xE1. \xBFEs la oscilaci\xF3n del error visible? \xBFLa frecuencia de oscilaci\xF3n cambia con KP?"},{id:"dht11",title:"DHT22/DHT11 \u2014 Temperatura y Humedad",tags:["dht","sensor","franky","iot","ambiente"],platform:"FRANKY",concept:"El DHT22 mide temperatura y humedad usando un protocolo digital propietario de 1 hilo. En FRANKY, los datos se exponen en /api como campos temp y hum. El sensor tarda ~2 segundos en actualizar.",hardware:"El DHT22 tiene 4 pines: VCC (3.3V en ESP32), DATA (con pull-up de 10k\u03A9), NC (no conectado), GND. La temperatura tiene resoluci\xF3n de 0.1\xB0C y la humedad de 0.1%RH.",example:`// En firmware FRANKY (ya implementado).
// El DHT22 se lee autom\xE1ticamente y sus valores
// se exponen en la respuesta del endpoint /api:

void setup() {
  // FRANKY ya configura el DHT22 en su firmware
  // No necesitas c\xF3digo extra para leerlo
}

void loop() {
  // Para ver los datos: GET /api en el browser
  // o usar el panel Status en el simulador
  // Respuesta JSON incluye:
  // { "temp": 22.5, "hum": 55.0, "dht": 1 }
}

// Para leer desde otro ESP32 (cliente HTTP):
// HTTPClient http;
// http.begin("http://192.168.4.1/api");
// int code = http.GET();
// String json = http.getString();`,applied:`// Challenge E2.1 \u2014 Telemetr\xEDa live:
// En el panel Status pod\xE9s observar:
// - temp: temperatura ambiente (~20-25\xB0C en interior)
// - hum: humedad relativa (~40-60% en ambiente normal)
// En hardware real estos valores cambian lentamente
// Pod\xE9s soplar sobre el sensor para subir la humedad`,lines:[{line:'"dht":1',note:"dht=1: el DHT22 respondi\xF3 correctamente. dht=0: error de lectura (cable suelto, demasiado frecuente)"},{line:'"temp":22.5',note:"Temperatura en grados Celsius, con 1 decimal. El DHT22 tiene \xB10.5\xB0C de precisi\xF3n"},{line:'"hum":55.0',note:"Humedad relativa en porcentaje (0-100%). \xB12-5% de precisi\xF3n"}],errors:[{symptom:"temp y hum siempre 0",cause:"DHT no conectado o pin incorrecto",fix:"En FRANKY el pin DHT se configura con POST /dht/pin. Por defecto usa un pin predefinido"},{symptom:"Valores que saltan mucho",cause:"El DHT22 se lee muy frecuentemente (m\xEDnimo 2s entre lecturas)",fix:"En hardware: reducir frecuencia de lectura. En simulador los valores son estables"}],variants:"El DHT11 es m\xE1s barato pero menos preciso (\xB12\xB0C, \xB15%RH). El DHT22 es mejor para aplicaciones que requieren precisi\xF3n.",experiment:"En hardware real: med\xED temperatura con y sin calentamiento. \xBFCu\xE1nto tarda en subir 1\xB0C si pon\xE9s el dedo sobre el sensor? \xBFQu\xE9 implica eso para aplicaciones de control de temperatura?"},{id:"led-brillo",title:"LED con Brillo \u2014 PWM, map(), constrain()",tags:["led","pwm","map","constrain","franky","roboard"],platform:"both",concept:"Controlar el brillo de un LED con PWM. analogWrite() a un LED produce parpadeo a frecuencia imperceptible \u2014 el ojo promedia el brillo. Las funciones map() y constrain() son aliadas para escalar rangos.",hardware:"En ROBOARD: cualquier pin PWM (~). En FRANKY: GPIO8 (activo LOW: duty 0=LED al m\xE1ximo, duty 255=LED apagado). El ojo humano percibe el brillo en forma logar\xEDtmica, no lineal.",example:`// LED reactivo al sensor: m\xE1s cerca = m\xE1s brillante
#define LED_PIN 10
#define SENSOR  A0

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  int dist = analogRead(SENSOR); // 0-1023
  
  // map(): convierte de un rango a otro
  // dist 80 (lejos) \u2192 brillo 0
  // dist 700 (cerca) \u2192 brillo 255
  int brillo = map(dist, 80, 700, 0, 255);
  
  // constrain(): limitar al rango v\xE1lido (por si dist > 700)
  brillo = constrain(brillo, 0, 255);
  
  analogWrite(LED_PIN, brillo);
  delay(20);
}`,applied:`// En FRANKY: LED via WebServer
// POST /led/on    \u2192 encendido m\xE1ximo
// POST /led/off   \u2192 apagado
// POST /led/brillo?val=128 \u2192 50% brillo

// GPIO8 es ACTIVO BAJO en FRANKY:
// duty=0   \u2192 GPIO8=LOW  \u2192 LED encendido (m\xE1ximo)
// duty=255 \u2192 GPIO8=HIGH \u2192 LED apagado
// Esto invierte la l\xF3gica respecto a Arduino est\xE1ndar`,lines:[{line:"map(dist, 80, 700, 0, 255)",note:"map(valor, deMin, deMax, aMin, aMax): transforma linealmente el rango [80-700] al rango [0-255]"},{line:"constrain(brillo, 0, 255)",note:"Limita el resultado al rango v\xE1lido. Si dist<80: map da negativo \u2192 constrain lo lleva a 0"},{line:"analogWrite(LED_PIN, brillo)",note:"PWM al LED. duty=0 \u2192 apagado, duty=255 \u2192 m\xE1ximo brillo"}],errors:[{symptom:"LED siempre apagado con analogWrite",cause:"Pin no es PWM, o no tiene resistencia limitadora",fix:"Verificar que el pin tiene ~. Agregar resistencia de 220-470\u03A9 en serie con el LED"},{symptom:"LED parpadea visiblemente",cause:"Frecuencia PWM muy baja, o delay() en el loop muy largo",fix:"En Arduino la frecuencia PWM ~490Hz deber\xEDa ser invisible. Verificar que delay() < 50ms"}],variants:"Para efecto de respiraci\xF3n (fade in/out): usar una funci\xF3n seno o incrementar/decrementar brillo cada ciclo.",experiment:"Cambi\xE1 los par\xE1metros de map(): \xBFQu\xE9 pasa con map(dist, 200, 600, 50, 200)? El LED nunca se apaga del todo y nunca llega al m\xE1ximo. \xBFPara qu\xE9 sirve esto?"}];ri.exports={MANUAL_SECTIONS:zr}});var ni=m((Mn,oi)=>{"use strict";var{FRANKY_PLATFORM:Rn}=Fe(),je=class{constructor(e){this._bus=e||null,this._state=this._initState(),this._history=[]}_initState(){return{chA1:0,chA2:0,chB1:0,chB2:0,pwmA:0,pwmB:0,trimA:255,trimB:255,motorSpeed:200,a0:0,a1:0,btn:0,temp:22.5,hum:55,mode:0,running:0,proglen:0,i2c:0,spi:0,dht:1,ledState:0,ledBrillo:255,program:[],modeRunning:!1,retardoOK:!1,tInicioModo:0,sumoTipoMicro:0,sumoUmbralDistMicro:25,sumoUmbralBordeMicro:1500,sumoEstrategiaMini:0,sumoTipoMini:0,sumoUmbralDistMini:30,sumoUmbralBordeMini:1500,numBordeMini:2,ssid:"FRANKY-SIM",ip:"192.168.4.1"}}_applyTrim(e,t){return Math.min(255,Math.floor(e*t/255))}_move(e,t){(t<0||t===void 0)&&(t=this._state.motorSpeed);let i=this._applyTrim(t,this._state.trimA),r=this._applyTrim(t,this._state.trimB),a=this._state;a.chA1=0,a.chA2=0,a.chB1=0,a.chB2=0,e==="f"?(a.chA1=i,a.chB1=r):e==="b"?(a.chA2=i,a.chB2=r):e==="l"?(a.chA2=i,a.chB1=r):e==="r"&&(a.chA1=i,a.chB2=r),a.pwmA=i,a.pwmB=r,this._emitMotor()}_stop(){let e=this._state;e.chA1=0,e.chA2=0,e.chB1=0,e.chB2=0,e.pwmA=0,e.pwmB=0,this._emitMotor()}_emitMotor(){if(!this._bus)return;let e=this._state,t=e.chA1>0?"FORWARD":e.chA2>0?"REVERSE":"DISABLED",i=e.chB1>0?"FORWARD":e.chB2>0?"REVERSE":"DISABLED";this._bus.emit({type:"FRANKY_MOTOR",payload:{motorA:{direction:t,pwm:e.pwmA},motorB:{direction:i,pwm:e.pwmB},raw:{chA1:e.chA1,chA2:e.chA2,chB1:e.chB1,chB2:e.chB2}},source:"FRANKY"})}injectSensors({a0:e=0,a1:t=0,btn:i=0,temp:r=22.5,hum:a=55}={}){Object.assign(this._state,{a0:e,a1:t,btn:i,temp:r,hum:a})}getState(){return{...this._state}}getMotorCmds(){let e=this._state;return{motorA:{direction:e.chA1>0?"FORWARD":e.chA2>0?"REVERSE":"DISABLED",pwm:e.pwmA},motorB:{direction:e.chB1>0?"FORWARD":e.chB2>0?"REVERSE":"DISABLED",pwm:e.pwmB}}}handleRequest(e,t,i={}){let r=this._state,a=200,n="OK";switch(t){case"/api":n=JSON.stringify({a0:r.a0,a1:r.a1,btn:r.btn,temp:parseFloat(r.temp.toFixed(2)),hum:parseFloat(r.hum.toFixed(2)),mode:r.mode,running:r.running?1:0,proglen:r.program.length,i2c:r.i2c,spi:r.spi,dht:r.dht,pwmA:r.pwmA,pwmB:r.pwmB,trimA:r.trimA,trimB:r.trimB,motorSpeed:r.motorSpeed});break;case"/mv":i.d&&this._move(i.d,parseInt(i.val||-1));break;case"/st":this._stop();break;case"/spd":i.val!==void 0&&(r.motorSpeed=parseInt(i.val));break;case"/stopall":r.mode=0,r.running=0,this._stop();break;case"/led/on":r.ledState=1,this._bus&&this._bus.emit({type:"FRANKY_LED",payload:{state:1},source:"FRANKY"});break;case"/led/off":r.ledState=0,this._bus&&this._bus.emit({type:"FRANKY_LED",payload:{state:0},source:"FRANKY"});break;case"/led/brillo":i.val!==void 0&&(r.ledBrillo=parseInt(i.val),r.ledState=2),this._bus&&this._bus.emit({type:"FRANKY_LED",payload:{state:2,brillo:r.ledBrillo},source:"FRANKY"});break;case"/sumo/micro":r.mode=1,r.running=1,r.retardoOK=!1,r.tInicioModo=Date.now(),this._stop(),this._bus&&this._bus.emit({type:"FRANKY_MODE",payload:{mode:"MICRO"},source:"FRANKY"});break;case"/sumo/mini":r.mode=2,r.running=1,r.retardoOK=!1,r.tInicioModo=Date.now(),this._stop(),this._bus&&this._bus.emit({type:"FRANKY_MODE",payload:{mode:"MINI"},source:"FRANKY"});break;case"/sumo/stop":r.mode=0,r.running=0,this._stop(),this._bus&&this._bus.emit({type:"FRANKY_MODE",payload:{mode:"IDLE"},source:"FRANKY"});break;case"/sumo/trim":i.ma!==void 0&&(r.trimA=Math.max(0,Math.min(255,parseInt(i.ma)))),i.mb!==void 0&&(r.trimB=Math.max(0,Math.min(255,parseInt(i.mb))));break;case"/sumo/config":i.tipo!==void 0&&(r.sumoTipoMicro=i.tipo==="sonar"?0:1),i.umbral!==void 0&&(r.sumoUmbralDistMicro=parseInt(i.umbral)),i.borde!==void 0&&(r.sumoUmbralBordeMicro=parseInt(i.borde));break;case"/sumo/umbral":i.micro!==void 0&&(r.sumoUmbralDistMicro=parseInt(i.micro)),i.borde!==void 0&&(r.sumoUmbralBordeMicro=parseInt(i.borde));break;case"/gpio/out":if([2,3,4,5].includes(parseInt(i.pin))){a=400,n="Pin motor";break}this._bus&&this._bus.emit({type:"FRANKY_GPIO",payload:{pin:parseInt(i.pin),val:parseInt(i.val||0)},source:"FRANKY"});break;case"/gpio/read":n=JSON.stringify({pin:parseInt(i.pin||0),val:0});break;case"/sonar/read":n=JSON.stringify({cm:Math.round(r.a0*400/4095)});break;case"/bloques/list":n=JSON.stringify(r.program);break;case"/bloques/add":i.op!==void 0&&r.program.push({op:parseInt(i.op),val:parseInt(i.val||0)});break;case"/bloques/del":{let s=parseInt(i.idx);s>=0&&s<r.program.length&&r.program.splice(s,1)}break;case"/bloques/run":r.mode=3,r.running=1,this._bus&&this._bus.emit({type:"FRANKY_MODE",payload:{mode:"BLOQUES"},source:"FRANKY"});break;case"/bloques/stop":case"/bloques/clear":r.mode=0,r.running=0,this._stop(),t==="/bloques/clear"&&(r.program=[]);break;case"/auto/vivero":r.mode=4,r.running=1;break;case"/auto/meteo":r.mode=5,r.running=1;break;case"/auto/alarma":r.mode=6,r.running=1;break;case"/auto/acceso":r.mode=7,r.running=1;break;case"/auto/stop":r.mode=0,r.running=0,this._stop();break;default:a=404,n="Not found: "+t}return this._history.push({ts:Date.now(),method:e,path:t,params:i,status:a,body:typeof n=="string"?n.slice(0,100):n}),this._history.length>50&&this._history.shift(),{status:a,body:n,contentType:typeof n=="string"&&(n[0]==="{"||n[0]==="[")?"application/json":"text/plain"}}getHistory(){return[...this._history]}reset(){this._state=this._initState(),this._history=[]}};oi.exports={FrankySimulator:je}});var _i=m((Dn,fi)=>{"use strict";var si=[{id:"fk-control-remoto",name:"E1.1 \u2014 Control Remoto",description:"Control\xE1 el robot FRANKY desde el panel web. No hay c\xF3digo que escribir todav\xEDa \u2014 explor\xE1 c\xF3mo responden los motores a cada comando.",scenarioId:"franky-arena",platformId:"FRANKY",interactionMode:"webserver",tags:["etapa1","franky","control-remoto","sin-codigo"],sketch:null,objectives:[{id:"move-f",label:'Robot avanza (comando "f")',type:"custom",params:{fn:o=>o.motorCmds?.motorA?.direction==="FORWARD"&&o.motorCmds.motorA.pwm>0},required:!0},{id:"move-b",label:'Robot retrocede (comando "b")',type:"custom",params:{fn:o=>o.motorCmds?.motorA?.direction==="REVERSE"&&o.motorCmds.motorA.pwm>0},required:!0},{id:"turn",label:'Robot gira (comando "l" o "r")',type:"custom",params:{fn:o=>{let e=o.motorCmds;return e?e.motorA.direction!==e.motorB.direction:!1}},required:!0},{id:"speed",label:"Cambia velocidad desde el slider",type:"custom",params:{fn:o=>o.variables?.motorSpeed!==void 0&&o.variables.motorSpeed!==200},required:!1}],hints:{"move-f":["Abr\xED el panel FRANKY (bot\xF3n \u{1F916} en el header). Presion\xE1 \u25B2 en el Gamepad.","El comando enviado es POST /mv?d=f. El robot avanza mientras manten\xE9s presionado."],"move-b":["Presion\xE1 \u25BC en el Gamepad para retroceder.","POST /mv?d=b activa los canales A2 y B2 del LEDC."],turn:["Presion\xE1 \u25C0 o \u25B6 para girar. Un motor va adelante, el otro atr\xE1s.","POST /mv?d=l: canal A2 (reversa) + B1 (adelante). El robot gira a la izquierda."]},theory:"concept_iot_webserver"},{id:"fk-figuras-basicas",name:"E1.2 \u2014 Figuras Geom\xE9tricas",description:"Dibuj\xE1 un cuadrado usando los bloques ADE y IZQ. La secuencia ya tiene los primeros dos pasos \u2014 complet\xE1 los 4 lados.",scenarioId:"franky-arena",platformId:"FRANKY",interactionMode:"bloques",tags:["etapa1","franky","blockly","figuras","secuencias"],programa:[{op:1,val:800},{op:3,val:480},{op:1,val:800},{op:0,val:0}],objectives:[{id:"four-sides",label:"Programa tiene 4 lados (ADE\xD74)",type:"custom",params:{fn:o=>(o.variables?.program||[]).filter(t=>t.op===1).length>=4},required:!0},{id:"four-turns",label:"Programa tiene 4 giros (IZQ\xD74)",type:"custom",params:{fn:o=>(o.variables?.program||[]).filter(t=>t.op===3||t.op===4).length>=4},required:!0},{id:"ends-fin",label:"Programa termina con FIN",type:"custom",params:{fn:o=>{let e=o.variables?.program||[];return e.length>0&&e[e.length-1].op===0}},required:!0}],hints:{"four-sides":["Un cuadrado tiene 4 lados iguales. Ya ten\xE9s 2. Agreg\xE1 2 m\xE1s con el bot\xF3n ADE.","ADE(800) avanza ~20cm (depende de la velocidad configurada)."],"four-turns":["Entre cada lado hay un giro de 90\xB0. Ya ten\xE9s 2 giros. Agreg\xE1 2 m\xE1s.","IZQ(480) gira aproximadamente 90\xB0. Ajust\xE1 el valor si el cuadrado no cierra."],"ends-fin":["El programa debe terminar con la instrucci\xF3n FIN para que el robot se detenga.","FIN es autom\xE1tico si no agreg\xE1s m\xE1s instrucciones despu\xE9s."]},theory:"concept_sequential_programming"}],li=[{id:"fk-telemetria-live",name:"E2.1 \u2014 Telemetr\xEDa en Vivo",description:"Abr\xED el panel Status del WebServer mientras mov\xE9s el robot. Observ\xE1 c\xF3mo cambia ADC0 al acercarte a un obst\xE1culo. \xBFQu\xE9 relaci\xF3n hay entre distancia y valor?",scenarioId:"franky-arena",platformId:"FRANKY",interactionMode:"webserver",tags:["etapa2","franky","telemetria","sensores","adc"],sketch:null,objectives:[{id:"obs-near",label:"Observa ADC0 > 2000 (robot cerca de obst\xE1culo)",type:"custom",params:{fn:o=>o.variables?.a0_max!==void 0&&o.variables.a0_max>2e3},required:!0},{id:"obs-far",label:"Observa ADC0 < 500 (robot lejos)",type:"custom",params:{fn:o=>o.variables?.a0_min!==void 0&&o.variables.a0_min<500},required:!0},{id:"read-temp",label:"Lee la temperatura del DHT22",type:"custom",params:{fn:o=>o.variables?.temp_read===!0},required:!1}],hints:{"obs-near":["Abr\xED el panel Status. Mov\xE9 el robot cerca de un obst\xE1culo y observ\xE1 el valor ADC0.","ADC0 es un valor 12-bit: 0 (lejos/apagado) a 4095 (muy cerca/m\xE1ximo)."],"obs-far":["Alejate del obst\xE1culo. El valor ADC0 deber\xEDa bajar.","La relaci\xF3n no es lineal: el sensor anal\xF3gico satura cerca y baja r\xE1pido a distancia."],"read-temp":["En el panel Status: el campo Temp muestra la lectura del DHT22.","En ambiente real: el DHT22 tarda hasta 2 segundos en actualizar."]},theory:"concept_adc_telemetry"},{id:"fk-led-reactivo",name:"E2.2 \u2014 LED Reactivo",description:"Us\xE1 el Blockly para hacer que el LED parpadee cuando el ADC0 supera un umbral. La instrucci\xF3n IF_GT ya est\xE1 \u2014 conect\xE1 LED_ON y LED_OFF.",scenarioId:"franky-arena",platformId:"FRANKY",interactionMode:"bloques",tags:["etapa2","franky","led","adc","reactividad","blockly"],programa:[{op:30,val:0},{op:71,val:2e3},{op:6,val:50},{op:74,val:0},{op:0,val:0}],objectives:[{id:"adc-read",label:"Lee ADC0 en el programa",type:"custom",params:{fn:o=>(o.variables?.program||[]).some(t=>t.op===30)},required:!0},{id:"led-on",label:"Usa LED_ON en el programa",type:"custom",params:{fn:o=>(o.variables?.program||[]).some(t=>t.op===7)},required:!0},{id:"led-off",label:"Usa LED_OFF en el programa",type:"custom",params:{fn:o=>(o.variables?.program||[]).some(t=>t.op===8)},required:!0}],hints:{"adc-read":["ADC_READ (op=30) lee el sensor ADC0 y lo guarda en varGlobal. Ya est\xE1 en el programa.","Despu\xE9s de ADC_READ, us\xE1 IF_GT o IF_LT para comparar con un umbral."],"led-on":["Agreg\xE1 LED_ON (op=7) despu\xE9s de IF_GT cuando el valor es alto (objeto cerca).","LED_ON activa GPIO8 en el ESP32 (activo bajo: LOW = encendido)."],"led-off":["Agreg\xE1 LED_OFF (op=8) para apagar el LED cuando el objeto se aleja.","La secuencia: ADC_READ \u2192 IF_GT \u2192 LED_ON \u2192 LED_OFF (si no supera) \u2192 ESP \u2192 REPEAT"]},theory:"concept_reactive_systems"}],di=[{id:"fk-esquivar-obstaculo",name:"E3.1 \u2014 Esquivar Obst\xE1culos",description:"El programa avanza indefinidamente. Agreg\xE1 la detecci\xF3n de obst\xE1culo (ADC_READ + IF_LT) para que el robot gire cuando algo est\xE1 cerca.",scenarioId:"franky-obstacle",platformId:"FRANKY",interactionMode:"bloques",tags:["etapa3","franky","blockly","sensor","reactivo"],programa:[{op:1,val:-1},{op:6,val:30},{op:74,val:0},{op:0,val:0}],objectives:[{id:"reads-adc",label:"Lee ADC0 en el programa",type:"custom",params:{fn:o=>(o.variables?.program||[]).some(t=>t.op===30)},required:!0},{id:"has-if",label:"Usa IF_GT o IF_LT",type:"custom",params:{fn:o=>(o.variables?.program||[]).some(t=>t.op===70||t.op===71)},required:!0},{id:"turns",label:"Gira al detectar",type:"custom",params:{fn:o=>{let e=o.motorCmds;return e?e.motorA.direction!==e.motorB.direction:!1}},required:!0}],hints:{"reads-adc":["Agreg\xE1 ADC_READ (op=30) al inicio del loop para leer el sensor.","ADC_READ guarda el valor en varGlobal (0\u20134095). Valor alto = objeto cerca."],"has-if":["IF_GT(umbral): si varGlobal > umbral, ejecuta la siguiente instrucci\xF3n.","Umbral sugerido: 2500 (objeto a ~20cm). Ajustalo observando los valores en Status."],turns:["Despu\xE9s del IF_GT, agreg\xE1 IZQ o DER (op=3 o op=4) para esquivar.","Secuencia: ADC_READ \u2192 IF_GT 2500 \u2192 IZQ(300) \u2192 ADE(-1) \u2192 ESP(30) \u2192 REPEAT"]},theory:"concept_sensor_decision_loop"},{id:"fk-patrulla",name:"E3.2 \u2014 Patrulla Aut\xF3noma",description:"Dise\xF1\xE1 un patr\xF3n de movimiento aut\xF3nomo que cubra el \xE1rea: avanzar, girar, avanzar, girar. Us\xE1 REPEAT para que sea infinito y ajust\xE1 los tiempos para que patrule correctamente.",scenarioId:"franky-arena",platformId:"FRANKY",interactionMode:"bloques",tags:["etapa3","franky","blockly","autonomo","patrones"],programa:[{op:1,val:600},{op:0,val:0}],objectives:[{id:"moves",label:"Robot se mueve",type:"custom",params:{fn:o=>o.motorCmds?.motorA?.direction==="FORWARD"&&o.motorCmds.motorA.pwm>0},required:!0},{id:"pattern",label:"Secuencia de \u22653 movimientos distintos",type:"custom",params:{fn:o=>{let e=o.variables?.program||[];return new Set(e.map(i=>i.op)).size>=3}},required:!0},{id:"loops",label:"Usa REPEAT para loop infinito",type:"custom",params:{fn:o=>(o.variables?.program||[]).some(t=>t.op===74)},required:!0}],hints:{pattern:["Combin\xE1 ADE, IZQ y ESP para crear un patr\xF3n. Ejemplo: ADE \u2192 IZQ \u2192 ADE \u2192 DER.","Los tiempos determinan el \xE1rea cubierta. Tiempos iguales en IZQ y DER hacen el patr\xF3n sim\xE9trico."],loops:["REPEAT (op=74) con val=0 vuelve al inicio del programa.","Ponelo antes del FIN para que el robot patrule indefinidamente."]},theory:"concept_autonomous_patterns"}],ci=[{id:"fk-minisumo-config",name:"E4.1 \u2014 Configurar Minisumo",description:"FRANKY tiene un modo minisumo incorporado en el firmware. Configur\xE1 los umbrales y activ\xE1 el modo. El robot debe quedarse dentro del tatami y detectar el oponente.",scenarioId:"franky-sumo",platformId:"FRANKY",interactionMode:"webserver",tags:["etapa4","franky","minisumo","config","modos-autonomos"],sketch:null,objectives:[{id:"config-trim",label:"Ajusta trim de motores (A\u2260B posible)",type:"custom",params:{fn:o=>o.variables?.trimConfigured===!0},required:!0},{id:"start-micro",label:"Activa modo MICRO o MINI",type:"custom",params:{fn:o=>o.variables?.mode===1||o.variables?.mode===2},required:!0},{id:"borde-detected",label:"Robot detecta y escapa del borde",type:"motor_reverse",params:{motor:"A"},required:!0}],hints:{"config-trim":["En el panel Sumo: ajust\xE1 el trim si el robot no va recto. TrimA=TrimB=255 es neutro.","POST /sumo/trim?ma=245&mb=255 corrige si el robot desv\xEDa a la derecha."],"start-micro":['En el panel Sumo: clic en "\u25B6 INICIAR MICRO". El robot espera 5 segundos y comienza.',"POST /sumo/micro activa MODE_MICRO en el firmware. El robot hace el ciclo de b\xFAsqueda."],"borde-detected":["FRANKY detecta el borde con ADC0 > umbral (default=1500). Ajust\xE1 con /sumo/umbral.",'Al detectar borde: el firmware ejecuta: move("b", 220) \u2192 espera \u2192 gira.']},theory:"concept_autonomous_modes"}],ui=[{id:"fk-seguidor-2sensor",name:"E5.1 \u2014 Seguidor de L\xEDnea (2 sensores)",description:"FRANKY usa ADC0 y ADC1 como sensores de l\xEDnea. Control diferencial bang-bang primero, luego proporcional. El c\xF3digo lee los dos sensores \u2014 complet\xE1 la l\xF3gica de correcci\xF3n.",scenarioId:"lf-pista-recta",platformId:"FRANKY",interactionMode:"codigo",tags:["etapa5","franky","line-follower","2-sensor","proportional"],sketch:`// FRANKY \u2014 Seguidor de L\xEDnea 2 sensores
// ADC0 (GPIO0) = sensor izquierdo | ADC1 (GPIO1) = sensor derecho
// Negro (l\xEDnea) = valor ALTO (~3500-4095)
// Blanco (fondo) = valor BAJO (~0-500)
#include <Arduino.h>
#define PIN_MA_IN1 5
#define PIN_MA_IN2 4
#define PIN_MB_IN1 3
#define PIN_MB_IN2 2
#define PIN_LED    8
#define ADC_IZQ    0   // GPIO0
#define ADC_DER    1   // GPIO1
#define UMBRAL     2000
#define VEL_BASE   160
#define KP         0.08f  // para modo proporcional

void avanzar(int izq, int der) {
  // FRANKY: LEDC directo \u2014 velocidad = duty cycle del canal
  // Canal positivo = adelante, canal negativo = atr\xE1s
  // Simplificado: usamos analogWrite sobre los pines GPIO directamente
  if (izq >= 0) { digitalWrite(PIN_MA_IN1,1); digitalWrite(PIN_MA_IN2,0); analogWrite(PIN_MA_IN1, izq); }
  else           { digitalWrite(PIN_MA_IN1,0); digitalWrite(PIN_MA_IN2,1); analogWrite(PIN_MA_IN2,-izq); }
  if (der >= 0) { digitalWrite(PIN_MB_IN1,1); digitalWrite(PIN_MB_IN2,0); analogWrite(PIN_MB_IN1, der); }
  else           { digitalWrite(PIN_MB_IN1,0); digitalWrite(PIN_MB_IN2,1); analogWrite(PIN_MB_IN2,-der); }
}

void setup() {
  pinMode(PIN_MA_IN1,OUTPUT); pinMode(PIN_MA_IN2,OUTPUT);
  pinMode(PIN_MB_IN1,OUTPUT); pinMode(PIN_MB_IN2,OUTPUT);
  pinMode(PIN_LED,OUTPUT);
}

void loop() {
  bool lineaIzq = (analogRead(ADC_IZQ) > UMBRAL);
  bool lineaDer = (analogRead(ADC_DER) > UMBRAL);

  // TODO: completar la l\xF3gica de direcci\xF3n
  // Modo bang-bang (empez\xE1 por ac\xE1):
  //   ambos detectan \u2192 recto
  //   solo izq \u2192  girar izquierda (izq lento, der r\xE1pido)
  //   solo der \u2192 girar derecha (izq r\xE1pido, der lento)
  //   ninguno  \u2192 buscar (\xFAltimo giro conocido)
  
  avanzar(VEL_BASE, VEL_BASE);  // placeholder: siempre recto
  delay(5);
}`,objectives:[{id:"reads-izq",label:"Lee sensor izquierdo ADC0",type:"custom",params:{fn:o=>!!o.gpio?.A0?.mode},required:!0},{id:"reads-der",label:"Lee sensor derecho ADC1",type:"custom",params:{fn:o=>!!o.gpio?.A1?.mode},required:!0},{id:"differential",label:"Velocidades diferenciales",type:"custom",params:{fn:o=>o.motorCmds?Math.abs(o.motorCmds.motorA.pwm-o.motorCmds.motorB.pwm)>20&&o.motorCmds.motorA.pwm>0:!1},required:!0}],hints:{"reads-izq":["analogRead(ADC_IZQ) lee el sensor izquierdo. ADC de 12-bit: 0-4095.","bool lineaIzq = (analogRead(ADC_IZQ) > UMBRAL); ya est\xE1 en el c\xF3digo."],differential:["Solo der detecta \u2192 l\xEDnea a la derecha \u2192 girar derecha \u2192 motor izq m\xE1s r\xE1pido.","if(!lineaIzq && lineaDer)  avanzar(VEL_BASE+40, VEL_BASE-40); // curva derecha",`L\xF3gica completa bang-bang:
if(lineaIzq && lineaDer)       avanzar(VEL_BASE,VEL_BASE);
else if(!lineaIzq && lineaDer)  avanzar(VEL_BASE+40,VEL_BASE-40);
else if(lineaIzq && !lineaDer)  avanzar(VEL_BASE-40,VEL_BASE+40);
else                            avanzar(VEL_BASE-20,VEL_BASE+20);`]},theory:"concept_franky_line_sensor"},{id:"fk-minisumo-pd",name:"E5.2 \u2014 Minisumo con Control PD",description:"Dos sonares laterales (izq/der) detectan el oponente. El error angular es la diferencia entre las lecturas. Complet\xE1 el control PD para rastrear y atacar.",scenarioId:"franky-sumo",platformId:"FRANKY",interactionMode:"codigo",tags:["etapa5","franky","minisumo","pd","tracking"],sketch:`// FRANKY \u2014 Minisumo con control PD de rastreo
// Dos sonares: izquierdo (ADC0) y derecho (ADC1)
// Error angular = diferencia entre mediciones
// Control PD corrige la orientaci\xF3n hacia el oponente
#include <Arduino.h>
#define PIN_MA_IN1 5
#define PIN_MA_IN2 4
#define PIN_MB_IN1 3
#define PIN_MB_IN2 2
#define ADC_IZQ    0
#define ADC_DER    1
#define ADC_BORDE  0   // mismo ADC0 para borde (minisumo FRANKY)
#define UMBRAL_BORDE 3500
#define DIST_ATK   2000  // ADC value \u2014 objeto cerca si > esto
#define VEL_BASE   180
#define KP_TRACK   0.04f
#define KD_TRACK   0.02f

void move(int velA, int velB) {
  if(velA>=0){digitalWrite(PIN_MA_IN1,1);digitalWrite(PIN_MA_IN2,0);analogWrite(PIN_MA_IN1,constrain(velA,0,255));}
  else       {digitalWrite(PIN_MA_IN1,0);digitalWrite(PIN_MA_IN2,1);analogWrite(PIN_MA_IN2,constrain(-velA,0,255));}
  if(velB>=0){digitalWrite(PIN_MB_IN1,1);digitalWrite(PIN_MB_IN2,0);analogWrite(PIN_MB_IN1,constrain(velB,0,255));}
  else       {digitalWrite(PIN_MB_IN1,0);digitalWrite(PIN_MB_IN2,1);analogWrite(PIN_MB_IN2,constrain(-velB,0,255));}
}

// TODO: declarar errorAnterior para el t\xE9rmino D
// int errorAnterior = 0;

void setup() {
  pinMode(PIN_MA_IN1,OUTPUT); pinMode(PIN_MA_IN2,OUTPUT);
  pinMode(PIN_MB_IN1,OUTPUT); pinMode(PIN_MB_IN2,OUTPUT);
  delay(500);
}

void loop() {
  // 1. Borde (prioridad m\xE1xima)
  if (analogRead(ADC_BORDE) > UMBRAL_BORDE) {
    move(-200, -200); delay(150);
    move(200, -200);  delay(300);
    return;
  }

  int lectIzq = analogRead(ADC_IZQ);
  int lectDer = analogRead(ADC_DER);

  // 2. TODO: calcular error angular
  // int error = lectDer - lectIzq;  (positivo = oponente a la derecha)

  // 3. TODO: calcular correcci\xF3n PD
  // int errorDerivada = error - errorAnterior;
  // int corr = (int)(KP_TRACK * error + KD_TRACK * errorDerivada);
  // errorAnterior = error;

  // 4. Atacar si detecta oponente cerca
  bool oponente = (lectIzq > DIST_ATK) || (lectDer > DIST_ATK);
  if (oponente) {
    // TODO: usar corr para orientar el ataque
    move(255, 255);  // ataque recto \u2014 mejorar con corr
  } else {
    // B\xFAsqueda: girar para buscar
    move(160, -160);
  }
  delay(10);
}`,objectives:[{id:"borde",label:"Detecta y escapa del borde",type:"motor_reverse",params:{motor:"A"},required:!0},{id:"error-ang",label:"Calcula error angular (der - izq)",type:"code_contains",params:{substring:"error"},required:!0},{id:"pd-corr",label:"Usa KP y KD en la correcci\xF3n",type:"code_contains",params:{substring:"KD_TRACK"},required:!0},{id:"tracks",label:"Velocidades asim\xE9tricas al rastrear",type:"custom",params:{fn:o=>{if(!o.motorCmds)return!1;let{motorA:e,motorB:t}=o.motorCmds;return e.direction!==t.direction||Math.abs(e.pwm-t.pwm)>30&&e.pwm>0}},required:!0}],hints:{"error-ang":["El error angular es la diferencia entre lo que ve el sonar derecho y el izquierdo.","int error = lectDer - lectIzq; \u2014 positivo = oponente m\xE1s visible a la derecha."],"pd-corr":["int errorDerivada = error - errorAnterior; errorAnterior = error;","int corr = (int)(KP_TRACK * error + KD_TRACK * errorDerivada);","Aplicar: move(VEL_BASE + corr, VEL_BASE - corr) para orientarse hacia el oponente."],tracks:["Si corr > 0: oponente a la derecha \u2192 motor A m\xE1s r\xE1pido para girar derecha.",`C\xF3digo completo del ataque con PD:
if(oponente){
  move(constrain(VEL_BASE+corr,0,255), constrain(VEL_BASE-corr,0,255));
}`]}}],kr=[{id:"concept_iot_webserver",type:"text",title:"El Robot Conectado: Cliente-Servidor",content:{body:`FRANKY tiene un servidor web dentro del ESP32.

Cuando te conect\xE1s al panel desde el celular o la PC:
\u2022 vos sos el CLIENTE (browser)
\u2022 FRANKY es el SERVIDOR (ESP32)

Cada bot\xF3n env\xEDa una petici\xF3n HTTP:
  \u25B2 \u2192 POST /mv?d=f&val=200
  \u25A0 \u2192 POST /st
  \u{1F50A} \u2192 GET /api

El ESP32 responde con JSON:
  {"pwmA":200,"pwmB":200,"mode":0,...}

Esta arquitectura es la base de IoT industrial.`},displayMode:"panel"},{id:"concept_adc_telemetry",type:"text",title:"ADC y Telemetr\xEDa",content:{body:`El ESP32-C3 tiene un ADC de 12 bits.
Rango: 0 a 4095 (2^12 valores).

Comparaci\xF3n con Arduino Nano:
\u2022 Nano: 10-bit ADC \u2192 0 a 1023
\u2022 ESP32: 12-bit ADC \u2192 0 a 4095

M\xE1s bits = m\xE1s resoluci\xF3n = detecci\xF3n m\xE1s precisa.

Telemetr\xEDa = medir + transmitir + visualizar.
FRANKY transmite ADC0, ADC1, temp, hum cada vez
que el panel consulta /api (polling HTTP).

En sistemas reales: el robot sube datos a la nube
cada pocos segundos, incluso sin que alguien mire.`},displayMode:"panel"},{id:"concept_sequential_programming",type:"text",title:"Programaci\xF3n Secuencial Visual",content:{body:`En FRANKY, la programaci\xF3n visual usa un bytecode propio.
Cada instrucci\xF3n tiene un opcode y un valor:

  ADE  (op=1): avanzar N milisegundos
  ATR  (op=2): retroceder N ms
  IZQ  (op=3): girar izquierda N ms
  DER  (op=4): girar derecha N ms
  STOP (op=5): detener motores
  ESP  (op=6): esperar N ms
  FIN  (op=0): terminar el programa

Para un cuadrado perfecto:
  ADE(800) IZQ(480) \xD74 repeticiones

El valor de IZQ para 90\xB0 depende de la velocidad.
Calibralo experimentando.`},displayMode:"panel"},{id:"concept_reactive_systems",type:"text",title:"Sistemas Reactivos",content:{body:`Un sistema reactivo responde a su entorno en tiempo real.

Patr\xF3n b\xE1sico:
  SENSAR \u2192 DECIDIR \u2192 ACTUAR

En el bytecode de FRANKY:
  ADC_READ (op=30) \u2192 SENSAR
  IF_GT/IF_LT \u2192 DECIDIR
  ADE/IZQ/LED_ON \u2192 ACTUAR

El t\xE9rmino "reactivo" en IoT/sistemas distribuidos
tiene un significado preciso: el sistema responde
a eventos externos sin sondear constantemente.

FRANKY usa polling (pregunta cada ciclo).
Sistemas avanzados usan interrupciones (el sensor
avisa cuando hay cambio, sin preguntar).`},displayMode:"panel"},{id:"concept_sensor_decision_loop",type:"text",title:"Loop Sensor-Decisi\xF3n",content:{body:`El loop m\xE1s b\xE1sico de rob\xF3tica aut\xF3noma:

  loop:
    leer sensor
    evaluar condici\xF3n
    ejecutar acci\xF3n
    esperar
    volver al inicio

En el bytecode FRANKY:
  ADC_READ(0)
  IF_GT(2500)
  IZQ(300)
  ADE(-1)
  ESP(30)
  REPEAT(0)

La frecuencia del loop (cu\xE1ntas veces por segundo)
determina qu\xE9 tan r\xE1pido reacciona el robot.
FRANKY ejecuta el loop cada 50ms \u2248 20 Hz.`},displayMode:"panel"},{id:"concept_autonomous_patterns",type:"text",title:"Patrones de Movimiento Aut\xF3nomo",content:{body:`Los robots aut\xF3nomos usan patrones de movimiento
predefinidos cuando no tienen sensor completo.

Patrones comunes de cobertura:
  L\xEDnea: ADE \u2192 girar 180\xB0 \u2192 ADE
  Espiral: aumentar radio gradualmente
  Zigzag: ADE \u2192 DER \u2192 ADE \u2192 IZQ
  Random turn: ADE \u2192 girar aleatorio

El pattern de patrulla es determinista:
siempre recorre el mismo camino.

Para exploraci\xF3n real necesit\xE1s:
  \u2022 mapa del entorno (SLAM)
  \u2022 planificaci\xF3n de trayectoria
  \u2022 localizaci\xF3n
Eso est\xE1 fuera del scope de esta etapa.`},displayMode:"panel"},{id:"concept_autonomous_modes",type:"text",title:"Modos Aut\xF3nomos en Firmware",content:{body:`FRANKY tiene modos aut\xF3nomos precompilados en el firmware:

  MODE_MICRO: microsumo con un sonar
  MODE_MINI:  minisumo con dos sonares
  MODE_BLOQUES: ejecuta el programa bytecode
  MODE_VIVERO:  control de humedad/luz
  MODE_METEO:   monitoreo ambiental
  MODE_ALARMA:  detecci\xF3n de movimiento/temp
  MODE_ACCESO:  control de acceso por bot\xF3n

Cuando activ\xE1s un modo v\xEDa /sumo/micro:
  1. El firmware cambia currentMode
  2. El loop principal detecta el cambio
  3. Ejecuta la l\xF3gica del modo cada 50ms

Pod\xE9s cambiar el comportamiento configurando
los par\xE1metros del modo antes de activarlo.`},displayMode:"panel"}],pi={id:"franky-etapa1",name:"FRANKY Etapa 1 \u2014 Robot Conectado",platformId:"FRANKY",duration:"2 \xD7 50 min",tags:["etapa1","franky"],startChallenge:"fk-control-remoto",startScenario:"franky-arena"},mi={id:"franky-etapa2",name:"FRANKY Etapa 2 \u2014 Sensores y Telemetr\xEDa",platformId:"FRANKY",duration:"2 \xD7 50 min",tags:["etapa2","franky"],startChallenge:"fk-telemetria-live",startScenario:"franky-arena"},hi={id:"franky-etapa3",name:"FRANKY Etapa 3 \u2014 Programaci\xF3n Visual",platformId:"FRANKY",duration:"3 \xD7 50 min",tags:["etapa3","franky"],startChallenge:"fk-esquivar-obstaculo",startScenario:"franky-obstacle"},gi={id:"franky-etapa4",name:"FRANKY Etapa 4 \u2014 Modos Aut\xF3nomos",platformId:"FRANKY",duration:"2 \xD7 50 min",tags:["etapa4","franky"],startChallenge:"fk-minisumo-config",startScenario:"franky-sumo"},Vr=[...si,...li,...di,...ci,...ui],Fr=[pi,mi,hi,gi];fi.exports={ETAPA1_CHALLENGES:si,ETAPA2_CHALLENGES:li,ETAPA3_CHALLENGES:di,ETAPA4_CHALLENGES:ci,ETAPA5_CHALLENGES:ui,FRANKY_THEORY:kr,ALL_FRANKY_CHALLENGES:Vr,ALL_FRANKY_LESSONS:Fr,FRANKY_LESSON_E1:pi,FRANKY_LESSON_E2:mi,FRANKY_LESSON_E3:hi,FRANKY_LESSON_E4:gi}});var Ti=m((Pn,Oi)=>{"use strict";var bi=[{id:"u1-explorar-motores",name:"U1.1 \u2014 Explorar los Motores",description:"Hac\xE9 que el robot se mueva. El c\xF3digo mueve solo el motor izquierdo. \xBFQu\xE9 falta para que los dos motores funcionen?",scenarioId:"empty-arena",platformId:"ROBOARD",tags:["unit1","motors","exploration"],sketch:`#define Mizq_pwm 3   // Motor izquierdo \u2014 PWM
#define Mizq1    5   // Motor izquierdo \u2014 IN1
#define Mizq2    4   // Motor izquierdo \u2014 IN2
#define pinSTBY  6   // TB6612FNG STANDBY (HIGH = habilitado)
// TODO: definir pines del motor derecho (Mder1=7, Mder2=8, Mder_pwm=9)

void setup() {
  pinMode(pinSTBY, OUTPUT);
  digitalWrite(pinSTBY, HIGH);  // Habilit\xE1s el driver
  pinMode(Mizq1, OUTPUT);
  pinMode(Mizq2, OUTPUT);
  pinMode(Mizq_pwm, OUTPUT);
  // TODO: configurar pines del motor derecho con pinMode()
}

void loop() {
  // Motor izquierdo adelante
  digitalWrite(Mizq1, HIGH);
  digitalWrite(Mizq2, LOW);
  analogWrite(Mizq_pwm, 180);
  // TODO: hacer lo mismo con el motor derecho para avanzar recto
  delay(50);
}`,objectives:[{id:"stby-on",label:"Driver TB6612FNG habilitado (STBY=HIGH)",type:"gpio_high",params:{pin:"D6"},required:!0},{id:"moves-fwd",label:"Ambos motores avanzan",type:"motor_forward",params:{motor:"A"},required:!0}],hints:{"stby-on":["El TB6612FNG necesita STBY=HIGH para operar. Sin esto los motores no giran aunque todo lo dem\xE1s est\xE9 bien.","Agreg\xE1: pinMode(pinSTBY, OUTPUT); digitalWrite(pinSTBY, HIGH);"],"moves-fwd":["Para avanzar recto: los dos motores deben ir hacia adelante a la misma velocidad.","El motor derecho usa pines D7 (BIN1), D8 (BIN2), D9 (PWMB). Mismo patr\xF3n que el izquierdo.","Para avanzar: IN1=HIGH, IN2=LOW, PWM=velocidad (0-255).","#define Mder1 7 | #define Mder2 8 | #define Mder_pwm 9 \u2014 y replic\xE1 la l\xF3gica del motor izquierdo."]}},{id:"u1-reactivo-parar",name:"U1.2 \u2014 Reactivo: Parar",description:"Partiendo del c\xF3digo anterior: agreg\xE1 el sensor Sharp IR y hac\xE9 que el robot pare cuando detecta un obst\xE1culo. El bloque de movimiento ya est\xE1; complet\xE1 la lectura del sensor y la condici\xF3n.",scenarioId:"single-obstacle",platformId:"ROBOARD",tags:["unit1","sensor","reactive"],sketch:`#define Mizq_pwm 3
#define Mizq1    5
#define Mizq2    4
#define pinSTBY  6
#define Mder1    7
#define Mder2    8
#define Mder_pwm 9
#define LED      10
#define UMBRAL   350  // ajust\xE1 este valor seg\xFAn lo que observes

void setup() {
  pinMode(pinSTBY, OUTPUT); digitalWrite(pinSTBY, HIGH);
  pinMode(Mizq1, OUTPUT);   pinMode(Mizq2, OUTPUT);   pinMode(Mizq_pwm, OUTPUT);
  pinMode(Mder1, OUTPUT);   pinMode(Mder2, OUTPUT);   pinMode(Mder_pwm, OUTPUT);
  pinMode(LED, OUTPUT);
}

void loop() {
  // TODO: leer el sensor Sharp IR en A0
  // int sensor = ???

  // TODO: completar la condici\xF3n
  // Cuando sensor < UMBRAL: libre \u2192 avanzar
  // Cuando sensor >= UMBRAL: obst\xE1culo \u2192 parar

  // Avanzar (para cuando sea libre):
  // digitalWrite(Mizq1, HIGH); digitalWrite(Mizq2, LOW);
  // digitalWrite(Mder1, HIGH); digitalWrite(Mder2, LOW);
  // analogWrite(Mizq_pwm, 200); analogWrite(Mder_pwm, 200);

  // Parar (para cuando hay obst\xE1culo):
  // analogWrite(Mizq_pwm, 0);
  // analogWrite(Mder_pwm, 0);

  delay(20);
}`,objectives:[{id:"stby",label:"Driver habilitado",type:"gpio_high",params:{pin:"D6"},required:!0},{id:"reads",label:"Lee el sensor A0 (analogRead)",type:"custom",params:{fn:o=>!!o.gpio?.A0?.mode},required:!0},{id:"avanza",label:"Robot avanza cuando libre",type:"motor_forward",params:{motor:"A"},required:!0},{id:"para",label:"Robot para al detectar obst\xE1culo",type:"motor_stop",params:{},required:!0}],hints:{reads:["analogRead(pin) lee un valor anal\xF3gico entre 0 y 1023. Para A0: analogRead(A0) o analogRead(0).","Guard\xE1 el valor: int sensor = analogRead(A0);"],avanza:['Us\xE1 if(sensor < UMBRAL) para el caso de "libre". Cuando es libre, activ\xE1 los dos motores hacia adelante.',"if(sensor < UMBRAL) { /* avanzar */ } else { /* parar */ }"],para:["Para parar: analogWrite(Mizq_pwm, 0); analogWrite(Mder_pwm, 0);","El umbral 350 puede necesitar ajuste. Observ\xE1 los valores del sensor en el HUD mientras mov\xE9s el obst\xE1culo."]}},{id:"u1-reactivo-girar",name:"U1.3 \u2014 Reactivo: Girar",description:'Partiendo de U1.2: en lugar de parar, el robot debe girar al detectar un obst\xE1culo. Modific\xE1 solamente la parte del "obst\xE1culo".',scenarioId:"obstacle-arena",platformId:"ROBOARD",tags:["unit1","reactive","differential"],sketch:`#define Mizq_pwm 3
#define Mizq1    5
#define Mizq2    4
#define pinSTBY  6
#define Mder1    7
#define Mder2    8
#define Mder_pwm 9
#define UMBRAL   350
#define VEL      200

void setup() {
  pinMode(pinSTBY, OUTPUT); digitalWrite(pinSTBY, HIGH);
  pinMode(Mizq1, OUTPUT);   pinMode(Mizq2, OUTPUT);   pinMode(Mizq_pwm, OUTPUT);
  pinMode(Mder1, OUTPUT);   pinMode(Mder2, OUTPUT);   pinMode(Mder_pwm, OUTPUT);
}

void loop() {
  int sensor = analogRead(A0);

  if (sensor < UMBRAL) {
    // Libre: avanzar (ya funciona del desaf\xEDo anterior)
    digitalWrite(Mizq1, HIGH); digitalWrite(Mizq2, LOW);
    digitalWrite(Mder1, HIGH); digitalWrite(Mder2, LOW);
    analogWrite(Mizq_pwm, VEL); analogWrite(Mder_pwm, VEL);
  } else {
    // Obst\xE1culo: MODIFIC\xC1 ESTO para girar en lugar de parar
    // Pista: para girar, un motor va adelante y el otro va ATR\xC1S
    analogWrite(Mizq_pwm, 0);
    analogWrite(Mder_pwm, 0);
  }
  delay(20);
}`,objectives:[{id:"avanza",label:"Robot avanza cuando libre",type:"motor_forward",params:{motor:"A"},required:!0},{id:"gira",label:"Motores asim\xE9tricos al detectar obst\xE1culo",type:"custom",params:{fn:o=>{if(!o.motorCmds||!o.gpio?.A0)return!1;let e=o.gpio.A0.value>350,{motorA:t,motorB:i}=o.motorCmds;return e&&(t.direction!==i.direction||Math.abs(t.pwm-i.pwm)>60&&t.pwm>0)}},required:!0}],hints:{avanza:["El c\xF3digo de avanzar ya est\xE1. Asegurate que los pines est\xE9n configurados con pinMode() en setup().","Para avanzar: IN1=HIGH, IN2=LOW, y analogWrite(pwm, velocidad) en ambos motores."],gira:["Para girar diferencialmente: un motor hacia adelante (IN1=HIGH, IN2=LOW) y el otro hacia atr\xE1s (IN1=LOW, IN2=HIGH).","Ejemplo: motor izquierdo adelante + motor derecho atr\xE1s = gira a la derecha.",`digitalWrite(Mizq1,HIGH); digitalWrite(Mizq2,LOW); \u2192 adelante
digitalWrite(Mder1,LOW);  digitalWrite(Mder2,HIGH); \u2192 atr\xE1s`,`C\xF3digo completo del giro:
digitalWrite(Mizq1,HIGH); digitalWrite(Mizq2,LOW);
digitalWrite(Mder1,LOW);  digitalWrite(Mder2,HIGH);
analogWrite(Mizq_pwm,VEL); analogWrite(Mder_pwm,VEL);`]}}],vi=[{id:"u2-secuencia-tiempos",name:"U2.1 \u2014 Secuencia con Tiempos",description:"Partiendo de U1.3: el robot debe ejecutar una secuencia fija sin sensor. Complet\xE1 las funciones vac\xEDas avanzar(), girar() y frenar().",scenarioId:"empty-arena",platformId:"ROBOARD",tags:["unit2","timing","sequence","functions"],sketch:`#define Mizq_pwm 3
#define Mizq1    5
#define Mizq2    4
#define pinSTBY  6
#define Mder1    7
#define Mder2    8
#define Mder_pwm 9
#define VEL 180

// TODO: completar estas funciones
void avanzar() {
  // Ambos motores adelante a velocidad VEL
}

void girarDer() {
  // Motor izq adelante, motor der atr\xE1s
}

void frenar() {
  // Ambos motores a 0
}

void setup() {
  pinMode(pinSTBY, OUTPUT); digitalWrite(pinSTBY, HIGH);
  pinMode(Mizq1, OUTPUT); pinMode(Mizq2, OUTPUT); pinMode(Mizq_pwm, OUTPUT);
  pinMode(Mder1, OUTPUT); pinMode(Mder2, OUTPUT); pinMode(Mder_pwm, OUTPUT);
}

void loop() {
  avanzar();   delay(2000);
  girarDer();  delay(800);
  avanzar();   delay(2000);
  frenar();    delay(1000);
}`,objectives:[{id:"moves",label:"Robot avanza",type:"motor_forward",params:{motor:"A"},required:!0},{id:"turns",label:"Robot gira (motores opuestos)",type:"custom",params:{fn:o=>{if(!o.motorCmds)return!1;let{motorA:e,motorB:t}=o.motorCmds;return e.direction!==t.direction&&(e.pwm>0||t.pwm>0)}},required:!0}],hints:{moves:["La funci\xF3n avanzar() necesita activar ambos motores hacia adelante a velocidad VEL.",`void avanzar() {
  digitalWrite(Mizq1,HIGH); digitalWrite(Mizq2,LOW);
  digitalWrite(Mder1,HIGH); digitalWrite(Mder2,LOW);
  analogWrite(Mizq_pwm, VEL); analogWrite(Mder_pwm, VEL);
}`],turns:["Para girar: un motor adelante (IN1=HIGH, IN2=LOW) y el otro atr\xE1s (IN1=LOW, IN2=HIGH).",`void girarDer() {
  digitalWrite(Mizq1,HIGH); digitalWrite(Mizq2,LOW);   // izq adelante
  digitalWrite(Mder1,LOW);  digitalWrite(Mder2,HIGH);  // der atr\xE1s
  analogWrite(Mizq_pwm, VEL); analogWrite(Mder_pwm, VEL);
}`]}},{id:"u2-millis-no-delay",name:"U2.2 \u2014 Sin delay(): millis()",description:"El mismo comportamiento que U2.1 pero con millis(). El esqueleto de la m\xE1quina de estados est\xE1; complet\xE1 las transiciones y las acciones de cada estado.",scenarioId:"obstacle-arena",platformId:"ROBOARD",tags:["unit2","millis","non-blocking","state-machine"],sketch:`#define Mizq_pwm 3
#define Mizq1 5
#define Mizq2 4
#define pinSTBY 6
#define Mder1 7
#define Mder2 8
#define Mder_pwm 9
#define UMBRAL 350

// Estados posibles
#define AVANZANDO 0
#define GIRANDO   1

int estado = AVANZANDO;
long tInicio = 0;

void setup() {
  pinMode(pinSTBY, OUTPUT); digitalWrite(pinSTBY, HIGH);
  pinMode(Mizq1, OUTPUT); pinMode(Mizq2, OUTPUT); pinMode(Mizq_pwm, OUTPUT);
  pinMode(Mder1, OUTPUT); pinMode(Mder2, OUTPUT); pinMode(Mder_pwm, OUTPUT);
  tInicio = millis();
}

void loop() {
  int sensor = analogRead(A0);
  long ahora = millis();
  long dt = ahora - tInicio;

  if (estado == AVANZANDO) {
    // TODO: si hay obst\xE1culo \u2192 cambiar a GIRANDO
    // if (???) { estado = GIRANDO; tInicio = millis(); }

    // Avanzar (ya sab\xE9s c\xF3mo):
    // digitalWrite(Mizq1,HIGH); ...

  } else if (estado == GIRANDO) {
    // TODO: girar durante 600ms, luego volver a AVANZANDO
    // if (dt < 600) { /* girar */ }
    // else { estado = AVANZANDO; tInicio = millis(); }
  }
}`,objectives:[{id:"uses-millis",label:"Usa millis() (no delay())",type:"code_contains",params:{substring:"millis()"},required:!0},{id:"state-machine",label:"Variable de estado implementada",type:"code_contains",params:{substring:"estado"},required:!0},{id:"reactive",label:"Reacciona al obst\xE1culo y gira",type:"custom",params:{fn:o=>!o.motorCmds||!o.gpio?.A0?!1:o.gpio.A0.value>350&&o.motorCmds.motorA.direction!==o.motorCmds.motorB.direction},required:!0}],hints:{"uses-millis":["millis() retorna milisegundos transcurridos. Guard\xE1 el momento del cambio de estado: tInicio = millis();","Para saber cu\xE1nto pas\xF3: long dt = millis() - tInicio;"],"state-machine":['La variable "estado" determina qu\xE9 hace el robot. Cambi\xE1s de estado seg\xFAn condiciones.',"if (estado == AVANZANDO && sensor > UMBRAL) { estado = GIRANDO; tInicio = millis(); }"],reactive:["En el caso GIRANDO: if(dt < 600) { girar } else { estado=AVANZANDO; tInicio=millis(); }","Para girar: Mizq1=HIGH, Mizq2=LOW, Mder1=LOW, Mder2=HIGH, ambos PWM activos."]}},{id:"u2-seguir-pared",name:"U2.3 \u2014 Seguir la Pared (Control P)",description:"El robot debe mantener una distancia constante a la pared usando A1. La f\xF3rmula de control proporcional est\xE1; calcul\xE1 el error y complet\xE1 las velocidades diferenciales.",scenarioId:"corridor",platformId:"ROBOARD",tags:["unit2","proportional","wall-following","control"],sketch:`#define Mizq_pwm 3
#define Mizq1 5
#define Mizq2 4
#define pinSTBY 6
#define Mder1 7
#define Mder2 8
#define Mder_pwm 9
#define DIST_OBJ 400  // valor ADC objetivo para el sensor lateral
#define VEL_BASE 160
#define KP       0.3  // ganancia proporcional \u2014 experiment\xE1 con este valor

void setup() {
  pinMode(pinSTBY, OUTPUT); digitalWrite(pinSTBY, HIGH);
  pinMode(Mizq1, OUTPUT); pinMode(Mizq2, OUTPUT); pinMode(Mizq_pwm, OUTPUT);
  pinMode(Mder1, OUTPUT); pinMode(Mder2, OUTPUT); pinMode(Mder_pwm, OUTPUT);
}

void loop() {
  int sensorLat = analogRead(A1);  // sensor lateral

  // TODO: calcular el error (diferencia entre medici\xF3n y objetivo)
  // int error = ???

  // TODO: calcular la correcci\xF3n proporcional
  // int corr = (int)(KP * error);

  // TODO: calcular velocidades individuales
  // int velIzq = constrain(???, 0, 255);
  // int velDer = constrain(???, 0, 255);

  // Aplicar velocidades (una vez que las calcules):
  // digitalWrite(Mizq1, HIGH); digitalWrite(Mizq2, LOW);
  // digitalWrite(Mder1, HIGH); digitalWrite(Mder2, LOW);
  // analogWrite(Mizq_pwm, velIzq);
  // analogWrite(Mder_pwm, velDer);

  delay(10);
}`,objectives:[{id:"reads-lat",label:"Lee sensor lateral A1",type:"custom",params:{fn:o=>!!o.gpio?.A1?.mode},required:!0},{id:"differential",label:"Velocidades asim\xE9tricas (control)",type:"custom",params:{fn:o=>o.motorCmds?Math.abs(o.motorCmds.motorA.pwm-o.motorCmds.motorB.pwm)>15&&o.motorCmds.motorA.pwm>0:!1},required:!0}],hints:{"reads-lat":["analogRead(A1) devuelve 0-1023 proporcional a la distancia del sensor lateral.","int sensorLat = analogRead(A1); \u2014 ya est\xE1 en el c\xF3digo."],differential:["error = sensorLat - DIST_OBJ. Si positive: muy cerca \u2192 alejarse (aumentar vel izq).",`int error = sensorLat - DIST_OBJ;
int corr = (int)(KP * error);
velIzq = VEL_BASE + corr;
velDer = VEL_BASE - corr;`,"constrain(valor, min, max) limita el rango. Usalo para que el PWM no sea negativo ni mayor a 255."]}}],Ai=[{id:"u3-calibrar-ir",name:"U3.1 \u2014 Calibrar el Sensor Sharp IR",description:"Med\xED los valores del sensor a distintas distancias y determin\xE1 el umbral correcto. El c\xF3digo imprime el valor crudo; agreg\xE1 la interpretaci\xF3n.",scenarioId:"single-obstacle",platformId:"ROBOARD",tags:["unit3","calibration","serial","adc"],sketch:`// Calibraci\xF3n del sensor Sharp IR (GP2Y0A21YK)
// Objetivo: encontrar el umbral correcto para "cerca" vs "lejos"

void setup() {
  Serial.begin(9600);
  Serial.println("=== Calibracion Sharp IR ===");
  Serial.println("Mov\xE9 el obst\xE1culo y observ\xE1 los valores");
}

void loop() {
  int raw = analogRead(A0);
  Serial.print("ADC raw: ");
  Serial.print(raw);

  // TODO: agregar interpretaci\xF3n seg\xFAn el valor
  // Si raw > 700: muy cerca (< 10cm)
  // Si raw > 400: cerca (10-25cm)
  // Si raw > 150: lejos (25-50cm)
  // Sino: fuera de rango
  // Us\xE1 if/else if/else y Serial.println() para cada caso

  delay(200);
}`,objectives:[{id:"serial",label:"Imprime valores por Serial",type:"serial_printed",params:{contains:"ADC raw:"},required:!0},{id:"near-read",label:"Lee valores cercanos (>400)",type:"sensor_above",params:{pin:"A0",threshold:400},required:!0},{id:"far-read",label:"Lee valores lejanos (<200)",type:"sensor_below",params:{pin:"A0",threshold:200},required:!0}],hints:{serial:["Serial.begin(9600) ya est\xE1 en setup(). Serial.print() ya imprime el valor crudo.","Agreg\xE1 if/else despu\xE9s de Serial.print(raw): cada rango imprime una etiqueta diferente."],"near-read":["Acerc\xE1 el obst\xE1culo en el simulador arrastr\xE1ndolo hacia el robot.",'if (raw > 700) { Serial.println("  <- MUY CERCA"); } else if (raw > 400) { Serial.println("  <- CERCA"); }'],"far-read":["Alej\xE1 el obst\xE1culo. El valor deber\xEDa bajar por debajo de 200.",'else if (raw > 150) { Serial.println("  <- LEJOS"); } else { Serial.println("  <- FUERA DE RANGO"); }']}},{id:"u3-minisumo-borde",name:"U3.2 \u2014 Minisumo: Detectar Borde",description:"El QTR lee ~80 en el tatami negro y ~900 en el borde blanco. El robot ya avanza; complet\xE1 la detecci\xF3n de borde y la maniobra de escape.",scenarioId:"minisumo-practice",platformId:"ROBOARD",tags:["unit3","minisumo","qtr","lnr"],sketch:`#define Mizq_pwm 3
#define Mizq1 5
#define Mizq2 4
#define pinSTBY 6
#define Mder1 7
#define Mder2 8
#define Mder_pwm 9
// Sensor QTR en A0 (simulado: negro=bajo ~80, blanco=alto ~900)
#define SENSOR_QTR A0  // Sensor QTR: negro=~80, blanco=~900
#define BORDE 600  // por encima = borde blanco detectado

void avanzar(int v) {
  digitalWrite(Mizq1,HIGH); digitalWrite(Mizq2,LOW);
  digitalWrite(Mder1,HIGH); digitalWrite(Mder2,LOW);
  analogWrite(Mizq_pwm,v);  analogWrite(Mder_pwm,v);
}

// TODO: implementar retroceder(int v)
// void retroceder(int v) { ... }

// TODO: implementar girarDer(int v)
// void girarDer(int v) { ... }

void setup() {
  pinMode(pinSTBY, OUTPUT); digitalWrite(pinSTBY, HIGH);
  pinMode(Mizq1, OUTPUT); pinMode(Mizq2, OUTPUT); pinMode(Mizq_pwm, OUTPUT);
  pinMode(Mder1, OUTPUT); pinMode(Mder2, OUTPUT); pinMode(Mder_pwm, OUTPUT);
  delay(500);
}

void loop() {
  int qtr = analogRead(SENSOR_QTR);

  if (qtr > BORDE) {
    // TODO: borde detectado \u2014 retroceder y girar
    // retroceder(200); delay(150);
    // girarDer(160);   delay(300);
    avanzar(0);  // por ahora solo para
  } else {
    avanzar(160);
  }
  delay(10);
}`,objectives:[{id:"stby",label:"Driver habilitado",type:"gpio_high",params:{pin:"D6"},required:!0},{id:"reads-qtr",label:"Lee sensor QTR (analogRead)",type:"custom",params:{fn:o=>!!o.gpio?.A0?.mode},required:!0},{id:"avanza",label:"Robot avanza en el tatami",type:"motor_forward",params:{motor:"A"},required:!0},{id:"retrocede",label:"Robot retrocede al detectar borde",type:"motor_reverse",params:{motor:"A"},required:!0}],hints:{"reads-qtr":["analogRead(SENSOR_QTR) o analogRead(A0). El QTR devuelve ~80 en negro (tatami) y ~900 en blanco (borde).","Observ\xE1 el valor en el HUD cuando el robot est\xE1 en el centro vs cerca del borde."],stby:["Ya est\xE1 en setup(). Verific\xE1 que STBY=HIGH antes de ejecutar."],retrocede:[`void retroceder(int v) {
  digitalWrite(Mizq1,LOW); digitalWrite(Mizq2,HIGH);
  digitalWrite(Mder1,LOW); digitalWrite(Mder2,HIGH);
  analogWrite(Mizq_pwm,v); analogWrite(Mder_pwm,v);
}`,"Despu\xE9s de retroceder un poco, girar. girarDer: motor izq adelante, motor der atr\xE1s.","Secuencia: retroceder(200); delay(150); girarDer(160); delay(300);",`C\xF3digo completo:
void retroceder(int v){digitalWrite(Mizq1,LOW);digitalWrite(Mizq2,HIGH);digitalWrite(Mder1,LOW);digitalWrite(Mder2,HIGH);analogWrite(Mizq_pwm,v);analogWrite(Mder_pwm,v);}
void girarDer(int v){digitalWrite(Mizq1,HIGH);digitalWrite(Mizq2,LOW);digitalWrite(Mder1,LOW);digitalWrite(Mder2,HIGH);analogWrite(Mizq_pwm,v);analogWrite(Mder_pwm,v);}`]}},{id:"u3-minisumo-atacar",name:"U3.3 \u2014 Minisumo: Buscar y Atacar",description:"Partiendo de U3.2: agreg\xE1 el HC-SR04 para detectar el oponente y atacar. La funci\xF3n medirDistancia() est\xE1 vac\xEDa; implementala.",scenarioId:"minisumo-ring",platformId:"ROBOARD",tags:["unit3","minisumo","hc-sr04","lnr"],sketch:`#define Mizq_pwm 3
#define Mizq1 5
#define Mizq2 4
#define pinSTBY 6
#define Mder1 7
#define Mder2 8
#define Mder_pwm 9
#define SENSOR_QTR A0  // Sensor QTR: negro=~80, blanco=~900
#define TRIG 13
#define ECHO A3
#define BORDE    600
#define DIST_ATK 350  // microsegundos \u2014 oponente cerca si pulseIn < esto
#define VEL_B    170  // velocidad b\xFAsqueda
#define VEL_A    255  // velocidad ataque

// TODO: implementar medirDistancia()
// Debe enviar un pulso por TRIG y medir el tiempo de ECHO
long medirDistancia() {
  // paso 1: asegurar TRIG en LOW
  // paso 2: pulso de 10\xB5s en HIGH
  // paso 3: retornar pulseIn(ECHO, HIGH, 30000)
  return 99999;  // por ahora devuelve infinito (sin oponente)
}

void avanzar(int v)  {digitalWrite(Mizq1,HIGH);digitalWrite(Mizq2,LOW);digitalWrite(Mder1,HIGH);digitalWrite(Mder2,LOW);analogWrite(Mizq_pwm,v);analogWrite(Mder_pwm,v);}
void retroceder(int v){digitalWrite(Mizq1,LOW);digitalWrite(Mizq2,HIGH);digitalWrite(Mder1,LOW);digitalWrite(Mder2,HIGH);analogWrite(Mizq_pwm,v);analogWrite(Mder_pwm,v);}
void girarDer(int v)  {digitalWrite(Mizq1,HIGH);digitalWrite(Mizq2,LOW);digitalWrite(Mder1,LOW);digitalWrite(Mder2,HIGH);analogWrite(Mizq_pwm,v);analogWrite(Mder_pwm,v);}

void setup() {
  pinMode(pinSTBY, OUTPUT); digitalWrite(pinSTBY, HIGH);
  pinMode(Mizq1,OUTPUT);pinMode(Mizq2,OUTPUT);pinMode(Mizq_pwm,OUTPUT);
  pinMode(Mder1,OUTPUT);pinMode(Mder2,OUTPUT);pinMode(Mder_pwm,OUTPUT);
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  delay(500);
}

void loop() {
  // Prioridad 1: borde
  if (analogRead(SENSOR_QTR) > BORDE) {
    retroceder(200); delay(150);
    girarDer(160);   delay(300);
    return;
  }
  // Prioridad 2: oponente
  long dist = medirDistancia();
  if (dist > 0 && dist < DIST_ATK) {
    avanzar(VEL_A);
  } else {
    avanzar(VEL_B);
  }
  delay(10);
}`,objectives:[{id:"stby",label:"Driver habilitado",type:"gpio_high",params:{pin:"D6"},required:!0},{id:"borde",label:"Detecta borde y retrocede",type:"motor_reverse",params:{motor:"A"},required:!0},{id:"pulsein",label:"Implementa pulseIn en medirDist",type:"code_contains",params:{substring:"pulseIn"},required:!0},{id:"ataque",label:"Velocidad alta al detectar opon.",type:"custom",params:{fn:o=>o.motorCmds?.motorA?.pwm>200},required:!0}],hints:{stby:["STBY ya est\xE1 en setup(). Verific\xE1 que el driver est\xE9 habilitado antes de ejecutar.","GPIO Inspector: D6 debe mostrar HIGH."],borde:["La detecci\xF3n de borde ya estaba en el challenge anterior. Copiala aqu\xED: analogRead(SENSOR_QTR) > BORDE.","La prioridad es borde primero: if(analogRead(SENSOR_QTR) > BORDE) { retroceder + girar; return; }"],ataque:["Si dist < DIST_ATK: el oponente est\xE1 cerca \u2192 velocidad m\xE1xima VEL_A=255.","if(dist > 0 && dist < DIST_ATK) avanzar(VEL_A); else avanzar(VEL_B);"],pulsein:["pulseIn(pin, HIGH) mide el tiempo que el pin est\xE1 en HIGH (en microsegundos).",`Protocolo HC-SR04:
1. digitalWrite(TRIG, LOW); delayMicroseconds(2);
2. digitalWrite(TRIG, HIGH); delayMicroseconds(10);
3. digitalWrite(TRIG, LOW);
4. return pulseIn(ECHO, HIGH, 30000);`,`Funci\xF3n completa:
long medirDistancia(){
  digitalWrite(TRIG,LOW); delayMicroseconds(2);
  digitalWrite(TRIG,HIGH); delayMicroseconds(10);
  digitalWrite(TRIG,LOW);
  return pulseIn(ECHO,HIGH,30000);
}`]}},{id:"u3-minisumo-estrategia",name:"U3.4b \u2014 Minisumo: Estrategia Avanzada",description:"Implement\xE1 una estrategia de minisumo completa. No hay una sola soluci\xF3n: sweep, espiral, agresivo, conservador. El validator acepta cualquier estrategia que complete los objetivos reales.",scenarioId:"minisumo-ring",platformId:"ROBOARD",tags:["unit3","minisumo","strategy","state-machine","lnr"],sketch:`#define Mizq_pwm 3
#define Mizq1 5
#define Mizq2 4
#define pinSTBY 6
#define Mder1 7
#define Mder2 8
#define Mder_pwm 9
#define SENSOR_QTR A0   // QTR: negro=~80, blanco(borde)=~900
#define TRIG 13
#define ECHO A3
#define BORDE    600
#define DIST_ATK 350    // \xB5s: oponente cerca si < esto
// Estrategias posibles \u2014 eleg\xED UNA o combin\xE1
#define ESTRATEGIA_SWEEP      1  // buscar girando 360\xB0
#define ESTRATEGIA_ESPIRAL    2  // espiral hacia afuera
#define ESTRATEGIA_ZIGZAG     3  // zigzag buscando
#define MI_ESTRATEGIA ESTRATEGIA_SWEEP  // \u2190 cambi\xE1 esto

#define VEL_BASE  170
#define VEL_MAX   255
#define VEL_GIRO  140

long medirDistancia() {
  digitalWrite(TRIG, LOW); delayMicroseconds(2);
  digitalWrite(TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  return pulseIn(ECHO, HIGH, 30000);
}

void avanzar(int v) {
  digitalWrite(Mizq1,HIGH);digitalWrite(Mizq2,LOW);
  digitalWrite(Mder1,HIGH);digitalWrite(Mder2,LOW);
  analogWrite(Mizq_pwm,v);analogWrite(Mder_pwm,v);
}
void retroceder(int v) {
  digitalWrite(Mizq1,LOW);digitalWrite(Mizq2,HIGH);
  digitalWrite(Mder1,LOW);digitalWrite(Mder2,HIGH);
  analogWrite(Mizq_pwm,v);analogWrite(Mder_pwm,v);
}
void girarDer(int v) {
  digitalWrite(Mizq1,HIGH);digitalWrite(Mizq2,LOW);
  digitalWrite(Mder1,LOW);digitalWrite(Mder2,HIGH);
  analogWrite(Mizq_pwm,v);analogWrite(Mder_pwm,v);
}
void girarIzq(int v) {
  digitalWrite(Mizq1,LOW);digitalWrite(Mizq2,HIGH);
  digitalWrite(Mder1,HIGH);digitalWrite(Mder2,LOW);
  analogWrite(Mizq_pwm,v);analogWrite(Mder_pwm,v);
}
void frenar() { analogWrite(Mizq_pwm,0); analogWrite(Mder_pwm,0); }

// TODO: implementar la l\xF3gica de b\xFAsqueda seg\xFAn MI_ESTRATEGIA
// La m\xE1quina de estados debe tener al menos:
// - Estado BUSCAR: girar o zigzag buscando oponente
// - Estado ATACAR: avanzar a m\xE1xima velocidad
// - Estado BORDE:  retroceder + reentrar al centro

int estado = 0;  // 0=BUSCAR, 1=ATACAR, 2=BORDE
long tEstado = 0;

void setup() {
  pinMode(pinSTBY,OUTPUT); digitalWrite(pinSTBY,HIGH);
  pinMode(Mizq1,OUTPUT);pinMode(Mizq2,OUTPUT);pinMode(Mizq_pwm,OUTPUT);
  pinMode(Mder1,OUTPUT);pinMode(Mder2,OUTPUT);pinMode(Mder_pwm,OUTPUT);
  pinMode(TRIG,OUTPUT);pinMode(ECHO,INPUT);
  delay(500);
  tEstado=millis();
}

void loop() {
  // TODO: implementar m\xE1quina de estados con:
  // - detecci\xF3n de borde (prioridad m\xE1xima)
  // - detecci\xF3n de oponente (atacar cuando dist < DIST_ATK)
  // - b\xFAsqueda activa (girar cuando no ve oponente)
  // - recuperaci\xF3n (retroceder al centro tras borde)
  
  avanzar(VEL_BASE);  // comportamiento placeholder
  delay(10);
}`,objectives:[{id:"stby",label:"Driver habilitado",type:"gpio_high",params:{pin:"D6"},required:!0},{id:"borde",label:"Detecta y escapa del borde",type:"motor_reverse",params:{motor:"A"},required:!0},{id:"busca",label:"Gira buscando (motores asim\xE9tricos)",type:"custom",params:{fn:o=>{if(!o.motorCmds)return!1;let{motorA:e,motorB:t}=o.motorCmds;return e.direction!==t.direction&&(e.pwm>0||t.pwm>0)}},required:!0},{id:"ataca",label:"Ataca cuando detecta oponente (PWM m\xE1ximo)",type:"custom",params:{fn:o=>o.motorCmds?.motorA?.pwm>=220},required:!0},{id:"estados",label:"Usa millis() para los tiempos",type:"code_contains",params:{substring:"millis()"},required:!0},{id:"recovery",label:"Recupera posici\xF3n tras borde (bonus)",type:"custom",params:{fn:o=>o.motorCmds?o.motorCmds.motorA.direction==="FORWARD"&&o.motorCmds.motorA.pwm>0:!1},required:!1}],hints:{stby:["Ya est\xE1 en setup(). Verific\xE1 GPIO Inspector: D6=HIGH.","digitalWrite(pinSTBY, HIGH); en setup()."],borde:["Borde = QTR > BORDE = 600. M\xE1xima prioridad: si hay borde, todo lo dem\xE1s espera.","if(analogRead(SENSOR_QTR) > BORDE) { retroceder(200); delay(150); girarDer(160); delay(300); return; }"],busca:["Para buscar: girar sobre el eje. Un motor adelante, el otro atr\xE1s.","Estado BUSCAR: girarDer(VEL_GIRO) durante 400ms, luego avanzar 200ms. Repetir.",`Con millis():
if(estado==BUSCAR){
  if((millis()-tEstado)%600<400) girarDer(VEL_GIRO);
  else avanzar(VEL_BASE);
}`],ataca:["Si dist < DIST_ATK: cambiar a estado ATACAR con avanzar(VEL_MAX=255).","long dist=medirDistancia(); if(dist>0&&dist<DIST_ATK){ estado=1; avanzar(VEL_MAX); }"],estados:["tEstado=millis() al cambiar de estado. long dt=millis()-tEstado; para medir tiempo en estado.",`Estructura b\xE1sica:
if(borde){ /* escape */ return; }
long dist=medirDistancia();
if(dist<DIST_ATK){ avanzar(VEL_MAX); }
else{ /* buscar */ }`]}},{id:"u3-seguidor-linea",name:"U3.4 \u2014 Seguidor de L\xEDnea",description:"El robot sigue una l\xEDnea negra sobre fondo blanco usando dos sensores QTR (A0=centro, A1=derecho). La lectura de sensores est\xE1; complet\xE1 la l\xF3gica de direcci\xF3n.",scenarioId:"lf-pista-recta",platformId:"ROBOARD",tags:["unit3","line-follower","qtr","lnr"],sketch:`#define Mizq_pwm 3
#define Mizq1 5
#define Mizq2 4
#define pinSTBY 6
#define Mder1 7
#define Mder2 8
#define Mder_pwm 9
// QTR: negro = alto (~900), blanco = bajo (~80)
#define QTR_C    A0  // sensor centro
#define QTR_R    A1  // sensor derecho
#define UMBRAL   500
#define VEL_BASE 160
#define VEL_GIRO 100

void avanzar(int izq, int der) {
  digitalWrite(Mizq1,HIGH); digitalWrite(Mizq2,LOW);
  digitalWrite(Mder1,HIGH); digitalWrite(Mder2,LOW);
  analogWrite(Mizq_pwm, constrain(izq,0,255));
  analogWrite(Mder_pwm, constrain(der,0,255));
}

void setup() {
  pinMode(pinSTBY, OUTPUT); digitalWrite(pinSTBY, HIGH);
  pinMode(Mizq1,OUTPUT);pinMode(Mizq2,OUTPUT);pinMode(Mizq_pwm,OUTPUT);
  pinMode(Mder1,OUTPUT);pinMode(Mder2,OUTPUT);pinMode(Mder_pwm,OUTPUT);
}

void loop() {
  // Leer sensores (negro = true cuando valor > UMBRAL)
  bool lineaCentro  = analogRead(QTR_C) > UMBRAL;
  bool lineaDerecha = analogRead(QTR_R) > UMBRAL;

  // TODO: completar la l\xF3gica
  // Si centro=true  y derecha=false \u2192 recto
  // Si centro=false y derecha=true  \u2192 curva derecha (izq m\xE1s r\xE1pido)
  // Si centro=true  y derecha=true  \u2192 curva cerrada derecha
  // Si ninguno detecta              \u2192 buscar (izq m\xE1s lento)

  avanzar(VEL_BASE, VEL_BASE);  // por ahora siempre recto \u2014 reemplaz\xE1 con la l\xF3gica correcta
  delay(5);
}`,objectives:[{id:"reads-c",label:"Lee QTR central A0",type:"sensor_above",params:{pin:"A0",threshold:400},required:!0},{id:"reads-r",label:"Lee QTR derecho A1",type:"sensor_above",params:{pin:"A1",threshold:400},required:!0},{id:"diferencial",label:"Velocidades diferenciales",type:"custom",params:{fn:o=>o.motorCmds?Math.abs(o.motorCmds.motorA.pwm-o.motorCmds.motorB.pwm)>20&&o.motorCmds.motorA.pwm>0:!1},required:!0}],hints:{"reads-c":["analogRead(QTR_C) > UMBRAL = negro = l\xEDnea. El c\xF3digo ya lo hace con QTR_C=A0.","Observ\xE1 el HUD: cuando el robot est\xE1 sobre la l\xEDnea, A0 deber\xEDa mostrar ~900."],"reads-r":["analogRead(QTR_R) lee el sensor derecho (A1). Tambi\xE9n est\xE1 implementado.","El truco es usar ambos valores: bool lineaCentro = analogRead(QTR_C) > UMBRAL; bool lineaDerecha = analogRead(QTR_R) > UMBRAL;"],diferencial:["Para corregir hacia la derecha: motor izquierdo m\xE1s r\xE1pido que motor derecho.",`if(lineaCentro && !lineaDerecha) avanzar(VEL_BASE, VEL_BASE);
else if(!lineaCentro && lineaDerecha) avanzar(VEL_GIRO+40, VEL_GIRO-40);
else if(lineaCentro && lineaDerecha)  avanzar(VEL_GIRO+60, VEL_GIRO-60);
else                                  avanzar(VEL_GIRO-20, VEL_GIRO+20);`,`C\xF3digo completo:
if(lineaCentro && !lineaDerecha)      avanzar(VEL_BASE, VEL_BASE);
else if(!lineaCentro && lineaDerecha) avanzar(VEL_GIRO+40, VEL_GIRO-40);
else if(lineaCentro && lineaDerecha)  avanzar(VEL_GIRO+60, VEL_GIRO-60);
else                                  avanzar(VEL_GIRO-20, VEL_GIRO+20);`]}},{id:"u3-seguidor-qtr8",name:"U3.5 \u2014 Seguidor: Array QTR-8",description:"Us\xE1s 8 sensores QTR (A0\u2013A7) para calcular el error de posici\xF3n por centro de masa. El array ya lee; complet\xE1 el c\xE1lculo del centroide y el control proporcional.",scenarioId:"lf-curvas",platformId:"ROBOARD",tags:["unit3","qtr8","line-follower","proportional","centroid"],sketch:`#define Mizq_pwm 3
#define Mizq1    5
#define Mizq2    4
#define pinSTBY  6
#define Mder1    7
#define Mder2    8
#define Mder_pwm 9
#define N_SENS   8       // 8 sensores QTR: A0..A7
#define UMBRAL   500     // por encima = l\xEDnea negra
#define VEL_BASE 140
#define KP       0.4f    // ganancia proporcional \u2014 experiment\xE1

// Posiciones relativas de los sensores (-350 a +350, de izq a der)
const int POS[N_SENS] = {-350, -250, -150, -50, 50, 150, 250, 350};

void setup() {
  pinMode(pinSTBY, OUTPUT); digitalWrite(pinSTBY, HIGH);
  pinMode(Mizq1, OUTPUT);   pinMode(Mizq2, OUTPUT);   pinMode(Mizq_pwm, OUTPUT);
  pinMode(Mder1, OUTPUT);   pinMode(Mder2, OUTPUT);   pinMode(Mder_pwm, OUTPUT);
  Serial.begin(9600);
}

void avanzar(int izq, int der) {
  digitalWrite(Mizq1, HIGH); digitalWrite(Mizq2, LOW);
  digitalWrite(Mder1, HIGH); digitalWrite(Mder2, LOW);
  analogWrite(Mizq_pwm, constrain(izq, 0, 255));
  analogWrite(Mder_pwm, constrain(der, 0, 255));
}

void loop() {
  // Leer array QTR (negro = valor alto)
  int vals[N_SENS];
  long suma = 0, pesoTotal = 0;

  for (int i = 0; i < N_SENS; i++) {
    vals[i] = analogRead(i);           // A0=0, A1=1, ... A7=7
  }

  // TODO: calcular el centroide (posici\xF3n promedio ponderada)
  // Para cada sensor con l\xEDnea detectada (vals[i] > UMBRAL):
  //   suma      += POS[i] * vals[i];
  //   pesoTotal += vals[i];
  // error = (pesoTotal > 0) ? suma / pesoTotal : errorAnterior;

  // TODO: control proporcional
  // int corr = (int)(KP * error);
  // avanzar(VEL_BASE - corr, VEL_BASE + corr);

  // Por ahora: avanzar recto
  avanzar(VEL_BASE, VEL_BASE);

  // DEBUG: imprimir valores de sensores
  for (int i = 0; i < N_SENS; i++) {
    Serial.print(vals[i]); Serial.print(" ");
  }
  Serial.println();
  delay(5);
}`,objectives:[{id:"reads-array",label:"Lee todos los sensores A0\u2013A7",type:"custom",params:{fn:o=>{let e=o.gpio||{};return["A0","A1","A2","A3","A4","A5","A6","A7"].filter(t=>e[t]?.mode).length>=4}},required:!0},{id:"centroid-calc",label:"Calcula el centroide del array",type:"code_contains",params:{substring:"pesoTotal"},required:!0},{id:"prop-control",label:"Control proporcional con correcci\xF3n",type:"custom",params:{fn:o=>{if(!o.motorCmds)return!1;let{motorA:e,motorB:t}=o.motorCmds;return Math.abs(e.pwm-t.pwm)>20&&e.pwm>0&&e.direction==="FORWARD"}},required:!0},{id:"serial-debug",label:"Imprime valores por Serial (debug)",type:"serial_printed",params:{contains:" "},required:!1}],hints:{"reads-array":["analogRead(i) con i de 0 a 7 lee A0..A7. El loop ya est\xE1.","Para verificar: Serial.print(vals[i]) imprime cada sensor."],"centroid-calc":["Centro de masa: sumar cada POS[i] ponderado por vals[i]. Dividir por la suma de pesos.","for(int i=0;i<N_SENS;i++){if(vals[i]>UMBRAL){suma+=POS[i]*vals[i];pesoTotal+=vals[i];}}","int error=(pesoTotal>0)?(int)(suma/pesoTotal):0;",`Error completo con memoria:
static int errorAnterior=0;
int error=(pesoTotal>0)?(int)(suma/pesoTotal):errorAnterior;
errorAnterior=error;`],"prop-control":["error negativo \u2192 robot desviado a la izquierda \u2192 corregir a la derecha (izq m\xE1s lento).","int corr=(int)(KP*error); avanzar(VEL_BASE-corr, VEL_BASE+corr);","Ajust\xE1 KP entre 0.2 y 0.8. Demasiado alto oscila, demasiado bajo no corrige."]}},{id:"u3-seguidor-pd",name:"U3.6 \u2014 Seguidor PD: Derivada",description:"Agreg\xE1s el t\xE9rmino derivativo al control proporcional. El robot oscila menos en curvas. Complet\xE1 el c\xE1lculo de errorDerivada y ajust\xE1 KD.",scenarioId:"lf-curvas",platformId:"ROBOARD",tags:["unit3","pd","derivative","line-follower","qtr8"],sketch:`#define Mizq_pwm 3
#define Mizq1    5
#define Mizq2    4
#define pinSTBY  6
#define Mder1    7
#define Mder2    8
#define Mder_pwm 9
#define N_SENS   8
#define UMBRAL   500
#define VEL_BASE 140
#define KP       0.35f  // ganancia proporcional
#define KD       0.10f  // ganancia derivativa \u2014 AJUST\xC1 ESTO

const int POS[N_SENS] = {-350,-250,-150,-50,50,150,250,350};

// TODO: declarar variable errorAnterior (necesaria para calcular derivada)
// int errorAnterior = 0;

void setup() {
  pinMode(pinSTBY,OUTPUT); digitalWrite(pinSTBY,HIGH);
  pinMode(Mizq1,OUTPUT); pinMode(Mizq2,OUTPUT); pinMode(Mizq_pwm,OUTPUT);
  pinMode(Mder1,OUTPUT); pinMode(Mder2,OUTPUT); pinMode(Mder_pwm,OUTPUT);
}

void avanzar(int izq, int der) {
  digitalWrite(Mizq1,HIGH); digitalWrite(Mizq2,LOW);
  digitalWrite(Mder1,HIGH); digitalWrite(Mder2,LOW);
  analogWrite(Mizq_pwm, constrain(izq,0,255));
  analogWrite(Mder_pwm, constrain(der,0,255));
}

void loop() {
  long suma=0, pesoTotal=0;
  for(int i=0;i<N_SENS;i++){
    int v=analogRead(i);
    if(v>UMBRAL){ suma+=POS[i]*v; pesoTotal+=v; }
  }

  int error = (pesoTotal > 0) ? (int)(suma/pesoTotal) : 0;

  // TODO: calcular la derivada del error
  // int errorDerivada = error - errorAnterior;
  // errorAnterior = error;

  // Control P solamente (por ahora):
  int corr = (int)(KP * error);
  // TODO: agregar t\xE9rmino D:
  // int corr = (int)(KP * error + KD * errorDerivada);

  avanzar(VEL_BASE - corr, VEL_BASE + corr);
  delay(5);
}`,objectives:[{id:"uses-prev",label:"Declara errorAnterior (estado persistente)",type:"code_contains",params:{substring:"errorAnterior"},required:!0},{id:"deriv-calc",label:"Calcula derivada del error",type:"code_contains",params:{substring:"errorDerivada"},required:!0},{id:"kd-term",label:"Usa KD en el c\xE1lculo de correcci\xF3n",type:"code_contains",params:{substring:"KD"},required:!0},{id:"diff-pwm",label:"Velocidades diferenciales activas",type:"custom",params:{fn:o=>o.motorCmds?Math.abs(o.motorCmds.motorA.pwm-o.motorCmds.motorB.pwm)>15&&o.motorCmds.motorA.pwm>0:!1},required:!0}],hints:{"uses-prev":["La derivada del error necesita el error del ciclo anterior. Declaralo con static o como variable global.","static int errorAnterior = 0; \u2014 la keyword static conserva el valor entre llamadas de loop()."],"deriv-calc":["Derivada discreta: cambio de error entre un ciclo y el anterior.","int errorDerivada = error - errorAnterior; errorAnterior = error;"],"kd-term":["KD grande: amortigua oscilaciones pero puede hacer el control muy lento.","int corr = (int)(KP * error + KD * errorDerivada); \u2014 el t\xE9rmino D frena cuando el error crece r\xE1pido.","Empez\xE1 con KD=0.05 y aument\xE1 hasta que las oscilaciones desaparezcan sin que el robot frene en curvas."]}}],jr=[{id:"concept_differential_drive",type:"text",title:"Control Diferencial",content:{body:`Un robot diferencial gira controlando la diferencia de velocidad entre sus ruedas.

Ambas iguales \u2192 recto.
Izquierda m\xE1s r\xE1pida \u2192 gira a la derecha.
Derecha m\xE1s r\xE1pida \u2192 gira a la izquierda.
Opuestas \u2192 giro en el lugar.

La trayectoria es proporcional a la diferencia.`},displayMode:"panel"},{id:"concept_qtr_sensor",type:"text",title:"Sensor QTR Reflectivo",content:{body:`El QTR emite luz infrarroja y mide cu\xE1nta regresa.

Superficie negra (tatami): absorbe \u2192 ADC bajo (~50\u2013150).
Superficie blanca (borde): refleja \u2192 ADC alto (~700\u2013950).

Por eso en minisumo:
\u2022 Dentro del ring (negro) \u2192 valor bajo
\u2022 Borde blanco \u2192 valor alto \u2192 \xA1escapar!

En seguidor de l\xEDnea:
\u2022 Sobre la l\xEDnea negra \u2192 valor alto
\u2022 Sobre el fondo blanco \u2192 valor bajo`},displayMode:"panel"},{id:"concept_hcsr04",type:"text",title:"Sensor HC-SR04 Ultrasonido",content:{body:`Mide distancia por tiempo de vuelo del sonido.

1. TRIG: pulso de 10\xB5s \u2192 dispara ultrasonido.
2. ECHO se mantiene HIGH durante el tiempo del eco.
3. pulseIn(ECHO, HIGH) retorna tiempo en \xB5s.

Distancia (cm) \u2248 tiempo_\xB5s / 58
Rango: 2cm a 400cm.`},displayMode:"panel"},{id:"concept_state_machine",type:"code_example",title:"M\xE1quina de Estados vs delay()",content:{bad:`void loop() {
  avanzar();
  delay(2000); // robot sordo 2 segundos
}`,good:`void loop() {
  long ahora = millis();
  int sensor = analogRead(A0); // SIEMPRE lee
  if(estado==0 && ahora-tInicio>2000)
    { estado=1; tInicio=ahora; }
}`,explanation:"Con millis(): el robot puede leer sensores en cualquier momento del ciclo. Con delay(): est\xE1 completamente bloqueado."},displayMode:"panel"},{id:"concept_proportional_control",type:"formula",title:"Control Proporcional (P)",content:{formula:"correcci\xF3n = Kp \xD7 (medido - objetivo)",examples:["error = sensorLateral - DIST_OBJ","corr  = Kp \xD7 error","velIzq = VEL_BASE + corr","velDer = VEL_BASE - corr"],note:"Kp muy alto \u2192 oscila. Kp muy bajo \u2192 responde lento. Encontralo experimentando."},displayMode:"panel"}],Ei={id:"unit-1",name:"Unidad 1 \u2014 Sistemas Rob\xF3ticos",platformId:"ROBOARD",duration:"4 \xD7 50 min",tags:["unit1"],startChallenge:"u1-explorar-motores",startScenario:"empty-arena",moments:[{id:"observe",label:"Observar",description:"El robot ya funciona. Observ\xE1 qu\xE9 hace.",revealComponents:["CANVAS","SENSOR_HUD"]},{id:"discover",label:"Descubrir",description:"Mov\xE9 los obst\xE1culos. \xBFQu\xE9 cambia?",revealComponents:["CANVAS","SENSOR_HUD"]},{id:"understand",label:"Entender",description:"El robot solo mueve un motor. \xBFPor qu\xE9 gira?",revealComponents:["CANVAS","CODE_VIEW","GPIO_INSPECTOR"]},{id:"create",label:"Crear",description:"Complet\xE1 el c\xF3digo para girar al detectar.",revealComponents:["CANVAS","CODE_EDITOR","SERIAL","MOTOR_PANEL"],challenge:"u1-reactivo-girar"}]},yi={id:"unit-2",name:"Unidad 2 \u2014 Programaci\xF3n Interactiva",platformId:"ROBOARD",duration:"3 \xD7 50 min",tags:["unit2"],startChallenge:"u2-secuencia-tiempos",startScenario:"empty-arena",moments:[{id:"functions",label:"Funciones",description:"Organiz\xE1 el c\xF3digo en funciones.",revealComponents:["CANVAS","CODE_EDITOR","MOTOR_PANEL"]},{id:"non-blocking",label:"millis()",description:"Reescrib\xED sin delay().",revealComponents:["CANVAS","CODE_EDITOR","SENSOR_HUD","SERIAL"],challenge:"u2-millis-no-delay"},{id:"control",label:"Control P",description:"Control proporcional de distancia.",revealComponents:["CANVAS","CODE_EDITOR","SENSOR_HUD"],challenge:"u2-seguir-pared"}]},Ii={id:"unit-3",name:"Unidad 3 \u2014 Sensado y Datos",platformId:"ROBOARD",duration:"4 \xD7 50 min",tags:["unit3"],startChallenge:"u3-calibrar-ir",startScenario:"single-obstacle",moments:[{id:"measure",label:"Medir",description:"Calibr\xE1 el sensor IR.",revealComponents:["CANVAS","SENSOR_HUD","SERIAL"],challenge:"u3-calibrar-ir"},{id:"mini1",label:"Borde",description:"Detect\xE1 el borde del tatami.",revealComponents:["CANVAS","CODE_EDITOR","GPIO_INSPECTOR"],challenge:"u3-minisumo-borde"},{id:"mini2",label:"Atacar",description:"Borde + oponente.",revealComponents:["CANVAS","CODE_EDITOR","SENSOR_HUD"],challenge:"u3-minisumo-atacar"},{id:"line",label:"L\xEDnea",description:"Segu\xED la l\xEDnea negra.",revealComponents:["CANVAS","CODE_EDITOR","SENSOR_HUD"],challenge:"u3-seguidor-linea"}]};Oi.exports={UNIT1_CHALLENGES:bi,UNIT2_CHALLENGES:vi,UNIT3_CHALLENGES:Ai,UNIT1_LESSON:Ei,UNIT2_LESSON:yi,UNIT3_LESSON:Ii,EXTENDED_THEORY:jr,ALL_CHALLENGES:[...bi,...vi,...Ai],ALL_LESSONS:[Ei,yi,Ii]}});var Ri=m((Cn,Si)=>{"use strict";var Yr=[{id:"minisumo-ring",name:"Ring de Minisumo \u2014 Est\xE1ndar",description:"Ring circular de 77cm di\xE1metro. El robot debe empujar al oponente fuera del ring.",platformId:"ROBOARD",canvas:{width:700,height:700},robot:{start:{x:.35,y:.5,angle:0}},obstacles:[{id:"opponent",x:.56,y:.44,w:.08,h:.08,draggable:!0,label:"Oponente",mass:1.2}],track:{type:"arena",shape:"circle",radius:.42,edgeColor:"#ffffff",fillColor:"#1a1a1a"},boundaries:"none",tags:["minisumo","lnr","competition"],lnr:{category:"MINISUMO",ringDiamCm:77,ringColor:"black",edgeColor:"white",edgeWidthCm:5,maxRobotSizeCm:10,maxRobotGrams:500}},{id:"minisumo-practice",name:"Pr\xE1ctica Minisumo \u2014 Sin oponente",description:"Ring sin oponente. Para probar que el robot se mantiene dentro del ring.",platformId:"ROBOARD",canvas:{width:600,height:600},robot:{start:{x:.5,y:.5,angle:0}},obstacles:[],track:{type:"arena",shape:"circle",radius:.44,edgeColor:"#ffffff",fillColor:"#1a1a1a"},boundaries:"none",tags:["minisumo","lnr","practice"],lnr:{category:"MINISUMO"}},{id:"linea-recta",name:"Seguidor de L\xEDnea \u2014 Recta",description:"Pista recta simple. El robot debe seguir la l\xEDnea negra.",platformId:"ROBOARD",canvas:{width:800,height:300},robot:{start:{x:.08,y:.5,angle:0}},obstacles:[],track:{type:"line",shape:"straight",lineWidth:20,lineColor:"#000000",bgColor:"#ffffff"},boundaries:"wall",tags:["line-follower","lnr","practice"],lnr:{category:"LINE_FOLLOWER",trackType:"straight"}},{id:"linea-curvas",name:"Seguidor de L\xEDnea \u2014 Curvas",description:"Pista con curvas suaves. Requiere ajuste del umbral por sensor.",platformId:"ROBOARD",canvas:{width:900,height:600},robot:{start:{x:.1,y:.5,angle:0}},obstacles:[],track:{type:"line",shape:"oval",lineWidth:18,lineColor:"#000000",bgColor:"#ffffff"},boundaries:"wall",tags:["line-follower","lnr"],lnr:{category:"LINE_FOLLOWER",trackType:"oval"}},{id:"linea-competencia",name:"Seguidor de L\xEDnea \u2014 Pista LNR",description:"Pista con curvas cerradas, zona de inicio marcada. Mide tiempo de vuelta.",platformId:"ROBOARD",canvas:{width:1e3,height:700},robot:{start:{x:.5,y:.85,angle:-Math.PI/2}},obstacles:[],track:{type:"line",shape:"lnr_standard",lineWidth:20,lineColor:"#000000",bgColor:"#ffffff"},boundaries:"wall",tags:["line-follower","lnr","competition"],lnr:{category:"LINE_FOLLOWER",trackType:"lnr_standard",lapTiming:!0}}],Ye=`// ROBOARD \u2014 Minisumo
// Estrategia: buscar oponente y empujar
// Sensores: HC-SR04 frontal (trigger D13, echo A3)
//           QTR borde (A6)

#define TRIG     13
#define ECHO     A3
#define QTR_L    A6
#define QTR_R    A2
#define Mizq_pwm 3
#define Mizq1    5
#define Mizq2    4
#define pinSTBY  6
#define Mder1    7
#define Mder2    8
#define Mder_pwm 9

#define VEL_BUSCAR  180
#define VEL_ATACAR  255
#define DIST_ATAQUE 300    // pulseIn \xB5s \u2014 cerca del oponente
#define BORDE       600    // QTR sobre blanco del borde

long leerUltrasonico() {
  digitalWrite(TRIG, LOW);  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG, LOW);
  return pulseIn(ECHO, HIGH, 38000);
}

void avanzar(int vel) {
  digitalWrite(Mizq1,HIGH); digitalWrite(Mizq2,LOW);
  digitalWrite(Mder1,HIGH); digitalWrite(Mder2,LOW);
  analogWrite(Mizq_pwm, vel); analogWrite(Mder_pwm, vel);
}
void girarDerecha(int vel) {
  digitalWrite(Mizq1,HIGH); digitalWrite(Mizq2,LOW);
  digitalWrite(Mder1,LOW);  digitalWrite(Mder2,HIGH);
  analogWrite(Mizq_pwm, vel); analogWrite(Mder_pwm, vel);
}
void frenar() {
  digitalWrite(Mizq1,HIGH); digitalWrite(Mizq2,HIGH);
  digitalWrite(Mder1,HIGH); digitalWrite(Mder2,HIGH);
  analogWrite(Mizq_pwm,0); analogWrite(Mder_pwm,0);
}
void retroceder(int vel) {
  digitalWrite(Mizq1,LOW); digitalWrite(Mizq2,HIGH);
  digitalWrite(Mder1,LOW); digitalWrite(Mder2,HIGH);
  analogWrite(Mizq_pwm,vel); analogWrite(Mder_pwm,vel);
}

void setup() {
  pinMode(pinSTBY,OUTPUT); digitalWrite(pinSTBY,HIGH);
  pinMode(Mizq1,OUTPUT); pinMode(Mizq2,OUTPUT); pinMode(Mizq_pwm,OUTPUT);
  pinMode(Mder1,OUTPUT); pinMode(Mder2,OUTPUT); pinMode(Mder_pwm,OUTPUT);
  pinMode(TRIG,OUTPUT); pinMode(ECHO,INPUT);
  delay(3000); // Pausa de inicio reglamentaria
}

void loop() {
  // 1. Verificar borde (QTR ve blanco = peligro)
  if (analogRead(QTR_L) > BORDE || analogRead(QTR_R) > BORDE) {
    retroceder(200);
    delay(200);
    girarDerecha(150);
    delay(300);
    return;
  }
  // 2. Buscar y atacar oponente
  long dist = leerUltrasonico();
  if (dist > 0 && dist < DIST_ATAQUE) {
    avanzar(VEL_ATACAR);  // \xA1Atacar!
  } else {
    avanzar(VEL_BUSCAR);  // Buscar
  }
  delay(10);
}`,Ke=`// ROBOARD \u2014 Seguidor de L\xEDnea
// Sensor: QTR reflectivo en A0 (centro) y A1 (derecha)
// Negro = ADC alto, Blanco = ADC bajo

#define QTR_C    A0   // Centro
#define QTR_R    A1   // Derecha
#define Mizq_pwm 3
#define Mizq1    5
#define Mizq2    4
#define pinSTBY  6
#define Mder1    7
#define Mder2    8
#define Mder_pwm 9

#define UMBRAL   500   // por encima = l\xEDnea negra
#define VEL_BASE 160
#define VEL_GIRO 120

void avanzar(int izq, int der) {
  digitalWrite(Mizq1,HIGH); digitalWrite(Mizq2,LOW);
  digitalWrite(Mder1,HIGH); digitalWrite(Mder2,LOW);
  analogWrite(Mizq_pwm, constrain(izq,0,255));
  analogWrite(Mder_pwm, constrain(der,0,255));
}

void setup() {
  pinMode(pinSTBY,OUTPUT); digitalWrite(pinSTBY,HIGH);
  pinMode(Mizq1,OUTPUT); pinMode(Mizq2,OUTPUT); pinMode(Mizq_pwm,OUTPUT);
  pinMode(Mder1,OUTPUT); pinMode(Mder2,OUTPUT); pinMode(Mder_pwm,OUTPUT);
}

void loop() {
  int centro = analogRead(QTR_C);
  int derecha = analogRead(QTR_R);

  bool lineaCentro = centro > UMBRAL;
  bool lineaDerecha = derecha > UMBRAL;

  if (lineaCentro && !lineaDerecha) {
    // L\xEDnea al centro \u2014 avanzar recto
    avanzar(VEL_BASE, VEL_BASE);
  } else if (!lineaCentro && lineaDerecha) {
    // L\xEDnea se fue a la derecha \u2014 girar derecha
    avanzar(VEL_GIRO + 40, VEL_GIRO - 40);
  } else if (lineaCentro && lineaDerecha) {
    // Curva cerrada \u2014 girar m\xE1s
    avanzar(VEL_GIRO + 60, VEL_GIRO - 60);
  } else {
    // Perdi\xF3 la l\xEDnea \u2014 buscar
    avanzar(VEL_GIRO - 20, VEL_GIRO + 20);
  }
  delay(5);
}`,Kr=[{id:"ms-mantenerse-en-ring",name:"Minisumo Nv.1 \u2014 Mantenerse en el Ring",description:"El robot debe detectar el borde blanco y retroceder para no salirse.",scenarioId:"minisumo-practice",platformId:"ROBOARD",sketch:Ye,tags:["minisumo","lnr","level-1"],objectives:[{id:"motors-on",label:"Driver habilitado (STBY=HIGH)",type:"gpio_high",params:{pin:"D6"},required:!0},{id:"robot-moves",label:"Robot se mueve",type:"motor_forward",params:{motor:"A"},required:!0},{id:"stays-in-ring",label:"Robot no sale del ring por 10 segundos",type:"custom",params:{fn:o=>o.simTime>1e4&&!o._lnrOut},required:!0}],hints:{"stays-in-ring":["Le\xE9 el sensor QTR en A6. Si detecta blanco (ADC alto), el robot est\xE1 en el borde.","Cuando detectes el borde: retroced\xE9 y gir\xE1. Implement\xE1 esto en loop()."]}},{id:"ms-buscar-atacar",name:"Minisumo Nv.2 \u2014 Buscar y Atacar",description:"El robot debe buscar al oponente con el HC-SR04 y empujarlo fuera del ring.",scenarioId:"minisumo-ring",platformId:"ROBOARD",sketch:Ye,tags:["minisumo","lnr","level-2"],objectives:[{id:"detects-opponent",label:"Detecta oponente con sensor",type:"sensor_below",params:{pin:"A0",threshold:400},required:!0},{id:"attacks",label:"Aumenta velocidad al detectar oponente",type:"custom",params:{fn:o=>{if(!o.motorCmds)return!1;let e=o.gpio&&o.gpio.A0;return e&&e.value<400&&o.motorCmds.motorA.pwm>200}},required:!0},{id:"opponent-pushed",label:"Oponente se aleja del centro",type:"robot_moved",params:{minDistance:60},required:!1}],hints:{attacks:["Cuando la distancia sea baja, us\xE1 VEL_ATACAR=255 en lugar de VEL_BUSCAR."]}},{id:"lf-pista-recta",name:"Seguidor de L\xEDnea Nv.1 \u2014 Pista Recta",description:"Seguir una l\xEDnea recta sin desviarse. Introducci\xF3n al sensor QTR.",scenarioId:"linea-recta",platformId:"ROBOARD",sketch:Ke,tags:["line-follower","lnr","level-1"],objectives:[{id:"reads-sensor",label:"Lee el sensor QTR",type:"custom",params:{fn:o=>o.gpio&&o.gpio.A0&&o.gpio.A0.mode!==null},required:!0},{id:"follows-line",label:"Robot avanza siguiendo la l\xEDnea",type:"robot_moved",params:{minDistance:80},required:!0}],hints:{"follows-line":["Ajust\xE1 UMBRAL si el robot no detecta la l\xEDnea correctamente."]}},{id:"lf-curvas",name:"Seguidor de L\xEDnea Nv.2 \u2014 Curvas",description:"Seguir una pista con curvas. Requiere control proporcional b\xE1sico.",scenarioId:"linea-curvas",platformId:"ROBOARD",sketch:Ke,tags:["line-follower","lnr","level-2"],objectives:[{id:"differential-speed",label:"Motores con velocidades diferentes en curva",type:"custom",params:{fn:o=>o.motorCmds?Math.abs(o.motorCmds.motorA.pwm-o.motorCmds.motorB.pwm)>20:!1},required:!0},{id:"completes-curve",label:"Robot completa una curva sin salirse",type:"robot_moved",params:{minDistance:150},required:!0}],hints:{"differential-speed":["En curva, el motor exterior debe ir m\xE1s r\xE1pido que el interior.","Prob\xE1: avanzar(VEL_BASE + 40, VEL_BASE - 40) cuando la l\xEDnea est\xE1 a la derecha."]}}],$e=class{constructor(e){this._lnr=e||{},this._out=!1,this._lapStart=null,this._laps=[]}evaluate(e,t,i){let r=this._lnr.category;return r==="MINISUMO"?this._evalMinisumo(e,t,i):r==="LINE_FOLLOWER"?this._evalLineFollower(e):{ok:!0}}_evalMinisumo(e,t,i){let r=t/2,a=i/2,n=Math.min(t,i)*.42,s=e.x-r,l=e.y-a,u=Math.sqrt(s*s+l*l),c=u>n*.88;return u>n&&!this._out&&(this._out=!0),{category:"MINISUMO",onEdge:c,outOfRing:this._out,distFromCenter:u,ringRadius:n,edgeADC:c?800:50}}_evalLineFollower(e){return this._lnr.lapTiming&&(this._lapStart||(this._lapStart=Date.now())),{category:"LINE_FOLLOWER",lapCount:this._laps.length,currentLapMs:this._lapStart?Date.now()-this._lapStart:0,bestLapMs:this._laps.length?Math.min(...this._laps):null}}reset(){this._out=!1,this._lapStart=null,this._laps=[]}};Si.exports={LNR_SCENARIOS:Yr,LNR_CHALLENGES:Kr,LNRPhysics:$e,MINISUMO_SKETCH:Ye,LINE_FOLLOWER_SKETCH:Ke}});var wo=m((Nn,Di)=>{var{EventBus:$r,ScopedBus:Qr}=Ze(),{VirtualHAL:Zr,TB6612FNG:Xr,RZ7899:Jr,createDriver:ea}=H(),{getPlatform:ta,listPlatforms:ia,PLATFORMS:ra}=W(),{PedagogicalVM:aa}=z(),{DifferentialDrive:oa}=k(),{SensorEngine:na,SENSOR_MODE:sa}=F(),{SensorChannel:la}=he(),{getSensorType:da,listSensorTypes:ca,SENSOR_TYPES:ua}=ue(),{normalizePosition:pa,worldPosition:ma,getSensorOrientation:ha}=V(),{SeededRNG:ga}=P(),{SimSystem:fa}=Ae(),{TelemetryBus:_a,buildSnapshot:ba}=Y(),{SignalRecorder:va}=j(),{drawSparkline:Aa,drawGPIOTimeline:Ea,drawAnalogGauge:ya,drawMotorState:Ia,drawSensorComparison:Oa,drawGrid:Ta,TelemetryPanel:Sa,CLR:Ra}=It(),{ScenarioEngine:Ma}=Ie(),{ChallengeEngine:Da}=Te(),{obj:Pa,seq:Ca,all:Na,any:La,buildChallenge:wa}=Rt(),{RevelationEngine:Ua,COMPONENT:qa,REVEAL_TYPE:Ba,OBS:Ha}=Me(),{TheoryEngine:Wa}=Q(),{DiagnosticEngine:xa,HintGenerator:Ga}=Le(),{RuntimeValidator:za}=Ue(),{ContentRegistry:ka}=qe(),{TemplateEngine:Va}=Be(),{validate:Fa,validateMany:ja}=Z(),{PersistenceEngine:Ya,MemoryStorage:Ka,IndexedDBStorage:$a}=We(),{SandboxSession:Qa}=xt(),{SimProfiler:Za,LifecycleMonitor:Xa}=zt(),{EcosystemAssembler:Ja}=Ft(),{ROBOARD_SCENARIOS:eo}=Yt(),{ROBOARD_CHALLENGES:to}=Zt(),{UNIT_1:io}=Jt(),{ROBOARD_ROBOT_PROFILE:ro,ROBOARD_MINISUMO_PROFILE:ao}=ke(),{ROBOARD_THEORY:oo}=Q(),{SCENES:no,getScene:so,listScenes:lo}=ti(),{FRANKY_PLATFORM:co}=Fe(),{MANUAL_SECTIONS:uo}=ai(),{FrankySimulator:po}=ni(),{ALL_FRANKY_CHALLENGES:mo,ALL_FRANKY_LESSONS:ho,FRANKY_THEORY:go,ETAPA1_CHALLENGES:fo,ETAPA2_CHALLENGES:_o,ETAPA3_CHALLENGES:bo,ETAPA4_CHALLENGES:vo}=_i(),{ALL_CHALLENGES:Ao,ALL_LESSONS:Eo,EXTENDED_THEORY:yo,UNIT1_CHALLENGES:Io,UNIT2_CHALLENGES:Oo,UNIT3_CHALLENGES:To,UNIT1_LESSON:So,UNIT2_LESSON:Ro,UNIT3_LESSON:Mo}=Ti(),{LNR_SCENARIOS:Do,LNR_CHALLENGES:Po,LNRPhysics:Co,MINISUMO_SKETCH:No,LINE_FOLLOWER_SKETCH:Lo}=Ri(),Mi={EventBus:$r,ScopedBus:Qr,VirtualHAL:Zr,TB6612FNG:Xr,RZ7899:Jr,createDriver:ea,getPlatform:ta,listPlatforms:ia,PLATFORMS:ra,PedagogicalVM:aa,DifferentialDrive:oa,SensorEngine:na,SENSOR_MODE:sa,SensorChannel:la,getSensorType:da,listSensorTypes:ca,SENSOR_TYPES:ua,normalizePosition:pa,worldPosition:ma,getSensorOrientation:ha,SeededRNG:ga,SimSystem:fa,TelemetryBus:_a,buildSnapshot:ba,SignalRecorder:va,drawSparkline:Aa,drawGPIOTimeline:Ea,drawAnalogGauge:ya,drawMotorState:Ia,drawSensorComparison:Oa,drawGrid:Ta,TelemetryPanel:Sa,CLR:Ra,ScenarioEngine:Ma,ChallengeEngine:Da,obj:Pa,seq:Ca,all:Na,any:La,buildChallenge:wa,RevelationEngine:Ua,COMPONENT:qa,REVEAL_TYPE:Ba,OBS:Ha,TheoryEngine:Wa,DiagnosticEngine:xa,HintGenerator:Ga,RuntimeValidator:za,ContentRegistry:ka,TemplateEngine:Va,validate:Fa,validateMany:ja,PersistenceEngine:Ya,MemoryStorage:Ka,IndexedDBStorage:$a,SandboxSession:Qa,SimProfiler:Za,LifecycleMonitor:Xa,EcosystemAssembler:Ja,CURRICULUM_CHALLENGES:Ao,CURRICULUM_LESSONS:Eo,EXTENDED_THEORY:yo,UNIT1_CHALLENGES:Io,UNIT2_CHALLENGES:Oo,UNIT3_CHALLENGES:To,UNIT1_LESSON:So,UNIT2_LESSON:Ro,UNIT3_LESSON:Mo,ROBOARD_SCENARIOS:eo,ROBOARD_CHALLENGES:to,UNIT_1:io,ROBOARD_ROBOT_PROFILE:ro,ROBOARD_MINISUMO_PROFILE:ao,ROBOARD_THEORY:oo,SCENES:no,getScene:so,listScenes:lo,FRANKY_PLATFORM:co,FrankySimulator:po,MANUAL_SECTIONS:uo,ALL_FRANKY_CHALLENGES:mo,ALL_FRANKY_LESSONS:ho,FRANKY_THEORY:go,ETAPA1_CHALLENGES:fo,ETAPA2_CHALLENGES:_o,ETAPA3_CHALLENGES:bo,ETAPA4_CHALLENGES:vo,LNR_SCENARIOS:Do,LNR_CHALLENGES:Po,LNRPhysics:Co,MINISUMO_SKETCH:No,LINE_FOLLOWER_SKETCH:Lo,version:"1.0.0",build:Date.now()};typeof window<"u"&&(window.RoboLab=Mi);Di.exports=Mi});wo();})();
