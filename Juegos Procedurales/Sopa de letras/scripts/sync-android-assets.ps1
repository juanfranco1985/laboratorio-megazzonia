Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$targetRoot = [System.IO.Path]::GetFullPath((Join-Path $projectRoot 'android\app\src\main\assets\www'))

if (-not $targetRoot.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Target path '$targetRoot' is outside the project root '$projectRoot'."
}

if (-not (Test-Path -LiteralPath $targetRoot)) {
  New-Item -ItemType Directory -Path $targetRoot -Force | Out-Null
}

Get-ChildItem -LiteralPath $targetRoot -Force | Remove-Item -Recurse -Force

$rootFiles = @(
  'index.html',
  'manifest.webmanifest',
  'service-worker.js'
)

$rootDirectories = @(
  'packs',
  'src',
  'styles'
)

foreach ($file in $rootFiles) {
  $sourcePath = Join-Path $projectRoot $file
  Copy-Item -LiteralPath $sourcePath -Destination $targetRoot -Force
}

foreach ($directory in $rootDirectories) {
  $sourcePath = Join-Path $projectRoot $directory
  $destinationPath = Join-Path $targetRoot $directory
  Copy-Item -LiteralPath $sourcePath -Destination $destinationPath -Recurse -Force
}

Write-Output "Android assets synchronized to $targetRoot"
