# BarberPro Studio — M13

Aplicación reconstruida con Astro estático, Firebase Auth, perfiles y cuatro roles. Solo funciona contra emuladores locales. El original permanece intacto.

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
```

El servidor solo escucha en loopback. Las seis páginas públicas funcionan sin Firebase. Login, registro, verificación y perfil pertenecen a fase 4. Las otras 17 páginas privadas conservan el aviso de indisponibilidad y ya comprueban sesión, correo y rol; sus operaciones se implementarán en sus fases.

## Firebase

La integración está desactivada por defecto en un checkout nuevo. Copiar `app/.env.example` a `app/.env.local` y cambiar `PUBLIC_USE_FIREBASE_EMULATORS=1` y `PUBLIC_USE_FUNCTIONS_EMULATOR=1`. Los demás valores son ficticios. Este archivo se ignora en Git. Solo se admite `demo-barberpro-m13` desde localhost/127.0.0.1: Auth 9099, Firestore 8088 y Functions 5001.

En una terminal ejecutar `npm run emulators` y en otra `npm run dev`. Los emuladores necesitan Java 21; los scripts npm usan Node 20.20.2 local. No requieren `firebase login`. La CLI utiliza una configuración vacía en `.verificacion/firebase-cli`, sin reutilizar credenciales globales. Las cuentas son efímeras y desaparecen al detener los emuladores.

`npm run test:emuladores` arranca los tres servicios, ejecuta las pruebas de reglas/Auth/Functions, compila con configuración demo, prueba navegador en escritorio/móvil y detiene los servicios. **Usar una instancia de emuladores desechable y los puertos libres**: las pruebas borran exclusivamente los datos ficticios de ese proyecto. El lanzador rechaza otro proyecto y otros hosts. La salida de una prueba fallida se conserva como fallo.

El emulador imprime los enlaces de correo ficticios. Se pueden abrir localmente o consultar `http://127.0.0.1:9099/emulator/v1/projects/demo-barberpro-m13/oobCodes` y abrir `/verify?mode=verifyEmail&oobCode=CODIGO`. No se envían correos reales. Para las pruebas se crean cuentas públicas ficticias `fase4-{client,worker,manager,admin,pendiente}@example.test`; su contraseña de fixture consta en los tests. No representan usuarios reales. No se siembran cuentas al arrancar normalmente la aplicación.

Las reglas permiten editar solo nombre/teléfono propios; los roles se asignan en backend. `setMyRole` deniega siempre el cambio. `adminSetClaims` requiere administrador verificado y permisos vigentes. Los scripts `functions/scripts/asignar-roles.mjs` y `normalizar-roles.mjs` exigen UID explícito y los dos emuladores; simulan por defecto, escriben solo con `--aplicar`. No existe pantalla de administración general en esta fase.

No se incluyen comandos de despliegue ni claves administrativas. Las escrituras de negocio siguen denegadas hasta añadir su validación en las fases correspondientes; Storage sigue cerrado. La autenticación en un sitio estático protege los datos mediante reglas y backend: el HTML por sí mismo no equivale a una sesión de servidor.

## Estado y documentación

Consultar [fase 4](docs/fase-4-autenticacion-usuarios-roles.md), [cobertura actual](docs/control-cobertura.md), [avance](docs/control-avance.md) y el informe histórico de [fase 3](docs/fase-3-implementacion.md). Reservas, operativa profesional y administración general siguen pendientes. No se avanza automáticamente a fase 5. Las versiones heredadas conservan avisos de seguridad de dependencias; ver el informe antes de plantear una publicación.
