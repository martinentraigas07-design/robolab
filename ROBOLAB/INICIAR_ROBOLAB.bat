@echo off
title ROBOLAB - Plataforma de Robotica Educativa

echo.
echo ============================================
echo   ROBOLAB - Plataforma Educativa
echo ============================================
echo.

cd /d "%~dp0"

if not exist "index.html" (
echo ERROR: No se encontro index.html
echo.
echo Este archivo debe estar dentro de la carpeta ROBOLAB.
pause
exit /b
)

echo Iniciando servidor local...
echo.

start http://localhost:8080

python -m http.server 8080

echo.
echo El servidor se cerro.
pause
