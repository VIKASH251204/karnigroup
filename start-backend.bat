@echo off
title RealEstate API - Backend
echo ============================================
echo   RealEstate Panel - Backend (Demo Mode)
echo   API: http://localhost:5080
echo   Swagger: http://localhost:5080/swagger
echo ============================================
cd /d "%~dp0backend\RealEstate.Api"
set ASPNETCORE_ENVIRONMENT=Development
dotnet run --urls http://0.0.0.0:5080
pause
