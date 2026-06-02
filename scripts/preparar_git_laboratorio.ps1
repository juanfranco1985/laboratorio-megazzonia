$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $Root

$Owner = 'juanfranco1985'
$RootRepo = 'laboratorio-megazzonia'

$Projects = @(
    [pscustomobject]@{ Path = '10 - SOLAR YEAR HISTORICAL DATABASE & ANALYSIS TOOL'; Repo = 'megazzonia-solar-year-historical-database-analysis-tool' },
    [pscustomobject]@{ Path = '5 - Solar Agriculture Planning System'; Repo = 'megazzonia-solar-agriculture-planning-system' },
    [pscustomobject]@{ Path = '7 - Astronomical Solar Calendar Engine (Dynamic + Predictive)'; Repo = 'megazzonia-astronomical-solar-calendar-engine' },
    [pscustomobject]@{ Path = '9 - Solar Climate Dashboard'; Repo = 'megazzonia-solar-climate-dashboard' },
    [pscustomobject]@{ Path = 'ai-product-research'; Repo = 'megazzonia-ai-product-research' },
    [pscustomobject]@{ Path = 'Amazon Deals'; Repo = 'megazzonia-amazon-deals' },
    [pscustomobject]@{ Path = 'blog-portafolio-export'; Repo = 'megazzonia-blog-portafolio-export' },
    [pscustomobject]@{ Path = 'blog-portafolio-hosting'; Repo = 'megazzonia-blog-portafolio-hosting' },
    [pscustomobject]@{ Path = 'Champions Pong - copia - copia'; Repo = 'megazzonia-champions-pong-copia-copia' },
    [pscustomobject]@{ Path = 'Cronicas del ultimo piloto'; Repo = 'megazzonia-cronicas-del-ultimo-piloto' },
    [pscustomobject]@{ Path = 'Drone Factory'; Repo = 'megazzonia-drone-factory' },
    [pscustomobject]@{ Path = 'Endless Runner'; Repo = 'megazzonia-endless-runner' },
    [pscustomobject]@{ Path = 'FlightSimulatorClaude2'; Repo = 'megazzonia-flight-simulator-claude2' },
    [pscustomobject]@{ Path = 'Gato & Humano Ascenso al Rascacielos Celestial'; Repo = 'megazzonia-gato-humano-ascenso-rascacielos-celestial' },
    [pscustomobject]@{ Path = 'Juego Juan'; Repo = 'megazzonia-juego-juan' },
    [pscustomobject]@{ Path = 'Juegos Procedurales'; Repo = 'megazzonia-juegos-procedurales' },
    [pscustomobject]@{ Path = 'LABORATORIO MEGAZZONIA estructura blog'; Repo = 'megazzonia-estructura-blog' },
    [pscustomobject]@{ Path = 'Laboratorio virtual de mecanica de fluidos'; Repo = 'megazzonia-laboratorio-virtual-mecanica-fluidos' },
    [pscustomobject]@{ Path = 'Motorcraft CODEX 2'; Repo = 'megazzonia-motorcraft-codex-2' },
    [pscustomobject]@{ Path = 'portfolio'; Repo = 'megazzonia-portfolio' },
    [pscustomobject]@{ Path = "Proyecto Cuaderno digital inteligente para m$([char]0x00FA)sicos"; Repo = 'megazzonia-cuaderno-digital-inteligente-musicos' },
    [pscustomobject]@{ Path = 'Proyecto NPT- sistema solar'; Repo = 'megazzonia-npt-sistema-solar' },
    [pscustomobject]@{ Path = 'Real Turn Pong'; Repo = 'megazzonia-real-turn-pong' },
    [pscustomobject]@{ Path = 'RoiAnalyticsAndroid_v3'; Repo = 'megazzonia-roi-analytics-android-v3' },
    [pscustomobject]@{ Path = 'Simulador de consumo electrico'; Repo = 'megazzonia-simulador-consumo-electrico' },
    [pscustomobject]@{ Path = 'Simulador de transferencia de calor en disipadores'; Repo = 'megazzonia-simulador-transferencia-calor-disipadores' },
    [pscustomobject]@{ Path = 'Software de Analisis estructural - copia'; Repo = 'megazzonia-software-analisis-estructural' },
    [pscustomobject]@{ Path = 'Tanque CHATGPT'; Repo = 'megazzonia-tanque-chatgpt' }
)

$IgnoreBlock = @'

# Megazzonia generated excludes
node_modules/
dist/
build/
.gradle/
.gradle-local/
.gradle-user-home/
.venv/
venv/
.env
.env.*
!.env.example
__pycache__/
*.py[cod]
.pytest_cache/
.mypy_cache/
.ruff_cache/
.coverage
coverage/
.vite/
.next/
out/
target/
local.properties
*.log
*.err
.DS_Store
Thumbs.db
'@

$RootOnlyIgnoreBlock = @'

# Local Codex/agent workspace state
.codex/
.agents/
'@

function Invoke-Git {
    param(
        [Parameter(Mandatory = $true)][string]$RepositoryPath,
        [Parameter(Mandatory = $true)][string[]]$Arguments
    )

    & git -C $RepositoryPath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "git -C '$RepositoryPath' $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
    }
}

function Test-GitHead {
    param([Parameter(Mandatory = $true)][string]$RepositoryPath)

    $previousErrorAction = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    & git -C $RepositoryPath rev-parse --verify HEAD 1>$null 2>$null
    $exitCode = $LASTEXITCODE
    $ErrorActionPreference = $previousErrorAction

    return ($exitCode -eq 0)
}

function Ensure-IgnoreBlock {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string]$Block,
        [Parameter(Mandatory = $true)][string]$Marker
    )

    if (-not (Test-Path -LiteralPath $FilePath)) {
        Set-Content -LiteralPath $FilePath -Value $Block.TrimStart() -Encoding UTF8
        return
    }

    $current = Get-Content -LiteralPath $FilePath -Raw
    if ($current -notlike "*$Marker*") {
        Add-Content -LiteralPath $FilePath -Value $Block -Encoding UTF8
        return
    }

    $currentLines = Get-Content -LiteralPath $FilePath
    foreach ($line in ($Block -split "`r?`n")) {
        $entry = $line.Trim()
        if ($entry -and -not $entry.StartsWith('#') -and ($currentLines -notcontains $entry)) {
            Add-Content -LiteralPath $FilePath -Value $entry -Encoding UTF8
        }
    }
}

function Ensure-Origin {
    param(
        [Parameter(Mandatory = $true)][string]$RepositoryPath,
        [Parameter(Mandatory = $true)][string]$RemoteUrl
    )

    $previousErrorAction = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $origin = & git -C $RepositoryPath remote get-url origin 2>$null
    $exitCode = $LASTEXITCODE
    $ErrorActionPreference = $previousErrorAction

    if ($exitCode -ne 0) {
        Invoke-Git -RepositoryPath $RepositoryPath -Arguments @('remote', 'add', 'origin', $RemoteUrl)
        return
    }

    if ($origin -ne $RemoteUrl) {
        Write-Host "Origin already exists for $RepositoryPath -> $origin"
    }
}

function Ensure-Repository {
    param(
        [Parameter(Mandatory = $true)][string]$RepositoryPath,
        [Parameter(Mandatory = $true)][string]$RemoteUrl
    )

    if (-not (Test-Path -LiteralPath (Join-Path $RepositoryPath '.git'))) {
        Invoke-Git -RepositoryPath $RepositoryPath -Arguments @('init', '-b', 'main')
    }

    if (-not (Test-GitHead -RepositoryPath $RepositoryPath)) {
        Invoke-Git -RepositoryPath $RepositoryPath -Arguments @('branch', '-M', 'main')
    }

    Ensure-Origin -RepositoryPath $RepositoryPath -RemoteUrl $RemoteUrl
}

function Commit-IfNeeded {
    param(
        [Parameter(Mandatory = $true)][string]$RepositoryPath,
        [Parameter(Mandatory = $true)][string]$Message
    )

    Invoke-Git -RepositoryPath $RepositoryPath -Arguments @('add', '.')
    $changes = & git -C $RepositoryPath status --porcelain
    if ($LASTEXITCODE -ne 0) {
        throw "git status failed for '$RepositoryPath'"
    }

    if ($changes) {
        Invoke-Git -RepositoryPath $RepositoryPath -Arguments @('commit', '-m', $Message)
        return
    }

    Write-Host "No changes to commit in $RepositoryPath"
}

Write-Host "Preparing project repositories..."
foreach ($project in $Projects) {
    $projectPath = Join-Path $Root $project.Path
    if (-not (Test-Path -LiteralPath $projectPath)) {
        throw "Project folder not found: $($project.Path)"
    }

    $remoteUrl = "https://github.com/$Owner/$($project.Repo).git"
    Ensure-IgnoreBlock -FilePath (Join-Path $projectPath '.gitignore') -Block $IgnoreBlock -Marker 'Megazzonia generated excludes'
    Ensure-Repository -RepositoryPath $projectPath -RemoteUrl $remoteUrl
    $projectCommitMessage = if (Test-GitHead -RepositoryPath $projectPath) { 'Update generated Git excludes' } else { 'Initial project snapshot' }
    Commit-IfNeeded -RepositoryPath $projectPath -Message $projectCommitMessage
}

Write-Host "Preparing laboratory parent repository..."
$rootRemoteUrl = "https://github.com/$Owner/$RootRepo.git"
Ensure-IgnoreBlock -FilePath (Join-Path $Root '.gitignore') -Block $IgnoreBlock -Marker 'Megazzonia generated excludes'
Ensure-IgnoreBlock -FilePath (Join-Path $Root '.gitignore') -Block $RootOnlyIgnoreBlock -Marker 'Local Codex/agent workspace state'

$gitmodules = New-Object System.Collections.Generic.List[string]
$gitmodules.Add('# Generated by scripts/preparar_git_laboratorio.ps1')
foreach ($project in $Projects) {
    $gitmodules.Add("[submodule `"$($project.Path)`"]")
    $gitmodules.Add("`tpath = $($project.Path)")
    $gitmodules.Add("`turl = https://github.com/$Owner/$($project.Repo).git")
    $gitmodules.Add('')
}
Set-Content -LiteralPath (Join-Path $Root '.gitmodules') -Value $gitmodules -Encoding UTF8

if (-not (Test-Path -LiteralPath (Join-Path $Root 'README.md'))) {
    $readme = @(
        '# Laboratorio Megazzonia',
        '',
        'Repositorio padre del laboratorio. Los proyectos de primer nivel se versionan como repos Git independientes y se referencian aqui como submodulos.',
        '',
        'Clonar con submodulos:',
        '',
        '```powershell',
        'git clone --recurse-submodules https://github.com/juanfranco1985/laboratorio-megazzonia.git',
        '```',
        '',
        'Actualizar submodulos despues de clonar:',
        '',
        '```powershell',
        'git submodule update --init --recursive',
        '```'
    )
    Set-Content -LiteralPath (Join-Path $Root 'README.md') -Value $readme -Encoding UTF8
}

$repoDoc = New-Object System.Collections.Generic.List[string]
$repoDoc.Add('# Mapa de repos GitHub')
$repoDoc.Add('')
$repoDoc.Add('Generado por `scripts/preparar_git_laboratorio.ps1`.')
$repoDoc.Add('')
$repoDoc.Add('Los repos remotos previstos son privados por defecto cuando se creen con GitHub CLI.')
$repoDoc.Add('')
$repoDoc.Add('| Carpeta local | Repo GitHub previsto |')
$repoDoc.Add('| --- | --- |')
foreach ($project in $Projects) {
    $repoDoc.Add("| `$($project.Path)` | `https://github.com/$Owner/$($project.Repo)` |")
}
$repoDoc.Add("| `.` | `https://github.com/$Owner/$RootRepo` |")
$repoDoc.Add('')
$repoDoc.Add('Cuando `gh` este instalado y autenticado:')
$repoDoc.Add('')
$repoDoc.Add('```powershell')
foreach ($project in $Projects) {
    $repoDoc.Add("gh repo create $Owner/$($project.Repo) --private")
    $repoDoc.Add("git -C `"$($project.Path)`" push -u origin main")
}
$repoDoc.Add("gh repo create $Owner/$RootRepo --private")
$repoDoc.Add('git push -u origin main')
$repoDoc.Add('```')
Set-Content -LiteralPath (Join-Path $Root 'GITHUB_REPOS.md') -Value $repoDoc -Encoding UTF8

Ensure-Repository -RepositoryPath $Root -RemoteUrl $rootRemoteUrl
Commit-IfNeeded -RepositoryPath $Root -Message 'Initialize laboratory repository map'

Write-Host "Done."
