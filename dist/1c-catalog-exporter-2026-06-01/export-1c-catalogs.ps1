param(
    [ValidateSet("base", "next", "future", "all")]
    [string]$Set = "next",

    [string]$OutputDir = "D:\CRM\Exports",

    [string]$ConnectionString = $env:CRM_1C_CONNECTION_STRING,

    [string]$CscriptPath = "$env:WINDIR\System32\cscript.exe"
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$VbsPath = Join-Path $ScriptDir "export-1c-catalogs.vbs"

if (-not (Test-Path -LiteralPath $VbsPath)) {
    throw "VBS exporter not found: $VbsPath"
}

if (-not (Test-Path -LiteralPath $CscriptPath)) {
    throw "cscript.exe not found: $CscriptPath"
}

if ([string]::IsNullOrWhiteSpace($ConnectionString)) {
    throw @"
CRM_1C_CONNECTION_STRING is empty.
Set it in the current PowerShell session before running this script.

Example for server 1C base:
`$env:CRM_1C_CONNECTION_STRING = 'Srvr="192.168.0.5";Ref="elista";Usr="<1C_USER>";Pwd="<1C_PASSWORD>";'

Do not commit real 1C credentials to Git.
"@
}

if ($ConnectionString -match 'Usr\s*=\s*"?USER"?' -or $ConnectionString -match 'Pwd\s*=\s*"?PASSWORD"?') {
    throw "CRM_1C_CONNECTION_STRING still contains placeholder USER/PASSWORD. Replace them with real 1C credentials in this PowerShell session."
}

New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

$summaryPath = Join-Path $OutputDir "export_1c_catalogs_summary.csv"
$runnerLogPath = Join-Path $OutputDir "export_1c_catalogs_runner.log"
$runtimeVbsPath = Join-Path $OutputDir "export-1c-catalogs.runtime.vbs"

Get-Content -LiteralPath $VbsPath -Encoding UTF8 |
    Set-Content -LiteralPath $runtimeVbsPath -Encoding Unicode

@(
    "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') Starting export wrapper"
    "Set: $Set"
    "OutputDir: $OutputDir"
    "VBS: $VbsPath"
    "RuntimeVBS: $runtimeVbsPath"
    "Summary: $summaryPath"
) | Out-File -FilePath $runnerLogPath -Encoding UTF8 -Append

Write-Host "Starting 1C catalog export"
Write-Host "Set: $Set"
Write-Host "OutputDir: $OutputDir"
Write-Host "Runtime VBS: $runtimeVbsPath"
Write-Host "Summary will be: $summaryPath"

$previousConnectionString = $env:CRM_1C_CONNECTION_STRING
$env:CRM_1C_CONNECTION_STRING = $ConnectionString

try {
    & $CscriptPath //nologo $runtimeVbsPath "/out:$OutputDir" "/set:$Set"
    if ($LASTEXITCODE -ne 0) {
        throw "1C catalog export failed with exit code $LASTEXITCODE"
    }

    if (-not (Test-Path -LiteralPath $summaryPath)) {
        throw "1C catalog export finished, but summary file was not created: $summaryPath"
    }

    Write-Host "Export finished. Summary: $summaryPath"
    "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') Export finished. Summary: $summaryPath" |
        Out-File -FilePath $runnerLogPath -Encoding UTF8 -Append
}
finally {
    $env:CRM_1C_CONNECTION_STRING = $previousConnectionString
}
