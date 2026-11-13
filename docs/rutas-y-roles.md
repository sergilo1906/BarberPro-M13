# Rutas y roles contrastados

26 paginas reales; politica de comun/permisos.ts. La autorizacion de datos se exige tambien en reglas y backend. El perfil admite cuenta sin correo verificado; el resto de operativa requiere verificacion. Publica significa sin sesion, no un despliegue.

| Ruta | Archivo | Roles |
|---|---|---|
| /404 | app/src/pages/404.astro | Publica |
| /admin | app/src/pages/admin/index.astro | admin |
| /admin/usuarios | app/src/pages/admin/usuarios.astro | admin |
| /agenda | app/src/pages/agenda.astro | worker, manager, admin |
| /ayuda | app/src/pages/ayuda.astro | Publica |
| /bloqueos | app/src/pages/bloqueos.astro | worker, manager, admin |
| /branding | app/src/pages/branding.astro | admin |
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
