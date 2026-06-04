param(
    [ValidateSet("base", "next", "future", "all")]
    [string]$Set = "next",

    [string]$OutputDir = "D:\CRM\Exports",

    [string]$ConnectionString = $env:CRM_1C_CONNECTION_STRING,

    [string]$Server = $(if ([string]::IsNullOrWhiteSpace($env:CRM_1C_SERVER)) { "192.168.0.5" } else { $env:CRM_1C_SERVER }),

    [string]$Ref = $(if ([string]::IsNullOrWhiteSpace($env:CRM_1C_REF)) { "elista" } else { $env:CRM_1C_REF }),

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

if (-not $PSBoundParameters.ContainsKey("ConnectionString") -and ($PSBoundParameters.ContainsKey("Server") -or $PSBoundParameters.ContainsKey("Ref"))) {
    $ConnectionString = ""
}

if ([string]::IsNullOrWhiteSpace($ConnectionString)) {
    $ConnectionString = "Srvr=`"$Server`";Ref=`"$Ref`";"
    Write-Host "CRM_1C_CONNECTION_STRING is empty. Using no-login connection string: Srvr=`"$Server`";Ref=`"$Ref`";"
}

if ($ConnectionString -match 'Usr\s*=\s*"?USER"?' -or $ConnectionString -match 'Pwd\s*=\s*"?PASSWORD"?') {
    throw "CRM_1C_CONNECTION_STRING still contains placeholder USER/PASSWORD. Use no-login string such as: Srvr=`"$Server`";Ref=`"$Ref`";"
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
    "Server: $Server"
    "Ref: $Ref"
    "VBS: $VbsPath"
    "RuntimeVBS: $runtimeVbsPath"
    "Summary: $summaryPath"
) | Out-File -FilePath $runnerLogPath -Encoding UTF8 -Append

Write-Host "Starting 1C catalog export"
Write-Host "Set: $Set"
Write-Host "OutputDir: $OutputDir"
Write-Host "Server: $Server"
Write-Host "Ref: $Ref"
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
