# Fase 3 — implementación real de la base

## A. Resumen y alcance

Estado: base de fase 3 completada, con las limitaciones expresas de este informe. Se han creado 65 archivos propios en BarberPro-M13, sin copiar el proyecto completo ni modificar el original. Se han leído arquitectura.md, mapa-archivos.md, mapa-simbolos.md, rutas-y-roles.md, funcionalidades.md, plan-reconstruccion.md y control-cobertura.md en ../BarberPro-M13-Planificacion/docs antes de implementar.

Funcionan el arranque local, la compilación estática de las 27 páginas, las seis páginas públicas, su navegación, los recursos comunes, el 404 y el endpoint de salud probado de forma unitaria. Las otras 21 rutas conservan sus URLs y muestran una vista no disponible. Esto NO acredita autenticación, autorización ni operaciones de negocio.

Firebase queda desactivado por defecto. No se ha creado .env.local ni copiado credenciales. El módulo cliente no inicia servicios al importarse: solo una llamada explícita y una configuración demo válida permiten obtener Auth, Firestore y Functions, conectados los tres a loopback antes de entregarlos al consumidor. El código público no importa este módulo y funciona sin Firebase. La fuente Manrope sigue obteniéndose de Google Fonts, como en el original: el modo sin Firebase no equivale a disponibilidad completa sin Internet.

La identidad, los claims, los guards, los permisos y las reglas reales corresponden a fase 4. Las reglas nuevas deniegan todo; no se han desplegado. Tampoco se han implementado reservas, disponibilidad, personal, administración ni recordatorios. No se ha iniciado fase 4.

La referencia más reciente para fase 3 es 7 horas; la tabla histórica de fase 2 asignaba 8 horas a este bloque. Se registra esta diferencia sin modificar la planificación histórica. El objetivo global sigue siendo 92 horas más 8 de margen y las pausas no cuentan como desarrollo. Ninguna estimación se presenta como tiempo realmente trabajado.

## B. Estructura implementada

Árbol real de archivos propios y carpetas preparadas. Se omiten .git, node_modules, dist, .astro, resultados y evidencias generadas. Las carpetas vacías preparan módulos futuros: Git no versiona directorios vacíos y se crearán al añadir su primer archivo en otro checkout.

```text
BarberPro-M13/
├── .firebaserc
├── .gitignore
├── .nvmrc
├── app/
│   ├── .env.example
│   ├── astro.config.mjs
│   ├── package-lock.json
│   ├── package.json
│   ├── playwright.config.ts
│   ├── postcss.config.cjs
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── BarraNavegacion.astro
│   │   │   └── LeyendaDisponibilidad.astro
│   │   ├── comun/
│   │   ├── datos/
│   │   │   └── firebase.ts
│   │   ├── env.d.ts
│   │   ├── exportaciones/
│   │   ├── layouts/
│   │   │   └── DisenoPrincipal.astro
│   │   ├── modelos/
│   │   │   └── cuentas.ts
│   │   ├── modulos/
│   │   │   ├── administracion/
│   │   │   ├── cuentas/
│   │   │   ├── estadisticas/
│   │   │   ├── navegacion/
│   │   │   ├── profesionales/
│   │   │   └── reservas/
│   │   ├── pages/
│   │   │   ├── 404.astro
│   │   │   ├── admin/
│   │   │   │   ├── index.astro
│   │   │   │   └── usuarios.astro
│   │   │   ├── agenda.astro
│   │   │   ├── ayuda.astro
│   │   │   ├── bloqueos.astro
│   │   │   ├── branding.astro
│   │   │   ├── debug.astro
│   │   │   ├── equipo.astro
│   │   │   ├── export.astro
│   │   │   ├── horarios.astro
│   │   │   ├── index-admin.astro
│   │   │   ├── index-client.astro
│   │   │   ├── index.astro
│   │   │   ├── kpis.astro
│   │   │   ├── legal.astro
│   │   │   ├── login.astro
│   │   │   ├── mis-citas.astro
│   │   │   ├── panel-barbero.astro
│   │   │   ├── panel.astro
│   │   │   ├── perfil.astro
│   │   │   ├── planes.astro
│   │   │   ├── registro.astro
│   │   │   ├── reservar.astro
│   │   │   ├── servicios.astro
│   │   │   ├── setup-barber.astro
│   │   │   └── verify.astro
│   │   └── styles/
│   │       └── tailwind.css
│   ├── tailwind.config.cjs
│   ├── tests/
│   │   ├── e2e/
│   │   │   ├── acceso.test.ts
│   │   │   ├── comparacion-visual.test.ts
│   │   │   └── servidor-estatico.mjs
│   │   └── unit/
│   │       └── configuracion.test.ts
│   └── tsconfig.json
├── docs/
│   ├── control-avance.md
│   └── fase-3-implementacion.md
├── firebase.json
├── firestore.indexes.json
├── firestore.rules
├── functions/
│   ├── index.js
│   ├── package-lock.json
│   ├── package.json
│   ├── scripts/
│   ├── src/
│   │   ├── firebase.js
│   │   └── salud.js
│   └── tests/
│       ├── emuladores/
│       └── unit/
│           └── salud.test.mjs
├── package-lock.json
├── package.json
├── README.md
└── storage.rules
```

Son 65 archivos propios; los tres package-lock son nuevos bloqueos generados de los manifiestos nuevos. Dependencias y compilaciones antiguas quedan fuera del nuevo código.

## C. Archivos creados

Inventario completo. Una referencia original indica trazabilidad de responsabilidad, no una copia íntegra. Para páginas pendientes solo se ha reconstruido la estructura común; su controlador y comportamiento siguen pendientes. En archivos sin importaciones se indica la herramienta o contrato que los consume.

| Archivo | Responsabilidad y estado | Original de referencia | Funciones o componentes principales | Dependencias |
|---|---|---|---|---|
| `.firebaserc` | Alias local demo y destino studio; no copiar enlaces productivos. | `.firebaserc` | Configuración, estilos o documentación; sin API exportada. | Herramienta correspondiente (npm/Astro/TypeScript/Tailwind/Firebase); sin imports de aplicación. |
| `.gitignore` | Excluye dependencias, compilaciones, cachés, evidencias y configuración privada. | Nuevo; sin archivo original directo. | Configuración, estilos o documentación; sin API exportada. | Herramienta correspondiente (npm/Astro/TypeScript/Tailwind/Firebase); sin imports de aplicación. |
| `.nvmrc` | Fija el runtime local Node 20.20.2. | Nuevo; sin archivo original directo. | Configuración, estilos o documentación; sin API exportada. | Herramienta correspondiente (npm/Astro/TypeScript/Tailwind/Firebase); sin imports de aplicación. |
| `app/.env.example` | Plantilla sin secretos con Firebase, URL pública y emuladores. | `app/.env` | Configuración, estilos o documentación; sin API exportada. | Herramienta correspondiente (npm/Astro/TypeScript/Tailwind/Firebase); sin imports de aplicación. |
| `app/astro.config.mjs` | Mantener Astro 4 estático y el procesado Vite existente. | `app/astro.config.mjs` | Configuración, estilos o documentación; sin API exportada. | `astro/config` |
| `app/package-lock.json` | Tomar las versiones bloqueadas como referencia reproducible. | `app/package-lock.json` | Configuración, estilos o documentación; sin API exportada. | Manifiesto del mismo directorio; resolución npm generada de nuevo. |
| `app/package.json` | Mantener dependencias actuales; no añadir frameworks. | `app/package.json` | Configuración, estilos o documentación; sin API exportada. | Dependencias exactas del manifiesto; ver apartado F. |
| `app/playwright.config.ts` | Chromium escritorio y emulación móvil; dos servidores solo loopback; una ejecución por vez. | `app/playwright.config.ts` | Configuración, estilos o documentación; sin API exportada. | `@playwright/test`, `node:fs`, `node:url`, `node:path` |
| `app/postcss.config.cjs` | Mantener Tailwind y Autoprefixer. | `app/postcss.config.cjs` | Configuración, estilos o documentación; sin API exportada. | Herramienta correspondiente (npm/Astro/TypeScript/Tailwind/Firebase); sin imports de aplicación. |
| `app/public/favicon.svg` | Conservar el SVG y su URL pública. | `app/public/favicon.svg` | Configuración, estilos o documentación; sin API exportada. | Herramienta correspondiente (npm/Astro/TypeScript/Tailwind/Firebase); sin imports de aplicación. |
| `app/src/components/BarraNavegacion.astro` | Menú de invitado responsive, con enlaces privados ocultos y configuración de roles sin permisos funcionales. | `app/src/components/Navbar.astro` | BarraNavegacion | `../modelos/cuentas` |
| `app/src/components/LeyendaDisponibilidad.astro` | Conservar los indicadores Libre/Ocupado. | `app/src/components/Legend.astro` | LeyendaDisponibilidad | Herramienta correspondiente (npm/Astro/TypeScript/Tailwind/Firebase); sin imports de aplicación. |
| `app/src/datos/firebase.ts` | Configuración explícita y creación diferida de Auth, Firestore y Functions; solo proyecto demo y los tres emuladores locales. | `app/src/lib/firebase.ts` | `ConfiguracionFirebaseLocal`, `leerConfiguracionFirebase`, `comprobarConfiguracionFirebase`, `obtenerServiciosFirebase` | `firebase/app`, `firebase/auth`, `firebase/firestore`, `firebase/functions` |
| `app/src/env.d.ts` | Conservar referencias de tipos Astro. | `app/src/env.d.ts` | Configuración, estilos o documentación; sin API exportada. | Herramienta correspondiente (npm/Astro/TypeScript/Tailwind/Firebase); sin imports de aplicación. |
| `app/src/layouts/DisenoPrincipal.astro` | Documento, metadatos, fuente, favicon, barra, contenedor y pie originales. | `app/src/components/Layout.astro` | DisenoPrincipal | `../components/BarraNavegacion.astro`, `../styles/tailwind.css` |
| `app/src/modelos/cuentas.ts` | Contrato Rol utilizado en la barra; PerfilUsuario y Profesional quedan pendientes. | Nuevo; sin archivo original directo. | `Rol` | Herramienta correspondiente (npm/Astro/TypeScript/Tailwind/Firebase); sin imports de aplicación. |
| `app/src/pages/404.astro` | Página pública reconstruida: /404, contenido original y layout común. | `app/src/pages/404.astro` | Página Astro; DisenoPrincipal | `../layouts/DisenoPrincipal.astro` |
| `app/src/pages/admin/index.astro` | Ruta /admin reservada: informa de indisponibilidad, sin datos, formularios ni operaciones privadas. | `app/src/pages/admin/index.astro` | Página Astro; DisenoPrincipal | `../../layouts/DisenoPrincipal.astro` |
| `app/src/pages/admin/usuarios.astro` | Ruta /admin/usuarios reservada: informa de indisponibilidad, sin datos, formularios ni operaciones privadas. | `app/src/pages/admin/usuarios.astro` | Página Astro; DisenoPrincipal | `../../layouts/DisenoPrincipal.astro` |
| `app/src/pages/agenda.astro` | Ruta /agenda reservada: informa de indisponibilidad, sin datos, formularios ni operaciones privadas. | `app/src/pages/agenda.astro` | Página Astro; DisenoPrincipal | `../layouts/DisenoPrincipal.astro` |
| `app/src/pages/ayuda.astro` | Página pública reconstruida: /ayuda, contenido original y layout común. | `app/src/pages/ayuda.astro` | Página Astro; DisenoPrincipal | `../layouts/DisenoPrincipal.astro` |
| `app/src/pages/bloqueos.astro` | Ruta /bloqueos reservada: informa de indisponibilidad, sin datos, formularios ni operaciones privadas. | `app/src/pages/bloqueos.astro` | Página Astro; DisenoPrincipal | `../layouts/DisenoPrincipal.astro` |
| `app/src/pages/branding.astro` | Ruta /branding reservada: informa de indisponibilidad, sin datos, formularios ni operaciones privadas. | `app/src/pages/branding.astro` | Página Astro; DisenoPrincipal | `../layouts/DisenoPrincipal.astro` |
| `app/src/pages/debug.astro` | Ruta /debug reservada: informa de indisponibilidad, sin datos, formularios ni operaciones privadas. | `app/src/pages/debug.astro` | Página Astro; DisenoPrincipal | `../layouts/DisenoPrincipal.astro` |
| `app/src/pages/equipo.astro` | Ruta /equipo reservada: informa de indisponibilidad, sin datos, formularios ni operaciones privadas. | `app/src/pages/equipo.astro` | Página Astro; DisenoPrincipal | `../layouts/DisenoPrincipal.astro` |
| `app/src/pages/export.astro` | Ruta /export reservada: informa de indisponibilidad, sin datos, formularios ni operaciones privadas. | `app/src/pages/export.astro` | Página Astro; DisenoPrincipal | `../layouts/DisenoPrincipal.astro` |
| `app/src/pages/horarios.astro` | Ruta /horarios reservada: informa de indisponibilidad, sin datos, formularios ni operaciones privadas. | `app/src/pages/horarios.astro` | Página Astro; DisenoPrincipal | `../layouts/DisenoPrincipal.astro` |
| `app/src/pages/index-admin.astro` | Ruta /index-admin reservada: informa de indisponibilidad, sin datos, formularios ni operaciones privadas. | `app/src/pages/index-admin.astro` | Página Astro; DisenoPrincipal | `../layouts/DisenoPrincipal.astro` |
| `app/src/pages/index-client.astro` | Página pública reconstruida: /index-client, contenido original y layout común. | `app/src/pages/index-client.astro` | Página Astro; DisenoPrincipal | `../layouts/DisenoPrincipal.astro` |
| `app/src/pages/index.astro` | Página pública reconstruida: /, contenido original y layout común. | `app/src/pages/index.astro` | Página Astro; DisenoPrincipal | `../layouts/DisenoPrincipal.astro` |
| `app/src/pages/kpis.astro` | Ruta /kpis reservada: informa de indisponibilidad, sin datos, formularios ni operaciones privadas. | `app/src/pages/kpis.astro` | Página Astro; DisenoPrincipal | `../layouts/DisenoPrincipal.astro` |
| `app/src/pages/legal.astro` | Página pública reconstruida: /legal, contenido original y layout común. | `app/src/pages/legal.astro` | Página Astro; DisenoPrincipal | `../layouts/DisenoPrincipal.astro` |
| `app/src/pages/login.astro` | Ruta /login reservada: informa de indisponibilidad, sin datos, formularios ni operaciones privadas. | `app/src/pages/login.astro` | Página Astro; DisenoPrincipal | `../layouts/DisenoPrincipal.astro` |
| `app/src/pages/mis-citas.astro` | Ruta /mis-citas reservada: informa de indisponibilidad, sin datos, formularios ni operaciones privadas. | `app/src/pages/mis-citas.astro` | Página Astro; DisenoPrincipal | `../layouts/DisenoPrincipal.astro` |
| `app/src/pages/panel-barbero.astro` | Ruta /panel-barbero reservada: informa de indisponibilidad, sin datos, formularios ni operaciones privadas. | `app/src/pages/panel-barbero.astro` | Página Astro; DisenoPrincipal | `../layouts/DisenoPrincipal.astro` |
| `app/src/pages/panel.astro` | Ruta /panel reservada: informa de indisponibilidad, sin datos, formularios ni operaciones privadas. | `app/src/pages/panel.astro` | Página Astro; DisenoPrincipal | `../layouts/DisenoPrincipal.astro` |
| `app/src/pages/perfil.astro` | Ruta /perfil reservada: informa de indisponibilidad, sin datos, formularios ni operaciones privadas. | `app/src/pages/perfil.astro` | Página Astro; DisenoPrincipal | `../layouts/DisenoPrincipal.astro` |
| `app/src/pages/planes.astro` | Página pública reconstruida: /planes, contenido original y layout común. | `app/src/pages/planes.astro` | Página Astro; DisenoPrincipal | `../layouts/DisenoPrincipal.astro` |
| `app/src/pages/registro.astro` | Ruta /registro reservada: informa de indisponibilidad, sin datos, formularios ni operaciones privadas. | `app/src/pages/registro.astro` | Página Astro; DisenoPrincipal | `../layouts/DisenoPrincipal.astro` |
| `app/src/pages/reservar.astro` | Ruta /reservar reservada: informa de indisponibilidad, sin datos, formularios ni operaciones privadas. | `app/src/pages/reservar.astro` | Página Astro; DisenoPrincipal, LeyendaDisponibilidad | `../layouts/DisenoPrincipal.astro`, `../components/LeyendaDisponibilidad.astro` |
| `app/src/pages/servicios.astro` | Ruta /servicios reservada: informa de indisponibilidad, sin datos, formularios ni operaciones privadas. | `app/src/pages/servicios.astro` | Página Astro; DisenoPrincipal | `../layouts/DisenoPrincipal.astro` |
| `app/src/pages/setup-barber.astro` | Ruta /setup-barber reservada: informa de indisponibilidad, sin datos, formularios ni operaciones privadas. | `app/src/pages/setup-barber.astro` | Página Astro; DisenoPrincipal | `../layouts/DisenoPrincipal.astro` |
| `app/src/pages/verify.astro` | Ruta /verify reservada: informa de indisponibilidad, sin datos, formularios ni operaciones privadas. | `app/src/pages/verify.astro` | Página Astro; DisenoPrincipal | `../layouts/DisenoPrincipal.astro` |
| `app/src/styles/tailwind.css` | Conservar directivas y referencia visual; comprobar controles nativos. | `app/src/styles/tailwind.css` | Configuración, estilos o documentación; sin API exportada. | Herramienta correspondiente (npm/Astro/TypeScript/Tailwind/Firebase); sin imports de aplicación. |
| `app/tailwind.config.cjs` | Conservar tema y escaneo src; no renombrar utilidades Tailwind. | `app/tailwind.config.cjs` | Configuración, estilos o documentación; sin API exportada. | Herramienta correspondiente (npm/Astro/TypeScript/Tailwind/Firebase); sin imports de aplicación. |
| `app/tests/e2e/acceso.test.ts` | 62 verificaciones de rutas, navegación, recursos, ausencia de operaciones privadas y error 404. | Nuevo; sin archivo original directo. | Configuración, estilos o documentación; sin API exportada. | `@playwright/test` |
| `app/tests/e2e/comparacion-visual.test.ts` | Doce comparaciones reales: contenido, geometría, estilos y capturas en escritorio/móvil. | Nuevo; sin archivo original directo. | Configuración, estilos o documentación; sin API exportada. | `@playwright/test`, `node:fs`, `node:path`, `node:url` |
| `app/tests/e2e/servidor-estatico.mjs` | Sirve dist local; referencia original de solo lectura, seis rutas, sin scripts, con CSP y presentación de invitado. | Nuevo; sin archivo original directo. | `prepararReferenciaPublica` | `node:http`, `node:fs/promises`, `node:path`, `node:url` |
| `app/tests/unit/configuracion.test.ts` | Seis pruebas de límites de configuración y conexiones de SDK mediante mocks; no simula autenticación correcta. | Nuevo; sin archivo original directo. | `configurarEmuladores` | `vitest` |
| `app/tsconfig.json` | Conservar configuración estricta y excluir artefactos/pruebas por contexto si procede. | `app/tsconfig.json` | Configuración, estilos o documentación; sin API exportada. | Herramienta correspondiente (npm/Astro/TypeScript/Tailwind/Firebase); sin imports de aplicación. |
| `docs/control-avance.md` | Avance real frente a 132 archivos planificados, rutas, funciones y siguiente fase. | Nuevo; sin archivo original directo. | Configuración, estilos o documentación; sin API exportada. | Documentación de fase 2 y evidencia de fase 3. |
| `docs/fase-3-implementacion.md` | Informe A–G, inventario completo, decisiones, resultados y pendientes de fase 3. | Nuevo; sin archivo original directo. | Configuración, estilos o documentación; sin API exportada. | Documentación de fase 2 y evidencia de fase 3. |
| `firebase.json` | Conservar source/runtime/hosting/rules/indexes; añadir emuladores Auth y Functions solo en la reconstrucción. | `firebase.json` | Configuración, estilos o documentación; sin API exportada. | Herramienta correspondiente (npm/Astro/TypeScript/Tailwind/Firebase); sin imports de aplicación. |
| `firestore.indexes.json` | Conservar los seis índices; ampliación solo tras consultas y pruebas. | `firestore.indexes.json` | Configuración, estilos o documentación; sin API exportada. | Herramienta correspondiente (npm/Astro/TypeScript/Tailwind/Firebase); sin imports de aplicación. |
| `firestore.rules` | Reglas nuevas cerradas: deniegan todas las lecturas y escrituras; sin despliegue. | `firestore.rules` | Configuración, estilos o documentación; sin API exportada. | Herramienta correspondiente (npm/Astro/TypeScript/Tailwind/Firebase); sin imports de aplicación. |
| `functions/index.js` | Entrada ESM que importa opciones y reexporta únicamente ping; los otros doce contratos aún no están implementados. | `functions/index.js` | Configuración, estilos o documentación; sin API exportada. | `./src/salud.js` |
| `functions/package-lock.json` | Conservar versiones resueltas del backend y herramientas. | `functions/package-lock.json` | Configuración, estilos o documentación; sin API exportada. | Manifiesto del mismo directorio; resolución npm generada de nuevo. |
| `functions/package.json` | Conservar ESM y Node 20 de runtime; ampliar scripts de pruebas sin importar backend productivo. | `functions/package.json` | Configuración, estilos o documentación; sin API exportada. | Dependencias exactas del manifiesto; ver apartado F. |
| `functions/src/firebase.js` | Opciones globales europe-west1, 256 MiB y 120 s; Admin diferido hasta necesitar datos. | `functions/index.js` | Configuración, estilos o documentación; sin API exportada. | `firebase-functions/v2` |
| `functions/src/salud.js` | Respuesta HTTP ping: estado 200 y cuerpo ok, sin consultar datos. | `functions/index.js` | `ping` | `./firebase.js`, `firebase-functions/v2/https` |
| `functions/tests/unit/salud.test.mjs` | Invoca el wrapper HTTP real de ping y comprueba su respuesta sin servicio remoto. | Nuevo; sin archivo original directo. | Configuración, estilos o documentación; sin API exportada. | `node:test`, `node:assert/strict`, `../../index.js` |
| `package-lock.json` | Mantener el bloqueo raíz; regenerar solo si cambia su manifiesto en la reconstrucción. | `package-lock.json` | Configuración, estilos o documentación; sin API exportada. | Manifiesto del mismo directorio; resolución npm generada de nuevo. |
| `package.json` | Coordinar scripts de frontend, backend y pruebas sin monorepo adicional. | `package.json` | Configuración, estilos o documentación; sin API exportada. | Dependencias exactas del manifiesto; ver apartado F. |
| `README.md` | Explica instalación, comandos, desconexión por defecto y límites de esta base. | Nuevo; sin archivo original directo. | Configuración, estilos o documentación; sin API exportada. | Documentación de fase 2 y evidencia de fase 3. |
| `storage.rules` | Reglas nuevas cerradas para Storage; sin uso del servicio ni despliegue. | `storage.rules` | Configuración, estilos o documentación; sin API exportada. | Herramienta correspondiente (npm/Astro/TypeScript/Tailwind/Firebase); sin imports de aplicación. |

## D. Correspondencias y decisiones respecto a fase 2

- app/src/components/Layout.astro pasa a app/src/layouts/DisenoPrincipal.astro; el pie sigue dentro del layout según el plan. app/src/components/Navbar.astro pasa a BarraNavegacion.astro y AvailabilityLegend a LeyendaDisponibilidad.astro. Las 27 páginas conservan nombres y URLs por convención de Astro.
- app/src/lib/firebase.ts pasa a app/src/datos/firebase.ts. Se utilizan nombres descriptivos como configuracionFirebase, aplicacionFirebase, autenticacion, baseDatos, funcionesRemotas y mensajeError. leerConfiguracionFirebase, comprobarConfiguracionFirebase y obtenerServiciosFirebase expresan las nuevas responsabilidades de la inicialización diferida y la validación local. No se añaden alias de las exportaciones originales sin consumidor.
- Las páginas importan DisenoPrincipal desde layouts; el layout importa BarraNavegacion y estilos; la barra importa solo el tipo Rol desde modelos/cuentas. Reservar utiliza LeyendaDisponibilidad sin inventar huecos. Ningún import apunta al código fuente original. El servidor de comparación lee únicamente su compilación pública local como referencia, fuera del código de aplicación.
- Los valores persistentes de rol siguen siendo client, worker, manager y admin; son contratos, no etiquetas que deban traducirse. También se conservan IDs de navegación, selectores necesarios, título público mediante alias title: titulo, ping, rutas y variables PUBLIC_FIREBASE_*.
- functions/index.js se divide por responsabilidad: src/firebase.js configura opciones y src/salud.js implementa ping. La entrada solo reexporta contratos implementados. Los otros doce exports se conservan en la planificación, sin stubs que aparenten éxito.
- Se mantienen las clases Tailwind, textos, favicon SVG de tijeras, fuente Manrope y distribución de las seis páginas públicas. No se han generado nuevas imágenes ni inventado datos empresariales.
- El prompt actual pide únicamente utilidades y tipos realmente usados. Por eso los otros modelos, fechas, estados, avisos, errores y los tres controladores de navegación que el manifiesto anticipaba en fase 3 se difieren hasta sus consumidores. cuentas.ts contiene por ahora solo Rol. Se evita código muerto y no se cambian los destinos previstos.
- El plan anticipaba Admin en functions/src/firebase.js: se difiere su inicialización hasta fase 4 para no abrir servicios de datos sin necesidad. firebase-admin sí está instalado porque satisface el peer requerido por firebase-functions.
- No se crea app/.env.local: las páginas funcionan desconectadas y .env.example ya ofrece configuración ficticia. Los flags desactivados no inicializan servicios; el flag heredado PUBLIC_USE_FUNCTIONS_EMULATOR también activa los tres emuladores completos, incluso fuera de DEV. Se rechaza cualquier proyecto distinto de demo-barberpro-m13.
- .firebaserc contiene solo el alias demo y el destino studio ficticio. Los seis índices se conservaron revisados; no contienen datos de usuarios. Las reglas nuevas cerradas sustituyen únicamente la configuración del proyecto nuevo, sin tocar la original.
- Se añade @astrojs/check 0.9.4 para disponer de astro check; es herramienta de verificación compatible con TypeScript 5, no un framework nuevo. No se añaden date-fns ni Firebase CLI mientras no exista un consumidor de fase posterior. No se instala ningún framework de interfaz adicional.
- Las dos pruebas unitarias y los dos informes específicos de fase son 4 archivos adicionales a los 132 del manifiesto. Se justifican por los requisitos actuales de pruebas y documentación; no se altera el registro histórico de fase 2.

## E. Componentes visuales y rutas

Terminados para el estado público: DisenoPrincipal, BarraNavegacion y LeyendaDisponibilidad. El layout conserva documento, favicon, metadatos, fuente, contenedor y pie; admite noindex en rutas pendientes. La barra presenta invitado, muestra Entrar y Crear cuenta, y mantiene ocultos perfil, salida y enlaces de personal. El botón de salida también está deshabilitado. La configuración data-roles prepara el marcado pero no concede permisos.

Páginas públicas reconstruidas: `/404`, `/ayuda`, `/index-client`, `/`, `/legal`, `/planes`.

Rutas reservadas, sin funcionalidad privada: `/admin`, `/admin/usuarios`, `/agenda`, `/bloqueos`, `/branding`, `/debug`, `/equipo`, `/export`, `/horarios`, `/index-admin`, `/kpis`, `/login`, `/mis-citas`, `/panel-barbero`, `/panel`, `/perfil`, `/registro`, `/reservar`, `/servicios`, `/setup-barber`, `/verify`.

Cada ruta reservada informa de que su sección todavía no está disponible, indica la fase pendiente, permite volver a inicio/ayuda y carece de datos reales, formularios u operaciones. Su HTTP 200 significa que existe la vista informativa, no autorización ni funcionalidad terminada. Las URLs desconocidas reciben HTTP 404 con la página propia. No se han añadido enlaces que afirmen haber completado una reserva o iniciado sesión.

## F. Instalación y verificación

### Entorno y dependencias

Windows con PowerShell. Node global observado 24.20.0, npm 10.9.0 y Git 2.45.2. Node 20.20.2 se instala de forma aislada en node_modules/node; los scripts npm de la raíz heredan ese binario, sin cambiar el runtime global. .nvmrc deja el mismo requisito para otros entornos. El runtime de Functions queda nodejs20.

| Herramienta | Versión fijada |
|---|---|
| Node local | 20.20.2 |
| Astro | 4.16.19 |
| TypeScript | 5.9.3 |
| Tailwind CSS | 3.4.18 |
| PostCSS / Autoprefixer | 8.5.6 / 10.4.21 |
| Firebase cliente | 10.14.1 |
| firebase-admin / firebase-functions | 12.7.0 / 5.1.1 |
| @astrojs/check | 0.9.4 |
| Vitest / Playwright | 2.1.9 / 1.58.2 |

Se ejecutó el instalador local install-dependencies.mjs del skill Sites, primero en raíz y después en app/functions con el runtime aislado. La instalación generó bloqueos propios y las comprobaciones npm de dependencias no encontraron conflictos de peers. El auxiliar node-bin-setup aparece como extraneous al instalar el binario Node; no es código de aplicación ni error de resolución. Los comandos reproducibles para otra instalación figuran en README: npm ci, npm --prefix app ci y npm --prefix functions ci. No se usó --force ni se actualizaron dependencias originales.

Avisos abiertos de npm audit durante la instalación: raíz 0; app 22 (11 moderados, 8 altos y 3 críticos); Functions 9 moderados. También hubo avisos de paquetes deprecados como tsconfck y uuid. Se mantienen las versiones de referencia por alcance, pero esto NO equivale a una aprobación de seguridad para publicación. Hay que analizar los avisos, dependencias afectadas y actualizaciones compatibles antes de cualquier despliegue; no se ejecuta audit fix --force ni se afirma que todos sean explotables en estas páginas estáticas.

### Comandos y resultados reales

Todos estos comandos se ejecutaron dentro del proyecto nuevo:

| Comando o comprobación | Resultado |
|---|---|
| Instalador de dependencias en raíz, app y functions | Instalación completada; advertencias registradas arriba |
| npm run check | Exit 0: Astro 39 archivos, 0 errores, 0 warnings, 0 hints; tsc --noEmit y sintaxis de los tres archivos backend correctos |
| npm run test:unit | Exit 0: 6 pruebas Vitest y 1 Node, sin omitidas |
| npm run build | Exit 0: 27 páginas estáticas generadas |
| npm run dev | Servidor iniciado en http://127.0.0.1:4321 y HTTP 200 comprobado |
| Navegador manual | Escritorio 1440×1000 y móvil 390×844 inspeccionados; consola sin errores ni warnings en la vista revisada |
| npm run test:e2e | Última ejecución exit 0: 74 passed, 46,5 s; 62 de rutas/recursos/navegación y 12 visuales, sin omitidas |
| SHA-256 del original | 94 archivos propios cotejados con referencia-original.md: ninguna alteración |

El navegador solo solicitó recursos locales y las fuentes de Google; no se observaron peticiones a Firebase en las páginas públicas. Las siete pruebas unitarias verifican configuración y ping; NO prueban una cuenta, una sesión, permisos, Firestore real, emuladores arrancados ni despliegue.

Para usar otro puerto de desarrollo: npm --prefix app run dev -- --port 4341. El comando abreviado de raíz no reenvía esa opción de la misma forma. El puerto realmente verificado fue 4321.

### Comparación visual real y sus límites

Se sirvieron seis páginas del dist original en 127.0.0.1:4332 mediante un servidor de solo lectura. Se retiraron scripts de la respuesta, se bloqueó su ejecución y conexiones con CSP y se fijó la presentación de invitado (Entrar/Crear cuenta visibles y Mis citas oculto). Esto es una referencia estática aislada; no se ejecutó el runtime original ni se probaron sus sesiones.

La nueva compilación se sirvió en 127.0.0.1:4331. En el mismo Chromium se compararon las seis páginas en escritorio 1440×1000 y emulación iPhone 13. Se exigieron iguales el texto principal normalizado y la geometría, fuente, tamaño, peso, color y fondo de nav/main/footer/h1/h2/h3/p/th/td. Se capturaron las dos versiones, no se generó la referencia a partir de la página nueva.

Las capturas se inspeccionaron de verdad. Los fallos con igualdad absoluta mostraron bordes de letras con pequeñas variaciones de rasterizado entre superficies Chromium; no diferencias de caja ni de estilo. El test documenta threshold 0.1 y un máximo de 0.0001 del total de píxeles (0,01 %) con diferencia perceptible. No se afirma igualdad de todos los píxeles sin tolerancia. La suite final pasó con ese límite y mantiene exactas las comparaciones de contenido, geometría y estilos.

Evidencias locales no versionadas: app/.verificacion/manual/escritorio.png y movil.png, referencias reales en app/.verificacion/referencia y adjuntos en app/test-results. Si falta el dist original en otro entorno, las 12 comparaciones se omiten expresamente; no se inventa una referencia. Las 62 pruebas de acceso siguen disponibles. Las pantallas de negocio y sus estados se compararán en fase 10.

### Incidencias resueltas

1. El patrón tests/unit/*.test.mjs no se expandía como esperaba Node 20 en Windows; el script ahora señala el archivo real y la prueba pasó.
2. La ruta de referencia con barra inversa final escapaba la comilla del comando Windows y provocaba HTTP 400/timeout. path.resolve elimina esa barra final; el servidor arrancó y las comparaciones llegaron a ejecutarse.
3. Un parámetro de reemplazo sin usar producía un hint del checker. Se renombró _atributo; el resultado final es cero hints.
4. Una fila de planes no coincidía con el texto original (Gestionar pausas); se restauraron No / Su perfil / Equipo / Equipo antes de compilar y comparar.
5. La igualdad absoluta de capturas produjo fallos intermitentes en Planes, Legal y 404, aun con medidas y estilos iguales. Se esperó a las fuentes, se activó cada página y se esperaron dos frames; se inspeccionaron las diferencias y se fijó la tolerancia de rasterizado limitada descrita arriba. La ejecución final completa pasó; no se ocultaron los fallos iniciales como si hubieran sido éxitos.
6. Los warnings NO_COLOR/FORCE_COLOR del runner afectan al formato de la consola, no al resultado de compilación ni a las 74 pruebas.

### Verificaciones pendientes

Integración real de los tres emuladores; autenticación y autorización; reglas; datos y transacciones; pruebas de concurrencia; pantallas de negocio; comparación completa de fase 10 y auditoría de dependencias antes de publicación. Chromium en móvil emulado no sustituye una prueba en Safari/iPhone físico. La vista invitada no demuestra seguridad de los cuatro roles.

Se utilizó el skill local Sites para implementación/preview, sin registrar un Site ni publicar. El navegador manual y el servidor de desarrollo de esta sesión se cerraron al terminar la revisión; Playwright cerró sus dos servidores al finalizar. No quedó una operación de desarrollo de esta fase en curso.

## G. Pendientes, siguiente fase y pausa

1. Fase 4: identidad con emuladores, registro/inicio/verificación/perfil, estado de sesión, navegación por rol, guards, claims de backend y reglas reales. Completar los modelos y servicios previstos cuando se utilicen. Preparar Firebase CLI fijada y el entorno local requerido antes de la integración; no hay credenciales ni usuarios reales en este proyecto.
2. Fase 5: disponibilidad, validación, transacciones y locks con fixtures locales, sin depender de datos productivos.
3. Fase 6: flujo de cliente y reservas. Fase 7: agenda, horarios y operativa profesional. Fase 8: equipo, servicios y administración. Fase 9: estadísticas, exportaciones, recordatorios parciales y auxiliares.
4. Fases 10–12: comparación global, integración, seguridad, limpieza y entrega.
5. Resolver los avisos de dependencias antes de publicar; no se ha autorizado ni realizado despliegue.

El estado queda guardado en el repositorio local de la nueva aplicación, rama fase-3-base. El identificador del commit y el estado limpio se comprueban al cerrar la fase. El original y la planificación previa permanecen intactos.

Corresponde la pausa obligatoria de tres horas después de fase 3. Se finaliza de forma segura sin adelantar desarrollo. No se deja una espera automática ni se promete reanudación: no se puede garantizar la continuidad de una sesión de tres horas. No se afirma que ese tiempo haya transcurrido. Al regresar, comprobar Git/workspace y las modificaciones antes de continuar. La siguiente fase numerada es la 4 y requiere sus instrucciones y autorización; no se inicia automáticamente. Repetir la pausa tras fase 6, fase 9 y, si queda trabajo, fase 12.
