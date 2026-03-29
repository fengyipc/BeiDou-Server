#Requires -Version 5.1
<#
.SYNOPSIS
  Windows: download version.json from COS, apply patches, refresh BeiDou.jar (same behavior as update.sh).
#>
[CmdletBinding()]
param(
    [string]$InitCommit,
    [string]$Bootstrap,
    [switch]$ReplayPatchZips
)

$ErrorActionPreference = "Stop"

$DeployDir = Split-Path -Parent $PSCommandPath
. (Join-Path $DeployDir "cos-common.ps1")
Load-CosEnv

function Write-State {
    param([string]$Commit, [string]$JarSha = "")
    $dir = Split-Path -Parent $StateFile
    if ($dir -and -not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    $obj = [ordered]@{ appliedCommit = $Commit; artifactSha256 = $JarSha }
    ($obj | ConvertTo-Json -Depth 5) + "`n" | Set-Content -LiteralPath $StateFile -Encoding UTF8
}

if ($InitCommit) {
    if ($InitCommit -notmatch '^[0-9a-f]{40}$') { throw "--init-commit must be a full 40-char hex SHA" }
    Write-State $InitCommit ""
    Write-Host "Wrote $StateFile with appliedCommit=$InitCommit"
    exit 0
}

if ($env:COS_LOCAL_ROOT) {
    if (-not (Test-Path -LiteralPath $env:COS_LOCAL_ROOT -PathType Container)) {
        throw "COS_LOCAL_ROOT is not a directory: $($env:COS_LOCAL_ROOT)"
    }
}
else {
    Assert-CosCli
}
Assert-HelperPy
if (-not $env:COS_LOCAL_ROOT -and -not $env:COS_BUCKET) {
    throw "COS_BUCKET is required unless COS_LOCAL_ROOT is set (local mirror)"
}

$versionLocal = [System.IO.Path]::GetTempFileName()
try {
    Copy-CosDown "version.json" $versionLocal

    $ver = Get-Content -LiteralPath $versionLocal -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($ver.schema -ne 1) { throw "Unsupported version.json schema (expected schema=1)" }

    $headCommit = $ver.headCommit
    $artifactBlob = $ver.artifact.key
    $artifactSha = $ver.artifact.sha256

    if ($Bootstrap) {
        $tmpZip = [System.IO.Path]::GetTempFileName()
        try {
            Copy-CosDown $Bootstrap $tmpZip
            $h = Get-Sha256File $tmpZip
            Write-Host "Bootstrap zip sha256=$h (not verified)"
            Invoke-PythonHelper @("unzip", $tmpZip, $ServerRoot)
        }
        finally { Remove-Item -LiteralPath $tmpZip -Force -ErrorAction SilentlyContinue }
    }

    if (-not (Test-Path -LiteralPath $StateFile)) {
        Write-Host "Missing state file: $StateFile" -ForegroundColor Red
        Write-Host "First-time: git checkout <baseline> then: .\update.ps1 -InitCommit <40-char-sha>"
        Write-Host "Or: .\update.ps1 -Bootstrap <key> then -InitCommit ..."
        exit 1
    }

    $st = Get-Content -LiteralPath $StateFile -Raw -Encoding UTF8 | ConvertFrom-Json
    $applied = [string]$st.appliedCommit
    if ($applied -notmatch '^[0-9a-f]{40}$') { throw "Invalid appliedCommit in $StateFile" }

    if ($ReplayPatchZips) {
        $patchListReplay = $ver.patches
        if ($null -eq $patchListReplay) { $patchListReplay = @() }
        elseif ($patchListReplay -isnot [System.Array]) { $patchListReplay = @($patchListReplay) }
        $zipPatches = @($patchListReplay | Where-Object { $_.key -and $_.sha256 })
        if ($zipPatches.Count -eq 0) {
            Write-Host "No resource patch zips in version.json; nothing to replay."
        }
        else {
            Write-Host "Replaying $($zipPatches.Count) resource patch zip(s) from version.json..."
            foreach ($p in $zipPatches) {
                Write-Host "Replay: $($p.key)"
                $tmpZ = [System.IO.Path]::GetTempFileName()
                try {
                    Copy-CosDown $p.key $tmpZ
                    $got = Get-Sha256File $tmpZ
                    if ($got -ne $p.sha256) { throw "SHA256 mismatch for replay $($p.key)" }
                    Invoke-PythonHelper @("unzip", $tmpZ, $ServerRoot)
                }
                finally { Remove-Item -LiteralPath $tmpZ -Force -ErrorAction SilentlyContinue }
            }
        }
    }

    function Apply-PatchChain {
        param([string]$Current, [string]$Target)
        $cur = $Current
        while ($cur -ne $Target) {
            $patch = $null
            $patchList = $ver.patches
            if ($null -eq $patchList) { $patchList = @() }
            elseif ($patchList -isnot [System.Array]) { $patchList = @($patchList) }
            foreach ($p in $patchList) {
                if ($p.fromCommit -eq $cur) { $patch = $p; break }
            }
            if (-not $patch) {
                throw "No patch step from $cur toward $Target (broken chain)."
            }

            $artifactOnly = $false
            if ($null -ne $patch.artifactOnly) { $artifactOnly = [bool]$patch.artifactOnly }
            $shortFrom = $cur.Substring(0, 12)
            $shortTo = $patch.toCommit.Substring(0, 12)
            if ($artifactOnly) {
                Write-Host "Patch $shortFrom -> $shortTo : artifactOnly (jar updated at end; no resource zip for this step)"
            }
            else {
                $pkey = $patch.key
                $psha = $patch.sha256
                Write-Host "Patch $shortFrom -> $shortTo : applying resource zip $pkey"
                $tmpZ = [System.IO.Path]::GetTempFileName()
                try {
                    Copy-CosDown $pkey $tmpZ
                    $got = Get-Sha256File $tmpZ
                    if ($got -ne $psha) { throw "SHA256 mismatch for patch $pkey" }
                    Invoke-PythonHelper @("unzip", $tmpZ, $ServerRoot)
                }
                finally { Remove-Item -LiteralPath $tmpZ -Force -ErrorAction SilentlyContinue }
            }
            $cur = $patch.toCommit
            Write-State $cur ""
        }
    }

    if ($applied -ne $headCommit) {
        Apply-PatchChain $applied $headCommit
    }
    elseif (-not $ReplayPatchZips) {
        Write-Host "Patch chain skipped: local appliedCommit already equals headCommit (only the jar is refreshed below)."
        $plHint = $ver.patches
        if ($null -eq $plHint) { $plHint = @() }
        elseif ($plHint -isnot [System.Array]) { $plHint = @($plHint) }
        $firstFrom = $null
        foreach ($p in $plHint) {
            if ($p.key -and $p.sha256) { $firstFrom = $p.fromCommit; break }
        }
        if ($firstFrom) {
            Write-Host "If scripts/wz were never unpacked, state may match head while the tree does not."
            Write-Host "Fix A: .\deploy\update.ps1 -ReplayPatchZips"
            Write-Host "Fix B (when disk matches that commit): .\deploy\update.ps1 -InitCommit $firstFrom; .\deploy\update.ps1"
        }
    }

    $jarDest = Join-Path $ServerRoot "BeiDou.jar"
    $tmpJar = [System.IO.Path]::GetTempFileName()
    try {
        Copy-CosDown $artifactBlob $tmpJar
        $gotJar = Get-Sha256File $tmpJar
        if ($gotJar -ne $artifactSha) { throw "SHA256 mismatch for artifact" }
        Move-Item -LiteralPath $tmpJar -Destination $jarDest -Force
        $tmpJar = $null
    }
    finally {
        if ($tmpJar -and (Test-Path -LiteralPath $tmpJar)) { Remove-Item -LiteralPath $tmpJar -Force -ErrorAction SilentlyContinue }
    }

    Write-State $headCommit $artifactSha
    Write-Host "Update complete: appliedCommit=$headCommit, jar -> $jarDest"
    exit 0
}
finally {
    if (Test-Path -LiteralPath $versionLocal) { Remove-Item -LiteralPath $versionLocal -Force -ErrorAction SilentlyContinue }
}
