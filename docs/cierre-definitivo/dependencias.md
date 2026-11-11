# Dependencias analizadas en el cierre

Análisis nuevo del 11/11/2026 con Node 22.23.4 y npm 10.9.0, sin modificar lockfiles ni instalar actualizaciones. `npm audit --json` devolvió 1 en raíz/Functions y 0 en app: 14 nodos moderados, nueve moderados y cero alertas respectivamente; ninguna alta/crítica. Los nodos incluyen propagaciones por dependencias, no 23 avisos independientes.

| Aviso directo subyacente | Instalado / ruta | Versión corregida y decisión |
| --- | --- | --- |
| [uuid: límites de buffer en v3/v5/v6](https://github.com/advisories/GHSA-w5hq-g745-h8pq) | uuid 9.0.1 en herramientas; 9.0.1 y 10.0.0 transitivos de Admin/gaxios/google-gax/teeny-request | 11.1.1 o ramas posteriores corregidas; fuera de ^9/^10. No forzar un cambio mayor transitivo al cerrar una demo. |
| [minimatch: amplificación globparts](https://github.com/advisories/GHSA-g3hv-75wg-m249) | 9.0.9 bajo glob 10.5.0 de Firebase CLI | 11.0.1, fuera de ^9. Herramienta local, no entrada de negocio expuesta por la aplicación. |
| [glob: cancelación que deja recorrido de disco](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) | glob 10.5.0 del CLI, archiver-utils, exegesis y rimraf | 14.0.2, fuera de ^10. No imponer un override mayor sobre esas herramientas. |
| [OpenTelemetry: procesamiento de baggage](https://github.com/advisories/GHSA-8988-4f7v-96qf) | core 1.30.1 transitivo de @google-cloud/pubsub del CLI | 2.8.0, fuera de ^1.30.1. No se expone una ruta de telemetría de Pub/Sub de la aplicación. |

Paquetes directos señalados por propagación: `firebase-tools` en raíz; `firebase-admin` y `firebase-functions` en backend. Los paquetes subyacentes afectados son transitivos. El informe también marca archiver, archiver-utils, exegesis, gaxios, gcp-metadata, google-gax, rimraf, zip-stream, Firestore/Storage de Google Cloud, retry-request y teeny-request por esas cadenas. La app tiene cero alertas en este análisis, no una garantía permanente.

Se simuló `npm audit fix --dry-run --ignore-scripts --json` en raíz y Functions. No propone cambios de versiones compatibles que resuelvan estos avisos; Functions conserva nueve, y raíz conserva catorce. En raíz la simulación lista dos auxiliares del binario Node como retirables, sin reparación de los avisos: no se aplicó. La recomendación global de npm incluye bajar Firebase CLI de 15.35.0 a 13.11.2 o subir Admin a 14.5.0 y Functions a 7.4.0. No es una reparación de parche dentro de los rangos fijados y no se ejecuta. No se usa `audit fix --force` ni se declara resuelto lo que sigue apareciendo.

Exposición de esta entrega: web y emuladores solo en loopback y proyecto demo; sin Pub/Sub productivo, entradas de glob elegidas por usuarios remotos, uso propio de uuid v3/v5/v6 con buffers externos, ni configuración productiva habilitada. Es una evaluación limitada del alcance y del código propio, no una prueba exhaustiva de todos los caminos de terceros ni afirmación de inexplotabilidad. No abrir los emuladores a una red no confiable. Antes de una implantación real habría que planificar las actualizaciones mayores y validarlas aparte.

Versiones y lockfiles se conservan para reproducibilidad. Los overrides ya existentes de undici/grpc-js siguen fijados y se vuelven a contrastar con la regresión. Las fuentes enlazadas son los avisos primarios revisados; las salidas completas nuevas se conservan localmente en `.verificacion/cierre-definitivo-2026-11-11/`.
