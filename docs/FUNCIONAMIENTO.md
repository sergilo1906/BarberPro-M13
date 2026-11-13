# Funcionamiento

BarberPro Studio organiza reservas y agenda de barbería con cuatro roles. Las cuentas son ficticias y se crean con el comando explícito datos:local descrito en [instalación](INSTALACION.md).

| Rol | Operaciones |
| --- | --- |
| Cliente | Registro, login, verificación, perfil; seleccionar servicio/profesional o cualquiera, consultar huecos, reservar, ver historia, cancelar/reprogramar y descargar ICS. |
| Profesional | Panel y agenda propios, estados de citas, dos tramos de jornada, copia/publicación de semana, descansos, bloqueos/excepciones y vacaciones. |
| Responsable | Selección autorizada de profesionales, equipo, servicios/precio/duración, resumen, KPIs día/semana/mes y CSV. No asigna roles. |
| Administrador | Añade gestión de usuarios/roles, configuración de agenda y herramientas demo autorizadas. |

Las reservas validan fechas reales y futuras, zona horaria, duración completa, publicación, descansos, bloqueos y ocupación. Dos peticiones incompatibles no pueden confirmar el mismo intervalo. Se mantienen margen de cancelación, estados terminales e historia de cambios; los reintentos con la misma solicitud no duplican citas. La semana conserva descansos y rechaza recortes que perjudiquen citas existentes.

Los indicadores no cuentan dos veces la historia reprogramada ni añaden tiempo cancelado. CSV descarga el rango autorizado completo aunque la vista previa muestre ocho filas. ICS genera eventos UTC. Los recordatorios se registran en cola local y evitan duplicados; no se envía correo ni hay cron desplegado. Las herramientas demo requieren permisos, confirmación y emuladores desechables sin otros escritores. Diagnóstico es informativo; planes conserva el contrato PRO inactivo, sin contratación comercial.

Se conservan los 40 grupos originales en la [matriz](MATRIZ-REQUISITOS.md). Las diferencias de seguridad deliberadas retiran autoservicio de privilegios, escrituras directas del navegador, credenciales productivas y marcas de envío ficticio; no eliminan funciones esenciales.

## Rutas y acceso

| Ruta | Archivo | Roles |
|---|---|---|
| /404 | app/src/pages/404.astro | Publica |
| /admin | app/src/pages/admin/index.astro | admin |
| /admin/usuarios | app/src/pages/admin/usuarios.astro | admin |
| /agenda | app/src/pages/agenda.astro | worker, manager, admin |
| /ayuda | app/src/pages/ayuda.astro | Publica |
| /bloqueos | app/src/pages/bloqueos.astro | worker, manager, admin |
| /branding | app/src/pages/branding.astro | admin |
| /debug | app/src/pages/debug.astro | admin |
| /equipo | app/src/pages/equipo.astro | manager, admin |
| /export | app/src/pages/export.astro | manager, admin |
| /horarios | app/src/pages/horarios.astro | manager, admin |
| /index-admin | app/src/pages/index-admin.astro | worker, manager, admin |
| /index-client | app/src/pages/index-client.astro | Publica |
| / | app/src/pages/index.astro | Publica |
| /kpis | app/src/pages/kpis.astro | manager, admin |
| /legal | app/src/pages/legal.astro | Publica |
| /login | app/src/pages/login.astro | Publica |
| /mis-citas | app/src/pages/mis-citas.astro | client, worker, manager, admin |
| /panel-barbero | app/src/pages/panel-barbero.astro | worker, manager, admin |
| /panel | app/src/pages/panel.astro | worker, manager, admin |
| /perfil | app/src/pages/perfil.astro | client, worker, manager, admin |
| /planes | app/src/pages/planes.astro | Publica |
| /registro | app/src/pages/registro.astro | Publica |
| /reservar | app/src/pages/reservar.astro | client, worker, manager, admin |
| /servicios | app/src/pages/servicios.astro | manager, admin |
| /setup-barber | app/src/pages/setup-barber.astro | worker, manager, admin |
| /verify | app/src/pages/verify.astro | Publica |


[Seguridad y límites](SEGURIDAD-Y-LIMITACIONES.md), [pruebas](PRUEBAS.md) y [defensa](DEFENSA-M13.md).
