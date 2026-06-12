param(
  [string] $ZipPath = "C:\Users\juanf\Downloads\Certificados.zip",
  [string] $OutputRoot = (Join-Path (Get-Location) "certificados")
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.Web

function ConvertTo-Slug {
  param([string] $Value)

  $normalized = $Value.Normalize([System.Text.NormalizationForm]::FormD)
  $builder = [System.Text.StringBuilder]::new()

  foreach ($char in $normalized.ToCharArray()) {
    $category = [System.Globalization.CharUnicodeInfo]::GetUnicodeCategory($char)
    if ($category -ne [System.Globalization.UnicodeCategory]::NonSpacingMark) {
      [void] $builder.Append($char)
    }
  }

  $slug = $builder.ToString().Normalize([System.Text.NormalizationForm]::FormC).ToLowerInvariant()
  $slug = $slug -replace "[^a-z0-9]+", "-"
  $slug = $slug.Trim("-")

  if ([string]::IsNullOrWhiteSpace($slug)) {
    return "certificado"
  }

  return $slug
}

function ConvertTo-Title {
  param([string] $BaseName)

  $title = $BaseName -replace "_", " "
  $title = $title -replace "^Certificado del curso\s+", ""
  $title = $title -replace "\s+", " "
  $title = $title.Trim(" -_")

  $knownTitles = @{
    "Chatgptsinlimites" = "ChatGPT sin limites"
    "DataFundamentals Badge20240926-7-zfbdsf" = "Data Fundamentals Badge"
    "Instroduccion a la robotica con Arduino" = "Introduccion a la robotica con Arduino"
    "Serguridad Informatica" = "Seguridad Informatica"
    "generated" = "Certificado adicional"
  }

  if ($knownTitles.ContainsKey($title)) {
    return $knownTitles[$title]
  }

  return $title
}

function Save-ZipEntry {
  param(
    [System.IO.Compression.ZipArchiveEntry] $Entry,
    [string] $Destination
  )

  $parent = Split-Path -Parent $Destination
  New-Item -ItemType Directory -Force -Path $parent | Out-Null

  $inputStream = $Entry.Open()
  try {
    $outputStream = [System.IO.File]::Create($Destination)
    try {
      $inputStream.CopyTo($outputStream)
    } finally {
      $outputStream.Dispose()
    }
  } finally {
    $inputStream.Dispose()
  }
}

function HtmlEncode {
  param([string] $Value)
  return [System.Web.HttpUtility]::HtmlEncode($Value)
}

if (-not (Test-Path -LiteralPath $ZipPath)) {
  throw "No se encontro el ZIP: $ZipPath"
}

if (Test-Path -LiteralPath $OutputRoot) {
  throw "La carpeta de salida ya existe. Borra o renombra primero: $OutputRoot"
}

$zip = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
try {
  $groups = [ordered] @{}

  foreach ($entry in $zip.Entries) {
    if ([string]::IsNullOrWhiteSpace($entry.Name)) {
      continue
    }

    $extension = [System.IO.Path]::GetExtension($entry.Name).ToLowerInvariant()
    if ($extension -notin @(".pdf", ".jpg", ".jpeg", ".png")) {
      continue
    }

    $nameWithoutExtension = [System.IO.Path]::GetFileNameWithoutExtension($entry.Name)
    $baseName = $nameWithoutExtension -replace "_page-\d+$", ""

    if ($baseName -eq "generated") {
      $baseName = "Programador javascript"
    }

    if (-not $groups.Contains($baseName)) {
      $groups[$baseName] = [System.Collections.Generic.List[object]]::new()
    }

    $groups[$baseName].Add([pscustomobject] @{
      Entry = $entry
      Extension = $extension
      OriginalName = $entry.Name
      Length = $entry.Length
    })
  }

  New-Item -ItemType Directory -Force -Path $OutputRoot | Out-Null

  $usedSlugs = @{}
  $certificates = [System.Collections.Generic.List[object]]::new()

  foreach ($baseName in $groups.Keys) {
    $title = ConvertTo-Title $baseName
    $slug = ConvertTo-Slug $title
    $candidate = $slug
    $counter = 2

    while ($usedSlugs.ContainsKey($candidate)) {
      $candidate = "$slug-$counter"
      $counter += 1
    }

    $slug = $candidate
    $usedSlugs[$slug] = $true

    $certificateDir = Join-Path $OutputRoot $slug
    New-Item -ItemType Directory -Force -Path $certificateDir | Out-Null

    $items = $groups[$baseName]
    $pdfItem = $items | Where-Object { $_.Extension -eq ".pdf" } | Select-Object -First 1
    $imageItem = $items | Where-Object { $_.Extension -in @(".jpg", ".jpeg", ".png") } | Select-Object -First 1

    $pdfFile = $null
    $imageFile = $null

    if ($pdfItem) {
      $pdfFile = "certificado.pdf"
      Save-ZipEntry -Entry $pdfItem.Entry -Destination (Join-Path $certificateDir $pdfFile)
    }

    if ($imageItem) {
      $imageExtension = if ($imageItem.Extension -eq ".png") { ".png" } else { ".jpg" }
      $imageFile = "vista-previa$imageExtension"
      Save-ZipEntry -Entry $imageItem.Entry -Destination (Join-Path $certificateDir $imageFile)
    }

    $sourceFiles = @($items | ForEach-Object { $_.OriginalName })
    $certificates.Add([pscustomobject] @{
      title = $title
      slug = $slug
      page = "$slug/"
      pdf = $pdfFile
      image = $imageFile
      sourceFiles = $sourceFiles
    })

    $safeTitle = HtmlEncode $title
    $previewHtml = ""

    if ($imageFile) {
      $safeImage = HtmlEncode $imageFile
      $previewHtml = "<img class=""certificate-preview"" src=""$safeImage"" alt=""$safeTitle"">"
    } elseif ($pdfFile) {
      $safePdf = HtmlEncode $pdfFile
      $previewHtml = "<object class=""certificate-pdf"" data=""$safePdf"" type=""application/pdf""><p>No se pudo previsualizar el PDF. <a href=""$safePdf"">Abrir certificado</a>.</p></object>"
    }

    $pdfLink = ""
    if ($pdfFile) {
      $safePdf = HtmlEncode $pdfFile
      $pdfLink = "<a class=""button primary"" href=""$safePdf"">Abrir PDF</a>"
    }

    $imageLink = ""
    if ($imageFile) {
      $safeImage = HtmlEncode $imageFile
      $imageLink = "<a class=""button"" href=""$safeImage"">Abrir imagen</a>"
    }

    $sourceItems = ($sourceFiles | ForEach-Object { "<li>$(HtmlEncode $_)</li>" }) -join "`n"

    $pageHtml = @"
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>$safeTitle | Certificados</title>
    <link rel="stylesheet" href="../styles.css">
  </head>
  <body>
    <main class="certificate-page">
      <p class="eyebrow"><a href="../">Certificados</a></p>
      <h1>$safeTitle</h1>
      <div class="actions">
        $pdfLink
        $imageLink
      </div>
      <section class="viewer" aria-label="Vista del certificado">
        $previewHtml
      </section>
      <section class="meta">
        <h2>Archivos fuente</h2>
        <ul>
          $sourceItems
        </ul>
      </section>
    </main>
  </body>
</html>
"@

    Set-Content -LiteralPath (Join-Path $certificateDir "index.html") -Value $pageHtml -Encoding UTF8

    $metadata = [pscustomobject] @{
      title = $title
      slug = $slug
      sourceFiles = $sourceFiles
      pdf = $pdfFile
      image = $imageFile
    }
    $metadata | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $certificateDir "metadata.json") -Encoding UTF8
  }

  $style = @"
:root {
  color-scheme: light;
  font-family: Arial, "Segoe UI", sans-serif;
  background: #f5f7fb;
  color: #172024;
}

body {
  margin: 0;
  min-height: 100vh;
}

a {
  color: #1f5f8b;
  font-weight: 700;
}

.certificate-index,
.certificate-page {
  width: min(1120px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 32px 0 48px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #5d6b78;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1 {
  margin: 0 0 12px;
  font-size: clamp(2rem, 5vw, 3.2rem);
  line-height: 1.05;
}

h2 {
  margin-top: 0;
}

.intro {
  max-width: 760px;
  margin: 0 0 24px;
  color: #52616b;
  line-height: 1.6;
}

.certificate-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.certificate-card {
  display: block;
  padding: 18px;
  min-height: 112px;
  border: 1px solid rgba(23, 32, 36, 0.14);
  border-radius: 8px;
  background: #ffffff;
  color: inherit;
  text-decoration: none;
}

.certificate-card strong {
  display: block;
  margin-bottom: 14px;
  line-height: 1.25;
}

.certificate-card span {
  color: #5d6b78;
  font-size: 0.92rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 20px 0;
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid rgba(31, 95, 139, 0.4);
  border-radius: 6px;
  background: #ffffff;
  color: #1f5f8b;
  text-decoration: none;
}

.button.primary {
  background: #1f5f8b;
  color: #ffffff;
}

.viewer {
  overflow: hidden;
  border: 1px solid rgba(23, 32, 36, 0.16);
  border-radius: 8px;
  background: #ffffff;
}

.certificate-preview {
  display: block;
  width: 100%;
  height: auto;
}

.certificate-pdf {
  display: block;
  width: 100%;
  min-height: 80vh;
  border: 0;
}

.meta {
  margin-top: 24px;
  padding: 18px;
  border: 1px solid rgba(23, 32, 36, 0.12);
  border-radius: 8px;
  background: #ffffff;
}

.meta ul {
  margin: 0;
  padding-left: 20px;
}
"@

  Set-Content -LiteralPath (Join-Path $OutputRoot "styles.css") -Value $style -Encoding UTF8

  $cards = ($certificates | ForEach-Object {
    $safeCardTitle = HtmlEncode $_.title
    $safeSlug = HtmlEncode $_.slug
    "<a class=""certificate-card"" href=""$safeSlug/""><strong>$safeCardTitle</strong><span>URL independiente</span></a>"
  }) -join "`n"

  $indexHtml = @"
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Certificados | Laboratorio Megazzonia</title>
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <main class="certificate-index">
      <p class="eyebrow">Laboratorio Megazzonia</p>
      <h1>Certificados</h1>
      <p class="intro">Cada certificacion tiene su propia pagina y archivos directos para usar como URL independiente en GitHub Pages.</p>
      <section class="certificate-grid" aria-label="Lista de certificados">
        $cards
      </section>
    </main>
  </body>
</html>
"@

  Set-Content -LiteralPath (Join-Path $OutputRoot "index.html") -Value $indexHtml -Encoding UTF8
  $certificates | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $OutputRoot "certificados.json") -Encoding UTF8

  $readme = @'
# Certificados

Carpeta preparada para GitHub Pages. Cada certificado tiene:

- `index.html`: pagina publica independiente.
- `certificado.pdf`: PDF directo cuando existe en el ZIP.
- `vista-previa.jpg` o `vista-previa.png`: imagen de vista previa cuando existe en el ZIP.
- `metadata.json`: datos de origen y archivos incluidos.

Si GitHub Pages publica este repositorio desde la raiz, el patron de URL sera:

`https://juanfranco1985.github.io/laboratorio-megazzonia/certificados/<slug>/`

Indice general:

`https://juanfranco1985.github.io/laboratorio-megazzonia/certificados/`
'@

  Set-Content -LiteralPath (Join-Path $OutputRoot "README.md") -Value $readme -Encoding UTF8

  Write-Host "Certificados generados: $($certificates.Count)"
  Write-Host "Salida: $OutputRoot"
} finally {
  $zip.Dispose()
}
