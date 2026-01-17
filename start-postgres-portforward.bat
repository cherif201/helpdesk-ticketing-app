@echo off
echo ================================================
echo PostgreSQL Port-Forward for pgAdmin
echo ================================================
echo.
echo This window MUST stay open while using pgAdmin!
echo Press Ctrl+C to stop port-forwarding
echo.
echo Starting port-forward on localhost:5433...
echo.

oc port-forward pod/postgres-1-w2jc6 5433:5432 -n chrif0709-dev

pause
