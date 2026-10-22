@echo off
title RealEstate Panel - Frontend
echo ============================================
echo   RealEstate Panel - Frontend
echo   App: http://localhost:4200
echo   (Pehle start-backend.bat chalu hona chahiye)
echo ============================================
cd /d "%~dp0frontend"
if not exist node_modules (
    echo Pehli baar hai - npm install chal raha hai...
    call npm install
)
call npm start
pause
