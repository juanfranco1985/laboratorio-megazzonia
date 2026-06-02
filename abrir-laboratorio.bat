@echo off
setlocal
cd /d "%~dp0"
set PORT=8090
start "Laboratorio Megazzonia Server" /min C:\Python313\python.exe -m http.server %PORT% --bind 127.0.0.1
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:%PORT%/?v=megazzonia-20260513a"
endlocal




