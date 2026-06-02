param(
    [string]$Root = "D:\CRM\Exports",
    [int]$Port = 8090,
    [string]$BindPrefix = "+"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $Root)) {
    throw "Export root does not exist: $Root"
}

$prefix = "http://$BindPrefix`:$Port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
}
catch {
    throw "Cannot start HTTP listener on $prefix. Try running PowerShell as Administrator or check if port $Port is already used. $($_.Exception.Message)"
}

Write-Host "Serving $Root on $prefix"
Write-Host "Stop with Ctrl+C"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        try {
            if ($request.HttpMethod -notin @("GET", "HEAD")) {
                $response.StatusCode = 405
                $response.Close()
                continue
            }

            $relative = [Uri]::UnescapeDataString($request.Url.AbsolutePath.TrimStart("/"))
            if ([string]::IsNullOrWhiteSpace($relative)) {
                $files = Get-ChildItem -LiteralPath $Root -File |
                    Sort-Object Name |
                    ForEach-Object { "<li><a href=""$($_.Name)"">$($_.Name)</a> $($_.Length)</li>" }
                $html = "<html><body><h1>CRM Exports</h1><ul>$($files -join "`n")</ul></body></html>"
                $bytes = [Text.Encoding]::UTF8.GetBytes($html)
                $response.ContentType = "text/html; charset=utf-8"
                $response.ContentLength64 = $bytes.Length
                if ($request.HttpMethod -eq "GET") {
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                }
                $response.Close()
                continue
            }

            $path = Join-Path $Root $relative
            $fullRoot = [IO.Path]::GetFullPath($Root)
            $fullPath = [IO.Path]::GetFullPath($path)

            if (-not $fullPath.StartsWith($fullRoot, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
                $response.StatusCode = 404
                $response.Close()
                continue
            }

            $file = Get-Item -LiteralPath $fullPath
            $response.ContentType = "text/csv; charset=utf-16le"
            $response.ContentLength64 = $file.Length

            if ($request.HttpMethod -eq "GET") {
                $stream = [IO.File]::OpenRead($fullPath)
                try {
                    $stream.CopyTo($response.OutputStream)
                }
                finally {
                    $stream.Close()
                }
            }
            $response.Close()
        }
        catch {
            try {
                $response.StatusCode = 500
                $response.Close()
            }
            catch {
            }
        }
    }
}
finally {
    $listener.Stop()
    $listener.Close()
}
