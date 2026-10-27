[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js não foi encontrado. Instale a versão LTS em https://nodejs.org/ e execute novamente."
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm não foi encontrado. Reinstale o Node.js LTS com o npm habilitado."
}

Write-Host "Node.js: $(node --version)" -ForegroundColor DarkGray
Write-Host "npm:     $(npm --version)" -ForegroundColor DarkGray
Write-Host "Instalando a CLI oficial @webos-tools/cli 3.2.6 somente nesta pasta..." -ForegroundColor Cyan
npm ci --ignore-scripts
if ($LASTEXITCODE -ne 0) { throw "A instalação da CLI falhou (código $LASTEXITCODE)." }

npx --no-install ares-config --profile tv
if ($LASTEXITCODE -ne 0) { throw "Não foi possível selecionar o perfil webOS TV." }

Write-Host ""
Write-Host "CLI oficial preparada com sucesso." -ForegroundColor Green
npx --no-install ares -V

