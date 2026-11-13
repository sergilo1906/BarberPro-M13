# BarberPro Studio M13 — empezar aquí

BarberPro gestiona reservas de una barbería con cuatro roles: cliente, profesional, responsable y administrador. Esta entrega es una **demo local**, reconstruida con Astro, TypeScript, Tailwind y Firebase Emulator Suite. Incluye fuente, reglas e índices, recursos, pruebas, documentación y [guía de defensa](GUIA-DEFENSA-M13.md). La asistencia de Codex se declara en el [registro académico](registro-academico.md).

## Qué descargar

En la [release de cierre definitivo](https://github.com/sergilo1906/BarberPro-M13/releases/tag/cierre-definitivo-2026-11-11), descargar los tres adjuntos: `BarberPro-M13-cierre-definitivo-2026-11-11.zip`, su `.zip.sha256` y `validacion-cierre-definitivo-2026-11-11.md`. El informe identifica el commit y las pruebas del ZIP exacto e incluye su lista de contenido. No usar los ZIP históricos como si incluyeran este cierre.

Antes de extraer, desde la carpeta de descargas en PowerShell:

```powershell
Get-FileHash -LiteralPath .\BarberPro-M13-cierre-definitivo-2026-11-11.zip -Algorithm SHA256
Get-Content -LiteralPath .\BarberPro-M13-cierre-definitivo-2026-11-11.zip.sha256
Expand-Archive -LiteralPath .\BarberPro-M13-cierre-definitivo-2026-11-11.zip -DestinationPath .\M13-demo
Set-Location .\M13-demo\BarberPro-M13
```

Los dos hashes deben coincidir, sin importar mayúsculas. Elegir una carpeta de extracción nueva; no sobrescribir una exploración anterior.

## Preparación en Windows y PowerShell

Instalar **Node 22.23.4**, **npm 10 o posterior** y **Java 21**, disponibles en el PATH. Comprobar con `node --version`, `npm --version` y `java -version`. Hace falta conexión para descargar dependencias, Chromium para las pruebas y el emulador Java en su primer arranque; las páginas utilizan fuentes de Google. No hacen falta una cuenta Firebase, `firebase login`, una clave administrativa ni el proyecto original.

Desde la raíz extraída:

```powershell
npm ci
npm --prefix app ci
npm --prefix functions ci
Copy-Item -LiteralPath app/.env.example -Destination app/.env.local
```

Abrir `app/.env.local` y cambiar únicamente estos dos indicadores:

```dotenv
PUBLIC_USE_FIREBASE_EMULATORS=1
PUBLIC_USE_FUNCTIONS_EMULATOR=1
```

Conservar los demás valores ficticios de la plantilla: proyecto `demo-barberpro-m13`, dominio `localhost`. No introducir datos de producción. Si PowerShell bloquea el shim `npm.ps1`, usar `npm.cmd` en los mismos comandos; no es necesario cambiar la política de ejecución del equipo.

## Arranque: dos terminales

Abrir ambas en la raíz `BarberPro-M13`. En la primera:

```powershell
npm run emulators
```

Esperar a que Auth, Firestore y Functions estén preparados. En la segunda:

```powershell
npm run datos:local
npm run dev
```

Abrir **http://127.0.0.1:4321**. Los servicios escuchan en loopback: Auth 9099, Firestore 8088, Functions 5001 y hub 4401. Si un puerto está ocupado, detener únicamente el servidor anterior identificado; no arrancar dos juegos de emuladores. No hay interfaz de emuladores activada por defecto.

`datos:local` crea cuentas ficticias, catálogo, semanas y citas. También restablece reservas, ocupación, bloqueos y notificaciones **del demo local**: ejecutarlo solo sobre emuladores desechables y no repetirlo para conservar los cambios de una demostración. Ctrl+C en cada terminal detiene los servidores; sin exportación los datos son efímeros. Sin activar los dos indicadores, las páginas públicas funcionan, pero el acceso privado informa de que Firebase está desactivado.

## Cuentas y recorridos

Todas las cuentas de esta tabla usan **`Prueba123!`**, contraseña pública de prueba. Solo existen después de preparar los datos. Cerrar sesión antes de cambiar de rol.

| Rol | Cuenta ficticia | Qué probar |
| --- | --- | --- |
| Cliente | reservas-client@example.test | Reservar a más de 12 h, consultar Mis citas, descargar ICS, cambiar, cancelar y abrir perfil. |
| Profesional | profesional-escritorio@example.test | Panel, agenda, semana siguiente, copia/publicación y bloqueos sin citas incompatibles. |
| Responsable | reservas-manager@example.test | Equipo, servicios, resumen, KPIs por periodo y exportación CSV. No tiene permiso para asignar roles. |
| Administrador | reservas-admin@example.test | Usuarios y roles, configuración de agenda y herramientas autorizadas. Para probar roles usar `admin-destino-escritorio@example.test`, sin quitar permisos a la propia cuenta administradora. |

Las fechas se calculan en Europe/Madrid; escoger un día futuro con semana publicada y servicio/profesional activo. Los fixtures incluyen historia y estados terminales deliberadamente. Si no hay hueco, probar otro día o profesional. Las herramientas demo y los recordatorios manuales se contrastan también mediante integración. La página de depuración informativa se ha retirado.

## Pruebas

Detener primero ambos servidores con Ctrl+C. Dejar libres los puertos anteriores y los de QA 4331/4332. Desde la raíz:

```powershell
npm --prefix app exec -- playwright install chromium
npm test
node scripts/trazar-simbolos.mjs
```

`npm test` comprueba tipos/sintaxis, ejecuta unitarias, arranca emuladores desechables, prueba integración, compila y ejecuta los recorridos de navegador. Crea sus propios fixtures y apaga los servicios al terminar. Para comprobaciones rápidas sin emuladores: `npm run check`, `npm run build`, `npm run test:unit`.

En una extracción independiente se omiten expresamente las 126 comparaciones que necesitan la compilación original externa. No se cuentan como aprobadas ahí; el informe adjunto distingue la comparación realizada en el workspace. No copiar el original ni sus credenciales dentro del ZIP. La trazabilidad funciona sin `.git`; el inventario general requiere un checkout propio.

## Alcance y lectura adicional

No hay hosting público de la aplicación, correo real, cron desplegado ni configuración productiva habilitada. Los recordatorios generan una cola local `queued`; no son mensajes enviados. Una web accesible al profesor por enlace requeriría un despliegue separado, fuera de esta entrega. Móvil y tableta son perfiles de Chromium, sin certificación de Safari, dispositivos físicos o carga productiva. Persisten avisos moderados de dependencias, explicados en [pendientes](cierre-definitivo/pendientes.md).

Para evaluar: [resultado del cierre](cierre-definitivo/resultado-final.md), [matriz de 40 grupos](matriz-requisitos.md), [pruebas](pruebas-finales.md) y el informe de validación adjunto. Los anexos técnicos se conservan sin que sea necesario leerlos todos para arrancar. Las horas reales y la revisión personal del alumno permanecen identificadas para completar; no se presume una rúbrica académica no facilitada.
