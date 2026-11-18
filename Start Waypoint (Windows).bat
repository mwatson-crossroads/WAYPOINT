@echo off
title Waypoint
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto :nonode
node -e "process.exit(+process.versions.node.split('.')[0] < 22 ? 1 : 0)"
if errorlevel 1 goto :nonode

if not exist node_modules (
  echo Setting up Waypoint for the first time. This takes a minute or two...
  call npm install
  if errorlevel 1 goto :fail
)

echo Building Waypoint...
call npm run build
if errorlevel 1 goto :fail

echo.
echo Waypoint is starting. Your browser will open in a few seconds.
echo KEEP THIS WINDOW OPEN while you use Waypoint. Close it to stop Waypoint.
echo.
start "" cmd /c "timeout /t 5 >nul & start http://localhost:4300"
call npm start
goto :eof

:nonode
echo Waypoint needs Node.js version 22 or newer.
echo Opening the download page now. Install the "LTS" version, then double-click this file again.
start https://nodejs.org
pause
goto :eof

:fail
echo.
echo Something went wrong. Take a screenshot of this window and send it to Claude.
pause
