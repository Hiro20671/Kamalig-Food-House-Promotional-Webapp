@echo off
echo Starting Kamalig Food House Promotional Web Application (Desktop + Mobile Wi-Fi Ready)...
start "Kamalig Django Backend (Port 8000)" cmd /k "cd /d "%~dp0backend" && .\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000"
start "Kamalig React Frontend (Port 5173)" cmd /k "cd /d "%~dp0frontend" && npm.cmd run dev -- --host 0.0.0.0 --port 5173"
echo Both servers are launching:
echo - Public Website: http://localhost:5173
echo - Owner CMS Portal: http://localhost:5173/admin/login (Passcode: 1830)
echo - Django API Backend: http://127.0.0.1:8000
