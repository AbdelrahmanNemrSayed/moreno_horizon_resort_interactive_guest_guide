@echo off
timeout /t 5 /nobreak

:: تشغيل سيرفر المشروع
cd /d "D:\Code Projects\moreno_horizon_resort_interactive_guest_guide"
start "" /b node server.js

:: تشغيل نفق Cloudflare
start "" "%TEMP%\cloudflared.exe" tunnel --url http://localhost:3000