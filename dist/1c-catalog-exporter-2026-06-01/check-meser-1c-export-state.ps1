param(
    [string]$ExportDir = "D:\CRM\Exports",
    [string]$RepoDir = "D:\Codex\CRM\SQL",
    [string]$ReportPath = ""
)

$ErrorActionPreference = "Continue"

if ([string]::IsNullOrWhiteSpace($ReportPath)) {
    $ReportPath = Join-Path $ExportDir "meser_1c_export_state.txt"
}

$expectedBaseCsv = @(
    "1c_units.csv",
    "1c_counterparties.csv",
    "1c_counterparty_contracts.csv",
    "1c_product_groups.csv",
    "1c_organizations.csv",
    "1c_currencies.csv",
    "1c_price_types.csv",
    "1c_product_series.csv"
)

$expectedNextCsv = @(
    "1c_product_characteristics.csv",
    "1c_warehouses.csv",
    "1c_product_kinds.csv",
    "1c_unit_classifier.csv",
    "1c_organization_units.csv",
    "1c_persons.csv",
    "1c_contact_info_types.csv",
    "1c_bank_accounts.csv"
)

$expectedFutureCsv = @(
    "1c_manufacturers.csv",
    "1c_countries.csv"
)

$expectedOperationalCsv = @(
    "1c_stock_balances.csv",
    "1c_reserved_stock_balances.csv",
    "1c_counterparty_settlements.csv"
)

$requiredScripts = @(
    "export-1c-catalogs.ps1",
    "export-1c-catalogs.vbs",
    "export-1c-operational-data.ps1",
    "export-1c-operational-data.vbs"
)

function Write-Line {
    param([string]$Text = "")
    $Text | Tee-Object -FilePath $ReportPath -Append
}

function Write-Header {
    param([string]$Text)
    Write-Line ""
    Write-Line "==== $Text ===="
}

function Test-ComObject {
    param([string]$ProgId)

    try {
        $object = New-Object -ComObject $ProgId -ErrorAction Stop
        [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($object)
        return "OK"
    }
    catch {
        return "FAIL: $($_.Exception.Message)"
    }
}

function Test-ExpectedFile {
    param(
        [string]$BaseDir,
        [string]$Name
    )

    $path = Join-Path $BaseDir $Name
    if (Test-Path -LiteralPath $path) {
        $item = Get-Item -LiteralPath $path
        [pscustomobject]@{
            Name = $Name
            Exists = "YES"
            Length = $item.Length
            LastWriteTime = $item.LastWriteTime
        }
    }
    else {
        [pscustomobject]@{
            Name = $Name
            Exists = "NO"
            Length = ""
            LastWriteTime = ""
        }
    }
}

function Format-ConnectionStringState {
    $value = $env:CRM_1C_CONNECTION_STRING
    if ([string]::IsNullOrWhiteSpace($value)) {
        return "MISSING"
    }

    $hasPlaceholders = $value -match 'Usr\s*=\s*"?USER"?' -or
        $value -match 'Pwd\s*=\s*"?PASSWORD"?' -or
        $value -match '<1C_USER>' -or
        $value -match '<1C_PASSWORD>'

    if ($hasPlaceholders) {
        return "SET BUT HAS PLACEHOLDERS"
    }

    return "SET WITHOUT PLACEHOLDERS"
}

try {
    $reportDir = Split-Path -Parent $ReportPath
    if (-not [string]::IsNullOrWhiteSpace($reportDir) -and -not (Test-Path -LiteralPath $reportDir)) {
        New-Item -ItemType Directory -Path $reportDir -Force -ErrorAction Stop | Out-Null
    }

    Set-Content -Path $ReportPath -Value "" -Encoding UTF8 -ErrorAction Stop
}
catch {
    $fallbackReportPath = Join-Path $env:TEMP "meser_1c_export_state.txt"
    Set-Content -Path $fallbackReportPath -Value "" -Encoding UTF8
    $ReportPath = $fallbackReportPath
    Write-Line "WARNING: cannot write report to requested path. Using fallback report path: $ReportPath"
    Write-Line "Original error: $($_.Exception.Message)"
}

Write-Header "MESER 1C EXPORT STATE"
Write-Line "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Line "ComputerName: $env:COMPUTERNAME"
Write-Line "User: $env:USERDOMAIN\$env:USERNAME"
Write-Line "CurrentDirectory: $(Get-Location)"
Write-Line "ExportDir: $ExportDir"
Write-Line "RepoDir: $RepoDir"
Write-Line "ReportPath: $ReportPath"

Write-Header "BASIC PATHS"
foreach ($path in @("D:\CRM", $ExportDir, $RepoDir, (Join-Path $RepoDir "scripts\windows"))) {
    $exists = Test-Path -LiteralPath $path
    Write-Line "$path => $exists"
}

Write-Header "POWERSHELL AND CSCRIPT"
Write-Line "PowerShellVersion: $($PSVersionTable.PSVersion)"
Write-Line "ExecutionPolicy Process: $(Get-ExecutionPolicy -Scope Process)"
Write-Line "ExecutionPolicy CurrentUser: $(Get-ExecutionPolicy -Scope CurrentUser)"
Write-Line "ExecutionPolicy LocalMachine: $(Get-ExecutionPolicy -Scope LocalMachine)"
$cscript = Join-Path $env:WINDIR "System32\cscript.exe"
Write-Line "cscript.exe: $cscript => $(Test-Path -LiteralPath $cscript)"

Write-Header "1C COM CONNECTOR"
Write-Line "V83.COMConnector => $(Test-ComObject 'V83.COMConnector')"
Write-Line "V82.COMConnector => $(Test-ComObject 'V82.COMConnector')"

Write-Header "CONNECTION STRING"
Write-Line "CRM_1C_CONNECTION_STRING => $(Format-ConnectionStringState)"
Write-Line "Value is intentionally not printed because it can contain credentials."

Write-Header "EXPORTER FILES IN EXPORT DIR"
$requiredScripts | ForEach-Object { Test-ExpectedFile -BaseDir $ExportDir -Name $_ } |
    Format-Table -AutoSize | Out-String | ForEach-Object { Write-Line $_.TrimEnd() }

Write-Header "EXPORTER FILES IN REPO DIR"
$repoScriptsDir = Join-Path $RepoDir "scripts\windows"
$requiredScripts | ForEach-Object { Test-ExpectedFile -BaseDir $repoScriptsDir -Name $_ } |
    Format-Table -AutoSize | Out-String | ForEach-Object { Write-Line $_.TrimEnd() }

Write-Header "EXPECTED BASE CSV"
$expectedBaseCsv | ForEach-Object { Test-ExpectedFile -BaseDir $ExportDir -Name $_ } |
    Format-Table -AutoSize | Out-String | ForEach-Object { Write-Line $_.TrimEnd() }

Write-Header "EXPECTED NEXT CSV"
$expectedNextCsv | ForEach-Object { Test-ExpectedFile -BaseDir $ExportDir -Name $_ } |
    Format-Table -AutoSize | Out-String | ForEach-Object { Write-Line $_.TrimEnd() }

Write-Header "EXPECTED FUTURE OPTIONAL CSV"
$expectedFutureCsv | ForEach-Object { Test-ExpectedFile -BaseDir $ExportDir -Name $_ } |
    Format-Table -AutoSize | Out-String | ForEach-Object { Write-Line $_.TrimEnd() }

Write-Header "EXPECTED OPERATIONAL CSV"
$expectedOperationalCsv | ForEach-Object { Test-ExpectedFile -BaseDir $ExportDir -Name $_ } |
    Format-Table -AutoSize | Out-String | ForEach-Object { Write-Line $_.TrimEnd() }

Write-Header "ALL CSV IN EXPORT DIR"
Get-ChildItem -LiteralPath $ExportDir -Filter "*.csv" -ErrorAction SilentlyContinue |
    Sort-Object Name |
    Select-Object Name, Length, LastWriteTime |
    Format-Table -AutoSize | Out-String | ForEach-Object { Write-Line $_.TrimEnd() }

Write-Header "SUMMARY AND LOG FILES"
$logFiles = @(
    "export_1c_catalogs_summary.csv",
    "export_1c_catalogs.log",
    "export_1c_catalogs_runner.log",
    "export_1c_operational_summary.csv",
    "export_1c_operational.log",
    "export_1c_operational_runner.log"
)

$logFiles | ForEach-Object { Test-ExpectedFile -BaseDir $ExportDir -Name $_ } |
    Format-Table -AutoSize | Out-String | ForEach-Object { Write-Line $_.TrimEnd() }

foreach ($logFile in $logFiles) {
    $path = Join-Path $ExportDir $logFile
    if (Test-Path -LiteralPath $path) {
        Write-Header "TAIL $logFile"
        Get-Content -LiteralPath $path -Tail 30 -ErrorAction SilentlyContinue |
            ForEach-Object { Write-Line $_ }
    }
}

Write-Header "HTTP EXPORT PORT 8090"
try {
    Get-NetTCPConnection -LocalPort 8090 -ErrorAction Stop |
        Select-Object LocalAddress, LocalPort, State, OwningProcess |
        Format-Table -AutoSize | Out-String | ForEach-Object { Write-Line $_.TrimEnd() }
}
catch {
    Write-Line "No Get-NetTCPConnection result for local port 8090: $($_.Exception.Message)"
}

Write-Header "BLOCKERS"
$blockers = New-Object System.Collections.Generic.List[string]

if (-not (Test-Path -LiteralPath (Join-Path $ExportDir "export-1c-catalogs.ps1"))) {
    $blockers.Add("Missing $ExportDir\export-1c-catalogs.ps1")
}

if (-not (Test-Path -LiteralPath (Join-Path $ExportDir "export-1c-catalogs.vbs"))) {
    $blockers.Add("Missing $ExportDir\export-1c-catalogs.vbs")
}

if ((Format-ConnectionStringState) -ne "SET WITHOUT PLACEHOLDERS") {
    $blockers.Add("CRM_1C_CONNECTION_STRING is missing or still has placeholders")
}

if ((Test-ComObject "V83.COMConnector") -like "FAIL*" -and (Test-ComObject "V82.COMConnector") -like "FAIL*") {
    $blockers.Add("No 1C COMConnector is available")
}

if ($blockers.Count -eq 0) {
    Write-Line "No obvious blockers found for running the exporter."
}
else {
    foreach ($blocker in $blockers) {
        Write-Line "- $blocker"
    }
}

Write-Header "NEXT COMMAND IF BLOCKERS ARE FIXED"
Write-Line "`$env:CRM_1C_CONNECTION_STRING = 'Srvr=""192.168.0.5"";Ref=""elista"";Usr=""<1C_USER>"";Pwd=""<1C_PASSWORD>"";'"
Write-Line "powershell.exe -NoProfile -ExecutionPolicy Bypass -File '$ExportDir\export-1c-catalogs.ps1' -Set next -OutputDir '$ExportDir'"
Write-Line "powershell.exe -NoProfile -ExecutionPolicy Bypass -File '$ExportDir\export-1c-operational-data.ps1' -Set all -OutputDir '$ExportDir'"

Write-Line ""
Write-Line "Report written to: $ReportPath"

$global:Error.Clear()
exit 0
