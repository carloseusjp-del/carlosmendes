@echo off
setlocal
cd /d "%~dp0"
set /p TV_IP=Digite o IPv4 mostrado na TV: 
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File ".\scripts\Conectar-DeveloperMode.ps1" -TvIp "%TV_IP%"
echo.
pause
endlocal
