@echo off
:: ============================================================
::  ROBOLAB — Servidor de Red para Aula (LAN)
::  Versión para docentes que quieren servir desde UN equipo
::  y que TODOS los alumnos se conecten desde sus PCs.
::
::  CÓMO USAR EN EL AULA:
::    1. Ejecutar este .bat en la PC del docente (o servidor)
::    2. Anotar la IP que muestra en pantalla
::    3. Los alumnos abren: http://[IP-del-docente]:8080
::
::  DIFERENCIA CON INICIAR_ROBOLAB.bat:
::    - Este servidor acepta conexiones de TODA la red local
::    - El otro solo acepta conexiones desde la misma PC
:: ============================================================

title ROBOLAB — Servidor de Aula (LAN)

echo.
echo  ================================================
echo   ROBOLAB — Servidor de Aula para Red Local
echo  ================================================
echo.

cd /d "%~dp0"

if not exist "index.html" (
    echo  [ERROR] index.html no encontrado en esta carpeta.
    pause
    exit /b 1
)

set PORT=8080

:: Detectar Python
set PYTHON_CMD=
python --version >nul 2>&1
if %errorlevel% == 0 set PYTHON_CMD=python
if "%PYTHON_CMD%"=="" (
    python3 --version >nul 2>&1
    if %errorlevel% == 0 set PYTHON_CMD=python3
)
if "%PYTHON_CMD%"=="" (
    py --version >nul 2>&1
    if %errorlevel% == 0 set PYTHON_CMD=py
)
if "%PYTHON_CMD%"=="" (
    echo  [ERROR] Python no encontrado. Ver INICIAR_ROBOLAB.bat para instrucciones.
    pause
    exit /b 1
)

:: ============================================================
:: Obtener la IP local de esta PC para mostrársela al docente
:: ============================================================
echo  Obteniendo IP de esta PC...
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1" ^| findstr /v "169.254"') do (
    set LOCAL_IP=%%A
    goto :got_ip
)
:got_ip
:: Limpiar el espacio inicial de la IP
set LOCAL_IP=%LOCAL_IP: =%

echo.
echo  ------------------------------------------------
echo   Servidor iniciando en TODOS los adaptadores
echo   Puerto: %PORT%
echo.
echo   Esta PC (servidor):  http://localhost:%PORT%
if defined LOCAL_IP (
    echo   Desde los alumnos:   http://%LOCAL_IP%:%PORT%
)
echo  ------------------------------------------------
echo.
echo  [!] NO CIERRES ESTA VENTANA durante la clase
echo.
echo  PARA LOS ALUMNOS:
if defined LOCAL_IP (
    echo  Escribir en el navegador: http://%LOCAL_IP%:%PORT%
) else (
    echo  Ejecutar "ipconfig" y buscar "Dirección IPv4"
    echo  Luego escribir: http://[esa-ip]:%PORT%
)
echo.

:: Servidor SIN --bind para aceptar conexiones externas
start /B %PYTHON_CMD% -m http.server %PORT% 2>nul

timeout /t 2 /nobreak >nul

:: Verificar arranque
netstat -an 2>nul | findstr ":%PORT% " >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] El servidor no pudo iniciar.
    echo  Si Windows Firewall pregunta: hacer clic en "Permitir acceso"
    echo.
    pause
    exit /b 1
)

:: Abrir en navegador local del servidor también
start "" "http://localhost:%PORT%/index.html"

echo  ================================================
echo   Servidor activo. Esperando alumnos...
echo   (El firewall de Windows puede pedir permiso —
echo    hacer clic en "Permitir acceso" o "Redes privadas")
echo  ================================================
echo.
pause >nul
exit /b 0
