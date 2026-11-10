# Correspondencias contrastadas de los 94 originales

Se comprueba existencia; no certifica por si sola equivalencia funcional. Home-role se fusiona con barra-navegacion, como indica la implementacion. La planificacion externa se conserva intacta.

| Original | Destinos existentes en la reconstruccion | Decision historica |
|---|---|---|
| .firebaserc | .firebaserc | Conservar |
| firebase.json | firebase.json | Conservar |
| firestore.indexes.json | firestore.indexes.json | Conservar |
| firestore.rules | firestore.rules | Conservar |
| package-lock.json | package-lock.json | Conservar |
| package.json | package.json | Conservar |
| storage.rules | storage.rules | Conservar |
| app/.env | app/.env.example; app/.env.local | Sustituir |
| app/astro.config.mjs | app/astro.config.mjs | Conservar |
| app/package-lock.json | app/package-lock.json | Conservar |
| app/package.json | app/package.json | Conservar |
| app/playwright.config.ts | app/playwright.config.ts | Conservar |
| app/postcss.config.cjs | app/postcss.config.cjs | Conservar |
| app/tailwind.config.cjs | app/tailwind.config.cjs | Conservar |
| app/tsconfig.json | app/tsconfig.json | Conservar |
| app/public/favicon.svg | app/public/favicon.svg | Conservar |
| app/src/env.d.ts | app/src/env.d.ts | Conservar |
| app/src/components/Layout.astro | app/src/layouts/DisenoPrincipal.astro | Mover |
| app/src/components/Legend.astro | app/src/components/LeyendaDisponibilidad.astro | Renombrar |
| app/src/components/Navbar.astro | app/src/components/BarraNavegacion.astro | Renombrar |
| app/src/lib/auth-flow.ts | app/src/datos/sesion.ts; app/src/comun/permisos.ts; app/src/comun/errores.ts | Dividir |
| app/src/lib/booking-core.ts | app/src/comun/fechas.ts; app/src/comun/estados-cita.ts; functions/src/fechas.js; functions/src/persistencia-reservas.js; functions/src/reservas.js | Dividir |
| app/src/lib/csv.ts | app/src/exportaciones/csv.ts | Mover |
| app/src/lib/firebase.ts | app/src/datos/firebase.ts | Mover |
| app/src/lib/ics.ts | app/src/exportaciones/calendario.ts | Renombrar |
| app/src/lib/rbac.ts | app/src/comun/permisos.ts | Fusionar |
| app/src/lib/ui.ts | app/src/comun/avisos.ts | Mover |
| app/src/lib/week.ts | app/src/comun/fechas.ts | Fusionar |
| app/src/pages/404.astro | app/src/pages/404.astro | Conservar |
| app/src/pages/agenda.astro | app/src/pages/agenda.astro | Conservar |
| app/src/pages/ayuda.astro | app/src/pages/ayuda.astro | Conservar |
| app/src/pages/bloqueos.astro | app/src/pages/bloqueos.astro | Conservar |
| app/src/pages/branding.astro | app/src/pages/branding.astro | Conservar |
| app/src/pages/debug.astro | app/src/pages/debug.astro | Conservar |
| app/src/pages/equipo.astro | app/src/pages/equipo.astro | Conservar |
| app/src/pages/export.astro | app/src/pages/export.astro | Conservar |
| app/src/pages/horarios.astro | app/src/pages/horarios.astro | Conservar |
| app/src/pages/index-admin.astro | app/src/pages/index-admin.astro | Conservar |
| app/src/pages/index-client.astro | app/src/pages/index-client.astro | Conservar |
| app/src/pages/index.astro | app/src/pages/index.astro | Conservar |
| app/src/pages/kpis.astro | app/src/pages/kpis.astro | Conservar |
| app/src/pages/legal.astro | app/src/pages/legal.astro | Conservar |
| app/src/pages/login.astro | app/src/pages/login.astro | Conservar |
| app/src/pages/mis-citas.astro | app/src/pages/mis-citas.astro | Conservar |
| app/src/pages/panel-barbero.astro | app/src/pages/panel-barbero.astro | Conservar |
| app/src/pages/panel.astro | app/src/pages/panel.astro | Conservar |
| app/src/pages/perfil.astro | app/src/pages/perfil.astro | Conservar |
| app/src/pages/planes.astro | app/src/pages/planes.astro | Conservar |
| app/src/pages/registro.astro | app/src/pages/registro.astro | Conservar |
| app/src/pages/reservar.astro | app/src/pages/reservar.astro | Conservar |
| app/src/pages/servicios.astro | app/src/pages/servicios.astro | Conservar |
| app/src/pages/setup-barber.astro | app/src/pages/setup-barber.astro | Conservar |
| app/src/pages/verify.astro | app/src/pages/verify.astro | Conservar |
| app/src/pages/admin/index.astro | app/src/pages/admin/index.astro | Conservar |
| app/src/pages/admin/usuarios.astro | app/src/pages/admin/usuarios.astro | Conservar |
| app/src/scripts/admin-guard.client.ts | app/src/comun/permisos.ts | Fusionar |
| app/src/scripts/admin-users.client.ts | app/src/modulos/administracion/usuarios.ts; app/src/modulos/administracion/tarjeta-usuario.ts; app/src/datos/personas.ts; app/src/datos/funciones-remotas.ts | Dividir |
| app/src/scripts/agenda.client.ts | app/src/modulos/profesionales/agenda-diaria.ts; app/src/modulos/profesionales/tarjetas-citas.ts; app/src/datos/personas.ts; app/src/datos/agenda.ts; app/src/datos/funciones-remotas.ts | Dividir |
| app/src/scripts/bloqueos-guard.client.ts | app/src/comun/permisos.ts | Fusionar |
| app/src/scripts/bloqueos.client.ts | app/src/modulos/profesionales/bloqueos.ts; app/src/modulos/profesionales/formulario-bloqueo.ts; app/src/datos/personas.ts; app/src/datos/agenda.ts | Dividir |
| app/src/scripts/branding-guard.client.ts | app/src/comun/permisos.ts | Fusionar |
| app/src/scripts/branding.client.ts | app/src/modulos/administracion/reglas-agenda.ts; app/src/datos/configuracion.ts | Mover |
| app/src/scripts/equipo-guard.client.ts | app/src/comun/permisos.ts | Fusionar |
| app/src/scripts/equipo.client.ts | app/src/modulos/administracion/equipo.ts; app/src/datos/personas.ts | Mover |
| app/src/scripts/export-guard.client.ts | app/src/comun/permisos.ts | Fusionar |
| app/src/scripts/export.client.ts | app/src/modulos/estadisticas/listado-citas.ts; app/src/datos/personas.ts; app/src/datos/agenda.ts | Mover |
| app/src/scripts/guards.client.ts | app/src/comun/permisos.ts; app/src/datos/sesion.ts | Fusionar |
| app/src/scripts/home-role.client.ts | app/src/modulos/navegacion/barra-navegacion.ts; app/src/datos/sesion.ts | Mover |
| app/src/scripts/horarios-guard.client.ts | app/src/comun/permisos.ts | Fusionar |
| app/src/scripts/horarios.client.ts | app/src/modulos/administracion/resumen-horarios.ts; app/src/datos/personas.ts; app/src/datos/agenda.ts | Mover |
| app/src/scripts/index-admin.client.ts | app/src/modulos/navegacion/inicio-equipo.ts | Mover |
| app/src/scripts/kpis-guard.client.ts | app/src/comun/permisos.ts | Fusionar |
| app/src/scripts/kpis.client.ts | app/src/modulos/estadisticas/indicadores.ts; app/src/datos/personas.ts; app/src/datos/agenda.ts | Mover |
| app/src/scripts/login.client.ts | app/src/modulos/cuentas/iniciar-sesion.ts; app/src/datos/sesion.ts | Mover |
| app/src/scripts/mis-citas.client.ts | app/src/modulos/reservas/mis-citas.ts; app/src/modulos/reservas/cambiar-cita.ts; app/src/datos/personas.ts; app/src/datos/agenda.ts; app/src/datos/configuracion.ts; app/src/datos/funciones-remotas.ts | Dividir |
| app/src/scripts/navbar.client.ts | app/src/modulos/navegacion/barra-navegacion.ts; app/src/datos/sesion.ts; app/src/datos/personas.ts | Mover |
| app/src/scripts/panel-barbero.client.ts | app/src/modulos/profesionales/panel-profesional.ts; app/src/datos/personas.ts; app/src/datos/agenda.ts | Mover |
| app/src/scripts/panel.client.ts | app/src/modulos/estadisticas/resumen-diario.ts; app/src/datos/personas.ts; app/src/datos/agenda.ts | Mover |
| app/src/scripts/perfil.client.ts | app/src/modulos/cuentas/editar-perfil.ts; app/src/datos/sesion.ts; app/src/datos/personas.ts | Mover |
| app/src/scripts/registro.client.ts | app/src/modulos/cuentas/crear-cuenta.ts; app/src/datos/sesion.ts | Mover |
| app/src/scripts/reservar.client.ts | app/src/modulos/reservas/reservar-cita.ts; app/src/modulos/reservas/huecos-reserva.ts; app/src/datos/catalogo.ts; app/src/datos/personas.ts; app/src/datos/funciones-remotas.ts | Dividir |
| app/src/scripts/services.client.ts | app/src/modulos/administracion/servicios.ts; app/src/datos/catalogo.ts | Mover |
| app/src/scripts/servicios-guard.client.ts | app/src/comun/permisos.ts | Fusionar |
| app/src/scripts/setup-barber.client.ts | app/src/modulos/profesionales/editar-horario.ts; app/src/modulos/profesionales/formulario-horario.ts; app/src/datos/personas.ts; app/src/datos/agenda.ts | Dividir |
| app/src/scripts/staff-guard.client.ts | app/src/comun/permisos.ts | Fusionar |
| app/src/scripts/verify.client.ts | app/src/modulos/cuentas/verificar-correo.ts; app/src/datos/sesion.ts | Mover |
| app/src/styles/tailwind.css | app/src/styles/tailwind.css | Conservar |
| functions/index.js | functions/index.js; functions/src/firebase.js; functions/src/permisos.js; functions/src/configuracion.js; functions/src/cuentas.js; functions/src/horarios.js; functions/src/fechas.js; functions/src/disponibilidad.js; functions/src/reservas.js; functions/src/persistencia-reservas.js; functions/src/recordatorios.js; functions/src/demostracion.js; functions/src/salud.js | Dividir |
| functions/package-lock.json | functions/package-lock.json | Conservar |
| functions/package.json | functions/package.json | Conservar |
| functions/scripts/migrate-legacy-roles.mjs | functions/scripts/normalizar-roles.mjs | Renombrar |
| functions/scripts/set-role-claims.mjs | functions/scripts/asignar-roles.mjs | Renombrar |
| functions/tests/emulators/lock-concurrency.mjs | functions/tests/emuladores/reservas-concurrencia.test.mjs | Sustituir |
| functions/tests/emulators/run-emulator-test.mjs | functions/tests/emuladores/ejecutar-pruebas.mjs | Renombrar |
