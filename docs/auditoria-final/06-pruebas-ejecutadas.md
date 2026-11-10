# Pruebas ejecutadas y resultados

Auditoría iniciada el 10 de noviembre de 2026 sobre 5b11204. No se presentan los resultados históricos de fases como una ejecución nueva. Los logs completos y trazas quedan en .verificacion/auditoria-final, excluidos del código y del paquete por contener resultados temporales de emuladores.

## Regresión real

| Ejecución | Resultado observado |
|---|---|
| Baseline conservado, anterior a esta auditoría | 43 unitarias, 67 integraciones, 212 navegador. Se leyó el log asociado a la base, sin llamarlo nueva ejecución. |
| npm run check / test:unit / build tras actualizar herramientas | Salida 0; checker sin diagnósticos, 43 unitarias y 27 páginas. Después se amplió la prueba ICS. |
| npm test, primera pasada (regresion-completa.log) | Salida 1: 43 unitarias y 68 integraciones correctas; 232 navegador correctas y 8 fallos visuales de Perfil/KPI por espacios del nuevo compilador. Tableta no se ejecutó porque el runner conserva el fallo. |
| npm test, segunda pasada (regresion-final.log) | Salida 1: 44 unitarias y 69 integraciones correctas; 238 navegador correctas y 2 fallos funcionales. Comparaciones visuales de escritorio/móvil correctas. No se ejecutó tableta. |
| npm test, pasada validada (regresion-validada.log) | **Salida 0: 44 unitarias, 69 integraciones, 284 navegador correctas; ninguna omitida. Build de 27 páginas.** |

La pasada validada contiene 29 unitarias frontend en ocho ficheros y 15 backend. Integraciones: 33 del primer grupo (cuentas/reservas/concurrencia), 4 de cliente, 11 de profesional, 11 de administración y 10 restantes. Browser: 242 escritorio/móvil y 42 visuales de tableta. Del total, 126 son comparaciones visuales y 158 recorridos/accesos funcionales. No se suman las visuales otra vez al total.

Astro/TypeScript examina 106 archivos: cero errores, warnings y hints; sintaxis backend correcta. Se ejecuta con Node 22.23.4 fijado localmente, Astro 7.4.8 y Vitest 5.1.0. La suite finalizó y detuvo sus emuladores/servidores; se comprobaron libres sus puertos. No se instalaron tareas productivas ni se enviaron correos reales.

## Causas contrastadas de fallos y comprobaciones posteriores

- Espacios inline desaparecidos: se inspeccionaron HTML compilados y trazas. Perfil concatenaba etiqueta/estado; KPI se desplazaba 2,8125 px. Espacios explícitos corrigen el marcado. No se cambian los límites de imagen/geometría.
- Segunda pasada: un recorrido esperó un slot durante 30 s. El log del emulador mostró cinco getAvailability simultáneos y fallo de carga de workers; no fue una reserva duplicada ni una autorización concedida. Se agrupan cambios rápidos y la nueva prueba verifica una sola petición y los valores finales. No se certifica la causa completa de la lentitud del emulador ni se aumenta el timeout global.
- Un fixture móvil de cambio de cuenta agotó la espera conservando el usuario anterior. Se espera la restauración de Auth en la otra pestaña antes de modificar IndexedDB y se devuelve el foco. Se conservan las aserciones de identidad/limpieza y datos no confirmados. El timeout por sí solo no acredita una fuga de datos del producto.
- Las dos nuevas integraciones administrativas verifican actor revocado y conservación de ficha oculta/nombre. El ICS largo pasó de una línea de 192 octetos a un máximo de 75, comprobando despliegue de líneas y caracteres UTF-8.

Las trazas representativas de fallos están en fallos-primera-pasada y fallos-segunda-pasada. No se borraron casos ni se configuraron retries para convertir estos fallos en verde. Las nuevas ejecuciones se justifican por correcciones concretas.

## Otras comprobaciones ejecutadas

- node scripts/auditar-proyecto.mjs: inventario reproducible de fuente propia, declaraciones AST, imports locales y ciclos. El resumen final está en inventario.json. No equivale a revisión semántica de todos los símbolos ni cobertura de líneas.
- Recuento independiente original: 94 archivos propios, 79 archivos JS/TS/Astro, 27 páginas y 13 exports del index backend; sin originales adicionales/ausentes frente al mapa. Las bibliotecas y builds se excluyen del recuento propio.
- Simulación real de asignar-roles.mjs con --uid reservas-client --role worker, sin --aplicar; y normalizar-roles.mjs --uid reservas-client. Ambas salieron 0 y se compararon perfil/claims antes/después: intactos. No se migran usuarios reales.
- Metadata generada por el SDK: región europe-west1, memoria 256 MiB y timeout 120 s; aserciones correctas tras corregir GlobalOptions. Sintaxis del empaquetador PowerShell comprobada con su parser.
- npm audit inicial/final en los tres manifiestos. Resultado final: raíz 14 moderadas; app 0; Functions 9 moderadas. Cero altas/críticas en los tres árboles. Son nodos afectados de npm, no CVE únicas. Informe numérico autocontenido en dependencias-resultados.json. No se utilizó npm audit fix --force ni legacy-peer-deps.
- GitHub consultado por conector y referencia Git: público, sergilo1906/BarberPro-M13, main, 5b11204. La auditoría no se publica. No se modifica la visibilidad ni el historial remoto.

Gitleaks 8.30.1 sobre historial y fuente del paquete: salida 0, sin fugas detectadas. Los 94 hashes del original coinciden. El ZIP de ejecución se extrajo, instaló con npm ci y superó npm test: 44 unitarias, 69 integraciones y 158 navegador funcionales; checker/build correctos. Las 126 visuales se omiten por ausencia del original en esa copia, no se toman como PASS. El candidato final y sus comprobaciones separadas se registran en 08-entrega-github.md y en el registro externo junto al ZIP; no se anticipa su resultado por haber pasado el workspace.

## Límites de la evidencia

Emuladores de Auth/Firestore/Functions y Chromium. No producción, SMTP, Safari, dispositivos físicos, firma criptográfica de tokens del emulador, carga masiva, índices desplegados ni importación manual en todas las hojas de cálculo/calendarios. Los errores permission-denied de pruebas negativas y SIGINT al detener Firestore son esperados; el fallo de carga de worker de la segunda pasada se registra como inesperado, no se oculta.

El inventario histórico de 3.122 símbolos no tiene todavía equivalencia semántica individual certificada. Se declara NO VERIFICADO ese nivel en control-total.md. Ningún contador de pruebas acredita por sí solo el 100 % de funcionalidades, variables o seguridad.
