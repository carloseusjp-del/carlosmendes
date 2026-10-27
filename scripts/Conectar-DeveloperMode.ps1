[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateScript({
        $valor = $null
        [System.Net.IPAddress]::TryParse($_, [ref]$valor) -and $valor.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork
    })]
    [string]$TvIp,

    [ValidatePattern('^[A-Za-z0-9_-]+$')]
    [string]$Nome = "lg-sala"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz

if (-not (Test-Path ".\node_modules\.bin\ares-config.cmd")) {
    throw "A CLI ainda não foi instalada. Execute primeiro .\scripts\Configurar-CLI.ps1."
}

Write-Host "Preparação do pareamento oficial LG webOS" -ForegroundColor Cyan
Write-Host "TV: $TvIp | nome local: $Nome" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Confirme na TV antes de continuar:" -ForegroundColor Yellow
Write-Host "  1. Developer Mode Status = ON"
Write-Host "  2. Key Server = ON"
Write-Host "  3. A senha de seis caracteres está visível na tela"
Write-Host ""
$confirmacao = Read-Host "Digite PAREAR para autorizar o registro local e solicitar a chave da TV"
if ($confirmacao -cne "PAREAR") {
    Write-Host "Operação cancelada; nenhuma configuração foi criada." -ForegroundColor Yellow
    exit 0
}

$testeSsh = Test-NetConnection -ComputerName $TvIp -Port 9922 -InformationLevel Quiet -WarningAction SilentlyContinue
if (-not $testeSsh) {
    throw "A porta 9922 não está acessível. Verifique o IP, a rede, o Developer Mode e o Key Server."
}
$testeChave = Test-NetConnection -ComputerName $TvIp -Port 9991 -InformationLevel Quiet -WarningAction SilentlyContinue
if (-not $testeChave) {
    throw "A porta 9991 não está acessível. Ligue o Key Server no aplicativo Developer Mode."
}

& npx --no-install ares-config --profile tv
if ($LASTEXITCODE -ne 0) { throw "Não foi possível selecionar o perfil webOS TV." }

& npx --no-install ares-setup-device --add $Nome --info "username=prisoner" --info "host=$TvIp" --info "port=9922"
if ($LASTEXITCODE -ne 0) {
    throw "Não foi possível registrar a TV. Se o nome '$Nome' já existir, remova o registro antigo com o script Desfazer-Pareamento.ps1."
}

Write-Host ""
Write-Host "Digite no próximo prompt a senha exibida pelo aplicativo Developer Mode da TV." -ForegroundColor Cyan
& npx --no-install ares-novacom --device $Nome --getkey
if ($LASTEXITCODE -ne 0) { throw "A obtenção da chave falhou. Confirme a senha e mantenha o Key Server ligado." }

Write-Host ""
Write-Host "Verificando comunicação e lendo somente as informações públicas do sistema..." -ForegroundColor Cyan
& npx --no-install ares-device --system-info --device $Nome
if ($LASTEXITCODE -ne 0) { throw "A chave foi solicitada, mas a verificação final falhou." }

Write-Host ""
Write-Host "Pareamento concluído." -ForegroundColor Green

