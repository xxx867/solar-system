@echo off
chcp 65001 >nul
start "" "%~dp0index.html"
echo Презентация открывается в браузере...
timeout /t 3 >nul
