@echo off
setlocal
title Mendes Home 0.2.1 - Instalador

set "SCRIPT=%~dp0scripts\Instalar-MendesHome-0.2.1.ps1"

if not exist "%SCRIPT%" (
  echo ERRO: script nao encontrado:
  echo %SCRIPT%
  echo.
  echo Mantenha este arquivo CMD junto da pasta scripts do projeto.
  pause
  exit /b 1
)

set "ACTION="
if /I "%~1"=="/remover" set "ACTION=-Remover"

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%" %ACTION%
set "RESULT=%ERRORLEVEL%"

echo.
if not "%RESULT%"=="0" (
  echo O procedimento terminou com erro. Leia a mensagem acima.
) else (
  echo Procedimento concluido.
)

echo.
echo Para remover depois, execute:
echo   INSTALAR-MENDES-HOME-0.2.1.cmd /remover
echo.
pause
exit /b %RESULT%
