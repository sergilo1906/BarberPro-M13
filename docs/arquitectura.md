# Arquitectura de la fuente publicada

Describe el proyecto actual; no sustituye la planificación histórica ni acredita el cierre de las fases pendientes.

| Carpeta o archivo | Responsabilidad |
|---|---|
| app/src/pages | 26 páginas Astro, incluidas las rutas administrativas y 404. Se ha retirado la antigua ruta informativa de depuración. |
| app/src/layouts y components | Diseño compartido, navegación y leyenda de disponibilidad. |
| app/src/modulos | Controladores de cuentas, navegación, reservas, profesionales, administración y estadísticas. |
| app/src/datos | Consultas Firebase, sesión y llamadas al backend. |
| app/src/modelos y comun | Interfaces TypeScript, fechas, estados, formularios, errores y permisos comunes. |
| app/src/exportaciones | Generación local de ICS y CSV. |
| app/src/styles y app/public | Tailwind y favicon propios de la interfaz reconstruida. |
| functions/index.js y functions/src | Exports públicos y lógica backend: cuentas, permisos, disponibilidad, reservas, agenda, administración, recordatorios y demo. |
| functions/scripts | Lanzador de emuladores y herramientas locales explícitas para roles y datos ficticios. |
| firestore.rules, storage.rules y firestore.indexes.json | Reglas e índices para el entorno local; no están desplegados. |
| app/tests y functions/tests | Unitarias, integración contra emuladores y recorridos de navegador. |
| docs | Informes, correspondencias, cobertura, pendientes y pruebas de publicación. |

La página carga su controlador; este utiliza modelos y funciones de datos. Las operaciones privilegiadas pasan por Functions. El backend comprueba Auth y rol vigentes, valida datos y utiliza transacciones para las operaciones de reservas y agenda. Los guards de navegador organizan la navegación; la autorización no depende de ocultar botones. Las escrituras SDK directas de negocio están denegadas.

El frontend se genera estáticamente con Astro y usa Firebase Auth en el navegador. La configuración pública se valida para aceptar únicamente localhost/127.0.0.1 y el proyecto demo. La fábrica Admin del backend también exige los emuladores de Auth y Firestore de demo-barberpro-m13 antes de proporcionar acceso a datos. No se incluyen credenciales administrativas ni una modalidad productiva activable por el usuario de la interfaz.

El estado publicado y sus límites están en README, [publicación](fase-github-publicacion.md) y [fase 9 en curso](fase-9-estado-en-curso.md). No se necesita el proyecto original para instalar ni compilar. Las comparaciones visuales históricas requieren su compilación de referencia y se omiten explícitamente si no está disponible; los tests no la inventan ni la descargan.
