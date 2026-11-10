# BarberPro Studio — M13

Aplicación reconstruida con Astro estático, Firebase Auth, perfiles, cuatro roles, reservas, área profesional y administración. Solo funciona contra emuladores locales. El original permanece intacto.

**Reconstrucción en curso:** fases 3–8 implementadas y verificadas localmente; fases 9–12 pendientes. Publicar la fuente en GitHub no constituye un despliegue ni una entrega final. El desarrollo se ha realizado con asistencia de Codex; el registro académico debe completarse con las horas y revisiones reales.

## Instalación local

Usar Node 20.20.2 (`.nvmrc`) y npm 10. Con Node ya disponible:

```powershell
npm ci
npm --prefix app ci
npm --prefix functions ci
```

La dependencia de desarrollo `node` proporciona el mismo runtime aislado para los scripts npm del proyecto; no cambia el Node global.

## Comandos

```powershell
npm run dev
npm run check
npm run test:unit
npm run build
npm run test:e2e
npm run test:emuladores
npm run emulators
npm run datos:local
```

El servidor solo escucha en loopback. Las seis páginas públicas funcionan sin Firebase. Login, registro, verificación y perfil están implementados; `/reservar` permite consultar disponibilidad, confirmar y descargar ICS. `/mis-citas` muestra citas propias, filtros e historia y permite cancelar o cambiar. El profesional dispone de `/panel-barbero`, `/agenda`, `/setup-barber` y `/bloqueos`, con semanas, publicación, copia, estados y bloques que afectan a disponibilidad. Administración incluye `/admin`, `/admin/usuarios`, `/equipo`, `/servicios`, `/branding`, `/horarios` e `/index-admin`. Las cuatro vistas `/panel`, `/kpis`, `/export` y `/debug` conservan su aviso hasta la fase 9.

## Firebase

La integración está desactivada por defecto en un checkout nuevo. Copiar `app/.env.example` a `app/.env.local` y cambiar `PUBLIC_USE_FIREBASE_EMULATORS=1` y `PUBLIC_USE_FUNCTIONS_EMULATOR=1`. Los demás valores son ficticios. Este archivo se ignora en Git. Solo se admite `demo-barberpro-m13` desde localhost/127.0.0.1: Auth 9099, Firestore 8088 y Functions 5001.

En una terminal ejecutar `npm run emulators` y en otra `npm run dev`. Los emuladores necesitan Java 21; los scripts npm usan Node 20.20.2 local. No requieren `firebase login`. La CLI utiliza una configuración vacía en `.verificacion/firebase-cli`, sin reutilizar credenciales globales. Las cuentas son efímeras y desaparecen al detener los emuladores.

Para explorar reservas con datos ficticios, con los emuladores ya arrancados ejecutar **explícitamente** `npm run datos:local` antes de `npm run dev`. Este comando reinicia reservas, locks, bloqueos y notificaciones del proyecto demo local y prepara catálogo/profesionales/semanas de prueba; no debe usarse para conservar una sesión de pruebas anterior. Rechaza configuración productiva. La cuenta ficticia verificada `reservas-client@example.test` permite acceder a `/reservar`; sus credenciales de ejemplo están definidas en los fixtures de pruebas. No son credenciales de servicios reales. Las fechas se calculan en Europe/Madrid y cubren los próximos 30 días.

`npm run test:emuladores` arranca los tres servicios, ejecuta las pruebas de reglas/Auth/Functions, compila con configuración demo, prueba navegador en escritorio/móvil y detiene los servicios. **Usar una instancia de emuladores desechable y los puertos libres**: las pruebas borran exclusivamente los datos ficticios de ese proyecto. El lanzador rechaza otro proyecto y otros hosts. La salida de una prueba fallida se conserva como fallo.

El emulador imprime los enlaces de correo ficticios. Se pueden abrir localmente o consultar `http://127.0.0.1:9099/emulator/v1/projects/demo-barberpro-m13/oobCodes` y abrir `/verify?mode=verifyEmail&oobCode=CODIGO`. No se envían correos reales. Para las pruebas se crean cuentas públicas ficticias `fase4-{client,worker,manager,admin,pendiente}@example.test`; su contraseña de fixture consta en los tests. No representan usuarios reales. No se siembran cuentas al arrancar normalmente la aplicación.

Las reglas permiten editar solo nombre/teléfono propios; los roles se asignan en backend. `setMyRole` deniega siempre el cambio. `adminSetClaims` requiere administrador verificado y permisos vigentes. Los scripts `functions/scripts/asignar-roles.mjs` y `normalizar-roles.mjs` exigen UID explícito y los dos emuladores; simulan por defecto, escriben solo con `--aplicar`. La pantalla de Usuarios permite al administrador buscar correo exacto y cambiar roles; manager/admin gestionan equipo y servicios. Solo admin cambia reglas de agenda.

No se incluyen comandos de despliegue ni claves administrativas. Las escrituras directas de negocio desde el navegador siguen denegadas. Reservas y operaciones de agenda validan en backend con transacciones y recuperación idempotente. `saveTeamProfile`, `saveService` y `saveAgendaSettings` añaden validación, comparación de versiones y reintentos sin duplicar altas. Un bloqueo, recorte o cambio de zona que perjudique una cita existente se rechaza. Cambiar un servicio conserva los snapshots de reservas anteriores. Storage continúa cerrado. El HTML estático no equivale a una sesión de servidor.

## Estado y documentación

Para explorar el listado hay cuentas ficticias verificadas `cliente-escritorio@example.test` y `cliente-movil@example.test`, con credenciales de ejemplo definidas en los fixtures; incluyen ocho citas de diferentes estados, antiguas/futuras y datos legados. `cliente-vacio@example.test` comienza sin citas. Todas se preparan solo al ejecutar explícitamente `npm run datos:local`.

Las cuentas ficticias `profesional-escritorio@example.test` y `profesional-movil@example.test`, con credenciales de ejemplo definidas en los fixtures, tienen semanas y citas para explorar las cuatro pantallas. `profesional-otro@example.test` comienza sin citas. `reservas-manager@example.test` y `reservas-admin@example.test` permiten probar la selección autorizada de profesionales. Solo se preparan al ejecutar explícitamente `npm run datos:local`; nunca son usuarios reales.

Consultar [fase 8](docs/fase-8-administracion.md), [fase 7](docs/fase-7-profesional-agenda.md), [fase 6](docs/fase-6-cliente.md), [fase 5](docs/fase-5-reservas-disponibilidad.md), [cobertura](docs/control-cobertura.md), [avance](docs/control-avance.md) y [ejecución de fases restantes](docs/ejecucion-fases-8-12.md). El prompt maestro autoriza continuar a fase 9 después de verificar administración, con pausa obligatoria antes de fase 10. Las versiones heredadas conservan avisos de seguridad de dependencias que deben tratarse antes de la entrega.
