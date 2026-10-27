[CmdletBinding()]
param(
    [ValidatePattern('^[A-Za-z0-9_-]+$')]
    [string]$Nome = "lg-sala"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz

if (-not (Test-Path ".\node_modules\.bin\ares-setup-device.cmd")) {
    throw "A CLI local não está instalada nesta pasta."
}

Write-Host "Isto removerá o registro '$Nome' da CLI no computador." -ForegroundColor Yellow
Write-Host "O firmware e os aplicativos da TV não serão alterados." -ForegroundColor DarkGray
$confirmacao = Read-Host "Digite REMOVER para continuar"
if ($confirmacao -cne "REMOVER") {
    Write-Host "Operação cancelada." -ForegroundColor Yellow
    exit 0
}

& npx --no-install ares-setup-device --remove $Nome
if ($LASTEXITCODE -ne 0) { throw "Não foi possível remover o registro '$Nome'." }
Write-Host "Registro local removido." -ForegroundColor Green

$arquivoChave = Join-Path $env:USERPROFILE ".ssh\$($Nome)_webos"
if (Test-Path -LiteralPath $arquivoChave) {
    Write-Host "A chave privada criada pelo pareamento continua em: $arquivoChave" -ForegroundColor Yellow
    $removerChave = Read-Host "Digite APAGAR para removê-la, ou pressione Enter para mantê-la"
    if ($removerChave -ceq "APAGAR") {
        Remove-Item -LiteralPath $arquivoChave -Force
        Write-Host "Chave local removida." -ForegroundColor Green
    }
}

