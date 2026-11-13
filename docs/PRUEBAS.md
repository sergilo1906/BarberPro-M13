# Pruebas de la versión de evaluación

La refactorización requiere una regresión nueva: los resultados de releases históricas no acreditan esta versión. El informe de validación adjunto a la release evaluacion-m13-2026-11-13 identifica commit, ZIP/SHA-256, instalación limpia y resultados exactos; no hay hashes autorreferenciales en la fuente.

## Ejecutar

Con Node 22.23.4, npm 10 o posterior, Java 21 y los puertos libres:

```powershell
npm ci
npm --prefix app ci
npm --prefix functions ci
npm --prefix app exec -- playwright install chromium
npm run check
npm run build
npm run test:unit
npm test
node scripts/trazar-simbolos.mjs
```

npm test ya encadena checker, unitarias e integración: usa exclusivamente emuladores desechables de demo-barberpro-m13, compila, ejecuta navegador y apaga servicios. No tener servidores manuales en los mismos puertos ni datos que se deseen conservar.

## Alcance

La suite incluye 44 unitarias (29 frontend y 15 backend), 69 integraciones y 284 casos de navegador del workspace. De esos 284, 126 son comparaciones de 42 estados en tres formatos y 158 recorridos funcionales. Se prueban cuentas, cuatro roles, permisos vigentes, reservas simultáneas, duración completa, reintentos/idempotencia, cancelación/reprogramación, horarios, bloqueos, sesión, estadísticas, CSV/ICS, recordatorios y demo protegida. Mantener aserciones y tolerancias.

En una extracción independiente no existe el original: esas 126 visuales se omiten explícitamente y no se cuentan como aprobadas. La aplicación y los otros tests funcionan sin el original. La comparación del workspace lo sirve aislado, sin ejecutar escritores/SDK originales; no modifica ese proyecto.

Escritorio, móvil iPhone 13 y tableta son Chromium emulado, no Safari ni dispositivos físicos. No se certifican producción, SMTP, cron desplegado, carga, firma productiva de tokens ni cobertura de líneas del 100 %. La tabla de símbolos es trazabilidad estructural y decisiones, no equivalencia matemática individual.

## Resultado de esta versión

La regresión corregida del 13/11/2026 termina con código 0: checker de 106 archivos sin diagnósticos, build de 27 páginas, 44 unitarias, 69 integraciones y 284 casos de navegador, ninguno omitido. Las 126 comparaciones visuales están incluidas en los 284; no se suman otra vez. También pasan los comandos separados check, build y test:unit y el análisis TypeScript de declaraciones/parámetros sin uso.

La primera pasada había fallado en Servicios/tableta por 3 px de ancho de un input. Se investigó sin relajar tolerancias ni aserciones: los controles se inicializaban mediante value/checked, sin reflejar los atributos iniciales del original. El código real usa ahora defaultValue/defaultChecked, manteniendo propiedades DOM seguras. La comparación específica pasa 3/3 en escritorio, móvil y tableta y después la regresión completa vuelve a pasar. La instrumentación temporal se retiró; los tests finales permanecen iguales a la base. El informe adjunto conserva ese fallo y distingue los intentos de las pruebas finales.

La instalación limpia y las pruebas del ZIP congelado se acreditan separadamente en el informe de validación de evaluacion-m13-2026-11-13, con su commit y SHA-256. No se atribuye al paquete el verde del workspace ni el de un ZIP histórico. La comprobación personal del alumno es independiente y no se marca realizada por las pruebas automatizadas.
