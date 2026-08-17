@echo off
title SangkhaFood - Pull from GitHub
cd /d "%~dp0"

echo ============================================================
echo    SangkhaFood - Pull latest from GitHub.
echo ============================================================
echo.

where git >nul 2>nul
if errorlevel 1 goto nogit
goto havegit
:nogit
echo [X] Git was not found on this computer.
echo      Install it from https://git-scm.com/download/win
pause
exit /b 1
:havegit

echo [1/2] Downloading latest code from GitHub...
git pull origin main
if errorlevel 1 goto pullfail
goto pulled
:pullfail
echo.
echo [X] Pull failed - possible reasons:
echo      [A] Not logged in to GitHub yet. See the push button notes.
echo      [B] You have local changes that conflict. Commit or undo
echo          them first, then run this file again.
echo      [C] This folder is not a git repo yet. Run the push button
echo          once first to connect it to GitHub.
pause
exit /b 1

:pulled
echo [2/2] Done! Code is now the latest from GitHub.
echo.
pause
