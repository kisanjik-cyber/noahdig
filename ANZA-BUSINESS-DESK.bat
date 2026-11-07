@echo off
rem Starts the NOAH Business Desk and opens the shop (orders go straight into the desk).
cd /d "%~dp0business-support-desk"
if not exist node_modules (call npm install)
start "" http://127.0.0.1:4177/
start "" http://127.0.0.1:4177/store/
node server.js
pause
