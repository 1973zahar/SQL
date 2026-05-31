param(
    [string]$VmHost = "192.168.0.166",
    [string]$VmUser = "crmadmin",
    [string]$RemotePath = "/var/backups/crm-postgres/",
    [string]$LocalPath = "D:\CRM\Backups"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command scp -ErrorAction SilentlyContinue)) {
    throw "scp.exe was not found. Install or enable the Windows OpenSSH Client."
}

New-Item -ItemType Directory -Force -Path $LocalPath | Out-Null

$remoteBase = "$VmUser@${VmHost}:$RemotePath"

& scp "$remoteBase*.dump" $LocalPath
if ($LASTEXITCODE -ne 0) {
    throw "Failed to copy PostgreSQL dump files from $remoteBase"
}

& scp "$remoteBase*.sha256" $LocalPath
if ($LASTEXITCODE -ne 0) {
    throw "Failed to copy PostgreSQL checksum files from $remoteBase"
}

Get-ChildItem -Path $LocalPath -Filter "crm_hub_*.dump" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 10 Name, Length, LastWriteTime
