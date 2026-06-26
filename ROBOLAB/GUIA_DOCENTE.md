# ROBOLAB — Guía de Distribución y Uso en Laboratorio

## Contenido de esta guía

1. Qué necesita cada PC
2. Estructura de archivos
3. Cómo distribuir a los estudiantes
4. Uso en laboratorio LAN
5. Configurar el Firewall de Windows
6. Cambiar el puerto
7. Errores comunes y soluciones
8. Acceso desde otros equipos de la red
9. Requisitos mínimos

---

## 1. Qué necesita cada PC

| Componente | ¿Necesario? | Notas |
|---|---|---|
| **Python 3** | ✅ Sí | Gratuito, 1 clic de instalación |
| Node.js | ❌ No | No hace falta |
| npm / pip | ❌ No | No hace falta |
| Conexión a internet | ❌ No | Todo funciona offline |
| Instalar ROBOLAB | ❌ No | Solo copiar la carpeta |
| Abrir terminal | ❌ No | Doble clic en el .bat |

**Verificar si Python ya está instalado:**
Abrir CMD y escribir: `python --version`
Si responde `Python 3.x.x` → listo, no hay que instalar nada.

---

## 2. Estructura de archivos

Todos estos archivos deben estar **en la misma carpeta**:

```
ROBOLAB\
├── index.html                  ← aplicación principal
├── robolab.bundle.js            ← simulador y curriculum
├── blockly_compressed.js        ← programación visual
├── bly_blocks.js
├── bly_js.js
├── bly_msg.js
├── franky-blockly.js
├── franky-blockly-helpers.js
├── manifest.json
├── sw.js
├── INICIAR_ROBOLAB.bat          ← lanzador para uso local
└── INICIAR_ROBOLAB_LAN.bat      ← lanzador para servidor de aula
```

---

## 3. Cómo distribuir a los estudiantes

### Opción A — USB / pendrive (sin red)

1. Copiar la carpeta `ROBOLAB\` completa al USB
2. El estudiante conecta el USB a su PC
3. Abre la carpeta en el explorador de Windows
4. Doble clic en `INICIAR_ROBOLAB.bat`
5. El navegador abre solo

> **Nota:** El progreso guardado queda en el navegador de **esa** PC (localStorage). Si el estudiante cambia de PC, empieza desde cero.

### Opción B — Carpeta compartida en red escolar

1. Copiar la carpeta a una unidad de red compartida (ej: `\\servidor\robolab\`)
2. Cada estudiante mapea la unidad o entra por el explorador
3. **Copiar la carpeta a C:\ROBOLAB\ en la PC local antes de ejecutar**
   (ejecutar directamente desde red puede ser lento o bloqueado por políticas)

### Opción C — Un servidor sirve a todos (recomendado para laboratorio)

Ver sección 4.

---

## 4. Uso en laboratorio LAN (una PC sirve, todos los alumnos se conectan)

### En la PC del servidor (docente):

1. Asegurarse de que Python 3 esté instalado
2. Copiar la carpeta `ROBOLAB\` a esa PC (ej: `C:\ROBOLAB\`)
3. Doble clic en **`INICIAR_ROBOLAB_LAN.bat`**
4. Anotar la IP que aparece en pantalla (ej: `192.168.1.50`)
5. Si Windows Firewall pregunta → clic en **"Permitir acceso"**

### En las PCs de los alumnos:

1. Abrir Chrome, Edge o Firefox
2. Escribir en la barra de dirección: `http://192.168.1.50:8080`
   (reemplazar `192.168.1.50` con la IP real del servidor)
3. Presionar Enter

> **Los alumnos no necesitan instalar nada.** Solo necesitan un navegador.

---

## 5. Configurar el Firewall de Windows

Cuando se ejecuta `INICIAR_ROBOLAB_LAN.bat` por primera vez, Windows puede mostrar este mensaje:

```
"¿Desea permitir que Python acceda a las redes públicas y privadas?"
```

**Hacer clic en:** ✅ Permitir acceso (o "Redes privadas")

Si el aviso ya no aparece pero los alumnos no pueden conectarse:

1. Abrir **Panel de Control** → **Windows Defender Firewall**
2. Hacer clic en **"Permitir una aplicación a través del Firewall"**
3. Buscar **"python.exe"** en la lista
4. Tildar ✅ **Privada** (y opcionalmente **Pública**)
5. Hacer clic en **Aceptar**

Alternativa rápida (como Administrador):
```
netsh advfirewall firewall add rule name="ROBOLAB Python" dir=in action=allow program="C:\Users\TuUsuario\AppData\Local\Programs\Python\Python3x\python.exe" enable=yes
```

---

## 6. Cambiar el puerto

El puerto predeterminado es **8080**. Si está ocupado por otro programa:

**En `INICIAR_ROBOLAB.bat`** y **`INICIAR_ROBOLAB_LAN.bat`**, buscar la línea:
```
set PORT=8080
```
Y cambiarla por:
```
set PORT=8000
```
(o cualquier número entre 1024 y 65535 que no esté en uso)

Puertos alternativos comunes: `8000`, `8081`, `9000`, `3000`

**Verificar si un puerto está libre:**
```
netstat -an | findstr :8080
```
Si no muestra nada → el puerto está libre.

---

## 7. Errores comunes y soluciones

### ❌ "No se encontró index.html en esta carpeta"
**Causa:** El .bat fue movido fuera de la carpeta de ROBOLAB.
**Solución:** Mover el .bat de vuelta a la misma carpeta que `index.html`.

---

### ❌ "Python no está instalado"
**Causa:** Python no está instalado o no está en el PATH de Windows.
**Solución:**
1. Ir a https://www.python.org/downloads/
2. Descargar Python 3.x
3. **Importante:** Tildar ✅ "Add Python to PATH" durante la instalación
4. Reiniciar la PC
5. Volver a ejecutar el .bat

---

### ❌ El navegador abre pero muestra una página en blanco o error
**Causa:** El Service Worker de una sesión anterior está en caché.
**Solución en Chrome/Edge:**
1. Presionar `Ctrl + Shift + I` (Herramientas de Desarrollador)
2. Ir a la pestaña **Application** → **Service Workers**
3. Hacer clic en **"Unregister"** (o "Update")
4. Recargar con `Ctrl + F5`

---

### ❌ Los alumnos no pueden conectarse al servidor del docente
**Causas posibles:**
- Firewall de Windows bloqueando (ver sección 5)
- La IP anotada es incorrecta
- Los equipos están en VLANs separadas

**Diagnóstico:**
En la PC del alumno, abrir CMD y escribir:
```
ping 192.168.1.50
```
(reemplazar con la IP del servidor)
Si hay respuesta → problema de puerto/firewall
Si no hay respuesta → problema de red/VLAN

---

### ❌ "El puerto 8080 está ocupado"
**Causa:** Otro programa (Tomcat, otro servidor Python, etc.) usa ese puerto.
**Solución:** Cambiar el puerto en el .bat (ver sección 6).

---

### ❌ El antivirus bloquea el .bat
**Causa:** Algunos antivirus corporativos bloquean scripts .bat.
**Solución:**
- Agregar la carpeta ROBOLAB a las exclusiones del antivirus
- O ejecutar el servidor manualmente desde CMD:
  ```
  cd C:\ROBOLAB
  python -m http.server 8080
  ```
  Y abrir `http://localhost:8080` en el navegador.

---

## 8. Acceso desde otros equipos de la red

Para que otros equipos (alumnos, docentes, tablets) accedan:

1. Usar **`INICIAR_ROBOLAB_LAN.bat`** (no el lanzador básico)
2. Configurar el firewall (sección 5)
3. Compartir la IP y el puerto con los alumnos

### Encontrar la IP del servidor manualmente:
```
ipconfig
```
Buscar la línea **"Dirección IPv4"** bajo el adaptador de red activo.
Ejemplo: `Dirección IPv4. . . . . . . . . : 192.168.1.50`

### Con tablets o celulares:
Los dispositivos en la misma red WiFi pueden acceder igual.
El alumno escribe en Safari o Chrome del celular: `http://192.168.1.50:8080`

---

## 9. Requisitos mínimos del sistema

| Componente | Mínimo | Recomendado |
|---|---|---|
| Sistema operativo | Windows 7 | Windows 10/11 |
| RAM | 2 GB | 4 GB |
| Python | 3.6+ | 3.10+ |
| Navegador | Chrome 70 / Edge 80 | Chrome 110+ |
| Pantalla | 1280×720 | 1366×768 o mayor |
| Espacio en disco | 15 MB | — |

### Navegadores compatibles:
- ✅ Google Chrome (recomendado)
- ✅ Microsoft Edge
- ✅ Firefox 90+
- ⚠️ Safari (funcional con limitaciones en Service Worker)
- ❌ Internet Explorer (no compatible)

---

## 10. Distribución en kit USB para el aula

Estructura recomendada para un USB de clase:

```
USB_ROBOLAB\
├── ROBOLAB\
│   ├── index.html
│   ├── robolab.bundle.js
│   ├── blockly_compressed.js
│   ├── ... (todos los archivos)
│   ├── INICIAR_ROBOLAB.bat
│   └── INICIAR_ROBOLAB_LAN.bat
│
├── Python-Installer\
│   └── python-3.12.x-amd64.exe     ← instalador offline de Python
│
└── GUIA_INSTALACION.txt            ← instrucciones breves impresas
```

**`GUIA_INSTALACION.txt`** (para estudiantes):
```
ROBOLAB — Instrucciones rápidas

1. Si Python no está instalado:
   - Abrir Python-Installer\python-3.12.x-amd64.exe
   - Tildar "Add Python to PATH"
   - Instalar y reiniciar la PC

2. Ejecutar ROBOLAB:
   - Abrir la carpeta ROBOLAB\
   - Doble clic en INICIAR_ROBOLAB.bat
   - El navegador abre solo

3. Si algo no funciona:
   - Llamar al docente
```

---

*Guía generada para ROBOLAB v1 — Plataforma educativa de robótica para secundaria técnica*
