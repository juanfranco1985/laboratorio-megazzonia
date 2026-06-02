param(
    [ValidateSet('private', 'public')]
    [string]$Visibility = 'private',
    [string]$Owner = 'juanfranco1985',
    [string]$RootRepo = 'laboratorio-megazzonia'
)

$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $Root

function Get-GhPath {
    $command = Get-Command gh -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    $defaultPath = 'C:\Program Files\GitHub CLI\gh.exe'
    if (Test-Path -LiteralPath $defaultPath) {
        return $defaultPath
    }

    throw 'GitHub CLI not found. Install it with: winget install --id GitHub.cli -e'
}

function Invoke-Checked {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string[]]$Arguments
    )

    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$FilePath $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
    }
}

function Test-GhRepo {
    param(
        [Parameter(Mandatory = $true)][string]$Gh,
        [Parameter(Mandatory = $true)][string]$FullName
    )

    $previousErrorAction = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    & $Gh repo view $FullName 1>$null 2>$null
    $exitCode = $LASTEXITCODE
    $ErrorActionPreference = $previousErrorAction

    return ($exitCode -eq 0)
}

function Ensure-GhRepo {
    param(
        [Parameter(Mandatory = $true)][string]$Gh,
        [Parameter(Mandatory = $true)][string]$Repo
    )

    $fullName = "$Owner/$Repo"
    if (Test-GhRepo -Gh $Gh -FullName $fullName) {
        Write-Host "Repo exists: $fullName"
        return
    }

    Write-Host "Creating $Visibility repo: $fullName"
    Invoke-Checked -FilePath $Gh -Arguments @('repo', 'create', $fullName, "--$Visibility")
}

function Read-Submodules {
    $modules = New-Object System.Collections.Generic.List[object]
    $current = $null

    foreach ($line in (Get-Content -LiteralPath (Join-Path $Root '.gitmodules'))) {
        if ($line -match '^\[submodule "(.+)"\]$') {
            $current = [ordered]@{ Path = $matches[1]; Repo = $null }
            $modules.Add([pscustomobject]$current)
            continue
        }

        if ($null -eq $current) {
            continue
        }

        if ($line -match '^\s*path = (.+)$') {
            $modules[$modules.Count - 1].Path = $matches[1]
            continue
        }

        if ($line -match '^\s*url = https://github\.com/[^/]+/([^/]+?)(?:\.git)?$') {
            $modules[$modules.Count - 1].Repo = $matches[1]
        }
    }

    return $modules
}

$Gh = Get-GhPath
Invoke-Checked -FilePath $Gh -Arguments @('auth', 'status')

$modules = Read-Submodules
foreach ($module in $modules) {
    if (-not $module.Repo) {
        throw "Missing repo URL for submodule path: $($module.Path)"
    }

    Ensure-GhRepo -Gh $Gh -Repo $module.Repo
    Invoke-Checked -FilePath 'git' -Arguments @('-C', (Join-Path $Root $module.Path), 'push', '-u', 'origin', 'main')
}

Ensure-GhRepo -Gh $Gh -Repo $RootRepo
Invoke-Checked -FilePath 'git' -Arguments @('push', '-u', 'origin', 'main')

Write-Host 'Publication completed.'
