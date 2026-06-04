param(
    [string]$OutputDir = "D:\CRM\Exports",
    [string]$ConnectionString = $env:CRM_1C_CONNECTION_STRING,
    [string]$Server = $(if ([string]::IsNullOrWhiteSpace($env:CRM_1C_SERVER)) { "192.168.0.5" } else { $env:CRM_1C_SERVER }),
    [string]$Ref = $(if ([string]::IsNullOrWhiteSpace($env:CRM_1C_REF)) { "elista" } else { $env:CRM_1C_REF }),
    [string[]]$CatalogSets = @("base", "next", "future"),
    [string]$OperationalSet = "all"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$catalogScript = Join-Path $scriptDir "export-1c-catalogs.ps1"
$operationalScript = Join-Path $scriptDir "export-1c-operational-data.ps1"
$logPath = Join-Path $OutputDir "run_1c_export_now.log"

if (-not $PSBoundParameters.ContainsKey("ConnectionString") -and ($PSBoundParameters.ContainsKey("Server") -or $PSBoundParameters.ContainsKey("Ref"))) {
    $ConnectionString = ""
}

if ([string]::IsNullOrWhiteSpace($ConnectionString)) {
    $ConnectionString = "Srvr=`"$Server`";Ref=`"$Ref`";"
}

New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

function Write-ExportLog {
    param([string]$Message)
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Message"
    $line | Tee-Object -FilePath $logPath -Append
}

Write-ExportLog "Starting 1C export now. OutputDir=$OutputDir"
Write-ExportLog "Server=$Server Ref=$Ref"
Write-ExportLog "Connection string uses no explicit 1C user/password."

foreach ($catalogSet in $CatalogSets) {
    Write-ExportLog "Starting catalog export set=$catalogSet"
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $catalogScript -Set $catalogSet -OutputDir $OutputDir -ConnectionString $ConnectionString -Server $Server -Ref $Ref
    if ($LASTEXITCODE -ne 0) {
        throw "Catalog export failed. Set=$catalogSet ExitCode=$LASTEXITCODE"
    }
    Write-ExportLog "Finished catalog export set=$catalogSet"
}

Write-ExportLog "Starting operational export set=$OperationalSet"
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $operationalScript -Set $OperationalSet -OutputDir $OutputDir -ConnectionString $ConnectionString -Server $Server -Ref $Ref
if ($LASTEXITCODE -ne 0) {
    throw "Operational export failed. Set=$OperationalSet ExitCode=$LASTEXITCODE"
}
Write-ExportLog "Finished operational export set=$OperationalSet"

Write-ExportLog "1C export now completed."
