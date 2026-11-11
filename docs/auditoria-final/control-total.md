# Control total y límites de cobertura

El [cierre definitivo](../cierre-definitivo/resultado-final.md) incorpora 225 archivos propios: 223 analizados más los dos informes excluidos de su propia medición. Añade documentación necesaria y CI, sin cambios en aplicación, diseño o dependencias. Repite 44 unitarias, 69 integraciones y 284 navegador (126 visuales incluidas) con código 0. El nuevo ZIP se acredita separadamente en su validación externa. Los recuentos de 216 y 200 siguientes pertenecen a entregas históricas.

El [cierre del 11 de noviembre](../revision-total-2026-11-10.md) consolida 216 archivos preparados (214 en el inventario y dos informes excluidos de su propia medición), 94 correspondencias, 27 rutas, 40 grupos y 3.122 registros con evidencia diferenciada. Los recuentos inferiores corresponden al cierre histórico de 200 archivos. No se declara biyección semántica ni ejecución individual del 100 %.

No se inventan porcentajes. Inventariado, implementado y probado son conceptos distintos. El inventario por archivo se genera con scripts/auditar-proyecto.mjs; no verifica de forma individual todos los escenarios de cada declaración. Los resultados se completan con pruebas reales en 06.

Recuento de cierre: 198 archivos analizados automáticamente y dos informes de inventario autogenerados, 200 archivos propios empaquetables en total. La base recibida contenía 177: se corrigen 33 existentes y se crean 23; no se elimina ninguno. Hay 31 carpetas con archivos propios en la reconstrucción, frente a 13 en el original. El resultado AST actual registra 225 declaraciones de variable y 1.713 constantes, 374 funciones nombradas, 694 flechas, tres métodos, 29 interfaces y siete alias de tipo; incluye pruebas/herramientas y no mide equivalencia ni cobertura de ejecución por símbolo.

| Elemento | Total original | Revisados | Implementados | Probados | Pendientes |
|---|---|---|---|---|---|
| Archivos propios | 94 recontados | 94 por inventario/hash; fuente reconstruida en inventario.json | 94 correspondencias con destinos existentes | Flujo y sintaxis según tipo, no prueba individual de cada archivo | Equivalencia semántica completa por símbolo NO VERIFICADA |
| Carpetas | 13 con archivos propios, recontadas | 13 originales y estructura actual de 31 | Páginas, datos, modelos, módulos, backend, tests y docs | Imports y ejecución | Carpetas vacías y terceros fuera de este recuento |
| Páginas / rutas | 27 | 27 | 27 | 27 rutas; comparaciones reales en tres formatos y matriz por rol | Todos los estados posibles NO VERIFICADOS |
| Componentes / layouts | 3 | 3 equivalentes | 3 | Navegación, estilos y estados en las comparaciones | Otros navegadores/temas no certificados |
| Scripts | 31 controladores frontend y dos scripts backend; 79 fuentes JS/TS/Astro totales | AST y grafo de la fuente actual | Según correspondencias, con fusiones | Checker, unidad, CLI y navegador según módulo | No relación uno a uno de cada callback |
| Variables | 995 declaraciones AST actuales del original; 974 registros históricos con otro criterio | Inventariadas en AST actual; desglose en inventario.json | NO VERIFICADO individualmente | NO VERIFICADO por variable | Correspondencia semántica por ámbito |
| Constantes | Sin desglose fiable separado del agregado anterior | Desglose AST actual, no compara universos distintos | NO VERIFICADO individualmente | NO VERIFICADO por constante | No sumar dos veces al agregado histórico |
| Funciones | 240 nombradas y 260 flechas recontadas; 501 registros históricos con otro criterio | Declaraciones/flechas actuales registradas y núcleos funcionales leídos | NO VERIFICADO uno a uno | Pruebas de comportamiento por áreas | Trazabilidad completa sin certificar |
| Métodos | Cero declaraciones propias según AST original | Declaraciones identificadas por AST actual | Tres declaraciones en el conjunto actual, incluidos tests | No cobertura por método certificada | No contar llamadas SDK como métodos propios |
| Clases | Cero declaraciones propias según AST original | AST actual también identifica cero | No se introducen clases artificiales | No aplica a un conjunto inexistente detectado | Clases de terceros excluidas |
| Interfaces / tipos | Cero interfaces y nueve alias recontados | 29 interfaces y siete alias actuales | Modelos tipados, contratos conservados | TypeScript y flujos | No equivalencia por todas las propiedades históricas |
| Roles | 4 | 4 | client, worker, manager, admin | Matriz de acceso, operaciones y negativas | Firma productiva del token no validable con emulador |
| Permisos | Sin cardinalidad única fiable | 18 políticas de ruta, reglas y operaciones backend | Guards y controles en servidor | Positivos/negativos, token manipulado/antiguo, datos ajenos y actor revocado | Revocación SDK y entorno productivo no certificados |
| Modelos de datos | Sin cardinalidad única independiente | Contratos de perfiles, agenda, catálogo, citas y avisos | Interfaces frontend y validación backend | Datos ficticios/legados y operaciones | Datos reales y migración excluidos |
| Colecciones Firestore | 8 raíz y weeklySchedules | 8 + subcolección | Conservadas | Reglas/integraciones | Índices productivos no desplegados |
| Funciones backend | 13 exports recontados | 13 + seis añadidos | 19 exports | Unidades/integración; job invocado manualmente | SMTP y cron productivos no probados |
| Recursos visuales | Favicon y SVG inline, fuentes externas | Archivo, markup y presentación | Conservados | HTTP y capturas reales | Disponibilidad de fuentes externas y dispositivos físicos |
| Funcionalidades | 40 grupos en catálogo planificado | Contraste por grupos y áreas | Operaciones descritas en 03; no porcentaje global | 44 unitarias, 69 integraciones y 284 navegador | Escenarios no enumerados y cierres globales |
| Pruebas | Dos archivos backend originales, además de configuración | Suite actual y nuevos casos revisados | Pruebas reales, sin omitir fallos para pasar | Resultado final 0; 126 visuales incluidas | Cobertura de líneas/rama NO MEDIDA |
| Documentación | Planificación e informes históricos, sin conteo semántico equivalente | Contraste con archivos/logs y nuevos informes | Diez informes obligatorios, mapas e inventario de auditoría | Comandos ejecutados; enlaces/rutas principales | Cierre académico y trazabilidad pendientes |

Las métricas AST son declaraciones según el parser y su alcance: incluyen código de pruebas y herramientas, excluyen bibliotecas y no equivalen al inventario histórico por propiedades/ámbitos. Los dos ficheros autogenerados de inventario se excluyen de sus propios hashes; sí se empaquetan y se escanean como contenido. Las posiciones del frontmatter Astro se ajustan a la línea del archivo, y su plantilla completa se contrasta con Astro Check/build.
