# Control de avance — implementación de fase 4

## Estado vigente — 9 de noviembre de 2026

Autenticación real local, perfil, verificación/reenvío, estado compartido, cuatro roles, navegación, guards, reglas y tres callables de cuentas implementados. Las 27 URLs se conservan: seis públicas, cuatro pantallas de cuentas y 17 vistas privadas de negocio aún reservadas. Hay cuatro de los trece exports backend originales reales; los nueve restantes pertenecen a fases posteriores.

Resultados funcionales: 19 pruebas unitarias; 14 pruebas de integración contra Auth/Firestore/Functions; build de 27 páginas; 98 pruebas de navegador en escritorio/móvil (20 comparaciones visuales incluidas). El informe registra la validación del lanzador con la CLI actualizada y cualquier pendiente. Original: 94 hashes iguales, cero modificaciones. Producción: ninguna operación.

No se declara una entrega sin pendientes de seguridad: siguen los avisos de dependencias heredadas, incluidos críticos en app. La revisión/actualización compatible está documentada. No se avanza a fase 5.

Consultar [informe de fase 4](fase-4-autenticacion-usuarios-roles.md) y [cobertura vigente](control-cobertura.md). El registro que sigue es histórico: sus cifras, estados pendientes y la pausa corresponden exclusivamente al cierre de fase 3; no sustituyen este estado vigente.

## Registro histórico del cierre de fase 3

## Punto de partida y métricas

Se mantiene intacto ../BarberPro-M13-Planificacion/docs/control-cobertura.md: su cobertura del 100 % es de análisis/planificación, no de código terminado. El registro de fase 2 contiene 132 destinos planificados y 94 correspondencias con archivos originales. Este documento añade avance, sin reescribir el historial.

| Métrica | Estado real |
|---|---|
| Archivos propios originales contrastados por hash | 94; sin cambios |
| Destinos planificados de todas las fases | 132 |
| Archivos propios creados ahora | 65 |
| Destinos del plan que ya existen | 61 de 132 (46,21 % de presencia física) |
| Destinos del plan todavía no creados | 71 |
| Archivos nuevos adicionales al plan | 4 |
| Páginas Astro / rutas originales preservadas | 27 |
| Páginas públicas implementadas | 6 |
| Rutas reservadas con vista no disponible | 21 |
| Layout y componentes compartidos usados | 3 terminados para estado público |
| Tipos de cuenta | Rol utilizado; otros DTO pendientes |
| Funciones backend originales | 1 de 13 implementada: ping |
| Pruebas unitarias | 7 superadas |
| Pruebas de navegador | 74 superadas: 62 acceso/navegación/recursos + 12 visuales |
| Integración con emuladores | Preparada en configuración; no ejecutada |
| Producción, despliegues y migraciones | Ninguno |

La presencia física de un archivo NO indica implementación funcional completa. En particular, las 21 rutas, la entrada backend y cuentas.ts son parciales. No se da un porcentaje global de funcionalidad: los destinos tienen tamaños distintos y 27 archivos de página no equivalen a 27 flujos terminados.

## Rutas

Públicas terminadas en el alcance: `/404`, `/ayuda`, `/index-client`, `/`, `/legal`, `/planes`.

Reservadas: `/admin`, `/admin/usuarios`, `/agenda`, `/bloqueos`, `/branding`, `/debug`, `/equipo`, `/export`, `/horarios`, `/index-admin`, `/kpis`, `/login`, `/mis-citas`, `/panel-barbero`, `/panel`, `/perfil`, `/registro`, `/reservar`, `/servicios`, `/setup-barber`, `/verify`. No hay controladores, datos privados ni operaciones simuladas en estas vistas; no se presenta un layout como un flujo terminado.

## Configuración y límites

Instalación, runtime local, TypeScript/Astro, Tailwind, scripts, compilación, recursos y pruebas básicos preparados. Firebase cliente se inicializa solo explícitamente con proyecto demo y los tres emuladores; offline por defecto. Functions configura región y expone ping. Las reglas nuevas deniegan todo. No se han ejecutado pruebas reales de autenticación ni se ha inicializado Admin para datos.

El inventario adicional al plan es: `app/tests/unit/configuracion.test.ts`, `docs/control-avance.md`, `docs/fase-3-implementacion.md`, `functions/tests/unit/salud.test.mjs`. Son pruebas e informes requeridos por la fase actual, no una nueva arquitectura.

Los módulos que el plan anticipaba para fase 3 pero carecen de consumidores se difieren: modelos restantes, utilidades comunes, controladores de sesión/navegación y el acceso Admin. Se mantiene su ubicación prevista. No se crean módulos vacíos, exports ficticios ni .env.local innecesario. Detalle de decisiones y dependencias: [informe de fase 3](fase-3-implementacion.md).

## Seguimiento de los 132 destinos

La fase indicada es la fase inicial del manifiesto histórico, no una afirmación de funcionalidad terminada. Las rutas se crearon ahora como estructura aunque sus flujos dependan de fases posteriores.

| Destino previsto | Fase inicial del plan | Estado en el cierre |
|---|---:|---|
| `app/src/datos/firebase.ts` | 3 | Creado para la base de fase 3 |
| `app/src/datos/sesion.ts` | 4 | Pendiente; no creado |
| `app/src/datos/personas.ts` | 4 | Pendiente; no creado |
| `app/src/datos/catalogo.ts` | 5 | Pendiente; no creado |
| `app/src/datos/agenda.ts` | 5 | Pendiente; no creado |
| `app/src/datos/configuracion.ts` | 5 | Pendiente; no creado |
| `app/src/datos/funciones-remotas.ts` | 5 | Pendiente; no creado |
| `app/src/modelos/cuentas.ts` | 3 | Parcial: solo Rol utilizado |
| `app/src/modelos/agenda.ts` | 3 | Diferido: sin consumidor en la base actual |
| `app/src/modelos/aplicacion.ts` | 3 | Diferido: sin consumidor en la base actual |
| `app/src/modelos/interfaz.ts` | 3 | Diferido: sin consumidor en la base actual |
| `app/src/comun/fechas.ts` | 3 | Diferido: sin consumidor en la base actual |
| `app/src/comun/estados-cita.ts` | 3 | Diferido: sin consumidor en la base actual |
| `app/src/comun/permisos.ts` | 4 | Pendiente; no creado |
| `app/src/comun/avisos.ts` | 3 | Diferido: sin consumidor en la base actual |
| `app/src/comun/errores.ts` | 3 | Diferido: sin consumidor en la base actual |
| `app/src/modulos/administracion/usuarios.ts` | 8 | Pendiente; no creado |
| `app/src/modulos/administracion/tarjeta-usuario.ts` | 8 | Pendiente; no creado |
| `app/src/modulos/profesionales/agenda-diaria.ts` | 7 | Pendiente; no creado |
| `app/src/modulos/profesionales/tarjetas-citas.ts` | 7 | Pendiente; no creado |
| `app/src/modulos/profesionales/bloqueos.ts` | 7 | Pendiente; no creado |
| `app/src/modulos/profesionales/formulario-bloqueo.ts` | 7 | Pendiente; no creado |
| `app/src/modulos/administracion/reglas-agenda.ts` | 8 | Pendiente; no creado |
| `app/src/modulos/administracion/equipo.ts` | 8 | Pendiente; no creado |
| `app/src/modulos/estadisticas/listado-citas.ts` | 9 | Pendiente; no creado |
| `app/src/modulos/navegacion/inicio-publico.ts` | 3 | Diferido: sin consumidor en la base actual |
| `app/src/modulos/administracion/resumen-horarios.ts` | 8 | Pendiente; no creado |
| `app/src/modulos/navegacion/inicio-equipo.ts` | 3 | Diferido: sin consumidor en la base actual |
| `app/src/modulos/estadisticas/indicadores.ts` | 9 | Pendiente; no creado |
| `app/src/modulos/cuentas/iniciar-sesion.ts` | 4 | Pendiente; no creado |
| `app/src/modulos/reservas/mis-citas.ts` | 6 | Pendiente; no creado |
| `app/src/modulos/reservas/cambiar-cita.ts` | 6 | Pendiente; no creado |
| `app/src/modulos/navegacion/barra-navegacion.ts` | 3 | Diferido: sin consumidor en la base actual |
| `app/src/modulos/profesionales/panel-profesional.ts` | 7 | Pendiente; no creado |
| `app/src/modulos/estadisticas/resumen-diario.ts` | 9 | Pendiente; no creado |
| `app/src/modulos/cuentas/editar-perfil.ts` | 4 | Pendiente; no creado |
| `app/src/modulos/cuentas/crear-cuenta.ts` | 4 | Pendiente; no creado |
| `app/src/modulos/reservas/reservar-cita.ts` | 6 | Pendiente; no creado |
| `app/src/modulos/reservas/huecos-reserva.ts` | 6 | Pendiente; no creado |
| `app/src/modulos/administracion/servicios.ts` | 8 | Pendiente; no creado |
| `app/src/modulos/profesionales/editar-horario.ts` | 7 | Pendiente; no creado |
| `app/src/modulos/profesionales/formulario-horario.ts` | 7 | Pendiente; no creado |
| `app/src/modulos/cuentas/verificar-correo.ts` | 4 | Pendiente; no creado |
| `app/src/exportaciones/csv.ts` | 9 | Pendiente; no creado |
| `app/src/exportaciones/calendario.ts` | 6 | Pendiente; no creado |
| `app/src/layouts/DisenoPrincipal.astro` | 3 | Creado para la base de fase 3 |
| `app/src/components/BarraNavegacion.astro` | 3 | Creado para la base de fase 3 |
| `app/src/components/LeyendaDisponibilidad.astro` | 3 | Creado para la base de fase 3 |
| `functions/src/firebase.js` | 3 | Parcial: opciones; Admin diferido |
| `functions/src/permisos.js` | 4 | Pendiente; no creado |
| `functions/src/configuracion.js` | 5 | Pendiente; no creado |
| `functions/src/cuentas.js` | 4 | Pendiente; no creado |
| `functions/src/horarios.js` | 5 | Pendiente; no creado |
| `functions/src/fechas.js` | 5 | Pendiente; no creado |
| `functions/src/disponibilidad.js` | 5 | Pendiente; no creado |
| `functions/src/reservas.js` | 5 | Pendiente; no creado |
| `functions/src/persistencia-reservas.js` | 5 | Pendiente; no creado |
| `functions/src/recordatorios.js` | 9 | Pendiente; no creado |
| `functions/src/demostracion.js` | 9 | Pendiente; no creado |
| `functions/src/salud.js` | 3 | Creado para la base de fase 3 |
| `functions/index.js` | 3 | Parcial: solo ping de 13 contratos |
| `.firebaserc` | 3 | Creado para la base de fase 3 |
| `firebase.json` | 3 | Creado para la base de fase 3 |
| `firestore.indexes.json` | 3 | Creado para la base de fase 3 |
| `firestore.rules` | 4 | Creado para la base de fase 3 |
| `package-lock.json` | 3 | Creado para la base de fase 3 |
| `package.json` | 3 | Creado para la base de fase 3 |
| `storage.rules` | 4 | Creado para la base de fase 3 |
| `app/.env.example` | 3 | Creado para la base de fase 3 |
| `app/.env.local` | 3 | Omitido deliberadamente: público desconectado |
| `app/astro.config.mjs` | 3 | Creado para la base de fase 3 |
| `app/package-lock.json` | 3 | Creado para la base de fase 3 |
| `app/package.json` | 3 | Creado para la base de fase 3 |
| `app/playwright.config.ts` | 3 | Creado para la base de fase 3 |
| `app/postcss.config.cjs` | 3 | Creado para la base de fase 3 |
| `app/tailwind.config.cjs` | 3 | Creado para la base de fase 3 |
| `app/tsconfig.json` | 3 | Creado para la base de fase 3 |
| `app/public/favicon.svg` | 3 | Creado para la base de fase 3 |
| `app/src/env.d.ts` | 3 | Creado para la base de fase 3 |
| `app/src/pages/404.astro` | 3 | Pública implementada |
| `app/src/pages/agenda.astro` | 3 | Ruta reservada; comportamiento pendiente |
| `app/src/pages/ayuda.astro` | 3 | Pública implementada |
| `app/src/pages/bloqueos.astro` | 3 | Ruta reservada; comportamiento pendiente |
| `app/src/pages/branding.astro` | 3 | Ruta reservada; comportamiento pendiente |
| `app/src/pages/debug.astro` | 3 | Ruta reservada; comportamiento pendiente |
| `app/src/pages/equipo.astro` | 3 | Ruta reservada; comportamiento pendiente |
| `app/src/pages/export.astro` | 3 | Ruta reservada; comportamiento pendiente |
| `app/src/pages/horarios.astro` | 3 | Ruta reservada; comportamiento pendiente |
| `app/src/pages/index-admin.astro` | 3 | Ruta reservada; comportamiento pendiente |
| `app/src/pages/index-client.astro` | 3 | Pública implementada |
| `app/src/pages/index.astro` | 3 | Pública implementada |
| `app/src/pages/kpis.astro` | 3 | Ruta reservada; comportamiento pendiente |
| `app/src/pages/legal.astro` | 3 | Pública implementada |
| `app/src/pages/login.astro` | 3 | Ruta reservada; comportamiento pendiente |
| `app/src/pages/mis-citas.astro` | 3 | Ruta reservada; comportamiento pendiente |
| `app/src/pages/panel-barbero.astro` | 3 | Ruta reservada; comportamiento pendiente |
| `app/src/pages/panel.astro` | 3 | Ruta reservada; comportamiento pendiente |
| `app/src/pages/perfil.astro` | 3 | Ruta reservada; comportamiento pendiente |
| `app/src/pages/planes.astro` | 3 | Pública implementada |
| `app/src/pages/registro.astro` | 3 | Ruta reservada; comportamiento pendiente |
| `app/src/pages/reservar.astro` | 3 | Ruta reservada; comportamiento pendiente |
| `app/src/pages/servicios.astro` | 3 | Ruta reservada; comportamiento pendiente |
| `app/src/pages/setup-barber.astro` | 3 | Ruta reservada; comportamiento pendiente |
| `app/src/pages/verify.astro` | 3 | Ruta reservada; comportamiento pendiente |
| `app/src/pages/admin/index.astro` | 3 | Ruta reservada; comportamiento pendiente |
| `app/src/pages/admin/usuarios.astro` | 3 | Ruta reservada; comportamiento pendiente |
| `app/src/styles/tailwind.css` | 3 | Creado para la base de fase 3 |
| `functions/package-lock.json` | 3 | Creado para la base de fase 3 |
| `functions/package.json` | 3 | Creado para la base de fase 3 |
| `functions/scripts/normalizar-roles.mjs` | 4 | Pendiente; no creado |
| `functions/scripts/asignar-roles.mjs` | 4 | Pendiente; no creado |
| `functions/tests/emuladores/reservas-concurrencia.test.mjs` | 5 | Pendiente; no creado |
| `functions/tests/emuladores/ejecutar-pruebas.mjs` | 3 | Diferido: sin consumidor en la base actual |
| `app/tests/unit/fechas.test.ts` | 5 | Pendiente; no creado |
| `app/tests/unit/formularios.test.ts` | 7 | Pendiente; no creado |
| `app/tests/unit/exportaciones.test.ts` | 9 | Pendiente; no creado |
| `app/tests/e2e/servidor-estatico.mjs` | 3 | Creado para la base de fase 3 |
| `app/tests/e2e/acceso.test.ts` | 4 | Creado para la base de fase 3 |
| `app/tests/e2e/cliente.test.ts` | 6 | Pendiente; no creado |
| `app/tests/e2e/personal.test.ts` | 7 | Pendiente; no creado |
| `app/tests/e2e/administracion.test.ts` | 8 | Pendiente; no creado |
| `app/tests/e2e/comparacion-visual.test.ts` | 10 | Creado para la base de fase 3 |
| `functions/tests/unit/disponibilidad.test.mjs` | 5 | Pendiente; no creado |
| `functions/tests/unit/recordatorios.test.mjs` | 9 | Pendiente; no creado |
| `functions/tests/emuladores/permisos.test.mjs` | 4 | Pendiente; no creado |
| `functions/tests/emuladores/reservas-consistencia.test.mjs` | 5 | Pendiente; no creado |
| `README.md` | 3 | Creado para la base de fase 3 |
| `.gitignore` | 3 | Creado para la base de fase 3 |
| `.nvmrc` | 3 | Creado para la base de fase 3 |
| `docs/puesta-en-marcha.md` | 12 | Pendiente; no creado |
| `docs/decisiones.md` | 12 | Pendiente; no creado |
| `docs/pruebas.md` | 12 | Pendiente; no creado |

## Funcionalidades pendientes

| Bloque | Estado |
|---|---|
| Presentación pública, navegación y error 404 | Implementado y probado en el alcance de fase 3 |
| Inicialización/configuración cliente | Implementada y probada con mocks; integración con emuladores pendiente |
| Salud backend | ping implementado y probado unitariamente |
| Auth, sesión, perfil, claims, guards y permisos | Fase 4; pendiente |
| Disponibilidad, validación, transacciones y locks | Fase 5; pendiente |
| Experiencia cliente y reservas | Fase 6; pendiente |
| Operativa profesional y horarios | Fase 7; pendiente |
| Administración, equipo y servicios | Fase 8; pendiente |
| Estadísticas, exportaciones y recordatorios parciales | Fase 9; pendiente |
| Comparación de pantallas complejas e integración global | Fases 10–11; pendiente |
| Memoria, puesta en marcha final y defensa | Fase 12; pendiente |

## Incidencias abiertas y cierre seguro

Las dependencias instaladas conservan avisos npm audit: app 22 (11 moderados, 8 altos, 3 críticos) y Functions 9 moderados. Revisar y resolver de forma compatible antes de publicar. La compilación y los tests correctos no eliminan este pendiente. Las capturas admiten exclusivamente la tolerancia descrita en el informe: threshold 0.1 y un máximo del 0,01 %; no se afirma igualdad absoluta de píxeles. Falta comparación de flujos privados y dispositivos reales.

Fases 1 y 2 constan completadas en la documentación anterior. La base autorizada de fase 3 queda completada, con limitaciones explícitas, sin afirmar que BarberPro entero esté operativo. Archivos guardados; repositorio nuevo local en fase-3-base; sin procesos de verificación o desarrollo de esta fase pendientes al cerrar.

Siguiente paso: pausa obligatoria de tres horas. Se cierra la sesión de forma segura sin espera ni reanudación automática garantizadas y sin afirmar que la pausa ya haya transcurrido. La siguiente fase numerada es 4 y no se inicia hasta recibir sus instrucciones. Recuperar estado con git status y revisar este informe antes de retomar. Pausas también tras 6 y 9, y tras 12 si queda trabajo; no alteran numeración ni cuentan como horas de desarrollo.

Referencia temporal vigente de fase 3: 7 horas; el plan histórico reservaba 8. No se imputa como trabajo real ninguna de esas estimaciones y se conserva el objetivo global 92 + 8 horas.
