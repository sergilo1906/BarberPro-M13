param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[a-zA-Z0-9][a-zA-Z0-9._-]*\.zip$')]
  [string]$Nombre
)

$ErrorActionPreference = 'Stop'
$raizProyecto = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
if (-not (Test-Path -LiteralPath (Join-Path $raizProyecto '.git'))) {
  throw 'Preparar el paquete requiere el checkout propio, no el repositorio de una carpeta antecesora.'
}
$carpetaEntrega = Join-Path $raizProyecto 'entrega'
$carpetaPreparacion = Join-Path $raizProyecto ('.verificacion\auditoria-final\paquete-' + [IO.Path]::GetFileNameWithoutExtension($Nombre))
$archivoZip = Join-Path $carpetaEntrega $Nombre
if ((Test-Path -LiteralPath $archivoZip) -or (Test-Path -LiteralPath $carpetaPreparacion)) {
  throw 'Ya existe un paquete con ese nombre. Usar otro nombre; no se sobrescriben paquetes anteriores.'
}
New-Item -ItemType Directory -Path $carpetaEntrega -Force | Out-Null
$destinoFuente = Join-Path $carpetaPreparacion 'BarberPro-M13'
New-Item -ItemType Directory -Path $destinoFuente -Force | Out-Null
$rutas = & git -C $raizProyecto ls-files --cached --others --exclude-standard
if ($LASTEXITCODE -ne 0) { throw 'No se pudo enumerar la fuente propia.' }
$cantidad = 0
foreach ($ruta in ($rutas | Sort-Object -Unique)) {
  if ($ruta -match '(^|/)(node_modules|dist|\.git|\.astro|\.verificacion|entrega|test-results|playwright-report)(/|$)' -or $ruta -match '\.(log|zip)$') {
    throw ('Ruta generada o privada inesperadamente versionable: ' + $ruta)
  }
  if ($ruta -match '(^|/)\.env($|\.)' -and $ruta -notmatch '(^|/)\.env\.example$') {
    throw ('Configuracion local inesperadamente versionable: ' + $ruta)
  }
  $origen = [IO.Path]::GetFullPath((Join-Path $raizProyecto $ruta))
  if (-not $origen.StartsWith($raizProyecto + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Una ruta de origen sale del proyecto.'
  }
  $destino = Join-Path $destinoFuente $ruta
  New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($destino)) -Force | Out-Null
  # Copiar bytes actuales conserva los hashes del inventario, incluidos finales de linea.
  Copy-Item -LiteralPath $origen -Destination $destino
  $cantidad++
}
Add-Type -AssemblyName System.IO.Compression.FileSystem
[IO.Compression.ZipFile]::CreateFromDirectory($carpetaPreparacion, $archivoZip, [IO.Compression.CompressionLevel]::Optimal, $false)
$hash = (Get-FileHash -LiteralPath $archivoZip -Algorithm SHA256).Hash.ToLowerInvariant()
[IO.File]::WriteAllText($archivoZip + '.sha256', $hash + '  ' + $Nombre + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
[pscustomobject]@{ Archivo = $archivoZip; Archivos = $cantidad; SHA256 = $hash } | ConvertTo-Json -Compress
