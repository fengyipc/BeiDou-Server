# Dot-source only: . "$PSScriptRoot\cos-common.ps1" from sibling scripts.
# Mirrors deploy/cos-common.sh for Windows (coscli + cos-helper.py).

$DeployDir = $PSScriptRoot
$ServerRoot = Split-Path -LiteralPath $DeployDir -Parent
$HelperPy = Join-Path $DeployDir "cos-helper.py"
$StateFile = if ($env:BEIDOU_STATE_FILE) { $env:BEIDOU_STATE_FILE } else { Join-Path $DeployDir ".beidou-deploy-state" }
$CosCliBin = if ($env:COSCLI) { $env:COSCLI } else { "coscli" }

function Load-CosEnv {
    $f = Join-Path -LiteralPath $DeployDir "cos.env"
    if (-not (Test-Path -LiteralPath $f)) { return }
    Get-Content -LiteralPath $f -Encoding UTF8 | ForEach-Object {
        $line = $_.TrimEnd()
        if ($line -match '^\s*#' -or [string]::IsNullOrWhiteSpace($line)) { return }
        $idx = $line.IndexOf('=')
        if ($idx -lt 1) { return }
        $k = $line.Substring(0, $idx).Trim()
        $v = $line.Substring($idx + 1).Trim()
        if ($v.Length -ge 2 -and $v.StartsWith('"') -and $v.EndsWith('"')) {
            $v = $v.Substring(1, $v.Length - 2)
        }
        Set-Item -Path "env:$k" -Value $v
    }
}

function Get-NormalizedPrefix {
    $p = if ($env:COS_PREFIX) { $env:COS_PREFIX } else { "" }
    $p = $p.TrimStart('/')
    if ($p -and -not $p.EndsWith('/')) { $p += '/' }
    return $p
}

function Get-ObjectKey {
    param([string]$Name)
    return (Get-NormalizedPrefix) + $Name
}

function Get-CosEndpoint {
    if ($env:COS_ENDPOINT) { return $env:COS_ENDPOINT }
    if (-not $env:COS_REGION) {
        throw "COS_REGION or COS_ENDPOINT is required when using COS_SECRET_ID/COS_SECRET_KEY"
    }
    return "cos.$($env:COS_REGION).myqcloud.com"
}

function Get-CosCliAuthArgs {
    $a = [System.Collections.Generic.List[string]]::new()
    if ($env:COS_SECRET_ID -and $env:COS_SECRET_KEY) {
        [void]$a.Add("--init-skip=true")
        [void]$a.Add("-e")
        [void]$a.Add((Get-CosEndpoint))
        [void]$a.Add("-i")
        [void]$a.Add($env:COS_SECRET_ID)
        [void]$a.Add("-k")
        [void]$a.Add($env:COS_SECRET_KEY)
    }
    elseif ($env:COS_ENDPOINT) {
        [void]$a.Add("-e")
        [void]$a.Add($env:COS_ENDPOINT)
    }
    return $a
}

function Get-CosUri {
    param([string]$Key)
    if (-not $env:COS_BUCKET) { throw "COS_BUCKET is required (e.g. mybucket-1250000000)" }
    $full = Get-ObjectKey $Key
    return "cos://$($env:COS_BUCKET)/$full"
}

function Get-LocalCosPath {
    param([string]$Key)
    $root = $env:COS_LOCAL_ROOT.TrimEnd('/', '\')
    $rel = (Get-ObjectKey $Key) -replace '\\', '/'
    return "$root/$rel"
}

function Assert-CosCli {
    $cmd = Get-Command $CosCliBin -ErrorAction SilentlyContinue
    if (-not $cmd) {
        throw "coscli not found. Install from https://github.com/tencentyun/coscli/releases and set COSCLI to coscli.exe path."
    }
}

function Assert-HelperPy {
    if (-not (Test-Path -LiteralPath $HelperPy)) { throw "Missing $HelperPy" }
}

function Invoke-CosCli {
    Assert-CosCli
    $auth = Get-CosCliAuthArgs
    $bin = $CosCliBin
    if ($auth.Count -gt 0) {
        & $bin @auth @args
    }
    else {
        & $bin @args
    }
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

function Copy-CosUp {
    param([string]$Src, [string]$Key)
    Invoke-CosCli cp $Src (Get-CosUri $Key)
}

function Copy-CosDown {
    param([string]$Key, [string]$Dest)
    if ($env:COS_LOCAL_ROOT) {
        $src = Get-LocalCosPath $Key
        if (-not (Test-Path -LiteralPath $src -PathType Leaf)) {
            throw "COS_LOCAL_ROOT: object not found: $src (key=$Key)"
        }
        Copy-Item -LiteralPath $src -Destination $Dest -Force
        return
    }
    Invoke-CosCli cp (Get-CosUri $Key) $Dest
}

function Test-CopyCosDown {
    param([string]$Key, [string]$Dest)
    if ($env:COS_LOCAL_ROOT) {
        $src = Get-LocalCosPath $Key
        if (-not (Test-Path -LiteralPath $src -PathType Leaf)) { return $false }
        Copy-Item -LiteralPath $src -Destination $Dest -Force
        return $true
    }
    Assert-CosCli
    $auth = Get-CosCliAuthArgs
    $bin = $CosCliBin
    if ($auth.Count -gt 0) {
        & $bin @auth cp (Get-CosUri $Key) $Dest 2>$null
    }
    else {
        & $bin cp (Get-CosUri $Key) $Dest 2>$null
    }
    return ($LASTEXITCODE -eq 0)
}

function Get-ShortSha {
    param([string]$Sha)
    if ($Sha.Length -le 12) { return $Sha }
    return $Sha.Substring(0, 12)
}

function Invoke-PythonHelper {
    param([string[]]$PyArgs)
    Assert-HelperPy
    $candidates = [System.Collections.Generic.List[string]]::new()
    if ($env:PYTHON) { [void]$candidates.Add($env:PYTHON) }
    [void]$candidates.Add("python")
    [void]$candidates.Add("python3")

    foreach ($exe in $candidates) {
        $cmd = Get-Command $exe -ErrorAction SilentlyContinue
        if ($cmd) {
            & $exe $HelperPy @PyArgs
            if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
            return
        }
    }
    $pyLauncher = Get-Command "py" -ErrorAction SilentlyContinue
    if ($pyLauncher) {
        & py -3 $HelperPy @PyArgs
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
        return
    }
    throw "Python not found for cos-helper.py. Install Python 3 or set PYTHON to python.exe."
}

function Get-Sha256File {
    param([string]$Path)
    Assert-HelperPy
    $candidates = [System.Collections.Generic.List[string]]::new()
    if ($env:PYTHON) { [void]$candidates.Add($env:PYTHON) }
    [void]$candidates.Add("python")
    [void]$candidates.Add("python3")
    foreach ($exe in $candidates) {
        if (-not (Get-Command $exe -ErrorAction SilentlyContinue)) { continue }
        $out = & $exe $HelperPy sha256 $Path 2>$null
        if ($LASTEXITCODE -eq 0) { return [string]$out.Trim() }
    }
    $pyLauncher = Get-Command "py" -ErrorAction SilentlyContinue
    if ($pyLauncher) {
        $out = & py -3 $HelperPy sha256 $Path 2>$null
        if ($LASTEXITCODE -eq 0) { return [string]$out.Trim() }
    }
    throw "Python not found for cos-helper.py."
}
