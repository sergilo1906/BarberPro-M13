# Entrega de BarberPro Studio M13

La entrada breve única es [ENTREGA-LEER-PRIMERO](ENTREGA-LEER-PRIMERO.md). Para estudiar el proyecto: [guía de defensa](GUIA-DEFENSA-M13.md); para evaluar el cierre: [resultado final](cierre-definitivo/resultado-final.md). Este documento conserva la guía técnica complementaria.

Entrega para revisión académica como **demo local con Firebase Emulator Suite**. No es una aplicación desplegada para clientes reales. La reconstrucción y la documentación han contado con asistencia de Codex, declarada en el [registro académico](registro-academico.md).

## Lectura recomendada

1. [README](../README.md): instalación y arranque.
2. [Estructura](estructura.md), [funcionalidades](funcionalidades-finales.md) y [decisiones](decisiones-tecnicas.md).
3. [Matriz de los 40 grupos originales](matriz-requisitos.md) y [rutas/roles](rutas-y-roles.md).
4. [Pruebas](pruebas-finales.md), [informe M13](informe-final-m13.md) y [segunda revisión](revision-total-2026-11-10.md).
5. [Mapa de 94 archivos](auditoria-final/correspondencias-archivos.md) y [tabla de 3.122 registros](trazabilidad/simbolos-actuales.md).

## Arranque desde una extracción limpia

Requisitos externos: Node 22.23.4, npm 10 o posterior y Java 21. No hacen falta una cuenta Firebase, firebase login ni credenciales administrativas.

```powershell
npm ci
npm --prefix app ci
npm --prefix functions ci
Copy-Item app/.env.example app/.env.local
```

En app/.env.local cambiar únicamente los dos indicadores de emuladores a 1. Los demás valores son ficticios y deben conservar el proyecto demo-barberpro-m13 y authDomain localhost. No introducir datos de producción.

En la primera terminal:

```powershell
npm run emulators
```

Con los tres emuladores arrancados, en otra terminal:

```powershell
npm run datos:local
npm run dev
```

Abrir http://localhost:4321. `datos:local` restablece exclusivamente fixtures del demo local: usar emuladores desechables y no ejecutarlo para conservar una exploración anterior. Ctrl+C detiene cada servidor. Sin activar emuladores, las páginas públicas funcionan y el acceso privado informa de la configuración desactivada.

## Cuentas ficticias de demostración

Todas las cuentas siguientes usan la contraseña pública de fixture `Prueba123!`. No pertenecen a personas ni servicios reales y no existen hasta sembrar el emulador.

| Rol | Correo de fixture | Recorrido sugerido |
| --- | --- | --- |
| Cliente | reservas-client@example.test | Reservar → Mis citas → cambiar/cancelar → perfil. |
| Profesional | profesional-escritorio@example.test | Panel → agenda → horarios → bloqueos. |
| Responsable | reservas-manager@example.test | Equipo → servicios → resumen/KPIs → exportación. |
| Administrador | reservas-admin@example.test | Usuarios y roles → configuración → administración. |

Las fechas de los fixtures se calculan en Europe/Madrid. Algunas citas representan historia o estados terminales deliberadamente. Si se desea repetir un recorrido desde cero, detener y restablecer los emuladores demo según las instrucciones anteriores.

## Pruebas e inventarios

Detener primero los servidores de desarrollo/emuladores que se hayan arrancado manualmente y dejar libres los puertos de emuladores y QA:

```powershell
npm --prefix app exec -- playwright install chromium
npm test
node scripts/trazar-simbolos.mjs
```

La suite crea sus datos ficticios y detiene los servicios al terminar. Las comparaciones con el original requieren su compilación junto al workspace; una extracción independiente las omite expresamente. No hay que copiar el original ni sus credenciales dentro de esta entrega. La herramienta de trazabilidad funciona desde el ZIP sin .git ni planificación externa; el generador general de inventario, en cambio, requiere el checkout Git propio.

## Contenido y límites de la entrega

El paquete definitivo se denomina BarberPro-M13-cierre-definitivo-2026-11-11.zip y se publica en la release cierre-definitivo-2026-11-11. Su checksum .sha256 y el informe de validación con lista de contenido se entregan como adjuntos separados para evitar un hash autorreferencial. Esa validación identifica el commit, el contenido y las pruebas ejecutadas sobre la extracción concreta. La entrega preliminar y el candidato r1 se conservan como historial, sin los materiales de este cierre.

La tabla de símbolos distingue declaración localizada, contrato referenciado, decisión manual y ámbito reestructurado. Tener 3.122 decisiones no significa demostrar equivalencia matemática o ejecutar cada variable. Se conservan los límites de los emuladores, el correo no enviado, la ausencia de despliegue, navegadores físicos no certificados y avisos moderados de herramientas/SDK. No hay errores altos/críticos conocidos en el npm audit ejecutado. Las horas y la revisión personal del alumno deben reflejar sus datos reales; no se han inventado.

La recomendación de entrega se fija tras verificar el paquete en el informe de validación adjunto. La aceptación, rúbrica y calificación corresponden al profesor.
