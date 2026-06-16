@echo off
cd /d "%~dp0"
python -m http.server 8092 --bind 127.0.0.1
