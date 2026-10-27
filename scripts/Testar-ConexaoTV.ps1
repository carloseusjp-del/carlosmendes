[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateScript({
        $valor = $null
        [System.Net.IPAddress]::TryParse($_, [ref]$valor) -and $valor.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork
    })]
    [string]$TvIp
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Teste de comunicação com LG webOS" -ForegroundColor Cyan
Write-Host "Destino: $TvIp" -ForegroundColor DarkGray
Write-Host "Este teste é somente leitura e não altera a TV." -ForegroundColor DarkGray
Write-Host ""

$pingOk = Test-Connection -ComputerName $TvIp -Count 2 -Quiet -ErrorAction SilentlyContinue
if ($pingOk) {
    Write-Host "[OK] A TV respondeu ao teste de rede." -ForegroundColor Green
} else {
    Write-Host "[AVISO] Sem resposta ao ping. Algumas redes ou TVs bloqueiam ping; isso não prova que a conexão falhou." -ForegroundColor Yellow
}

$portaSsh = Test-NetConnection -ComputerName $TvIp -Port 9922 -InformationLevel Detailed -WarningAction SilentlyContinue
if ($portaSsh.TcpTestSucceeded) {
    Write-Host "[OK] Porta 9922 acessível. O serviço de desenvolvimento está disponível." -ForegroundColor Green
} else {
    Write-Host "[PENDENTE] Porta 9922 fechada ou inacessível." -ForegroundColor Yellow
    Write-Host "Confirme na TV: Developer Mode Status = ON." -ForegroundColor Yellow
}

$portaChave = Test-NetConnection -ComputerName $TvIp -Port 9991 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($portaChave) {
    Write-Host "[OK] Porta 9991 acessível. O Key Server está disponível para o pareamento." -ForegroundColor Green
} else {
    Write-Host "[PENDENTE] Porta 9991 fechada ou inacessível. Confirme Key Server = ON." -ForegroundColor Yellow
}

$proximoSalto = if ($portaSsh.NetRoute) { $portaSsh.NetRoute.NextHop } else { $null }
[PSCustomObject]@{
    TvIp = $TvIp
    Ping = $pingOk
    Porta9922 = [bool]$portaSsh.TcpTestSucceeded
    Porta9991 = [bool]$portaChave
    InterfaceOrigem = $portaSsh.InterfaceAlias
    IPv4Origem = $portaSsh.SourceAddress
    ProximoSalto = $proximoSalto
} | Format-List

