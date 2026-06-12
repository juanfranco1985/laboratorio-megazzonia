$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$assetsRoot = Join-Path $root "android/app/src/main/assets"
$webTarget = Join-Path $assetsRoot "web"
$sharedTarget = Join-Path $assetsRoot "shared"

New-Item -ItemType Directory -Force -Path $assetsRoot | Out-Null
$resolvedAssetsRoot = (Resolve-Path $assetsRoot).Path

function Assert-InAssetsRoot {
  param([string] $Path)
  $fullPath = [System.IO.Path]::GetFullPath($Path)
  if (-not $fullPath.StartsWith($resolvedAssetsRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to modify path outside Android assets: $fullPath"
  }
}

Assert-InAssetsRoot $webTarget
Assert-InAssetsRoot $sharedTarget

if (Test-Path $webTarget) {
  Remove-Item -LiteralPath $webTarget -Recurse -Force
}

if (Test-Path $sharedTarget) {
  Remove-Item -LiteralPath $sharedTarget -Recurse -Force
}

Copy-Item -Path (Join-Path $root "web") -Destination $webTarget -Recurse
Copy-Item -Path (Join-Path $root "shared") -Destination $sharedTarget -Recurse

Write-Host "Android assets synchronized."
