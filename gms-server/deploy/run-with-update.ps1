#Requires -Version 5.1
<#
.SYNOPSIS
  Windows: stop BeiDou.jar, run update.ps1, start server (same idea as run-with-update.sh).
#>
[CmdletBinding()]
param(
    [switch]$Foreground
)

$ErrorActionPreference = "Stop"

$DeployDir = Split-Path -Parent $PSCommandPath
. (Join-Path $DeployDir "cos-common.ps1")
Load-CosEnv

function Stop-BeiDouJava {
    $list = @(Get-CimInstance Win32_Process -Filter "Name = 'java.exe'" -ErrorAction SilentlyContinue |
            Where-Object { $_.CommandLine -and ($_.CommandLine -like '*BeiDou.jar*') })
    if ($list.Count -eq 0) { return }
    $ids = $list | ForEach-Object { $_.ProcessId }
    Write-Host "Stopping BeiDou.jar PIDs: $($ids -join ', ')"
    foreach ($id in $ids) {
        Stop-Process -Id $id -ErrorAction SilentlyContinue
    }
    $waited = 0
    while ($waited -lt 30) {
        $still = @(Get-CimInstance Win32_Process -Filter "Name = 'java.exe'" -ErrorAction SilentlyContinue |
                Where-Object { $_.CommandLine -and ($_.CommandLine -like '*BeiDou.jar*') })
        if ($still.Count -eq 0) { break }
        Start-Sleep -Seconds 1
        $waited++
    }
    $still = @(Get-CimInstance Win32_Process -Filter "Name = 'java.exe'" -ErrorAction SilentlyContinue |
            Where-Object { $_.CommandLine -and ($_.CommandLine -like '*BeiDou.jar*') })
    if ($still.Count -gt 0) {
        Write-Host "Force killing remaining Java (BeiDou.jar)..." -ForegroundColor Yellow
        foreach ($p in $still) {
            Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
        }
    }
}

Stop-BeiDouJava

$updateScript = Join-Path $DeployDir "update.ps1"
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $updateScript
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$java = $env:BEIDOU_JAVA
if (-not $java) {
    $bundled = Join-Path $ServerRoot "jdk-21.0.2\bin\java.exe"
    if (Test-Path -LiteralPath $bundled) { $java = $bundled }
}
if (-not $java) { $java = "java" }

$jar = Join-Path $ServerRoot "BeiDou.jar"
if (-not (Test-Path -LiteralPath $jar)) {
    throw "Missing $jar (update.ps1 should have placed it)"
}

$commonArgs = [System.Collections.Generic.List[string]]::new()
if ($env:BEIDOU_JAVA_OPTS) {
    foreach ($t in ($env:BEIDOU_JAVA_OPTS.Trim() -split '\s+' | Where-Object { $_ })) {
        [void]$commonArgs.Add($t)
    }
}
[void]$commonArgs.Add("-Dspring.config.location=application.yml")
[void]$commonArgs.Add("-jar")
[void]$commonArgs.Add($jar)

Set-Location $ServerRoot

if ($Foreground) {
    & $java $commonArgs.ToArray()
    exit $LASTEXITCODE
}

$logDir = Join-Path $ServerRoot "logs"
if (-not (Test-Path -LiteralPath $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
$logFile = Join-Path $logDir "beidou.log"

$p = Start-Process -FilePath $java -ArgumentList $commonArgs.ToArray() -WorkingDirectory $ServerRoot `
    -RedirectStandardOutput $logFile -RedirectStandardError $logFile -PassThru -NoNewWindow
Write-Host "Started BeiDou.jar in background (logs -> $logFile, PID=$($p.Id))"
