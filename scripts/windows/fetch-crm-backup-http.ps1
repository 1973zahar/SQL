param(
    [string]$VmHost = "192.168.0.166",
    [int]$VmHttpPort = 8088,
    [string]$LocalPath = "D:\CRM\Backups",
    [string]$FileName = "crm_hub_backups_transfer.tar.gz"
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path $LocalPath | Out-Null

$uri = "http://${VmHost}:$VmHttpPort/$FileName"
$outFile = Join-Path $LocalPath $FileName

Invoke-WebRequest -Uri $uri -OutFile $outFile

Add-Type -AssemblyName System.IO.Compression.FileSystem
$inputStream = [System.IO.File]::OpenRead($outFile)
try {
    $gzipStream = New-Object System.IO.Compression.GZipStream($inputStream, [System.IO.Compression.CompressionMode]::Decompress)
    try {
        $buffer = New-Object byte[] 512
        $read = $gzipStream.Read($buffer, 0, 512)
        if ($read -le 0) {
            throw "Downloaded archive is empty or not readable as gzip: $outFile"
        }
    }
    finally {
        $gzipStream.Dispose()
    }
}
finally {
    $inputStream.Dispose()
}

Get-Item $outFile
