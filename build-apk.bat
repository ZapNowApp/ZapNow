@echo off
REM ============================================================
REM  build-apk.bat - Build all 4 APKs (PWA -> TWA)
REM  Requirements (install once):
REM    - Java JDK 17   (winget install --id Microsoft.OpenJDK.17 --scope user)
REM    - Android SDK   (with build-tools, cmdline-tools, platforms)
REM    - Bubblewrap    (npm install -g @bubblewrap/cli)
REM  Output: apk\<app>\app-release-signed.apk
REM          apk\release\*.apk (nice names, ready to share)
REM ============================================================
setlocal enabledelayedexpansion
set "BASE=%~dp0"
set "JAVA_HOME=C:\Users\Administrator\AppData\Local\Programs\Microsoft\jdk-17.0.10.7-hotspot"
set "ANDROID_HOME=C:\Users\Administrator\AppData\Local\Android\Sdk"
set "BUBBLEWRAP_KEYSTORE_PASSWORD=zapnow123"
set "BUBBLEWRAP_KEY_PASSWORD=zapnow123"

echo === [1/5] Create signing keys (if missing) ===
for %%A in (customer partner rider admin) do (
  if not exist "%BASE%apk\%%A\android-keystore" (
    echo   Creating keystore for %%A ...
    "%JAVA_HOME%\bin\keytool.exe" -genkeypair -keystore "%BASE%apk\%%A\android-keystore" -alias android -keyalg RSA -keysize 2048 -validity 10000 -storepass zapnow123 -keypass zapnow123 -dname "CN=ZapNowApp, OU=Dev, O=ZapNow, C=TH" >nul
    if errorlevel 1 goto :err
  ) else (
    echo   Keystore for %%A already exists (skip).
  )
)

echo === [2/5] Generate TWA projects (if missing) ===
if not exist "%BASE%apk\customer\twa-manifest.json" (
  node "%BASE%scripts\generate-twa.js"
  if errorlevel 1 goto :err
) else (
  echo   TWA projects already exist (skip).
)

echo === [3/5] Build APK for all 4 apps ===
for %%A in (customer partner rider admin) do (
  echo.
  echo   --- Building %%A ---
  pushd "%BASE%apk\%%A"
  echo   Compiling with Gradle...
  call .\gradlew.bat assembleRelease --no-daemon --stacktrace
  if errorlevel 1 (
    popd
    goto :err
  )
  echo   Signing APK with Bubblewrap...
  call bubblewrap build --manifest="%BASE%apk\%%A\twa-manifest.json" --directory="%BASE%apk\%%A" --skipPwaValidation
  set "BUILD_ERR=!errorlevel!"
  popd
  if not "!BUILD_ERR!"=="0" goto :err
)

echo === [4/5] Copy APKs to apk\release with nice names ===
mkdir "%BASE%apk\release" 2>nul
copy /Y "%BASE%apk\customer\app-release-signed.apk" "%BASE%apk\release\ZapNow-Customer.apk" >nul
copy /Y "%BASE%apk\partner\app-release-signed.apk" "%BASE%apk\release\Sangkha-Partner.apk" >nul
copy /Y "%BASE%apk\rider\app-release-signed.apk" "%BASE%apk\release\Sangkha-Rider.apk" >nul
copy /Y "%BASE%apk\admin\app-release-signed.apk" "%BASE%apk\release\ZapNow-Admin.apk" >nul

echo.
echo === [5/5] DONE! APKs are in: %BASE%apk\release\ ===
dir "%BASE%apk\release"
echo.
echo Install on your phone: copy the .apk file and open it (allow "install unknown apps").
pause
exit /b 0

:err
echo.
echo [X] Build failed. Check the error above.
pause
exit /b 1
