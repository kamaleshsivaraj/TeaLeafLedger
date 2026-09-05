@echo off
REM TeaLeafLedger Seed Data Importer (Windows)
REM Reads MongoDB credentials from .env at project root.

setlocal EnableDelayedExpansion
set "ROOT_DIR=%~dp0"
set "SEED_DIR=%ROOT_DIR%backend\src\main\resources\mongo-seed"

if not exist "%ROOT_DIR%.env" (
  echo Error: .env not found at %ROOT_DIR%.env
  echo Copy .env.example to .env and set MONGO_* values.
  exit /b 1
)

REM ---- Load .env values ----
for /f "usebackq tokens=1,* delims==" %%A in ("%ROOT_DIR%.env") do (
  set "line=%%A"
  if not "!line:~0,1!"=="#" (
    if not "%%A"=="" set "%%A=%%B"
  )
)

set "HOST=%MONGODB_HOST%"
if "%HOST%"=="" set "HOST=localhost"
set "PORT=%MONGODB_PORT%"
if "%PORT%"=="" set "PORT=27017"
set "DB=%MONGODB_DB%"
if "%DB%"=="" set "DB=tealeafledger_seed"

set "AUTH="
if not "%MONGODB_USER%"=="" (
  set "AUTH=-u %MONGODB_USER% -p "%MONGODB_PASSWORD%" --authenticationDatabase %MONGODB_AUTH_DB%"
)

echo Importing seed data into MongoDB database '%DB%' at %HOST%:%PORT% ...

mongoimport --host %HOST% --port %PORT% %AUTH% --db %DB% --collection seed_rates --jsonArray --file "%SEED_DIR%seed_rates.json" --drop || goto :error
mongoimport --host %HOST% --port %PORT% %AUTH% --db %DB% --collection seed_farmers --jsonArray --file "%SEED_DIR%seed_farmers.json" --drop || goto :error
mongoimport --host %HOST% --port %PORT% %AUTH% --db %DB% --collection seed_config --jsonArray --file "%SEED_DIR%seed_config.json" --drop || goto :error

echo.
echo MongoDB seed data imported successfully!
exit /b 0

:error
echo.
echo Seed import FAILED. Check MongoDB is running and .env credentials are correct.
exit /b 1