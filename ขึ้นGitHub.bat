@echo off
setlocal enabledelayedexpansion
title SangkhaFood - Push to GitHub
cd /d "%~dp0"

echo ============================================================
echo    SangkhaFood - Push to GitHub. Double-click = push.
echo ============================================================
echo.

REM ---------- check git ----------
where git >nul 2>nul
if errorlevel 1 goto nogit
goto havegit
:nogit
echo [X] Git was not found on this computer.
echo      Install it from https://git-scm.com/download/win
echo      Keep clicking Next, then run this file again.
pause
exit /b 1
:havegit

REM ---------- 1] init git repo if missing ----------
if not exist ".git" (
  echo [1/5] No git repo here - creating one...
  git init -b main >nul 2>nul
  if errorlevel 1 git init >nul
) else (
  echo [1/5] Git repo already exists - continuing.
)

REM ---------- 2] ask user.name / user.email once ----------
set "NAME="
set "EMAIL="
for /f "delims=" %%a in ('git config user.name 2^>nul') do set "NAME=%%a"
for /f "delims=" %%a in ('git config user.email 2^>nul') do set "EMAIL=%%a"
if not "%NAME%"=="" goto haveemail
set /p "NAME=   GitHub username, e.g. admin: "
git config user.name "%NAME%"
:haveemail
if not "%EMAIL%"=="" goto haveboth
set /p "EMAIL=   GitHub email: "
git config user.email "%EMAIL%"
:haveboth

REM ---------- 3] add remote origin - asked once ----------
set "URL="
for /f "delims=" %%a in ('git remote get-url origin 2^>nul') do set "URL=%%a"
if not "%URL%"=="" goto haveurl
echo.
echo [2/5] No remote origin yet - need your repo URL.
echo       1. If you don't have a repo yet, create one at
echo          https://github.com/new   e.g. name: sangkha-food
echo          Do NOT check README or .gitignore when creating.
echo       2. Paste the URL below, e.g. https://github.com/you/repo.git
echo.
set /p "URL=   Paste repo URL: "
if "%URL%"=="" goto nourl
git remote add origin "%URL%"
goto haveurl
:nourl
echo [X] No URL given - cancelled.
pause
exit /b 1
:haveurl

REM ---------- 4] add + commit ----------
echo [3/5] Adding all files. Junk files are ignored by .gitignore.
git add -A
git commit -m "SangkhaFood update %date% %time%" >nul 2>nul
if errorlevel 1 (
  echo      Nothing new to commit - pushing latest anyway.
)

REM ---------- 5] push ----------
echo [4/5] Setting branch to main and pushing...
git branch -M main
git push -u origin main 2>nul
if errorlevel 1 goto pushfailed
goto pushed
:pushfailed
echo.
echo    First push failed - two common reasons:
echo    [A] Not logged in to GitHub yet.
echo        Fix: install GitHub Desktop - https://desktop.github.com
echo        Sign in once, then run this file again.
echo        Or use a Personal Access Token when it asks for password.
echo.
echo    [B] This repo already has an older version on GitHub.
echo        You need to OVERWRITE it with your local files.
echo.
set /p "FORCE=   Overwrite the GitHub version with local files? [Y/n]: "
if /i "%FORCE%"=="Y" goto doforce
echo [X] Cancelled - nothing was pushed.
pause
exit /b 1
:doforce
git push -u origin main --force
if errorlevel 1 goto forcefailed
goto pushed
:forcefailed
echo.
echo [X] Still cannot push - probably the login issue, see [A].
pause
exit /b 1

REM ---------- done ----------
:pushed
echo [5/5] Done! Pushed to GitHub successfully.
echo.
echo    First time only: enable GitHub Pages once at
echo      repo - Settings - Pages - Source: GitHub Actions
echo    The workflow .github/workflows/deploy.yml is included,
echo    so the next push will deploy the site automatically.
echo.
pause
