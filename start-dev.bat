@echo off
echo Starting Expo development server...
echo.
echo Note: This script uses Node.js v24 compatibility mode
echo.

REM Set Node.js options to disable TypeScript stripping
set NODE_OPTIONS=--no-experimental-strip-types --no-warnings

REM Start the development server
npm run dev

pause
