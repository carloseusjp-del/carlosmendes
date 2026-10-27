@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File ".\scripts\Diagnostico-Rede.ps1" -SalvarEm ".\reports\rede.json"
echo.
pause
endlocal
