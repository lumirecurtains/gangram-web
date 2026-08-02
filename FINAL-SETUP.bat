@echo off
chcp 65001 >nul
title Gangaram Pilot — FINAL SETUP (Koi Mistake Nahi)
echo ============================================
echo   GANGARAM PILOT — FINAL CLEAN SETUP
echo   Ye sab khud karega — bas wait karo
echo ============================================
echo.

echo [1/5] Purana server band kar raha hoon...
taskkill /IM node.exe /F >nul 2>&1
echo   Done.

echo [2/5] Purani cache (.next) hata raha hoon...
if exist ".next" rmdir /S /Q .next
echo   Done.

echo [3/5] Naye changes lo (git pull)...
git pull
echo   Done.

echo [4/5] Packages install karo (npm install)...
call npm install
echo   Done.

echo [5/5] App shuru karo (npm run dev)...
echo.
echo ============================================
echo   READY! Browser mein kholo:
echo   http://localhost:3000
echo   (Ctrl+C se app band hoga)
echo ============================================
call npm run dev
pause
