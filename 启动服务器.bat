@echo off
chcp 65001 >nul
title HaiDao ZhengBa Server
cd /d "%~dp0"
if not exist server\node_modules (
  echo [First run] Installing dependencies, please wait...
  pushd server
  call npm ci
  if errorlevel 1 (
    popd
    echo [Error] Install failed. Please check the network and Node.js.
    pause
    exit /b 1
  )
  popd
)
echo.
echo ==========================================
echo   Server starting...
echo   Computer: http://localhost:8080
echo   Phone: use the WiFi URL printed below.
echo   Do not close the running server window.
echo ==========================================
echo.
node local-launcher.js --open
pause
