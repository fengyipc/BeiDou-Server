#Requires -Version 5.1
<#
.SYNOPSIS
  Windows: pack resource delta, mvn package, upload to COS (same behavior as publish.sh).
#>
[CmdletBinding()]
param(
    [switch]$ArtifactOnly,
    [switch]$RequireResourceChange,
    [switch]$SkipMaven
)

$ErrorActionPreference = "Stop"

$DeployDir = Split-Path -Parent $PSCommandPath
. (Join-Path $DeployDir "cos-common.ps1")
Load-CosEnv

$resourcePaths = if ($env:RESOURCE_PATHS) {
    @($env:RESOURCE_PATHS -split '\s+' | Where-Object { $_ })
}
else {
    @("scripts", "scripts-zh-CN", "wz", "wz-zh-CN")
}

Assert-CosCli
Assert-HelperPy
if (-not $env:COS_BUCKET) { throw "COS_BUCKET is required" }

Push-Location $ServerRoot
$prevFile = $null
$newVer = $null
$filesTmp = $null
$patchZip = $null
try {
    $to = (git rev-parse HEAD).Trim()
    if ($to -notmatch '^[0-9a-f]{40}$') { throw "Could not read HEAD commit" }

    $prevFile = [System.IO.Path]::GetTempFileName()
    $newVer = [System.IO.Path]::GetTempFileName()
    $filesTmp = [System.IO.Path]::GetTempFileName()

    $hadRemote = Test-CopyCosDown "version.json" $prevFile
    if ($hadRemote) {
        Invoke-PythonHelper @("json_validate", $prevFile)
        $prevDoc = (Get-Content -LiteralPath $prevFile -Raw -Encoding UTF8).Trim() | ConvertFrom-Json
        $from = $prevDoc.headCommit
    }
    else {
        Set-Content -LiteralPath $prevFile -Value "{}" -Encoding UTF8
        $from = $env:INITIAL_FROM_COMMIT
        if ($from -notmatch '^[0-9a-f]{40}$') {
            throw "No remote version.json. Set INITIAL_FROM_COMMIT to baseline (40-char SHA)."
        }
    }

    & git "cat-file" "-e" "${from}^{commit}" 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "from commit not found in repo: $from" }

    if ($from -eq $to) {
        Write-Host "Nothing to publish: remote head already matches HEAD ($to)"
        exit 0
    }

    $gitArgs = @("diff", "--name-only", "$from..$to", "--") + $resourcePaths
    & git @gitArgs | Set-Content -LiteralPath $filesTmp -Encoding UTF8
    # Monorepo: paths are repo-relative (e.g. gms-server/scripts/...); zip uses ServerRoot.
    $gitPrefix = ((git rev-parse --show-prefix 2>$null) | Out-String).Trim().TrimEnd('/', '\')
    if ($gitPrefix) {
        $p = "$gitPrefix/"
        Get-Content -LiteralPath $filesTmp -Encoding UTF8 | ForEach-Object {
            if ($_.StartsWith($p)) { $_.Substring($p.Length) } else { $_ }
        } | Set-Content -LiteralPath $filesTmp -Encoding UTF8
    }
    $hasResources = (Get-Item -LiteralPath $filesTmp).Length -gt 0

    if ($RequireResourceChange -and -not $hasResources) {
        throw "No resource changes under RESOURCE_PATHS (--RequireResourceChange)."
    }
    if ($ArtifactOnly) { $hasResources = $false }

    $patchType = "artifactOnly"
    if ($hasResources) {
        $patchType = "resource"
        $patchZip = [System.IO.Path]::ChangeExtension([System.IO.Path]::GetTempFileName(), "zip")
        Invoke-PythonHelper @("zip_paths", $ServerRoot, $filesTmp, $patchZip)
        if (-not (Test-Path -LiteralPath $patchZip) -or (Get-Item -LiteralPath $patchZip).Length -eq 0) {
            throw "Resource list non-empty but zip is empty (missing files?)"
        }
    }

    if (-not $SkipMaven) {
        & mvn "-q" "-f" (Join-Path $ServerRoot "pom.xml") "package" "-DskipTests"
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }

    $jarPath = Join-Path $ServerRoot "target\BeiDou.jar"
    if (-not (Test-Path -LiteralPath $jarPath)) { throw "Missing $jarPath" }

    $jarSha = Get-Sha256File $jarPath
    $st = Get-ShortSha $to
    $sf = Get-ShortSha $from
    $artifactKey = "releases/BeiDou-$st.jar"
    $patchKey = "releases/patches/patch-$sf-$st.zip"

    Copy-CosUp $jarPath $artifactKey

    if ($patchType -eq "resource") {
        $patchSha = Get-Sha256File $patchZip
        Copy-CosUp $patchZip $patchKey
        $newPatch = [ordered]@{
            fromCommit = $from
            toCommit   = $to
            key        = $patchKey
            sha256     = $patchSha
        }
    }
    else {
        $newPatch = [ordered]@{
            fromCommit   = $from
            toCommit     = $to
            artifactOnly = $true
        }
    }

    $prevRaw = (Get-Content -LiteralPath $prevFile -Raw -Encoding UTF8).Trim()
    $prevObj = if ($prevRaw) { $prevRaw | ConvertFrom-Json } else { $null }
    $patchList = [System.Collections.ArrayList]@()
    if ($prevObj -and $prevObj.patches) {
        $pl = $prevObj.patches
        if ($pl -isnot [System.Array]) { $pl = @($pl) }
        foreach ($x in $pl) { [void]$patchList.Add($x) }
    }
    [void]$patchList.Add([PSCustomObject]$newPatch)

    $doc = [ordered]@{
        schema     = 1
        headCommit = $to
        artifact   = [ordered]@{ key = $artifactKey; sha256 = $jarSha }
        patches    = $patchList.ToArray()
    }
    ($doc | ConvertTo-Json -Depth 20) + "`n" | Set-Content -LiteralPath $newVer -Encoding UTF8

    Invoke-PythonHelper @("json_validate", $newVer)

    Copy-CosUp $newVer "version.json.new"
    Invoke-CosCli cp (Get-CosUri "version.json.new") (Get-CosUri "version.json")
    $auth = Get-CosCliAuthArgs
    $bin = $CosCliBin
    if ($auth.Count -gt 0) {
        & $bin @auth rm (Get-CosUri "version.json.new") -f 2>$null | Out-Null
    }
    else {
        & $bin rm (Get-CosUri "version.json.new") -f 2>$null | Out-Null
    }

    Write-Host "Published head=$to artifact=$artifactKey patch=$patchType"
}
finally {
    Pop-Location
    foreach ($p in @($prevFile, $newVer, $filesTmp)) {
        if ($p -and (Test-Path -LiteralPath $p)) { Remove-Item -LiteralPath $p -Force -ErrorAction SilentlyContinue }
    }
    if ($patchZip -and (Test-Path -LiteralPath $patchZip)) { Remove-Item -LiteralPath $patchZip -Force -ErrorAction SilentlyContinue }
}
