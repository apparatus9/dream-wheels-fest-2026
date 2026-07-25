@echo off
REM Double-click this to see who has entered (names, cars, interests, hot leads).
REM It refreshes from Firebase and opens the dashboard in your browser.
cd /d "%~dp0"
echo Loading the latest entries from Firebase...
call node dashboard.js --open
if errorlevel 1 (
  echo.
  echo Something went wrong. Make sure serviceAccount.json is in this folder.
  pause
)
