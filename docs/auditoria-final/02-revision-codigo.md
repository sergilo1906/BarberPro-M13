# Revisión de código y estructura

## Método y límites

Se recuentan los archivos reales, se contrastan los 94 hashes de referencia y las 94 correspondencias, se analiza sintaxis JS/TS, frontmatter Astro y JSON, se resuelven imports locales y se buscan ciclos. `node scripts/auditar-proyecto.mjs` genera [inventario por archivo](inventario-archivos.md), metadatos, declaraciones y enlaces en inventario.json. Los dos ficheros generados se excluyen de su propio cálculo para evitar hashes autorreferenciales. Los scripts Astro se incluyen en el seguimiento de imports, pero la validez completa de sus plantillas corresponde al checker y al build.

Esto no representa revisión semántica individual de cada declaración, ni cobertura de líneas. Los lockfiles se parsean como JSON y se revisan mediante npm y sus grafos, sin inspeccionar manualmente cada biblioteca instalada. Los documentos, configuraciones y recursos forman parte del inventario. No se encontraron archivos propios vacíos en el primer recuento.

La herramienta de inventario requiere este checkout Git, con su .git en la raíz, para enumerar archivos propios y excluir configuraciones privadas. No es un requisito de instalación o ejecución de la aplicación extraída del ZIP. Los hashes del inventario describen los bytes del workspace; el paquete candidato se prepara con esos mismos bytes, sin convertir finales de línea mediante git archive.

Se leyó especialmente la implementación de sesión/permisos, perfil, roles, llamadas remotas, reservas/reprogramación, disponibilidad, fechas, horarios, administración, recordatorios, demo, KPIs, CSV e ICS; las pruebas contrastan sus efectos reales en emuladores. Las páginas conservan URLs y marcado; la comprobación visual se registra por separado. No se declara equivalencia completa de todos los símbolos históricos por haber leído sus módulos.

## Arquitectura y legibilidad

La separación páginas → controlador → datos/backend existe. Frontend Astro estático y TypeScript; backend JavaScript ESM; cuatro roles canónicos. Los controladores no escriben directamente datos de negocio: consumen callables. Modelos y fechas están separados. No se introducen frameworks ni clases artificiales.

Los módulos más costosos de seguir son persistencia-reservas.js (transacción extensa) y cambiar-cita.ts (modal con estado y funciones internas). La separación actual conserva la atomicidad y el ciclo de vida del modal; fragmentarlos mecánicamente introduciría acoplamiento. Conviene una revisión pedagógica con el alumno. Las plantillas constantes de DOM y los callbacks contienen líneas compactas; los nombres públicos ingleses y claves Firestore son contratos externos, no renombrados pendientes por sí mismos. No se renombra indiscriminadamente para aumentar una cifra.

No se han detectado imports locales rotos ni ciclos en el primer análisis (363 enlaces); el inventario final puede añadir enlaces de pruebas y herramientas. La ausencia de ciclos no demuestra ausencia de acoplamiento. El checker TypeScript/Astro sigue siendo la comprobación de tipos y plantillas; el análisis del script no lo sustituye.

## Correspondencias y nomenclatura

[Correspondencias de archivos](correspondencias-archivos.md) contrasta los destinos existentes de los 94 originales. `home-role.client.ts` está fusionado en barra-navegacion.ts: actualiza la tarjeta de inicio por rol; no se crea inicio-publico.ts sin uso. Los tres documentos previstos puesta-en-marcha.md, decisiones.md y pruebas.md se cubren mediante README e informes actuales; su ausencia física no equivale a una función ausente, pero el mapa histórico no acredita su implementación.

El inventario histórico contiene 3.094 registros JS/TS y 28 de reglas, presentados como 3.122. Son decisiones de planificación. Se reconcilia el recuento: 2.827 filas con ID S/R más 295 bindings importados dan 3.122; las otras 35 filas del cuadro de importaciones son imports sin binding. No se cuentan dos veces como variables. Esta auditoría no ha demostrado una biyección semántica completa con la nueva implementación: callbacks fusionados, propiedades wire, SDK y código sustituido no admiten un simple reemplazo textual. La revisión manual de cada símbolo/ámbito y su enlace final queda **NO VERIFICADA**. Ninguna búsqueda de nombres convierte automáticamente esa situación en un 100 %.

El recuento AST independiente del original, quitando BOM y leyendo frontmatter/scripts Astro, se conserva en original-recuento-ast.json: 79 fuentes sin errores de parseo, cero clases e interfaces declaradas, nueve alias de tipo, 240 funciones nombradas y 260 flechas, 995 declaraciones de variable/constante y 295 bindings importados. Sus criterios no son idénticos a los 974 registros históricos de variables ni a los 501 de funciones; no se inventa una equivalencia por coincidir parcialmente los números. Hay 31 controladores frontend originales y dos scripts de backend, además de dos ficheros de pruebas backend.

## Dependencias y correcciones

Astro 4.16.19 y Vitest 2.1.9 arrastraban alertas críticas. Se seleccionan Astro 7.4.8, Vitest 5.1.0, PostCSS 8.5.32 y Node 22.23.4 por requisitos y avisos publicados. Se conserva Tailwind 3.4.18 y Firebase 10.14.1; se fijan undici 6.29.1 y grpc-js 1.14.7 mediante overrides para retirar alertas altas del SDK heredado, sujetos a regresión contra emuladores. Functions pasa a runtime nodejs22, sin despliegue.

No se utilizó force ni legacy-peer-deps: npm rechazó dos resoluciones contra el árbol instalado antiguo. Se guardó el lockfile inicial, se resolvió un lock limpio en un directorio aislado y se instaló con npm ci. La resolución nueva de app informó cero alertas. Las opciones de Vitest y la ruta del ejecutable Astro del runner se adaptaron a sus contratos actuales; el runner lee el bin del propio paquete.

Fuentes consultadas: [Astro 7](https://docs.astro.build/en/guides/upgrade-to/v7/), [aviso crítico AVIF](https://github.com/withastro/astro/security/advisories/GHSA-26w7-cxv4-gfx2), [migración Vitest](https://vitest.dev/guide/migration/), [runtime Firebase](https://firebase.google.com/docs/functions/manage-functions#set_nodejs_version). Las versiones y el resultado de seguridad se contrastan además con npm; no se da por resuelto un aviso solo por actualizar un manifiesto.
