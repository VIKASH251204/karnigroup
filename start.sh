#!/usr/bin/env bash
# RealEstate Panel - dono servers ek saath (Linux/Mac)
# Usage: ./start.sh          -> demo mode (SQLite)
#        ./start.sh sqlserver -> SQL Server mode
set -e
cd "$(dirname "$0")"

if [ "$1" = "sqlserver" ]; then
  echo ">>> Backend (SQL Server mode) on :5080"
  (cd backend/RealEstate.Api && dotnet run --urls http://0.0.0.0:5080) &
else
  echo ">>> Backend (SQLite demo mode) on :5080"
  (cd backend/RealEstate.Api && ASPNETCORE_ENVIRONMENT=Development dotnet run --urls http://0.0.0.0:5080) &
fi

echo ">>> Frontend on :4200 (pehli baar npm install lag sakta hai)"
(cd frontend && [ -d node_modules ] || npm install) && (cd frontend && npm start) &
echo ">>> Done! Browser mein kholein: http://localhost:4200"
wait
