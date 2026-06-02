param(
    [string]$TaskName = "CRM 1C Export Hourly",
    [string]$ScriptPath = "D:\CRM\Exports\run-1c-export-now.ps1",
    [int]$IntervalHours = 1,
    [string]$StartTime = "00:10",
    [switch]$RunNow
)

$ErrorActionPreference = "Stop"

if ($IntervalHours -lt 1) {
    throw "IntervalHours must be 1 or greater."
}

if (-not (Test-Path -LiteralPath $ScriptPath)) {
    throw "Export launcher not found: $ScriptPath"
}

$resolvedScriptPath = (Resolve-Path -LiteralPath $ScriptPath).Path
$taskAction = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$resolvedScriptPath`""

Write-Host "Creating or updating Windows Scheduled Task:"
Write-Host "TaskName: $TaskName"
Write-Host "Action: $taskAction"
Write-Host "Schedule: every $IntervalHours hour(s), start time $StartTime"
Write-Host "Run account: current interactive Windows user"

$createArgs = @(
    "/Create",
    "/TN", $TaskName,
    "/TR", $taskAction,
    "/SC", "HOURLY",
    "/MO", $IntervalHours.ToString(),
    "/ST", $StartTime,
    "/RL", "HIGHEST",
    "/F"
)

& schtasks.exe @createArgs
if ($LASTEXITCODE -ne 0) {
    throw "schtasks.exe failed to create task. ExitCode=$LASTEXITCODE"
}

Write-Host "Scheduled Task was created or updated."

if ($RunNow) {
    Write-Host "Starting task now..."
    & schtasks.exe /Run /TN $TaskName
    if ($LASTEXITCODE -ne 0) {
        throw "schtasks.exe failed to start task. ExitCode=$LASTEXITCODE"
    }
}

Write-Host "Task details:"
& schtasks.exe /Query /TN $TaskName /V /FO LIST
