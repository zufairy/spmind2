@echo off
REM Setup script for Wordnik wordlist on Windows
REM This downloads and converts the Wordnik wordlist for Word Bomb

echo.
echo ================================================
echo  Word Bomb - Wordnik Wordlist Setup
echo ================================================
echo.

REM Check if curl is available
where curl >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: curl is not installed or not in PATH
    echo.
    echo Please download manually from:
    echo https://github.com/wordnik/wordlist/blob/main/wordlist-20210729.txt
    echo.
    pause
    exit /b 1
)

REM Check if Node.js is available
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [1/3] Downloading Wordnik wordlist...
curl -o wordlist-20210729.txt https://raw.githubusercontent.com/wordnik/wordlist/main/wordlist-20210729.txt
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to download wordlist
    pause
    exit /b 1
)
echo      Downloaded successfully!
echo.

echo [2/3] Converting to JSON format...
node scripts\convert-wordnik-wordlist.js
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Conversion failed
    pause
    exit /b 1
)
echo.

echo [3/3] Cleaning up...
del wordlist-20210729.txt
echo      Deleted temporary file
echo.

echo ================================================
echo  SUCCESS! Wordnik wordlist is ready!
echo ================================================
echo.
echo Next steps:
echo   1. Restart your app (npm start -- --reset-cache)
echo   2. Open Word Bomb game
echo   3. Check console for: "Using external wordlist"
echo.
echo The wordlist is saved in: assets\wordlist.json
echo.
pause

