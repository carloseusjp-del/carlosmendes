[CmdletBinding()]
param(
    [switch]$Remover
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$AppId = "com.carlosmendes.mendeshome"
$Version = "0.2.1"
$Device = "lg-sala"
$ExpectedHash = "D6EBF7DDCBA9D80C9D5125935767734A5283D68867DC6ADBA15BA845B3F096AB"
$PackageName = "com.carlosmendes.mendeshome_0.2.1_all.ipk"
$PackageUrl = "https://github.com/carloseusjp-del/carlosmendes/raw/refs/heads/mendes-home-webos/dist/$PackageName"
$ProjectDirectory = Join-Path $env:USERPROFILE "Documents\LGWebOSLauncher"
$DownloadDirectory = Join-Path $env:TEMP "MendesHome"
$PackagePath = Join-Path $DownloadDirectory $PackageName

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Invoke-Cli {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,

        [Parameter(Mandatory = $true)]
        [string]$Description,

        [switch]$AllowFailure
    )

    Write-Step $Description
    & $script:NpxPath @Arguments
    $exitCode = $LASTEXITCODE

    if ($exitCode -ne 0) {
        if ($AllowFailure) {
            Write-Warning "O comando terminou com codigo $exitCode. O procedimento continuara."
            return
        }

        throw "Falha em '$Description' (codigo $exitCode)."
    }

}

function Confirm-Action {
    param(
        [string]$Prompt,
        [string]$Expected
    )

    $answer = (Read-Host $Prompt).Trim()
    return $answer -ceq $Expected
}

function Show-Restoration {
    Write-Host ""
    Write-Host "Para desfazer a instalacao:" -ForegroundColor Yellow
    Write-Host "  Set-Location `"$ProjectDirectory`""
    Write-Host "  npx --no-install ares-launch -c $AppId -d $Device"
    Write-Host "  npx --no-install ares-install -r $AppId -d $Device"
    Write-Host ""
    Write-Host "A remocao apaga somente o Mendes Home e seus dados locais."
    Write-Host "Ela nao altera firmware, Home da LG ou aplicativos do sistema."
}

function Resolve-Prerequisites {
    if (-not (Test-Path -LiteralPath $ProjectDirectory -PathType Container)) {
        throw "Pasta da CLI nao encontrada: $ProjectDirectory"
    }

    $nodeCommand = Get-Command "node.exe" -ErrorAction SilentlyContinue
    if (-not $nodeCommand) {
        $nodeCommand = Get-Command "node" -ErrorAction SilentlyContinue
    }
    if (-not $nodeCommand) {
        throw "Node.js nao foi encontrado no PATH."
    }

    $npxCommand = Get-Command "npx.cmd" -ErrorAction SilentlyContinue
    if (-not $npxCommand) {
        $npxCommand = Get-Command "npx" -ErrorAction SilentlyContinue
    }
    if (-not $npxCommand) {
        throw "npx nao foi encontrado no PATH."
    }

    $script:NpxPath = $npxCommand.Path
}

function Download-And-ValidatePackage {
    Write-Step "Baixando Mendes Home $Version"
    New-Item -ItemType Directory -Path $DownloadDirectory -Force | Out-Null

    try {
        [Net.ServicePointManager]::SecurityProtocol =
            [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    }
    catch {
        # PowerShell moderno ja seleciona TLS automaticamente.
    }

    Invoke-WebRequest -Uri $PackageUrl -OutFile $PackagePath -UseBasicParsing

    if (-not (Test-Path -LiteralPath $PackagePath -PathType Leaf)) {
        throw "O download nao criou o arquivo IPK esperado."
    }

    Write-Step "Validando SHA-256"
    $actualHash = (Get-FileHash -LiteralPath $PackagePath -Algorithm SHA256).Hash.ToUpperInvariant()
    Write-Host "SHA-256 recebido: $actualHash"

    if ($actualHash -ne $ExpectedHash) {
        Remove-Item -LiteralPath $PackagePath -Force -ErrorAction SilentlyContinue
        throw "SHA-256 divergente. O arquivo foi descartado e nada foi instalado."
    }

    Write-Host "Pacote autentico e integro." -ForegroundColor Green
}

function Remove-MendesHome {
    if (-not (Confirm-Action -Prompt "Digite REMOVER para desinstalar somente o Mendes Home" -Expected "REMOVER")) {
        Write-Host "Remocao cancelada."
        return
    }

    Invoke-Cli -Arguments @("--no-install", "ares-launch", "-c", $AppId, "-d", $Device) `
        -Description "Fechando Mendes Home" -AllowFailure

    Invoke-Cli -Arguments @("--no-install", "ares-install", "-r", $AppId, "-d", $Device) `
        -Description "Removendo Mendes Home"

    Write-Host ""
    Write-Host "Mendes Home removido. A Home original da LG foi preservada." -ForegroundColor Green
}

function Install-MendesHome {
    Download-And-ValidatePackage

    Invoke-Cli -Arguments @("--no-install", "ares-install", $PackagePath, "-d", $Device) `
        -Description "Instalando Mendes Home $Version"

    Invoke-Cli -Arguments @("--no-install", "ares-launch", $AppId, "-d", $Device) `
        -Description "Abrindo Mendes Home"

    Write-Host ""
    Write-Host "Mendes Home $Version instalado e aberto com sucesso." -ForegroundColor Green
    Write-Host "O botao Home continua abrindo a interface original da LG."
    Show-Restoration
}

function Main {
    Write-Host "Mendes Home $Version - instalador oficial Developer Mode" -ForegroundColor White
    Write-Host "Dispositivo: $Device | Aplicativo: $AppId"
    Write-Host "Sem root, firmware ou remocao de componentes do sistema."

    Resolve-Prerequisites

    Push-Location $ProjectDirectory
    try {
        Invoke-Cli -Arguments @("--no-install", "ares-device", "-i", "-d", $Device) `
            -Description "Verificando conexao e informacoes da TV"

        if ($Remover) {
            Remove-MendesHome
        }
        else {
            Install-MendesHome
        }
    }
    finally {
        Pop-Location
    }
}

try {
    Main
    exit 0
}
catch {
    Write-Host ""
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Nada relacionado a firmware, root ou aplicativos do sistema foi executado."
    Show-Restoration
    exit 1
}
