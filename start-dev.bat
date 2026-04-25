@echo off
set ROOT=%~dp0
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%start-dev.ps1"
