# Mapa vigente de archivos reconstruidos

Este mapa describe implementación real y complementa los informes de fases 3–8. El diseño histórico completo de 94 originales está en la planificación de fase 2, conservada sin modificaciones. No se confunde tener un destino creado con haber comprobado todas sus funciones. La revisión final de inventario y referencias corresponde a fases 9–12.

## Fases anteriores

La base pública, componentes, configuración y recursos están inventariados en [fase 3](fase-3-implementacion.md). Cuentas, sesión, guards, reglas y scripts en [fase 4](fase-4-autenticacion-usuarios-roles.md). Motor de reservas, consultas y calendario en [fase 5](fase-5-reservas-disponibilidad.md) y [fase 6](fase-6-cliente.md). Los siete módulos profesionales y persistencia compartida están en [fase 7](fase-7-profesional-agenda.md). Sus URLs y contratos públicos se conservan.

## Administración — implementación de fase 8

| Origen | Destino real | Decisión |
|---|---|---|
| admin/index.astro | app/src/pages/admin/index.astro | Misma portada de herramientas; guard central del layout. |
| admin/usuarios.astro | app/src/pages/admin/usuarios.astro | Misma búsqueda por correo y tarjetas de rol. |
| admin-users.client.ts | app/src/modulos/administracion/usuarios.ts y tarjeta-usuario.ts | Coordinación y DOM separados; consultas en datos/personas. |
| equipo.astro / equipo.client.ts | app/src/pages/equipo.astro / app/src/modulos/administracion/equipo.ts | Nombre/visibilidad, autosave y control de duplicación. |
| servicios.astro / services.client.ts | app/src/pages/servicios.astro / app/src/modulos/administracion/servicios.ts | Crear, editar, activar/desactivar; sin borrado inventado. |
| branding.astro / branding.client.ts | app/src/pages/branding.astro / app/src/modulos/administracion/reglas-agenda.ts | Reglas de agenda; no editor de marca. |
| horarios.astro / horarios.client.ts | app/src/pages/horarios.astro / app/src/modulos/administracion/resumen-horarios.ts | Resumen semanal; editor reutilizado de fase 7. |
| index-admin.astro / index-admin.client.ts | app/src/pages/index-admin.astro / app/src/modulos/navegacion/inicio-equipo.ts | Entrada del personal y tarjeta de gestión por rol. |
| admin-guard, equipo-guard, horarios-guard, servicios-guard, branding-guard | app/src/comun/permisos.ts y DisenoPrincipal.astro | Política única; no recrear scripts duplicados. |
| Escrituras SDK de catálogo, equipo y config | functions/src/administracion.js | Tres callables nuevos, validados e idempotentes. |
| auth/adminSetClaims | functions/src/cuentas.js | Contrato existente conservado; no autoservicio de privilegios. |
| Consultas Firebase originales | app/src/datos/personas.ts, catalogo.ts, configuracion.ts | Acceso separado de controladores y presentación. |
| Modelos any de administración | app/src/modelos/cuentas.ts y agenda.ts | FichaEquipo, UsuarioAdministrable, ServicioAdministrable y operaciones tipadas. |

Originales aún correspondientes a fase 9: panel, KPIs, exportación CSV, diagnóstico, recordatorios y herramientas demo. Sus decisiones finales y la tabla completa de 27 rutas se ampliarán al cerrar ese bloque. No se afirma cobertura global del 100 %.
