param(
  [Parameter(Mandatory = $true)]
  [string]$Destino
)

$ErrorActionPreference = 'Stop'
$raizProyecto = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$archivoZip = [IO.Path]::GetFullPath($Destino)
if ($archivoZip.StartsWith($raizProyecto + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
  throw 'Guardar la entrega fuera del proyecto para no acumular copias.'
}
if ([IO.Path]::GetExtension($archivoZip) -ne '.zip' -or (Test-Path -LiteralPath $archivoZip)) {
  throw 'El destino debe ser un ZIP nuevo; no se sobrescriben entregas.'
}
if (-not (Test-Path -LiteralPath (Join-Path $raizProyecto '.git'))) {
  throw 'Se requiere el checkout Git propio.'
}
$rutas = & git -C $raizProyecto ls-files --cached --others --exclude-standard
if ($LASTEXITCODE -ne 0) { throw 'No se pudo enumerar la fuente.' }
New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($archivoZip)) -Force | Out-Null
Add-Type -AssemblyName System.IO.Compression
$salidaZip = [IO.File]::Open($archivoZip, [IO.FileMode]::CreateNew)
$paquete = [IO.Compression.ZipArchive]::new($salidaZip, [IO.Compression.ZipArchiveMode]::Create)
$cantidad = 0
try {
  foreach ($ruta in ($rutas | Sort-Object -Unique)) {
    if ($ruta -match '(^|/)(node_modules|dist|\.git|\.astro|\.verificacion|entrega|test-results|playwright-report)(/|$)' -or $ruta -match '\.(log|zip|bak|old)$') {
      throw ('Archivo generado o innecesario: ' + $ruta)
    }
    if ($ruta -match '(^|/)\.env($|\.)' -and $ruta -notmatch '(^|/)\.env\.example$') {
      throw ('Configuracion privada: ' + $ruta)
    }
    $origen = [IO.Path]::GetFullPath((Join-Path $raizProyecto $ruta))
    if (-not $origen.StartsWith($raizProyecto + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
      throw 'La ruta sale del proyecto.'
    }
    # Añadir directamente evita crear otra copia de la fuente.
    $entrada = $paquete.CreateEntry(('BarberPro-M13/' + $ruta), [IO.Compression.CompressionLevel]::Optimal)
    $flujoEntrada = $entrada.Open()
    $flujoFuente = [IO.File]::OpenRead($origen)
    try { $flujoFuente.CopyTo($flujoEntrada) }
    finally { $flujoFuente.Dispose(); $flujoEntrada.Dispose() }
    $cantidad++
  }
}
finally { $paquete.Dispose(); $salidaZip.Dispose() }
$hash = (Get-FileHash -LiteralPath $archivoZip -Algorithm SHA256).Hash.ToLowerInvariant()
[IO.File]::WriteAllText($archivoZip + '.sha256', $hash + '  ' + [IO.Path]::GetFileName($archivoZip) + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
[pscustomobject]@{ Archivo = $archivoZip; Archivos = $cantidad; SHA256 = $hash } | ConvertTo-Json -Compress
