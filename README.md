# BarberPro Studio — M13

Aplicación reconstruida con Astro estático, Firebase Auth, perfiles, cuatro roles y núcleo de reservas. Solo funciona contra emuladores locales. El original permanece intacto.

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

El servidor solo escucha en loopback. Las seis páginas públicas funcionan sin Firebase. Login, registro, verificación y perfil están implementados; `/reservar` permite consultar disponibilidad, confirmar y descargar ICS. `/mis-citas` muestra citas propias, filtros e historia y permite cancelar o cambiar con los servicios reales de fase 5. Las otras 15 vistas privadas conservan el aviso de indisponibilidad y sus permisos.

## Firebase

La integración está desactivada por defecto en un checkout nuevo. Copiar `app/.env.example` a `app/.env.local` y cambiar `PUBLIC_USE_FIREBASE_EMULATORS=1` y `PUBLIC_USE_FUNCTIONS_EMULATOR=1`. Los demás valores son ficticios. Este archivo se ignora en Git. Solo se admite `demo-barberpro-m13` desde localhost/127.0.0.1: Auth 9099, Firestore 8088 y Functions 5001.

En una terminal ejecutar `npm run emulators` y en otra `npm run dev`. Los emuladores necesitan Java 21; los scripts npm usan Node 20.20.2 local. No requieren `firebase login`. La CLI utiliza una configuración vacía en `.verificacion/firebase-cli`, sin reutilizar credenciales globales. Las cuentas son efímeras y desaparecen al detener los emuladores.

Para explorar reservas con datos ficticios, con los emuladores ya arrancados ejecutar **explícitamente** `npm run datos:local` antes de `npm run dev`. Este comando reinicia reservas, locks, bloqueos y notificaciones del proyecto demo local y prepara catálogo/profesionales/semanas de prueba; no debe usarse para conservar una sesión de pruebas anterior. Rechaza configuración productiva. La cuenta ficticia verificada `reservas-client@example.test`, contraseña pública de fixture `Prueba123!`, permite acceder a `/reservar`. Todos esos datos son de pruebas, nunca usuarios reales. Las fechas se calculan en Europe/Madrid y cubren los próximos 30 días.

`npm run test:emuladores` arranca los tres servicios, ejecuta las pruebas de reglas/Auth/Functions, compila con configuración demo, prueba navegador en escritorio/móvil y detiene los servicios. **Usar una instancia de emuladores desechable y los puertos libres**: las pruebas borran exclusivamente los datos ficticios de ese proyecto. El lanzador rechaza otro proyecto y otros hosts. La salida de una prueba fallida se conserva como fallo.

El emulador imprime los enlaces de correo ficticios. Se pueden abrir localmente o consultar `http://127.0.0.1:9099/emulator/v1/projects/demo-barberpro-m13/oobCodes` y abrir `/verify?mode=verifyEmail&oobCode=CODIGO`. No se envían correos reales. Para las pruebas se crean cuentas públicas ficticias `fase4-{client,worker,manager,admin,pendiente}@example.test`; su contraseña de fixture consta en los tests. No representan usuarios reales. No se siembran cuentas al arrancar normalmente la aplicación.

Las reglas permiten editar solo nombre/teléfono propios; los roles se asignan en backend. `setMyRole` deniega siempre el cambio. `adminSetClaims` requiere administrador verificado y permisos vigentes. Los scripts `functions/scripts/asignar-roles.mjs` y `normalizar-roles.mjs` exigen UID explícito y los dos emuladores; simulan por defecto, escriben solo con `--aplicar`. No existe pantalla de administración general en esta fase.

No se incluyen comandos de despliegue ni claves administrativas. Las escrituras directas de citas/locks/notificaciones desde el navegador siguen denegadas: las cinco funciones de reservas autorizan y validan en backend, con transacciones y reintentos idempotentes. Las escrituras de gestión de servicios, semanas y bloqueos siguen pendientes de sus fases; Storage continúa cerrado. La autenticación estática protege los datos mediante reglas/backend; el HTML no equivale a una sesión de servidor.

## Estado y documentación

Para explorar el listado hay cuentas ficticias verificadas `cliente-escritorio@example.test` y `cliente-movil@example.test`, con contraseña de fixture `Prueba123!`; incluyen ocho citas de diferentes estados, antiguas/futuras y datos legados. `cliente-vacio@example.test` comienza sin citas. Todas se preparan solo al ejecutar explícitamente `npm run datos:local`.

Consultar [fase 6](docs/fase-6-cliente.md), [fase 5](docs/fase-5-reservas-disponibilidad.md), [cobertura](docs/control-cobertura.md), [avance](docs/control-avance.md) e informes históricos de fases 3–4. La operativa profesional y administración continúan en sus fases autorizadas. Las versiones heredadas conservan avisos de seguridad de dependencias; ver los informes antes de plantear una publicación.
