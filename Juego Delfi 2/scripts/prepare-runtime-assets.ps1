param(
  [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$generated = Join-Path $ProjectRoot 'assets\generated'
$runtime = Join-Path $ProjectRoot 'assets\runtime'

function Export-TrimmedPng {
  param(
    [Parameter(Mandatory)][string]$Source,
    [Parameter(Mandatory)][string]$Destination,
    [int]$Padding = 4
  )

  $bitmap = [System.Drawing.Bitmap]::FromFile($Source)
  try {
    $minX = $bitmap.Width
    $minY = $bitmap.Height
    $maxX = -1
    $maxY = -1

    for ($y = 0; $y -lt $bitmap.Height; $y++) {
      for ($x = 0; $x -lt $bitmap.Width; $x++) {
        if ($bitmap.GetPixel($x, $y).A -gt 8) {
          if ($x -lt $minX) { $minX = $x }
          if ($y -lt $minY) { $minY = $y }
          if ($x -gt $maxX) { $maxX = $x }
          if ($y -gt $maxY) { $maxY = $y }
        }
      }
    }

    if ($maxX -lt 0) { throw "No hay píxeles visibles en $Source" }

    $left = [Math]::Max(0, $minX - $Padding)
    $top = [Math]::Max(0, $minY - $Padding)
    $right = [Math]::Min($bitmap.Width - 1, $maxX + $Padding)
    $bottom = [Math]::Min($bitmap.Height - 1, $maxY + $Padding)
    $rect = [System.Drawing.Rectangle]::new($left, $top, $right - $left + 1, $bottom - $top + 1)
    $trimmed = $bitmap.Clone($rect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $directory = Split-Path -Parent $Destination
      New-Item -ItemType Directory -Force -Path $directory | Out-Null
      $trimmed.Save($Destination, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $trimmed.Dispose()
    }
  } finally {
    $bitmap.Dispose()
  }
}

$copySets = @(
  @{ Source = 'characters\boy-movement'; Destination = 'characters\boy' },
  @{ Source = 'characters\girl-movement'; Destination = 'characters\girl' },
  @{ Source = 'characters\powers'; Destination = 'characters\powers' },
  @{ Source = 'shared\gameplay-objects'; Destination = 'shared' }
)

$worlds = @('galaxia', 'lava', 'oscuridad', 'oceano', 'fantasia', 'pradera', 'desierto')
foreach ($world in $worlds) {
  $copySets += @{ Source = "worlds\$world\sprites"; Destination = "worlds\$world\sprites" }
  $backgroundSource = Join-Path $generated "worlds\$world\$world-background-v1.png"
  $backgroundDestination = Join-Path $runtime "worlds\$world\background.png"
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $backgroundDestination) | Out-Null
  Copy-Item -LiteralPath $backgroundSource -Destination $backgroundDestination -Force
}

foreach ($set in $copySets) {
  $sourceDirectory = Join-Path $generated $set.Source
  $destinationDirectory = Join-Path $runtime $set.Destination
  Get-ChildItem -LiteralPath $sourceDirectory -File -Filter '*.png' | ForEach-Object {
    Export-TrimmedPng -Source $_.FullName -Destination (Join-Path $destinationDirectory $_.Name)
  }
}

$pngs = Get-ChildItem -LiteralPath $runtime -Recurse -File -Filter '*.png'
[PSCustomObject]@{
  RuntimeDirectory = $runtime
  TotalPng = $pngs.Count
  Backgrounds = ($pngs | Where-Object Name -eq 'background.png').Count
  TrimmedSprites = ($pngs | Where-Object Name -ne 'background.png').Count
}
