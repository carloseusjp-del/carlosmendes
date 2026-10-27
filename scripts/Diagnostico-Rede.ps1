[CmdletBinding()]
param(
    [string]$SalvarEm = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Test-IPv4Privado {
    param([Parameter(Mandatory)][string]$Endereco)

    $partes = $Endereco.Split('.')
    if ($partes.Count -ne 4) { return $false }
    $a = [int]$partes[0]
    $b = [int]$partes[1]
    return ($a -eq 10) -or ($a -eq 192 -and $b -eq 168) -or ($a -eq 172 -and $b -ge 16 -and $b -le 31)
}

$interfaces = Get-NetIPConfiguration | Where-Object {
    $_.NetAdapter.Status -eq "Up" -and
    $_.IPv4DefaultGateway -and
    $_.IPv4Address
}

$resultado = foreach ($item in $interfaces) {
    $ipInterface = Get-NetIPInterface -InterfaceIndex $item.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue
    foreach ($endereco in $item.IPv4Address) {
        if ($endereco.IPAddress -like "169.254.*") { continue }

        [PSCustomObject]@{
            Interface       = $item.InterfaceAlias
            Descricao       = $item.InterfaceDescription
            IPv4            = $endereco.IPAddress
            Prefixo         = $endereco.PrefixLength
            Gateway         = ($item.IPv4DefaultGateway.NextHop -join ", ")
            DNS             = ($item.DNSServer.ServerAddresses -join ", ")
            Metrica         = if ($ipInterface) { [int]$ipInterface.InterfaceMetric } else { 9999 }
            IPv4Privado     = Test-IPv4Privado -Endereco $endereco.IPAddress
            ProvavelVirtual = [bool]($item.InterfaceDescription -match "Virtual|VPN|Hyper-V|VMware|VirtualBox|WSL|TAP|TUN")
        }
    }
}

if (-not $resultado) {
    throw "Nenhuma interface IPv4 ativa com gateway padrão foi encontrada. Conecte o computador à mesma rede da TV e tente novamente."
}

$ordenado = @($resultado | Sort-Object @{Expression = "ProvavelVirtual"; Ascending = $true}, @{Expression = "IPv4Privado"; Descending = $true}, @{Expression = "Metrica"; Ascending = $true})
$recomendada = $ordenado[0]

Write-Host ""
Write-Host "Diagnóstico de rede — LG webOS" -ForegroundColor Cyan
Write-Host "Este diagnóstico não altera o computador nem a TV." -ForegroundColor DarkGray
Write-Host ""
$ordenado | Format-Table Interface, IPv4, Prefixo, Gateway, Metrica, ProvavelVirtual -AutoSize
Write-Host "Interface recomendada: $($recomendada.Interface)" -ForegroundColor Green
Write-Host "IPv4 do computador:     $($recomendada.IPv4)" -ForegroundColor Green
Write-Host "Gateway:                 $($recomendada.Gateway)" -ForegroundColor Green
Write-Host ""
Write-Host "A TV deve estar conectada à mesma rede e possuir um IPv4 privado semelhante." -ForegroundColor Yellow

$relatorio = [PSCustomObject]@{
    GeradoEm = (Get-Date).ToString("o")
    Computador = $env:COMPUTERNAME
    Recomendada = $recomendada
    Interfaces = $ordenado
}

if ($SalvarEm) {
    $pasta = Split-Path -Parent $SalvarEm
    if ($pasta -and -not (Test-Path $pasta)) {
        New-Item -ItemType Directory -Path $pasta -Force | Out-Null
    }
    $relatorio | ConvertTo-Json -Depth 5 | Set-Content -Path $SalvarEm -Encoding UTF8
    Write-Host "Relatório salvo em: $SalvarEm" -ForegroundColor DarkGray
}

